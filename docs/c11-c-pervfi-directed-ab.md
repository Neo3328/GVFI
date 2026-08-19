# C11-C — PerVFI Directed Offline A/B (Dual-Defect)

**Date:** 2026-08-13  
**Phase:** Isolated offline A/B only · **not** production integration · **not** EMA / next candidate  
**Prior:** C10-B P0 baseline · C10-D IFRNet morph · C11-B SGM WEAK-GO · C11-C design  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`** · no VideoWorker · no GVFI code change  

**Weight license:** **CLAIMED Apache-2.0** (HF `license: apache-2.0` + README “code and model”); SoftSplat **academic** dep remains in **inference** stack.  
**Technical result ≠ production authorization.**

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C11-C Verdict = **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** (Ghost↓ ∧ Smear not worse ∧ Overall clear↓) | **No** — Smear mean **2.0→2.6**; Overall mean **2.8→2.4** (Δ −0.4 < 0.6); Overall improved only **2/5** |
| **WEAK-GO** (Ghost↓ with morph / partial Overall) | **Yes** — Ghost **2.8→1.0** on **5/5**; Smear↑ on **3/5**; classic ghost→smear morph on #21/#36/#130 |
| **NO-GO** | **No** — not zero Ghost signal |
| Weight / ship | CLAIMED Apache + SoftSplat academic risk — **must not** treat as ship clearance |

**Do not** integrate PerVFI. **Do not** auto-start EMA-VFI or production work. Keep production **`cli` + `rife-v4.6`**.

---

## 1. Configuration

| Side | Implementation | Model | Isolation |
|------|----------------|-------|-----------|
| **A** | `rife-ncnn-vulkan` offline mid | **`rife-v4.6`** (copied from C10-D `out*_t05.png`) | `D:\GVFI-deps\c11c-pervfi-ab\ab\rife\` |
| **B** | Official `PerVFI` `Pipeline_infer` + `inference_rand_noise(..., time=0.5)` | **`raft+pervfi`** · `checkpoints/PerVFI/v00.pth` + `RAFT/raft-sintel.pth` | `D:\GVFI-deps\c11c-pervfi-ab\` |

| Item | Value |
|------|--------|
| Source stills | `D:\GVFI-deps\rife-defect-audit\src\` |
| Resolution | **720×1038** both |
| Timestep | **`t=0.5` both** (API `time=`) |
| GPU | RTX 5060 Laptop · isolated venv (`torch 2.11+cu128`) |
| Work / scores | `...\ab\` · `...\metrics\scores.json` |
| Host shim | SoftSplat `compile_with_cache` → `cupy.RawKernel` (same class of fix as C11-B; algorithm unchanged) |

### Timestep / phase

PerVFI `inference_rand_noise` / `build_models.infer` **supports** `time=` (default mid).  
Both sides forced to **`t=0.5`** on identical SRC pairs → **no phase confound**.

---

## 2. Frame mapping

| Label out# | SRC n | SRC n+1 | CLI frac (context) | A/B t | Phase confound |
|-----------:|------:|--------:|-------------------:|------:|:--------------:|
| 12 | 7 | 8 | 0.875 | 0.5 | No |
| 21 | 13 | 14 | 0.500 | 0.5 | No |
| 36 | 22 | 23 | 0.875 | 0.5 | No |
| 39 | 24 | 25 | 0.750 | 0.5 | No |
| 130 | 81 | 82 | 0.625 | 0.5 | No |

Excluded: **#25** (C10-B near_src, not mid).

Auxiliary similarity (not quality): full MAE RIFE↔PerVFI ≈ **1.38–2.01**; arm MAE ≈ **2.24–3.80**.

---

## 3. Defect scores

Rubric 0–3. Ghost = extra layered/translucent limb **absent from both SRC**.  
**Rule applied:** Ghost↓ + Smear↑ ⇒ **morph** ⇒ **Overall not credited as improved**.

### Per-frame

| Out# | Side | Ghost | Smear | Occlusion | Warp | Overall |
|-----:|------|------:|------:|----------:|-----:|--------:|
| 12 | RIFE | 2 | 2 | 2 | 1 | 2 |
| 12 | PerVFI | **1** | 2 | 2 | 1 | **1** |
| 21 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 21 | PerVFI | **1** | **3** | 2 | 2 | **3** |
| 36 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 36 | PerVFI | **1** | **3** | 2 | 2 | **3** |
| 39 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 39 | PerVFI | **1** | 2 | 2 | **1** | **2** |
| 130 | RIFE | **3** | 2 | 2 | 1 | **3** |
| 130 | PerVFI | **1** | **3** | 2 | 1 | **3** |

### Aggregate (n=5)

| Metric | RIFE mean | PerVFI mean | Δ (PerVFI−RIFE) |
|--------|----------:|------------:|----------------:|
| Ghost | 2.8 | **1.0** | **−1.8** |
| Smear | 2.0 | **2.6** | **+0.6** |
| Occlusion | 2.0 | 2.0 | 0.0 |
| Warp | 1.6 | 1.4 | −0.2 |
| Overall | **2.8** | **2.4** | **−0.4** |

| Count | Value |
|-------|------:|
| Ghost improved | **5 / 5** |
| Smear worsened | **3 / 5** |
| Overall improved | **2 / 5** (#12, #39) |
| Overall unchanged | **3 / 5** (#21, #36, #130 — morph) |

---

## 4. GO gate check (all required)

| Gate | Result | Detail |
|------|:------:|--------|
| Ghost mean ↓ | **PASS** | 2.8 → 1.0 |
| Smear mean **not** worse | **FAIL** | 2.0 → 2.6 |
| Overall mean ↓ ≥ 0.6 | **FAIL** | 2.8 → 2.4 (Δ −0.4) |
| Overall improved ≥ 3/5 | **FAIL** | 2/5 |
| **GO?** | **No** | → **WEAK-GO** |

---

## 5. Evidence

### P0 arm crops

- `D:\GVFI-deps\c11c-pervfi-ab\sheets\p0\out012_p0_arm.png`
- `...\p0\out021_p0_arm.png`
- `...\p0\out036_p0_arm.png`
- `...\p0\out039_p0_arm.png`
- `...\p0\out130_p0_arm.png`

### P1 motion-edge crops

- `...\sheets\p1\out012_p1_edge.png`
- `...\p1\out021_p1_edge.png`
- `...\p1\out036_p1_edge.png`
- `...\p1\out039_p1_edge.png`
- `...\p1\out130_p1_edge.png`

### Full / diff / raw / metrics

- Full: `...\sheets\full\out{012,021,036,039,130}_full.png`
- Diff: `...\sheets\diff\out*_arm_diff.png`
- Raw: `...\ab\rife\out*_t05.png`, `...\ab\pervfi\out*_t05.png`
- Manifest: `...\metrics\run_manifest.json`
- Scores: `...\metrics\scores.json`

---

## 6. Per-frame notes

| Out# | Note |
|-----:|------|
| **12** | Mild case. RIFE soft double → PerVFI single limb; Smear tied; Overall **2→1** (credited). |
| **21** | Fair CLI mid. RIFE **layered double arm**; PerVFI **heavy unified smear**. Morph → Overall **3→3**. |
| **36** | Ghost↓; shoulder/arm **jagged smear/tear**. Morph → Overall tied at 3. |
| **39** | Ghost clearly reduced; smear not worse; Overall **3→2**. |
| **130** | Ghost↓ to wider single smear; Overall **3→3** (not credited). |

---

## 7. Answers vs dual-defect question

| Question | Answer |
|----------|--------|
| Ghost↓ and Smear↓ together? | **No** — Ghost↓ on 5/5, but Smear↑ on 3/5; mean Smear worse |
| Overall severity clearly↓? | **No** — mean −0.4; only 2/5 frames Overall↓ |
| Ghost↓ but Smear↑ morph? | **Yes** on #21 / #36 / #130 |
| Vs C10-D IFRNet / C11-B SGM | Same **WEAK-GO morph class**; PerVFI not a production-grade dual-defect fix |
| Product? | **No** — SoftSplat in inference + no GO |

---

## 8. License / stack caveats

1. Repo **LICENSE** Apache-2.0; HF model card `license: apache-2.0`; README claims code **and model** Apache → recorded as **CLAIMED Apache-2.0**.  
2. Inference path still embeds **SoftSplat** (CuPy) — upstream SoftSplat is **academic-only** for commercial use.  
3. This experiment is **research isolation only**.  
4. **Do not** treat WEAK-GO as GO for shipping.

---

## 9. Safety check

| Check | Result |
|-------|--------|
| GVFI production modified | **No** |
| `backend_mode` | **cli** |
| Production RIFE | **`rife-v4.6`** |
| VideoWorker called | **No** |
| Production outputs overwritten | **No** |
| EMA-VFI / RIFE-ckpt / FILM started | **No** |
| Next phase auto-started | **No** |

---

## 10. Next Action

**Stop at C11-C PerVFI A/B.**

- Keep production: **`backend_mode=cli` + `rife-v4.6`**.  
- PerVFI = research-only **WEAK-GO** (Ghost↓ / Smear↑ morph).  
- **Do not** integrate.  
- **Do not** auto-enter EMA-VFI (requires **new explicit authorization**).  
- **Do not** claim quality replacement success.

---

## Final box (required)

| Item | Value |
|------|--------|
| **C11-C Verdict** | **WEAK-GO** |
| Ghost RIFE → PerVFI | **2.8 → 1.0** (↓) |
| Smear RIFE → PerVFI | **2.0 → 2.6** (↑) |
| Overall RIFE → PerVFI | **2.8 → 2.4** (↓ insufficient) |
| 5/5 Overall improved? | **2/5 only** |
| GO gates all met? | **No** |
| Weight license | **CLAIMED Apache-2.0** (+ SoftSplat academic inference dep) |
| Enter next stage? | **No** — not without new explicit auth |
