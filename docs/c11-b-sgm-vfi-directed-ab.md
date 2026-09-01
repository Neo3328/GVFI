# C11-B — SGM-VFI Directed Offline A/B (P0/P1)

**Date:** 2026-08-12  
**Phase:** Isolated offline A/B only · **not** production integration · **not** next phase  
**Prior:** C10-B P0 baseline · C10-D IFRNet morph · C11-A SGM shortlist  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`** · no VideoWorker · no GVFI code change  

**Weight license:** pretrained redistrib **UNKNOWN** (code Apache-2.0; SoftSplat academic dependency in stack).  
**Technical result ≠ production authorization.**

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C11-B Verdict = **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** (Overall stable drop, no major new defect) | **No** — Overall↓ only on **2/4** frames; mean **3.0→2.5** not a stable P0 net fix |
| **WEAK-GO** (Ghost↓ with tradeoff / partial Overall) | **Yes** — Ghost **3.0→1.0** on **4/4**; Smear↑ on **2/4**; morph toward unified blur |
| **NO-GO** | **No** — not zero signal |
| Weight / ship | **UNKNOWN** — must not treat this A/B as ship clearance |

**Do not** integrate SGM-VFI. **Do not** auto-enter next stage. Keep production **`cli` + `rife-v4.6`**.

---

## 1. Configuration

| Side | Implementation | Model | Isolation |
|------|----------------|-------|-----------|
| **A** | `rife-ncnn-vulkan` offline mid | **`rife-v4.6`** (reused C10-D `out*_t05.png`) | `D:\GVFI-deps\c11b-sgm-ab\ab\rife\` |
| **B** | Official `SGM-VFI` `inference(..., timestep=0.5)` | `ours_small` + **`ours-1-2-points`** + `ours-local` + `gmflow_sintel` | `D:\GVFI-deps\c11b-sgm-ab\` |

| Item | Value |
|------|--------|
| Source stills | `D:\GVFI-deps\rife-defect-audit\src\` (from existing dance MP4) |
| Resolution | **720×1038** |
| Timestep | **`t=0.5` both** |
| GPU | RTX 5060 Laptop · CUDA via isolated venv (`torch 2.11+cu128`) |
| Work / scores | `...\ab\` · `...\ab\metrics\scores.json` |

### Timestep / phase

SGM-VFI `Model.inference` **supports** `timestep=` (default 0.5).  
Both sides forced to **`t=0.5`** on identical SRC pairs → **no phase confound** for this A/B.

CLI 48fps frac ≠0.5 for #36/#39/#130 is **context only**; scored frames are offline fair mids (same protocol as C10-D).

---

## 2. Frame mapping

| Label out# | SRC n | SRC n+1 | CLI frac (context) | A/B t | Phase confound |
|-----------:|------:|--------:|-------------------:|------:|:--------------:|
| 21 | 13 | 14 | 0.500 | 0.5 | No |
| 36 | 22 | 23 | 0.875 | 0.5 | No |
| 39 | 24 | 25 | 0.750 | 0.5 | No |
| 130 | 81 | 82 | 0.625 | 0.5 | No |

Excluded: #12 (not in this priority set) · #25 (C10-B near_src, not mid).

Auxiliary similarity (not quality): full MAE RIFE↔SGM ≈ **1.05–1.31**; arm MAE ≈ **1.69–2.56**. Diff energy concentrates on arms (`sheets/diff/`).

---

## 3. Defect scores

### Per-frame

| Out# | Side | Ghost | Smear | Occlusion | Warp | Overall |
|-----:|------|------:|------:|----------:|-----:|--------:|
| 21 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 21 | SGM | **1** | **3** | 2 | 2 | **3** |
| 36 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 36 | SGM | **1** | **3** | 2 | 2 | **3** |
| 39 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 39 | SGM | **1** | 2 | 2 | **1** | **2** |
| 130 | RIFE | **3** | 2 | 2 | 1 | **3** |
| 130 | SGM | **1** | 2 | 2 | 1 | **2** |

### Aggregate (n=4)

| Metric | RIFE mean | SGM mean | Δ (SGM−RIFE) |
|--------|----------:|---------:|-------------:|
| Ghost | 3.0 | **1.0** | **−2.0** |
| Smear | 2.0 | **2.5** | **+0.5** |
| Occlusion | 2.0 | 2.0 | 0.0 |
| Warp | 1.75 | 1.5 | −0.25 |
| Overall | **3.0** | **2.5** | **−0.5** |

| Count | Value |
|-------|------:|
| Ghost improved | **4 / 4** |
| Smear worsened | **2 / 4** |
| Overall improved | **2 / 4** |
| Overall unchanged | **2 / 4** |

---

## 4. Evidence

### P0 arm crops

- `D:\GVFI-deps\c11b-sgm-ab\ab\sheets\p0\out021_p0_arm.png`
- `...\p0\out036_p0_arm.png`
- `...\p0\out039_p0_arm.png`
- `...\p0\out130_p0_arm.png`

### P1 motion-edge crops

- `...\p1\out021_p1_edge.png`
- `...\p1\out036_p1_edge.png`
- `...\p1\out039_p1_edge.png`
- `...\p1\out130_p1_edge.png`

### Full / diff / raw

- Full: `...\sheets\full\out{021,036,039,130}_full.png`
- Diff: `...\sheets\diff\out*_arm_diff.png`
- Raw: `...\rife\out*_t05.png`, `...\sgm\out*_t05.png`
- Mapping/manifest: `...\metrics\run_manifest.json`
- Scores: `...\metrics\scores.json`

---

## 5. Per-frame notes

| Out# | Note |
|-----:|------|
| **21** | Fair CLI mid. RIFE **layered double arm**; SGM **heavy single smear**. Overall **3→3**. |
| **36** | Same Ghost↓/Smear↑ morph; Overall tied at 3. |
| **39** | Ghost clearly reduced; smear not worse; mild Overall **3→2**. |
| **130** | Ghost reduced; limb more coherent than RIFE double; Overall **3→2** but still soft. |

---

## 6. Answers vs decision rules

| Question | Answer |
|----------|--------|
| Overall stable drop? | **No** — only 2/4 frames; mean −0.5 insufficient for **GO** |
| Ghost↓ but Smear↑ / Overall not stably↓? | **Yes** on #21/#36 — classic morph tradeoff |
| Vs C10-D IFRNet | Similar Ghost↓ pattern; SGM shows **slightly** more Overall movement (2/4) but still **WEAK-GO** class |
| Product? | **No** — weights **UNKNOWN** + SoftSplat academic dep |

---

## 7. License / stack caveats

1. SGM-VFI **code** Apache-2.0; **weights** no separate SPDX → redistrib **UNKNOWN**.  
2. Runtime uses **SoftSplat** (`model/softsplat.py` + CuPy) — upstream SoftSplat is **academic-only** for commercial use.  
3. This experiment is **research isolation only**.  
4. **Do not** treat WEAK-GO as GO for shipping.

---

## 8. Safety check

| Check | Result |
|-------|--------|
| GVFI production modified | **No** |
| `backend_mode` | **cli** |
| Production RIFE | **`rife-v4.6`** |
| VideoWorker called | **No** |
| Production outputs overwritten | **No** |
| Next phase auto-started | **No** |

---

## 9. Next Action

**Stop at C11-B.**

- Keep production: **`backend_mode=cli` + `rife-v4.6`**.  
- SGM-VFI = research-only WEAK-GO signal; **not** production candidate without license + SoftSplat clearance + stronger Overall evidence.  
- **Do not** auto-enter C11-C / integration.
