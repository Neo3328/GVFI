# Phase C6.6 — Pipeline Overlap Analysis (Independent PoC)

**GVFI — Native RIFE Async GPU/CPU Pipeline Overlap**  
**Developed by Mr. Gong**  
**Copyright © 2026 Mr. Gong. All Rights Reserved.**

---

## 1. Goal

Determine whether **pipeline depth ≥ 2** (double-buffer command submission) can reduce
steady-state per-frame time versus serialized `process_v4` / `process_v4_batch`.

Hard stop: if measured steady-state gain is **&lt; ~15%**, stop C6.6 and do not expand.

Constraints: no VideoWorker / CLI / default `backend_mode` / ncnn core / RIFE model changes;
no removal of C6.4/C6.5; no production wiring.

---

## 2. Current stage breakdown (`RIFE::process_v4`)

| # | Stage | Where | Sync? | Notes |
|---|--------|--------|-------|-------|
| 1 | Host decode / `from_pixels` (BGR↔RGB, FP16 pack path) | CPU before/with upload record | CPU-only | Must finish before GPU consumes those `Mat`s |
| 2 | Upload `record_clone` CPU→GPU | `VkCompute` record | Async-record | Executes only after submit |
| 3 | Preproc / timestep / flownet / Warp / postproc | `record_pipeline` + `Extractor::extract` | Async-record | Commands buffered; Extractor may die after record (ncnn design) |
| 4 | Download `record_clone` GPU→CPU | `VkCompute` record | Async-record | Staging readback recorded, completed after fence |
| 5 | `submit_and_wait()` | ncnn `VkCompute` | **Hard sync** | `vkQueueSubmit` + `vkWaitForFences` (fence wait is the CPU block) |
| 6 | `to_pixels` / CPU cast | After fence | CPU-only | Needs download results valid |

`process_v4_batch` (C6.4/C6.5) coalesces stages 2–5 for N frames into **one** submit/wait.
C6.5 showed that reduces submit *count* but **not** steady-state ms/frame (~37 ms flat).

---

## 3. What can overlap vs what cannot

### Can overlap (CPU vs GPU)

- While GPU executes frame **N** (after its `vkQueueSubmit`), CPU may:
  - `from_pixels` / prepare host mats for frame **N+1**
  - record a **different** `VkCompute` for frame **N+1**
  - (with a free compute queue) `vkQueueSubmit` frame **N+1**

### Must stay synchronized per frame

- Frame N’s `to_pixels` / consumer read of output **after** frame N’s fence
- Do **not** reuse frame N’s `VkMat` / allocator / `VkCompute` until its fence completes
- Download destination `Mat` must live until after fence (C6.4 lifecycle rule)

### ncnn public API constraint (no ncnn-core edits)

`ncnn::VkCompute` exposes only:

```text
submit_and_wait()
reset()
```

There is **no** public `submit()` + later `wait()`. However, ncnn’s implementation
**reclaims the VkQueue before `vkWaitForFences`**, and this GPU reports
`queueC=2[8]` (8 compute queues). Therefore a depth-2 PoC can:

1. Run two independent slots/threads
2. Each slot: own `VkCompute`, own acquired blob/staging allocators, own mats
3. Each slot still calls `submit_and_wait()` (unchanged algorithm path via `RIFE::process`)
4. Overlap = slot B records/submits while slot A blocks on its fence

This respects “no reuse of in-flight resources” without modifying ncnn.

---

## 4. PoC design (depth = 2 first)

```text
                    ┌─ Slot0: process_v4(frame i)   ─┐
Pipeline depth 2 ───┤                                 ├─→ ordered outputs
                    └─ Slot1: process_v4(frame i+1) ─┘
```

- Independent worker: `PipelineRifeWorker` (new files only)
- Does **not** alter `gvfi_process` / `gvfi_process_batch` / VideoWorker
- Shares one loaded `RIFE` (`process*` are `const`) with concurrent extractors
- Sliding window of `depth` in-flight `std::async` jobs
- Preserve: BGR24 I/O, FP16 packing path inside RIFE, Warp, full-res out, bit-exact vs baseline

### Metrics

| Metric | Definition |
|--------|------------|
| frame ms | `wall_ms / frame_count` |
| total GPU-ish job time | sum of per-job wall (`record+submit_and_wait+post`) |
| CPU wait / fence wait proxy | time blocked inside each job’s `process()` (same as job GPU-bound portion; cannot split fence without ncnn changes) |
| submit count | 1 × frames (each `process_v4`) |
| overlap ratio | `1 - wall_ms / sum(job_ms)` |
| quality | MAE / PSNR / SSIM / maxΔ / NaN / crash |

### Stop rule

If depth-2 steady-state frame-ms improvement vs sequential baseline **&lt; ~15%**,
halt C6.6 (no depth 3/4 expansion, no production integration).

---

## 5. Relation to C6.4 / C6.5

| Phase | Question | Result so far |
|-------|----------|----------------|
| C6.4 | Coalesce many frames → one submit | Bit-exact; submit count ↓ |
| C6.5 | Does coalescing help steady-state ms/frame? | **No** (~0% vs batch1) |
| C6.6 | Does depth-2 in-flight overlap help ms/frame? | *This PoC* |

C6.5 showed ~94% of `process_v4_batch` time is inside `submit_and_wait`.
Overlap can only win if a second compute queue keeps the GPU busier or hides host
record (~2 ms/frame). That sets a cautious prior: **≥15% is ambitious**; measurement decides.

---

## 6. Deliverables

- Analysis: this document
- Code: `pipeline_rife_worker.*` + PoC-only ABI + `test_c66_pipeline_overlap.py`
- Report: `docs/native/c66-pipeline-overlap-report.md` + JSON under
  `D:\GVFI-deps\native-video-worker-ab\c66_pipeline_overlap\`
