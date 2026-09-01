# C10-D — IFRNet vs RIFE Directed P0/P1 Offline A/B

**Date:** 2026-08-12  
**Phase:** Directed offline A/B on C10-B P0/P1 slots only  
**Prior:** C10-B quantification · C10-C IFRNet smoke **WEAK-GO** · C9.2-C limb morph **[DIFF]**  
**Forbidden performed:** no GVFI / `backend_mode` / VideoWorker / production RIFE change · no C10-E · no new model download  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`**

**Weight license:** IFRNet commercial redistrib remains **UNKNOWN** (unchanged; experiment ≠ clearance).

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C10-D Verdict = **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** | **No** — no stable net P0/P1 severity win; Overall unchanged |
| **WEAK-GO** | **Yes** — Ghost score drops on **5/5** critical pairs, but **Smear rises on 4/5**; classic **ghost → smear** morph tradeoff |
| **NO-GO** | Partial reading: if “improvement” requires Overall↓, this is effectively a **morph-only** change — documented below; label kept **WEAK-GO** per stated example (“Ghost↓ but Smear↑”) |
| **UNKNOWN** | **No** — mapping/evidence sufficient for the fair `t=0.5` protocol |

**Do not** replace production RIFE. **Do not** auto-enter C10-E / integration.

---

## 1. Configuration

| Side | Engine | Model | Isolation |
|------|--------|-------|-----------|
| **A** | `rife-ncnn-vulkan` (AI_Tools pack) | **`rife-v4.6`** | `D:\GVFI-deps\c10d-ifrnet-ab\rife\` |
| **B** | `ifrnet-ncnn-vulkan` (C10-C pack) | **`IFRNet_Vimeo90K`** | `D:\GVFI-deps\c10d-ifrnet-ab\ifrnet\` |

| Item | Value |
|------|--------|
| Source | Existing dance stills from `...\rife-defect-audit\src\` (from `L1L2_douyin_t3s.mp4`) |
| Resolution | **720×1038** both sides |
| Timestep | **`t=0.5` both** (fair) |
| GPU | RTX 5060 Laptop · Vulkan device **0** |
| Work root | `D:\GVFI-deps\c10d-ifrnet-ab\` |
| Scores | `...\metrics\scores.json` |

### Why forced `t=0.5`

`IFRNet_Vimeo90K` rejects custom `-s` / `-n` (“only GoPro model support custom numframe and timestep”).  
C10-B CLI outs #12/#36/#39/#130 sit at `frac≠0.5`. Comparing IFRNet `t=0.5` to those CLI slots would be a **phase confound**.

**Protocol chosen:** for each C10-B **source pair** `(n, n+1)`, generate **both** engines at **identical** `t=0.5`.  
Out numbers (#21, #39, …) are **labels** for the C10-B pairs, not claims that IFRNet matches the 48fps CLI index when `frac≠0.5`.

### Bridge (out#21 only, `frac_cli=0.5`)

Offline RIFE `t=0.5` vs existing CLI decode `frame_0021.png`: **MAE ≈ 1.31** → offline A tracks production RIFE class.  
Sheet: `sheets/bridge/out021_bridge.png`.

### Alignment

| Mode | Status |
|------|--------|
| **Time-aligned** (same SRC n/n+1, same `t=0.5`) | **Primary** — used for all scores |
| Index-aligned to CLI 48fps outs | **Auxiliary** — valid for #21; **not** used as sole ranker for `frac≠0.5` pairs |
| VFI↔VFI PSNR/SSIM as absolute quality | **Not used** (MAE reported only as similarity / localization aid) |

---

## 2. Frame mapping (C10-B pairs)

| Label out# | SRC n | SRC n+1 | CLI frac (context) | A/B timestep | Scored? |
|-----------:|------:|--------:|-------------------:|-------------:|:-------:|
| 12 | 7 | 8 | 0.875 | 0.5 | Yes |
| 21 | 13 | 14 | **0.500** | 0.5 | Yes (+ bridge) |
| 36 | 22 | 23 | 0.875 | 0.5 | Yes |
| 39 | 24 | 25 | 0.750 | 0.5 | Yes |
| 130 | 81 | 82 | 0.625 | 0.5 | Yes |
| 25 | 16 | 17 | 0.000 | — | **Excluded** (C10-B near_src, not mid) |

---

## 3. Defect scores (re-scored)

Rubric 0–3. Ghost counted only for **extra** layered / translucent limb contours not present as discrete doubles in both SRC frames.

### Per-frame

| Out# | Side | Ghost | Smear | Occlusion | Warp | Overall |
|-----:|------|------:|------:|----------:|-----:|--------:|
| 12 | RIFE | 2 | 2 | 2 | 1 | 2 |
| 12 | IFRNet | **1** | 2 | 2 | 1 | 2 |
| 21 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 21 | IFRNet | **1** | **3** | 2 | 2 | **3** |
| 36 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 36 | IFRNet | **1** | **3** | 2 | 2 | **3** |
| 39 | RIFE | **3** | 2 | 2 | 2 | **3** |
| 39 | IFRNet | **1** | **3** | 2 | **1** | **3** |
| 130 | RIFE | **3** | 2 | 2 | 1 | **3** |
| 130 | IFRNet | **1** | **3** | 2 | 1 | **3** |

### Aggregate (n=5)

| Metric | RIFE mean | IFRNet mean | Δ (IFR−RIFE) |
|--------|----------:|------------:|-------------:|
| Ghost | 2.8 | **1.0** | **−1.8** |
| Smear | 2.0 | **2.8** | **+0.8** |
| Occlusion | 2.0 | 2.0 | 0.0 |
| Warp | 1.6 | 1.4 | −0.2 |
| Overall | **2.8** | **2.8** | **0.0** |

| Count | Value |
|-------|------:|
| Frames Ghost improved (IFR lower) | **5 / 5** |
| Frames Smear worsened | **4 / 5** |
| Frames Overall improved | **0 / 5** |

Auxiliary similarity (not quality): full MAE RIFE↔IFRNet ≈ **0.47–1.81**; arm MAE ≈ **0.93–4.71** (largest **#36**). Diff energy concentrates on arms (`sheets/diff/*_arm_diff.png`).

---

## 4. Evidence sheets

### P0 (arm / occlusion)

| Out# | Path |
|-----:|------|
| 12 | `D:\GVFI-deps\c10d-ifrnet-ab\sheets\p0\out012_p0_arm.png` |
| 21 | `...\sheets\p0\out021_p0_arm.png` |
| 36 | `...\sheets\p0\out036_p0_arm.png` |
| 39 | `...\sheets\p0\out039_p0_arm.png` |
| 130 | `...\sheets\p0\out130_p0_arm.png` |

### P1 (motion boundary)

| Out# | Path |
|-----:|------|
| 12 | `...\sheets\p1\out012_p1_edge.png` |
| 21 | `...\sheets\p1\out021_p1_edge.png` |
| 36 | `...\sheets\p1\out036_p1_edge.png` |
| 39 | `...\sheets\p1\out039_p1_edge.png` |
| 130 | `...\sheets\p1\out130_p1_edge.png` |

### Full + diff + bridge

- Full: `...\sheets\full\out{012,021,036,039,130}_full.png`
- Arm |diff|×10: `...\sheets\diff\out*_arm_diff.png`
- Bridge #21: `...\sheets\bridge\out021_bridge.png`
- Raw A/B PNGs: `...\rife\out*_t05.png`, `...\ifrnet\out*_t05.png`

---

## 5. Per-critical-frame notes

| Out# | Difference summary |
|-----:|--------------------|
| **12** | Mild: RIFE soft double vs IFRNet slightly more unified blur; Overall tied at 2. |
| **21** | Strongest fair case. RIFE **layered double arm**; IFRNet **heavy single smear**. Bridge confirms CLI RIFE shares the ghost. Overall **3→3**. |
| **36** | Largest pixel morph gap. Ghost↓ / Smear↑ obvious; IFRNet darker blob, not a clean limb. |
| **39** | Same tradeoff; Warp −1 (softer edge) but structure lost; Overall still 3. |
| **130** | Late-clip **repeat** of ghost↔smear; confirms pattern is not a single-frame fluke. |

---

## 6. Answers to focus questions

| # | Question | Answer |
|---|----------|--------|
| 1 | IFRNet lower **P0 Ghost**? | **YES (score)** — discrete layered double-contour reduced on **5/5**. |
| 2 | IFRNet lower **P1 Warp**? | **Not stable** — mean Warp only **−0.2**; one mild #39 case. |
| 3 | Ghost merely → **Smear**? | **YES** — primary, repeatable finding; confirms C9.2-C hypothesis. |
| 4 | Better limb contour but lose detail? | Contour often **less double**, but fast-limb **structure/detail lost** to smear. |
| 5 | Stable quality advantage? | **NO** — Overall mean **2.8→2.8**; stable **morph difference**, not net quality win. |

---

## 7. Relation to C9.2-C

C9.2-C: “RIFE clearer **double-edge ghost**; IFRNet more **smear**” / no overall IFRNet win.  

**C10-D:** Same morph on **C10-B P0 pairs** with locked `t=0.5` and rubric scores → Ghost↓ is real as a **score dimension**, but **Overall severity does not fall**; tradeoff is **Smear↑**. Treat as **defect-form conversion**, not a production P0 fix.

---

## 8. Safety check

| Check | Result |
|-------|--------|
| GVFI production modified | **No** |
| `backend_mode` | **cli** |
| Production RIFE | **`rife-v4.6`** unchanged |
| VideoWorker modified | **No** |
| New model download | **No** (reused C10-C IFRNet pack + existing AI_Tools RIFE) |
| Weight license changed | **No** (still **UNKNOWN**) |
| Source / CLI enhanced MP4 overwritten | **No** |
| C10-E / integration | **Not started** |

---

## 9. Next Action

**Stop at C10-D.**

- Keep production: **`backend_mode=cli` + `rife-v4.6`**.  
- **Do not** auto-start C10-E.  
- **Do not** integrate IFRNet.  
- IFRNet remains research-only; any further work needs **new explicit authorization**.
