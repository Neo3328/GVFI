# C12-B — R2 Ghost-clean → Limb Structure Restore Directed Offline A/B

**Date:** 2026-08-13  
**Phase:** Isolated offline A/B only · **not** production · **not** C12-C · **not** R3  
**Prior:** C12-A / R1 = **WEAK-GO** (Ghost↓ + Smear↑ morph 5/5; half-translation cannot restore structure)

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`** · no VideoWorker · no GVFI production code change  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C12-B Verdict = **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** | **No** — Smear **2.0→3.0**; Overall **2.8→2.8**; Overall↑ **0/5**; morph **5/5**; Warp mean **1.6→2.6** |
| **WEAK-GO** | **Yes** — Ghost **2.8→1.0** on **5/5**, but LSR fails; classic Ghost→Smear morph |
| **NO-GO** | **No** — Ghost signal is real; pipeline is a valid two-stage R2 (not a fake) |
| **BLOCKED** | **No** — Stage B constructed, non-inert (matte MAE StageB−A ≈ 4.7–7.8), distinct from R1 |

**Do not** integrate. **Do not** auto-enter C12-C / R3 / R2.x. Keep **`cli` + `rife-v4.6`**.  
**Stop:** waiting for next human authorization.

| Lock | Value |
|------|--------|
| Production modified | **NO** |
| backend_mode | **cli** |
| Production RIFE | **rife-v4.6** |
| C12-C started | **NO** |
| R3 started | **NO** |

---

## 1. Configuration

| Side | Implementation | Isolation |
|------|----------------|-----------|
| **A** | Offline **`rife-v4.6`** @ `t=0.5` | `D:\GVFI-deps\c12b-r2-structure-restore-ab\ab\rife\` |
| **B** | **R2** two-stage (below) | `...\ab\r2\` · Stage A dumps in `...\ab\stage_a\` |

### R2 mechanism (distinct from C12-A / R1)

```
RIFE global mid
    → limb activity ROI matte
    → Stage A Ghost-clean: dense OF backward-warp WTA (intermediate; may smear)
    → Stage B Limb Structure Restore:
         OF-warped SRC donor → confidence-gated frequency split
         (low-freq structure mass + edge×photo-conf detail)
         + Poisson seamlessClone on matte core
    → composite with global RIFE outside matte
```

**Not used as “LSR”:** sharpen / unsharp / single-SRC half-translation / equal dual average / matte-only tweak.

| Item | Value |
|------|--------|
| SRC | `D:\GVFI-deps\rife-defect-audit\src\` |
| Resolution | **720×1038** |
| Timestep | **`t=0.5` both** |
| Frames | **#12 / #21 / #36 / #39 / #130** (#25 excluded) |
| Smoke | **PASS** on #21 before full A/B |
| Script | `D:\GVFI-deps\c12b-r2-structure-restore-ab\run_ab.py` |

---

## 2. Frame mapping

| out# | SRC n | SRC n+1 | CLI frac | A/B t |
|-----:|------:|--------:|---------:|------:|
| 12 | 7 | 8 | 0.875 | 0.5 |
| 21 | 13 | 14 | 0.500 | 0.5 |
| 36 | 22 | 23 | 0.875 | 0.5 |
| 39 | 24 | 25 | 0.750 | 0.5 |
| 130 | 81 | 82 | 0.625 | 0.5 |

Auxiliary: full MAE RIFE↔R2 ≈ **1.5–2.5**; StageB−A matte MAE ≈ **4.7–7.8**; arm lapvar ratio ≈ **1.0–1.3** (HF gate pass).

---

## 3. Defect scores

Rubric 0–3. **Ghost↓ + Smear↑ ⇒ morph ⇒ Overall not credited.**

### Per-frame

| Out# | Side | Ghost | Smear | Occlusion | Warp | Overall |
|-----:|------|------:|------:|----------:|-----:|--------:|
| 12 | RIFE | 2 | 2 | 2 | 1 | 2 |
| 12 | R2 | **1** | **3** | 2 | **2** | **2** |
| 21 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 21 | R2 | **1** | **3** | 2 | **3** | **3** |
| 36 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 36 | R2 | **1** | **3** | 2 | **3** | **3** |
| 39 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 39 | R2 | **1** | **3** | 2 | **3** | **3** |
| 130 | RIFE | **3** | 2 | 2 | 1 | **3** |
| 130 | R2 | **1** | **3** | 2 | **2** | **3** |

### Aggregate (n=5)

| Metric | RIFE mean | R2 mean | Δ |
|--------|----------:|--------:|--:|
| Ghost | 2.8 | **1.0** | **−1.8** |
| Smear | 2.0 | **3.0** | **+1.0** |
| Occlusion | 2.0 | 2.0 | 0.0 |
| Warp | 1.6 | **2.6** | **+1.0** |
| Overall | **2.8** | **2.8** | **0.0** |

| Count | Value |
|-------|------:|
| Ghost improved | **5 / 5** |
| Smear worsened | **5 / 5** |
| Overall improved | **0 / 5** |
| Major Ghost→Smear morph | **Yes (5/5)** |

---

## 4. GO gates

| Gate | Result | Detail |
|------|:------:|--------|
| Ghost mean ↓ | **PASS** | 2.8 → 1.0 |
| Smear mean not worse | **FAIL** | 2.0 → 3.0 |
| Overall mean ↓ ≥ 0.6 | **FAIL** | Δ 0.0 |
| Overall improved ≥ 3/5 | **FAIL** | **0 / 5** |
| No major Ghost→Smear morph | **FAIL** | **5 / 5** |

**GO = FAIL.**

---

## 5. Required answers

1. **R2 lower Ghost?** **Yes** — 2.8→1.0 on 5/5.  
2. **Avoid Smear increase?** **No** — 2.0→3.0.  
3. **LSR restore structure?** **No** — Stage B runs and differs from Stage A, but does **not** restore recognizable limb anatomy.  
4. **Ghost→Smear still present?** **Yes** — **5/5** morph.  
5. **Overall reach GO?** **No**.  
6. **Substantive gain vs C12-A/R1?** **No** — same Ghost/Smear/Overall morph pattern; Warp mean **worse** than R1.  
7. **Worth R3 pose/skeleton?** **Yes as a later authorized option** — OF-based LSR is insufficient; geometry prior remains open. **Not started here.**

---

## 6. Artifacts

| Kind | Path |
|------|------|
| Manifest | `D:\GVFI-deps\c12b-r2-structure-restore-ab\metrics\run_manifest.json` |
| Scores | `...\metrics\scores.json` |
| Raw notes | `...\metrics\raw_score_notes.md` |
| Full / P0 / P1 / Diff | `...\sheets\{full,p0,p1,diff}\` |
| Stage A dumps | `...\ab\stage_a\` |
| Masks | `...\ab\masks\` |
| Logs | `...\logs\smoke.log` · `...\logs\full_ab.log` |
| Env | `...\env\env.json` |
| Report (repo) | `docs/c12-b-r2-structure-restore-directed-ab.md` |

---

## 7. Stop line

**C12-B complete. Waiting for next authorization.**  
Forbidden without new auth: C12-C · R3 · R2.x auto-tune · production integration · VideoWorker · `backend_mode` change · RIFE replace.
