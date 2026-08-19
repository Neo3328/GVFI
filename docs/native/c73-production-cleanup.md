# C7.3 — Native Backend Production Code Cleanup / Audit

**Date:** 2026-08-12  
**Scope:** Audit + documentation isolation + orphan smoke-script deletion only.  
**No performance work. Default `backend_mode` remains `cli`.**

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Production call chain (final)

```
Electron / gvfi_api.py
  → params.backend_mode default "cli" (invalid → cli)
  → VideoWorker (main.py)
       ├─ create_interpolator_backend(requested)
       ├─ _ensure_interpolator_backend()
       │     Native fail → _switch_to_cli() → RifeCLIBackend
       └─ process_directory(scene frames)
            ├─ RifeCLIBackend → rife-ncnn-vulkan.exe
            └─ NativeInterpolatorBackend
                 → map_native_directory_sample (inclusive timeline)
                 → NativeLibraryLoader.process / gvfi_process
                 → NcnnVulkanBackend::processBgr
                 → RIFE::process_v4 (single)
                 → release() + destroy() on task end / fallback
```

**Not on this path:** `gvfi_process_batch`, `process_v4_batch`, `BatchRifeWorker`, `PipelineRifeWorker` / `gvfi_pipeline_*`, `gvfi_get_last_batch_profile`.

---

## Native vs CLI responsibilities

| | CLI (`RifeCLIBackend`) | Native (`NativeInterpolatorBackend`) |
|---|---|---|
| Role | Production default | Opt-in alternate + fallback target from Native |
| Exec | External `rife-ncnn-vulkan.exe` | In-process `gvfi_native.dll` |
| Timeline | CLI `-n` | `map_native_directory_sample` inclusive map |
| Failure | Propagate | Auto fallback to CLI once per task |

---

## Audit checklist results

1. Default `backend_mode=cli` — PASS (`main.py`, `gvfi_api.py`, factory)
2. CLI backend intact — PASS (`RifeCLIBackend` present)
3. Native fallback intact — PASS (`_switch_to_cli` / `native_to_cli`)
4. C6.3/C6.4/C6.6 not in VideoWorker chain — PASS (static audit)
5. `BatchRifeWorker` / `process_v4_batch` not used by default VideoWorker — PASS  
   (`process_v4_batch` only via experimental `gvfi_process_batch` ABI)
6. C6.6 pipeline PoC independent — PASS (`PipelinePocLoader` + `gvfi_pipeline_*`)
7. Temp benchmark/debug not in production path — PASS after smoke-script delete
8. C6.5 profile API retained (test-only callers) — PASS (documented, not removed)
9. C7.1.1 frame mapping tests — PASS (`test_c711_frame_mapping.py`)
10. `_emit_failure_detail` getattr tests — PASS
11. Lifecycle — PASS: Native `release()` then `destroy()` on task finally + fallback; Pipeline PoC has own destroy. No leak fix required in this phase.
12. Behavior unchanged — PASS (comments + deletes only)

---

## Experimental code inventory

| Item | Production ref? | Action |
|---|---|---|
| `gvfi_process_batch` / `processBgrBatch` / `process_v4_batch` | No (tests C6.4/C6.5 only) | **Retain** — document as experimental ABI |
| `gvfi_get_last_batch_profile` / `batch_profile.*` | No (C6.5 tests) | **Retain** — test profiling |
| `PipelineRifeWorker` / `pipeline_poc_capi` / `PipelinePocLoader` | No (C6.6 only) | **Retain** — isolated PoC |
| `BatchRifeWorker` C++ (no C ABI export) | No; tests stub unused | **Retain in tree** — orphan linked into DLL; future optional CMake drop + rebuild (not done: avoid DLL churn) |
| `tests/_c71_*.py`, `_c711_run_fg.py` smoke scripts | No | **Deleted** |
| `tests/test_c6*.py`, `test_c71*`, `test_c72*` | Harness only | **Retain** |

**Production path pollution:** None detected.

---

## Files modified this phase

- `ECCV2022-RIFE/gvfi_runtime/native_library.py` — docs on batch/profile APIs
- `native/include/gvfi_native.h` — docs on experimental batch ABI
- `ECCV2022-RIFE/tests/test_c73_production_callchain_audit.py` — added
- Deleted orphan smoke scripts under `ECCV2022-RIFE/tests/_c71*` / `_c711_run_fg.py`
- `docs/native/c73-production-cleanup.md` — this report

---

## Tests run

```
python -m unittest tests.test_c711_frame_mapping tests.test_c73_production_callchain_audit -v
→ 12 tests OK
```

---

## Verdict

**C7.3 can end.**  
Default remains `cli`. Experimental batch/pipeline/profile stay out of VideoWorker. No further production cleanup required for correctness; optional future work is dropping unused `BatchRifeWorker` objects from the DLL build after an explicit rebuild plan.
