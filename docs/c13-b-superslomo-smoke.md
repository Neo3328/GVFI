# C13-B — Super-SloMo Visibility-Map Isolated GPU Smoke

**Date:** 2026-08-13  
**Phase:** Isolated GPU Smoke only · **no A/B** · **no ABME** · **no C13-C** · **no production change**  

**Prior:** C13-A = **GO** · Best = Super-SloMo visibility-map VFI  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`**  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Verdict

# C13-B Verdict = **PASS**

Meaning: Super-SloMo completed a **minimal legal forward** on this host (Windows + RTX 5060) with `t=0.5` on protocol pair **#21**.  

**Does not** mean better than RIFE · **Does not** clear commercial weights · **Does not** authorize production · **Does not** start C13-C.

---

## Environment (F0-1 / F0-2 / F0-9)

| Item | Value |
|------|--------|
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU |
| Driver | 610.88 (`nvidia-smi`) |
| CUDA capability | (12, 0) |
| Python | 3.12.1 |
| PyTorch | 2.11.0+cu128 |
| CUDA (torch) | 12.8 |
| OS | Windows-11-10.0.26200 |
| Interpreter | `D:\GVFI-deps\c11d-ema-ab\venv\Scripts\python.exe` (isolated reuse; no GVFI prod edit) |
| Experiment root | `D:\GVFI-deps\c13b-superslomo-smoke\` |

| Gate | Result |
|------|--------|
| F0-1 program start | **PASS** |
| F0-2 RTX 5060 via PyTorch/CUDA | **PASS** |

---

## Implementation & weights

| Item | Value |
|------|--------|
| Public impl | `avinashpaliwal/Super-SloMo` (MIT **code**) |
| Commit | `544802b543e4aaaa707ebac6ae6c61e1da72a6f6` |
| Fetch note | GitHub git clone flaky; sources pulled via jsDelivr `@commit` CDN (same tree) |
| Checkpoint path | `D:\GVFI-deps\c13b-superslomo-smoke\weights\SuperSloMo.ckpt` |
| Weight source | README Google Drive id `1IvobLDbRiBgZr3ryCRrWL8xDbMZ-KnpF` (adobe240fps pretrained claim) |
| Weight SHA-256 | `1931F099A99E5E65A563F9B3AAE0E04B6D87D09A0C85BE1F761185C6BC67506E` |
| Size | 158,457,959 bytes |
| **Weight license** | **UNKNOWN** |
| **Commercial redistribution** | **UNKNOWN** |
| Code license | MIT (Avinash Paliwal 2018) — **≠** weight clearance |

Smoke PASS ≠ commercial clearance · Smoke PASS ≠ production authorization.

---

## Smoke inputs (F0-4 / F0-5)

| Item | Value |
|------|--------|
| Protocol slot | **#21** |
| SRC n / n+1 | `frame_0013.png` / `frame_0014.png` (`rife-defect-audit\src`) |
| Copies | `src_pair\out021_src_n.png` · `out021_src_n1.png` (SHA match C10-D copies) |
| Timestep | **0.5** [CONFIRMED] |
| CNN working size | 704×1024 (floor to /32 per public `Video`/`eval` convention) |
| Output resized to | **720×1038** |

---

## Forward results (F0-3 / F0-6 / F0-7)

| Gate | Result |
|------|--------|
| F0-3 load flowComp + ArbTimeFlowIntrp | **PASS** (`state_dictFC` / `state_dictAT`) |
| F0-6 mid-frame inference | **PASS** |
| Wall-clock | **0.7212 s** (includes first CUDA sync; single pair) |
| F0-7 size | **720×1038×3** RGB |
| F0-7 non-black | black_frac ≈ **3.3e-5** |
| F0-7 non-constant | std ≈ **30.96** · mean ≈ **44.28** |
| F0-7 pixel change | MAE vs SRC0 ≈ **4.45** · vs SRC1 ≈ **4.46** |

Artifact: `outputs\out021_t05_superslomo.png`

---

## Visibility-map participation (F0-8)

Public fusion path (same as `video_to_slomo.py`):

```text
V_t_0 = sigmoid(intrpOut[:, 4:5])
V_t_1 = 1 - V_t_0
Ft = (w0*V_t_0*g0 + w1*V_t_1*g1) / (w0*V_t_0 + w1*V_t_1)
```

| Check | Value | Grade |
|-------|--------|--------|
| Channel-4 → sigmoid visibility | used | [CONFIRMED] |
| `V_t_0` spatial stats | mean 0.507 · std **0.047** · min **0.0086** · max **0.993** | non-trivial [CONFIRMED] |
| MAE(Ft_vis, Ft_V=0.5) | **0.000923** (> 1e-4) | changes fusion [CONFIRMED] |
| Saved map | `outputs\out021_V_t_0.png` | evidence |

**F0-8 = PASS** — visibility/occlusion maps **actually participate**; not a plain warp stub / forged constant V.

---

## Full command

```text
D:\GVFI-deps\c11d-ema-ab\venv\Scripts\python.exe D:\GVFI-deps\c13b-superslomo-smoke\run_smoke.py
```

Logs: `logs\smoke.log` · `logs\smoke_console.txt`  
Metrics: `metrics\smoke_metrics.json`

---

## Production / scope locks

| Check | Result |
|-------|--------|
| GVFI production code modified | **No** |
| VideoWorker modified | **No** |
| `backend_mode` | **cli** (unchanged) |
| Production RIFE | **rife-v4.6** (unchanged) |
| ABME started | **No** |
| Full A/B started | **No** |
| C13-C started | **No** |
| Other models downloaded | **No** (only Super-SloMo ckpt) |

---

## Answers (required)

| # | Item | Value |
|---|------|--------|
| 1 | **C13-B Verdict** | **PASS** |
| 2 | GPU/Runtime | **PASS** (RTX 5060 + torch 2.11+cu128) |
| 3 | visibility-map participated | **Yes** |
| 4 | Output size/validity | **720×1038** RGB · non-black · non-constant · valid |
| 5 | wall-clock | **0.7212 s** |
| 6 | Weight license | **UNKNOWN** |
| 7 | Allow C13-C? | **Not started** — needs **new explicit authorization** |
| 8 | Production | Still **`cli` + `rife-v4.6`** |

---

## Stop

C13-B complete. **Stop.** Do not enter C13-C / ABME / A/B without new auth.
