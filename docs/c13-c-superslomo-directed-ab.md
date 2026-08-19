# C13-C — Super-SloMo Visibility-Map vs RIFE Directed Offline A/B

**Date:** 2026-08-13  
**Phase:** Isolated offline directed A/B only · **not** production · **not** C13-D · **not** ABME · **not** long-film benchmark  

**Prior:** C13-B = **PASS** (RTX 5060 t=0.5 minimal forward + visibility participation)  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`** · no VideoWorker · no GVFI production code change  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C13-C Verdict = **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** | **No** — Smear mean **2.0→3.0**; Overall mean **2.8→2.8**; Overall improved **0/5**; **major Ghost→Smear morph on 5/5** |
| **WEAK-GO** | **Yes** — Ghost **2.8→1.0** on **5/5** with real visibility-map participation, but classic morph (not dual-defect fix) |
| **NO-GO** | **No** — Ghost reduction is real and localized to limb path |

**Did not break Ghost→Smear.** Explicit Visibility / Occlusion Reasoning (Super-SloMo soft visibility fusion) **did not** deliver dual-defect GO on this protocol.

**Do not** integrate Super-SloMo. **Do not** auto-enter C13-D / ABME / production work. Keep **`cli` + `rife-v4.6`**.  
**Stop:** waiting for next human authorization.

**Technical WEAK-GO ≠ production GO ≠ commercial GO.** Weight license remains **UNKNOWN**.

---

## 1. Configuration

| Side | Implementation | Isolation |
|------|----------------|-----------|
| **A** | Offline **`rife-v4.6`** mids @ `t=0.5` (C10-D lineage copies) | `D:\GVFI-deps\c13c-superslomo-ab\ab\rife\` |
| **B** | Super-SloMo visibility-map (`avinashpaliwal/Super-SloMo` + C13-B verified ckpt) | `D:\GVFI-deps\c13c-superslomo-ab\ab\superslomo\` |

| Item | Value |
|------|--------|
| Source stills | `D:\GVFI-deps\rife-defect-audit\src\` |
| Resolution | **720×1038** both |
| Timestep | **`t=0.5` both** |
| Alignment | Same SRC `n/n+1` + `t=0.5` (not CLI `frac≠0.5` outputs) |
| Smoke #21 | **PASS** before full A/B |
| Script | `D:\GVFI-deps\c13c-superslomo-ab\run_ab.py` |
| Interpreter | `D:\GVFI-deps\c11d-ema-ab\venv\Scripts\python.exe` |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU · torch 2.11.0+cu128 |

### Implementation / weights

| Item | Value |
|------|--------|
| Public impl | `avinashpaliwal/Super-SloMo` |
| Commit | `544802b543e4aaaa707ebac6ae6c61e1da72a6f6` |
| Checkpoint | `D:\GVFI-deps\c13c-superslomo-ab\weights\SuperSloMo.ckpt` |
| **Checkpoint SHA-256** | `1931F099A99E5E65A563F9B3AAE0E04B6D87D09A0C85BE1F761185C6BC67506E` |
| Code license | **MIT** |
| **Weight license** | **UNKNOWN** |
| **Commercial redistribution** | **UNKNOWN** |

### Pre-A/B checks

| Check | Result |
|-------|--------|
| Production code touched | **No** |
| VideoWorker touched | **No** |
| `backend_mode` | **cli** (unchanged) |
| Production RIFE | **rife-v4.6** (unchanged) |
| Smoke #21 | **PASS** (vis_ok · 720×1038 · non-black) |
| Historical scores modified | **No** (RIFE baseline reused) |

---

## 2. Frame mapping

| Label out# | SRC n | SRC n+1 | CLI frac (context only) | A/B t |
|-----------:|------:|--------:|------------------------:|------:|
| 12 | 7 | 8 | 0.875 | **0.5** |
| 21 | 13 | 14 | 0.500 | **0.5** |
| 36 | 22 | 23 | 0.875 | **0.5** |
| 39 | 24 | 25 | 0.750 | **0.5** |
| 130 | 81 | 82 | 0.625 | **0.5** |

Excluded: **#25**.

Auxiliary (RIFE↔SS): full MAE ≈ **1.50–2.33**; arm MAE ≈ **1.72–4.03**. Visibility participated on **5/5** (`V_t_0` std > 0.03; MAE vs equal-V fusion > 1e-4).

---

## 3. Defect scores

Rubric 0–3. **Ghost↓ + Smear↑ ⇒ morph ⇒ Overall not credited for Ghost↓.**

### Per-frame

| Out# | Side | Ghost | Smear | Occlusion | Warp | Overall |
|-----:|------|------:|------:|----------:|-----:|--------:|
| 12 | RIFE | 2 | 2 | 2 | 1 | 2 |
| 12 | SuperSloMo | **1** | **3** | 2 | 2 | **2** |
| 21 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 21 | SuperSloMo | **1** | **3** | **3** | **3** | **3** |
| 36 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 36 | SuperSloMo | **1** | **3** | **3** | **3** | **3** |
| 39 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 39 | SuperSloMo | **1** | **3** | 2 | **3** | **3** |
| 130 | RIFE | **3** | 2 | 2 | 1 | **3** |
| 130 | SuperSloMo | **1** | **3** | 2 | 2 | **3** |

### Aggregate (n=5)

| Metric | RIFE mean | SuperSloMo mean | Δ (SS−RIFE) |
|--------|----------:|----------------:|------------:|
| Ghost | 2.8 | **1.0** | **−1.8** |
| Smear | 2.0 | **3.0** | **+1.0** |
| Occlusion | 2.0 | 2.4 | +0.4 |
| Warp | 1.6 | **2.6** | **+1.0** |
| Overall | **2.8** | **2.8** | **0.0** |

| Count | Value |
|-------|------:|
| Ghost improved | **5 / 5** |
| Smear worsened | **5 / 5** |
| Overall improved | **0 / 5** |
| Major Ghost→Smear morph | **Yes (5/5)** |

---

## 4. GO gate check (all required)

| Gate | Result | Detail |
|------|:------:|--------|
| Ghost mean ↓ | **PASS** | 2.8 → 1.0 |
| Smear mean not worse | **FAIL** | 2.0 → 3.0 |
| Overall mean ↓ ≥ 0.6 | **FAIL** | 2.8 → 2.8 (Δ 0.0) |
| Overall improved ≥ 3/5 | **FAIL** | **0 / 5** |
| No major Ghost→Smear morph | **FAIL** | **5 / 5** morph |

**GO = FAIL.** Verdict = **WEAK-GO**.

---

## 5. Interpretation (evidence-tied)

1. **Visibility maps are real:** on every scored pair, `V_t_0` is spatially non-trivial and changes fusion vs forced V=0.5 (same path as C13-B / public `video_to_slomo`). Evidence sheets under `sheets/diff/out*_vis_evidence.png`.
2. **Ghost↓ is real** on the same five reliable mids — layered translucent limb contours are reduced vs offline RIFE.
3. **Smear↑ / morph repeats C11-E / C12 pattern:** removing double contours without a true structure-preserving mid yields a unified / dark / stretched smear mass. Warp and Occlusion also worsen on several frames (#21/#36 especially).
4. **Overall flat** — Ghost score drop must **not** be treated as Overall win under the dual-defect protocol.
5. **Paradigm note:** Explicit Visibility / Occlusion Reasoning was the C13-0 Top-1 thesis. On this host + this public Super-SloMo stack, it **behaves like another ordinary soft-fusion VFI cousin** for dual-defect GO purposes — mechanism differ, outcome morph same class.

---

## 6. Artifacts

| Kind | Path |
|------|------|
| Manifest | `D:\GVFI-deps\c13c-superslomo-ab\metrics\run_manifest.json` |
| Scores | `D:\GVFI-deps\c13c-superslomo-ab\metrics\scores.json` |
| Raw notes | `D:\GVFI-deps\c13c-superslomo-ab\metrics\raw_score_notes.md` |
| Env | `D:\GVFI-deps\c13c-superslomo-ab\env\env.json` |
| Full sheets | `...\sheets\full\out*_full.png` |
| P0 arm | `...\sheets\p0\out*_p0_arm.png` |
| P1 edge | `...\sheets\p1\out*_p1_edge.png` |
| Diff / vis evidence | `...\sheets\diff\out*_arm_diff.png` · `out*_vis_evidence.png` |
| RIFE / SuperSloMo mids | `...\ab\rife\` · `...\ab\superslomo\` |
| Visibility maps | `...\ab\visibility\out*_V_t_0.png` |
| SRC copies | `...\ab\src\` |
| Logs | `...\logs\smoke.log` · `...\logs\full_ab.log` |
| Checkpoint SHA-256 | `1931F099A99E5E65A563F9B3AAE0E04B6D87D09A0C85BE1F761185C6BC67506E` |

---

## 7. Required answers

| # | Item | Value |
|---|------|--------|
| 1 | **C13-C Verdict** | **WEAK-GO** |
| 2 | RIFE → Super-SloMo Ghost | **2.8 → 1.0** (↓ on **5/5**) |
| 3 | RIFE → Super-SloMo Smear | **2.0 → 3.0** (↑ on **5/5**) |
| 4 | RIFE → Super-SloMo Warp | **1.6 → 2.6** (worse) |
| 5 | RIFE → Super-SloMo Overall | **2.8 → 2.8** (improved **0/5**) |
| 6 | 5/5 per-frame | All **morph**; see §3 table |
| 7 | Broke Ghost→Smear? | **No** (**5/5** morph) |
| 8 | Reached GO? | **No** |
| 9 | Weight license | **UNKNOWN** (code MIT ≠ commercial clearance) |
| 10 | Allow next stage? | **No auto.** C13-D / ABME / production **require new explicit authorization** |

---

## 8. Stop line

**C13-C complete. Stop.**  

Forbidden without new auth: C13-D · ABME · generative/inpainting paradigm run · long-film benchmark · production integration · VideoWorker · `backend_mode` change · RIFE replace · writing UNKNOWN weights as commercial clearance.
