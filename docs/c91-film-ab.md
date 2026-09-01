# C9.1-B — FILM Controlled Offline A/B

**Date:** 2026-08-12  
**Phase:** Authorized offline experiment · **stopped at Smoke**  
**Prior:** C9 survey · C9.1-A `PASS-WITH-UNKNOWN` (`docs/c91-film-readiness-check.md`)  
**Forbidden performed:** no GVFI production code change · no `backend_mode` change · no RIFE change · no VideoWorker adapter · no IFRNet · no C9.2 · no Steam assets · no FILM weight download (smoke failed first)

**Production preserved:** `backend_mode=cli` · RIFE CLI `rife-v4.6`

**Disclaimer:** Not legal advice. Weight commercial redistribute remains **[UNKNOWN]** (C9.1-A).

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision box

| Gate | Result |
|------|--------|
| **F0 Smoke** | **FAIL** |
| **F1 Minimal inference** | **NOT RUN** (stop condition) |
| **F2 A/B completed** | **NOT RUN** |
| **F3 Visual evidence** | **NOT RUN** |
| **F4 Metrics** | **NOT RUN** |
| **GO / WEAK-GO / NO-GO / UNKNOWN** | **NO-GO** (cannot run GPU FILM on this host under authorized isolated stack) |

**Question this phase was meant to answer:**  
“Does FILM show an observable quality advantage vs RIFE on real motion?” → **unanswered** (no inference).

**Recommended next action:** Do **not** auto-start IFRNet/C9.2. Re-authorize a separate env path only if desired (e.g. WSL2 + modern TF-GPU, or IFRNet/ncnn readiness), without touching GVFI production.

---

## 1. Environment

