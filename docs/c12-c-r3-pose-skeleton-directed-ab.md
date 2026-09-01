# C12-C — R3 Pose/Skeleton-guided Directed Offline A/B

**Date:** 2026-08-13  
**Phase:** Isolated offline A/B only · **not** production · **not** C12-D  
**Prior:** C12-A R1 WEAK-GO · C12-B R2 WEAK-GO  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`** · no VideoWorker · no GVFI production code change  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C12-C Verdict = **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** | **No** — Smear mean **2.0→2.6**; Overall mean↓ only **0.2** (&lt;0.6); Overall↑ **1/5**; morph **3/5** |
| **WEAK-GO** | **Yes** — Ghost **2.8→1.0** on **5/5**; pose route real; #36 shows partial structure win |
| **NO-GO** | **No** — Ghost + pose detection are real signals |
| **BLOCKED** | **No** — MediaPipe pose + skeleton fill ran on all 5 |

**Do not** integrate. **Do not** auto-enter C12-D. Keep **`cli` + `rife-v4.6`**.

| Lock | Value |
|------|--------|
| Production modified | **NO** |
| backend_mode | **cli** |
| Production RIFE | **rife-v4.6** |
| C12-D started | **NO** |

---

## 1. Configuration

| Side | Implementation |
|------|----------------|
| **A** | Offline **`rife-v4.6`** @ `t=0.5` |
| **B** | **R3:** MediaPipe `pose_landmarker_full.task` on SRC n/n+1 → lerp skeleton @ 0.5 → per-arm-segment affine warp SRC→mid bones → sharper-WTA ribbon composite into RIFE |

| Item | Value |
|------|--------|
| Isolation | `D:\GVFI-deps\c12c-r3-pose-ab\` |
| SRC | `D:\GVFI-deps\rife-defect-audit\src\` |
| Resolution | **720×1038** |
| Timestep | **`t=0.5`** |
| Frames | **#12 / #21 / #36 / #39 / #130** |
| Smoke | **PASS** on #21 before full A/B |
| Pose license note | MediaPipe stack (Apache-2.0) — research only; **≠** production auth |

Distinct from R1/R2: geometry prior = **interpolated skeleton**, not OF WTA / half-translation / freq-split LSR.

---

## 2. Frame mapping & pose health

| out# | SRC n/n+1 | arm_vis n/n+1 | matte_frac | arm MAE |
|-----:|-----------|---------------|-----------:|--------:|
| 12 | 7/8 | 0.99/0.99 | 0.036 | 0.82 |
| 21 | 13/14 | 1.00/0.98 | 0.039 | 1.75 |
| 36 | 22/23 | 0.93/0.93 | 0.039 | 1.70 |
| 39 | 24/25 | 0.93/0.95 | — | — |
| 130 | 81/82 | 0.90/0.97 | — | — |

Pose detected on **5/5**. Skeleton overlays saved under `ab/pose/`.

---

## 3. Defect scores

**Ghost↓ + Smear↑ ⇒ morph ⇒ Overall not credited.**

### Per-frame

| Out# | Side | Ghost | Smear | Occlusion | Warp | Overall |
|-----:|------|------:|------:|----------:|-----:|--------:|
| 12 | RIFE | 2 | 2 | 2 | 1 | 2 |
| 12 | R3 | **1** | **3** | 2 | 1 | **2** |
| 21 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 21 | R3 | **1** | **3** | 2 | **3** | **3** |
| 36 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 36 | R3 | **1** | 2 | 2 | 2 | **2** |
| 39 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 39 | R3 | **1** | 2 | 2 | **3** | **3** |
| 130 | RIFE | **3** | 2 | 2 | 1 | **3** |
| 130 | R3 | **1** | **3** | 2 | **3** | **3** |

### Aggregate (n=5)

| Metric | RIFE | R3 | Δ |
|--------|-----:|---:|--:|
| Ghost | 2.8 | **1.0** | **−1.8** |
| Smear | 2.0 | **2.6** | **+0.6** |
| Occlusion | 2.0 | 2.0 | 0.0 |
| Warp | 1.6 | **2.4** | **+0.8** |
| Overall | 2.8 | **2.6** | **−0.2** |

| Count | Value |
|-------|------:|
| Ghost improved | **5 / 5** |
| Smear worsened | **3 / 5** |
| Overall improved | **1 / 5** (#36) |
| Major Ghost→Smear morph | **Yes (3/5)** |

---

## 4. GO gates

| Gate | Result | Detail |
|------|:------:|--------|
| Ghost mean ↓ | **PASS** | 2.8 → 1.0 |
| Smear mean not worse | **FAIL** | 2.0 → 2.6 |
| Overall mean ↓ ≥ 0.6 | **FAIL** | Δ −0.2 only |
| Overall improved ≥ 3/5 | **FAIL** | **1 / 5** |
| No major Ghost→Smear morph | **FAIL** | **3 / 5** |

**GO = FAIL.**

---

## 5. Answers

1. **Ghost↓?** **Yes** (2.8→1.0, 5/5).  
2. **Smear not↑?** **No** (2.0→2.6).  
3. **Pose guide real?** **Yes** — landmarks on all pairs.  
4. **Ghost→Smear still?** **Yes** on **3/5**.  
5. **Overall GO?** **No**.  
6. **vs R1/R2?** Slightly better Smear mean (2.6 vs 3.0) and one Overall win (#36), **not** dual-defect GO.  
7. **Enter C12-D?** **No** — stop; needs new authorization.

---

## 6. Artifacts

| Kind | Path |
|------|------|
| Manifest / scores / notes | `D:\GVFI-deps\c12c-r3-pose-ab\metrics\` |
| Sheets | `...\sheets\{full,p0,p1,diff}\` |
| Pose overlays | `...\ab\pose\` |
| Logs | `...\logs\smoke.log` · `full_ab.log` |
| Report | `docs/c12-c-r3-pose-skeleton-directed-ab.md` |

---

## 7. Stop line

**C12-C complete. C12-D started = NO. Waiting for next authorization.**
