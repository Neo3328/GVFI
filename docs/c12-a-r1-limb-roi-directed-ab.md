# C12-A — R1 Limb-ROI Dual-Path Directed Offline A/B (Dual-Defect)

**Date:** 2026-08-13  
**Phase:** Isolated offline A/B only · **not** production · **not** C12-B · **not** integration  
**Prior:** C11-E = **CHANGE_APPROACH** · C12-0 Human/Limb-Aware design (recommend R1)

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`** · no VideoWorker · no GVFI production code change  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C12-A Verdict = **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** | **No** — Smear mean **2.0→3.0**; Overall mean **2.8→2.8**; Overall improved **0/5**; **major Ghost→Smear morph on 5/5** |
| **WEAK-GO** | **Yes** — Ghost **2.8→1.0** on **5/5**, but classic morph (not dual-defect fix) |
| **NO-GO** | **No** — Ghost signal is real and localized |

**Do not** integrate R1. **Do not** auto-enter C12-B / R2 / R3 / production work. Keep **`cli` + `rife-v4.6`**.  
**Stop:** waiting for next human authorization.

---

## 1. Configuration

| Side | Implementation | Isolation |
|------|----------------|-----------|
| **A** | Offline **`rife-v4.6`** mids @ `t=0.5` (C10-D copies) | `D:\GVFI-deps\c12a-r1-limb-roi-ab\ab\rife\` |
| **B** | **R1:** RIFE global + **limb-activity matte**; local mid = **single sharper-SRC** half-median-translation (no equal blend / dual WTA / unsharp) | `D:\GVFI-deps\c12a-r1-limb-roi-ab\ab\r1\` |

| Item | Value |
|------|--------|
| Source stills | `D:\GVFI-deps\rife-defect-audit\src\` |
| Resolution | **720×1038** both |
| Timestep | **`t=0.5` both** |
| Fusion mask | Activity matte inside P0 box `(0.12,0.18,0.88,0.62)` — **not** full-rectangle replace |
| Smoke | **PASS** on #21 (exit 0 · non-black · res · MAE≠0 · black/chroma/HF lapvar gates) before full A/B |
| Script | `D:\GVFI-deps\c12a-r1-limb-roi-ab\run_ab.py` |

### Pre-A/B checks

| Check | Result |
|-------|--------|
| Production code touched | **No** |
| VideoWorker touched | **No** |
| `backend_mode` | **cli** (unchanged) |
| Smoke #21 | **PASS** |

---

## 2. Frame mapping

| Label out# | SRC n | SRC n+1 | CLI frac (context) | A/B t |
|-----------:|------:|--------:|-------------------:|------:|
| 12 | 7 | 8 | 0.875 | 0.5 |
| 21 | 13 | 14 | 0.500 | 0.5 |
| 36 | 22 | 23 | 0.875 | 0.5 |
| 39 | 24 | 25 | 0.750 | 0.5 |
| 130 | 81 | 82 | 0.625 | 0.5 |

Excluded: **#25**.

Auxiliary: full MAE RIFE↔R1 ≈ **1.68–2.58**; arm MAE ≈ **5.0–7.7**; arm lapvar ratio ≈ **0.94–1.16** (no HF explosion after gate).

---

## 3. Defect scores

Rubric 0–3. **Ghost↓ + Smear↑ ⇒ morph ⇒ Overall not credited.**

### Per-frame

| Out# | Side | Ghost | Smear | Occlusion | Warp | Overall |
|-----:|------|------:|------:|----------:|-----:|--------:|
| 12 | RIFE | 2 | 2 | 2 | 1 | 2 |
| 12 | R1 | **1** | **3** | 2 | 1 | **2** |
| 21 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 21 | R1 | **1** | **3** | 2 | 2 | **3** |
| 36 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 36 | R1 | **1** | **3** | 2 | 2 | **3** |
| 39 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 39 | R1 | **1** | **3** | 2 | 2 | **3** |
| 130 | RIFE | **3** | 2 | 2 | 1 | **3** |
| 130 | R1 | **1** | **3** | 2 | 1 | **3** |

### Aggregate (n=5)

| Metric | RIFE mean | R1 mean | Δ (R1−RIFE) |
|--------|----------:|--------:|------------:|
| Ghost | 2.8 | **1.0** | **−1.8** |
| Smear | 2.0 | **3.0** | **+1.0** |
| Occlusion | 2.0 | 2.0 | 0.0 |
| Warp | 1.6 | 1.6 | 0.0 |
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

1. **R1 localization works:** diffs concentrate on limb-activity matte; non-matte ≈ RIFE (outside MAE ~0).  
2. **Ghost↓ is real** on the same five reliable mids — confirms C12-0 thesis that limb-local intervention can attack layered Ghost without swapping the global VFI.  
3. **Smear↑ / morph repeats C11-E pattern** inside the ROI: removing double contour without a true structure restore yields a unified smear mass. Single-SRC half-translation is **not** sufficient as the “structure-preserving local mid.”  
4. **Overall flat** — Ghost score drop must **not** be treated as Overall win under the dual-defect protocol.

---

## 6. Artifacts

| Kind | Path |
|------|------|
| Manifest | `D:\GVFI-deps\c12a-r1-limb-roi-ab\metrics\run_manifest.json` |
| Scores | `D:\GVFI-deps\c12a-r1-limb-roi-ab\metrics\scores.json` |
| Raw notes | `D:\GVFI-deps\c12a-r1-limb-roi-ab\metrics\raw_score_notes.md` |
| Full sheets | `...\sheets\full\out*_full.png` |
| P0 arm | `...\sheets\p0\out*_p0_arm.png` |
| P1 edge | `...\sheets\p1\out*_p1_edge.png` |
| Diff | `...\sheets\diff\out*_arm_diff.png` |
| Masks | `...\ab\masks\out*_roi.png` |
| RIFE / R1 mids | `...\ab\rife\` · `...\ab\r1\` |
| Logs | `...\logs\smoke.log` · `...\logs\full_ab.log` |
| Env | `...\env\env.json` |

---

## 7. Stop line

**C12-A complete. Waiting for next authorization.**  
Forbidden without new auth: C12-B · R2/R3 runs · production integration · VideoWorker · `backend_mode` change · RIFE replace.