Isolated root: `D:\GVFI-deps\film-c91b\` (outside GVFI production Python / requirements).

| Item | Value | Tag |
|------|-------|-----|
| Python | **3.10.11** (venv) · host also has 3.12.1 (unused for FILM) | **[CONFIRMED]** |
| Official FILM pin | Python **3.9** + TF **2.6.2** + CUDA **11.2.1** + cuDNN **8.1** | **[DIFF]** vs attempt |
| Why not official pin | No Python 3.9 install; no conda; no CUDA 11.2 toolkit; RTX 5060 era ≫ TF 2.6 | **[CONFIRMED]** |
| TensorFlow (isolated) | **2.10.1** (last native Windows CUDA build) | **[CONFIRMED]** |
| NumPy | 1.26.4 (pinned `<2` for TF 2.10 ABI) | **[CONFIRMED]** |
| CUDA Toolkit (`CUDA_PATH`) | **empty / absent** | **[CONFIRMED]** |
| `cudart64_110.dll` | **not found** | **[CONFIRMED]** |
| cuDNN | **not found** (`cudnn64_8.dll` missing) | **[CONFIRMED]** |
| GPU | NVIDIA GeForce **RTX 5060** Laptop · 8151 MiB | **[CONFIRMED]** |
| Driver | **610.88** · CUDA UMD **13.3** | **[CONFIRMED]** |
| WSL2 | **Not installed** | **[CONFIRMED]** |
| FILM commit | `69f8708f08e62c2edf46a27616a4bfcf083e2076` (2023-01-14) | **[SAME]** as C9.1-A pin |
| Checkpoint | **Not downloaded** (stop before fetch) | **[CONFIRMED]** |
| Checkpoint hash | N/A | — |
| Target checkpoint | `film_net/L1` (planned) | not reached |
| Artifact log | `D:\GVFI-deps\film-c91b\logs\smoke_env.json` · `tf_probe2.log` | |

**Isolation:** FILM deps live only under `D:\GVFI-deps\film-c91b\venv`. GVFI `requirements` / production env were not modified for this experiment.

---

## 2. Smoke result

### Checklist (authorized)

| # | Check | Result |
|---|-------|--------|
| 1 | Normal import (TensorFlow) | **PASS** (after `numpy<2`) |
| 2 | Load `film_net/L1` model | **NOT RUN** (no GPU path; weights not fetched) |
| 3 | CUDA initialization | **FAIL** — `cudart64_110.dll` / CUDA 11 libs missing; TF skips GPU registration |
| 4 | GPU forward | **FAIL** — `tf.config.list_physical_devices('GPU') == []` |
| 5 | Input legal frame pair | **NOT RUN** |
| 6 | Output mid-frame | **NOT RUN** |

### Evidence (abbreviated)

```
Could not load dynamic library 'cudart64_110.dll'; dlerror: cudart64_110.dll not found
... cublas64_11.dll / cudnn64_8.dll ... not found
Cannot dlopen some GPU libraries. ... Skipping registering GPU devices...
tf 2.10.1
built_with_cuda True
gpus []
```

### Why installing CUDA 11.2 was not pursued

1. Authorization: on RTX 5060 / CUDA / TF incompatibility → **stop immediately**; do not reshape GVFI production to force a run.  
2. Even with an isolated CUDA 11.2 toolkit, **TF 2.10 CUDA kernels do not target Blackwell (RTX 5060)**; GPU forward would still be expected to fail or be unsupported.  
3. Modern TF GPU on Windows requires **WSL2**, which is **not installed**.  
4. CPU-only forward would **not** satisfy the authorized GPU smoke gates.

# SMOKE = FAIL

---

## 3. Minimal inference

**NOT RUN** (requires Smoke PASS).

Planned input (untouched):  
`D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4`

---

## 4. A/B configuration

**NOT RUN.**

| Side | Planned |
|------|---------|
| A | GVFI RIFE-v4.6 (`backend_mode=cli`) |
| B | FILM `film_net/L1` offline |
| IO | 1920×1080 · 24→48 · SR OFF · p0 + real dance clip |

Available local assets (not processed in this run):

- p0 OSD: `...\native-video-worker-ab\input\p0_src_1080p24_audio.mp4`
- Real dance: `...\c81_real_content\input\L1L2_douyin_t3s.mp4`

---

## 5. Time alignment

**NOT RUN.**

Protocol remains C8 / C8.1: burned \(n^\*\) primary, \(t^\*\) tolerance assist; **Index-aligned** and **Time-aligned** both reported; quality claims only from **Time-aligned**.

---

## 6. Visual observations

**NOT RUN** — no frames to classify as `[SAME]` / `[DIFF]` / `[UNKNOWN]`.

---

## 7. Metrics

**NOT RUN** — no MAE / PSNR / SSIM / LPIPS.

---

## 8. RIFE vs FILM

| Question | Answer |
|----------|--------|
| Observable quality advantage of FILM vs RIFE on real motion? | **UNKNOWN** (no experiment data) |
| Engineering runnability of official-style FILM GPU path on this laptop? | **FAIL** under isolated TF 2.10 Windows CUDA attempt |
| Relation to C8 | C8 remains: SVFI-RIFE ≈ GVFI-RIFE; GmfSs morphology **[DIFF]** vs RIFE still the only prior non-RIFE visual signal |
| Relation to C9 | FILM stays survey **TOP 1** quality thesis; this host **cannot** currently validate it |

---

## 9. Known limitations

1. Host has **no CUDA 11.x** toolkit/runtime; driver exposes CUDA **13.3** UMD only.  
2. **No WSL2** → no supported modern TensorFlow-GPU Windows path.  
3. **RTX 5060 (Blackwell)** is outside TF 2.6 / 2.10 supported GPU generations.  
4. Official FILM stack is **archived TF2 SavedModel** — far from GVFI ncnn/Vulkan production shape (**E2** for product-native).  
5. Weights not downloaded; commercial weight SPDX remains **[UNKNOWN]** (C9.1-A).  
6. Smoke used TF **2.10.1** / Python **3.10** as the only plausible native-Windows CUDA TF in an isolated venv — still **[DIFF]** from official 2.6.2 / 3.9 pins.

---

## 10. Commercial / licensing caveat

Unchanged from C9.1-A:

- Code: Apache-2.0 **[CONFIRMED]**  
- Pretrained weights redistribute: formal grant **[UNKNOWN]**  
- Offline A/B eligibility was **PASS-WITH-UNKNOWN**; this run never reached weight use  
- Product bundling of FILM weights: **not cleared**

---

## 11. GO / WEAK-GO / NO-GO / UNKNOWN

| Verdict | Definition | Applied? |
|---------|------------|----------|
| GO | Stable run + clear visual advantage | No |
| WEAK-GO | Local advantage only | No |
| **NO-GO** | **Cannot run** / no observable advantage / eng cost not worth it | **Yes — cannot run GPU FILM here** |
| UNKNOWN | Insufficient evidence on quality | Quality question remains UNKNOWN; gate verdict is NO-GO on runnability |

**Final:** **NO-GO** for continuing FILM A/B on **this** machine/stack without a new explicitly authorized environment strategy.

This is **not** a claim that FILM lacks quality merit; it is a claim that **C9.1-B could not execute** under the isolation + GPU smoke rules.

---

## 12. Recommended next action

1. **Stop** C9.1-B here (this document).  
2. **Do not** change GVFI / `backend_mode` / RIFE.  
3. **Do not** auto-enter C9.2 or IFRNet (per authorization).  
4. If leadership wants a follow-up, choose **one** new authorized track:  
   - **Env track:** install WSL2 + modern TF-GPU (or a dedicated CUDA-capable Linux box) and re-run F0 only; or  
   - **Candidate track:** authorize **IFRNet** readiness/smoke (product-shaped ncnn path from C9), still offline and isolated.  
5. Keep RIFE `rife-v4.6` + `backend_mode=cli` as production.

---

## Gate summary (required)

| ID | Name | Status |
|----|------|--------|
| F0 | Smoke | **FAIL** |
| F1 | Minimal inference | **NOT RUN** |
| F2 | A/B completed | **NOT RUN** |
| F3 | Visual evidence | **NOT RUN** |
| F4 | Metrics | **NOT RUN** |

**Report path:** `docs/c91-film-ab.md`
