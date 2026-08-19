# C11-D — EMA-VFI Directed Offline A/B (Dual-Defect)

**Date:** 2026-08-13  
**Phase:** Isolated offline A/B only · **not** production integration · **not** C11-E  
**Prior:** C10-B · C10-D IFRNet morph · C11-B SGM WEAK-GO · C11-C PerVFI WEAK-GO · C11-D design  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`** · no VideoWorker · no GVFI code change  

**Code license:** Apache-2.0  
**Weight license:** **UNKNOWN** (Google Drive / Baidu `ckpt/*.pkl`; no separate SPDX)  
**Technical result ≠ production authorization.**

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C11-D Verdict = **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** | **No** — Smear mean **2.0→3.0**; Overall mean **2.8→2.8**; Overall improved **0/5**; **major Ghost→Smear morph on 5/5** |
| **WEAK-GO** | **Yes** — Ghost **2.8→1.0** on **5/5**, but classic morph (not dual-defect fix) |
| **NO-GO** | **No** — Ghost signal is real |
| Weight / ship | Weights **UNKNOWN** — **must not** treat as ship clearance |

**Do not** integrate EMA-VFI. **Do not** auto-enter C11-E or production work. Keep **`cli` + `rife-v4.6`**.

---

## 1. Configuration

| Side | Implementation | Model | Isolation |
|------|----------------|-------|-----------|
| **A** | `rife-ncnn-vulkan` offline mid | **`rife-v4.6`** (C10-D copies) | `D:\GVFI-deps\c11d-ema-ab\ab\rife\` |
| **B** | Official EMA-VFI `Model.inference(..., timestep=0.5)` | **`ours.pkl`** (TTA on) | `D:\GVFI-deps\c11d-ema-ab\` |

| Item | Value |
|------|--------|
| Source stills | `D:\GVFI-deps\rife-defect-audit\src\` |
| Resolution | **720×1038** both |
| Timestep | **`t=0.5` both** |
| GPU | RTX 5060 Laptop · isolated venv (`torch 2.11+cu128`) |
| Smoke | **PASS** on #21 before full A/B |
| Warp stack | `grid_sample` backwarp — **no SoftSplat** |

### Pre-A/B checks

| Check | Result |
|-------|--------|
| Code present | `MCG-NJU/EMA-VFI` cloned |
| Code license | **Apache-2.0** |
| Weights present | `ckpt/ours.pkl` (+ small / small_t) |
| Weight license | **UNKNOWN** |
| Smoke #21 | **PASS** (non-black · 720×1038 · exit 0) |

---

## 2. Frame mapping

| Label out# | SRC n | SRC n+1 | CLI frac (context) | A/B t | Phase confound |
|-----------:|------:|--------:|-------------------:|------:|:--------------:|
| 12 | 7 | 8 | 0.875 | 0.5 | No |
| 21 | 13 | 14 | 0.500 | 0.5 | No |
| 36 | 22 | 23 | 0.875 | 0.5 | No |
| 39 | 24 | 25 | 0.750 | 0.5 | No |
| 130 | 81 | 82 | 0.625 | 0.5 | No |

Excluded: **#25**.

Auxiliary MAE RIFE↔EMA ≈ **0.67–1.01**; arm MAE ≈ **1.18–1.88**.

---

## 3. Defect scores

Rubric 0–3. **Ghost↓ + Smear↑ ⇒ morph ⇒ Overall not credited.**

### Per-frame

| Out# | Side | Ghost | Smear | Occlusion | Warp | Overall |
|-----:|------|------:|------:|----------:|-----:|--------:|
| 12 | RIFE | 2 | 2 | 2 | 1 | 2 |
| 12 | EMA | **1** | **3** | 2 | 1 | **2** |
| 21 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 21 | EMA | **1** | **3** | 2 | 2 | **3** |
| 36 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 36 | EMA | **1** | **3** | 2 | 2 | **3** |
| 39 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 39 | EMA | **1** | **3** | 2 | 2 | **3** |
| 130 | RIFE | **3** | 2 | 2 | 1 | **3** |
| 130 | EMA | **1** | **3** | 2 | 1 | **3** |

### Aggregate (n=5)

| Metric | RIFE mean | EMA mean | Δ (EMA−RIFE) |
|--------|----------:|---------:|-------------:|
| Ghost | 2.8 | **1.0** | **−1.8** |
| Smear | 2.0 | **3.0** | **+1.0** |
| Occlusion | 2.0 | 2.0 | 0.0 |
| Warp | 1.6 | 1.4 | −0.2 |
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
| Overall mean ↓ ≥ 0.6 | **FAIL** | 2.8 → 2.8 |
| Overall improved ≥ 3/5 | **FAIL** | 0/5 |
| No major Ghost→Smear morph | **FAIL** | morph on all 5 |
| **GO?** | **No** | → **WEAK-GO** |

---

## 5. Evidence

### P0 / P1 / full / diff

- `D:\GVFI-deps\c11d-ema-ab\sheets\p0\out{012,021,036,039,130}_p0_arm.png`
- `...\sheets\p1\out*_p1_edge.png`
- `...\sheets\full\out*_full.png`
- `...\sheets\diff\out*_arm_diff.png`

### Raw / metrics

- `...\ab\rife\out*_t05.png`
- `...\ab\ema\out*_t05.png`
- `...\metrics\run_manifest.json`
- `...\metrics\scores.json`

---

## 6. Per-frame notes

| Out# | Note |
|-----:|------|
| **12** | RIFE soft double → EMA thick smear blob; Overall tied. |
| **21** | Fair mid. RIFE layered double arm → EMA solid smear mass; morph. |
| **36** | Same morph pattern on horizontal swing. |
| **39** | Ghost↓ / directional mushy smear↑; Overall tied. |
| **130** | Late-clip repeat of Ghost→Smear; confirms not a fluke. |

---

## 7. Vs prior candidates

| Candidate | Ghost | Smear | Overall | Class |
|-----------|------:|------:|--------:|-------|
| IFRNet (C10-D) | ↓ | ↑ | flat | WEAK-GO morph |
| SGM-VFI (C11-B) | ↓ | ↑ partial | partial↓ | WEAK-GO |
| PerVFI (C11-C) | ↓ | ↑ | mild↓ / 2/5 | WEAK-GO morph |
| **EMA-VFI (C11-D)** | ↓ | ↑ (stronger) | **flat / 0/5** | **WEAK-GO morph** |

EMA does **not** break the morph pattern; Smear worsening is **more uniform (5/5)** than PerVFI.

---

## 8. License / stack

1. Code **Apache-2.0**.  
2. Weights **UNKNOWN** — research isolation only.  
3. No SoftSplat in official warp path (better than PerVFI/SGM for product counsel *if* quality ever GO’d — it did not).  
4. **Do not** ship.

---

## 9. Safety check

| Check | Result |
|-------|--------|
| GVFI production modified | **No** |
| `backend_mode` | **cli** |
| Production RIFE | **`rife-v4.6`** |
| VideoWorker called | **No** |
| Production outputs overwritten | **No** |
| C11-E / integration | **Not started** |
| Other models expanded | **No** |

---

## 10. Next Action

**Stop at C11-D.**

- Keep production: **`backend_mode=cli` + `rife-v4.6`**.  
- EMA-VFI = research-only **WEAK-GO** (Ghost↓ / Smear↑ morph).  
- **Do not** integrate.  
- **Do not** auto-enter C11-E.

---

## Final box (required)

| Item | Value |
|------|--------|
| **C11-D Verdict** | **WEAK-GO** |
| Ghost RIFE → EMA | **2.8 → 1.0** (↓) |
| Smear RIFE → EMA | **2.0 → 3.0** (↑) |
| Overall RIFE → EMA | **2.8 → 2.8** (flat) |
| Overall improved | **0 / 5** |
| Major morph? | **Yes (5/5)** |
| GO gates all met? | **No** |
| Weight license | **UNKNOWN** |
| Enter C11-E / integrate? | **No** |
