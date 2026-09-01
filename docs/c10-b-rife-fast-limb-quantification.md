# C10-B — RIFE Fast-Limb Defect Quantification

**Date:** 2026-08-12  
**Scope:** Quantify C10-A P0/P1 on existing local dance clip + existing RIFE v4.6 CLI output only.  
**Not in scope:** IFRNet · FILM · new models · GVFI code · `backend_mode` · RIFE config · C10-C  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

**PASS**

Meaning: C10-B quantification pipeline completed with auditable mapping, sheets, and scores.  
**Not** a claim that RIFE quality is acceptable.

---

## Environment

| Item | Value |
|------|--------|
| Source video | `D:\GVFI-deps\native-video-worker-ab\c81_real_content\input\L1L2_douyin_t3s.mp4` |
| RIFE output | `D:\GVFI-deps\native-video-worker-ab\c81_real_content\gvfi_cli\L1L2_douyin_t3s_enhanced.mp4` |
| Source fps / frames | 30 fps · 90 frames · ~3.0 s |
| Output fps / frames | 48 fps · 144 frames |
| Resolution | 720×1038 |
| Model | **rife-v4.6** |
| backend_mode | **cli** |
| Workdir | `D:\GVFI-deps\rife-defect-audit\c10b\` |
| Mapping | `...\c10b\mapping.json` |
| Scores | `...\c10b\scores.json` |

**Read-only:** originals and production enhanced MP4 were not overwritten. Sheets are new audit copies only.

**Mapping method:**  
`t = (out_index - 1) / 48`  
`src_float = t * 30` (0-based)  
`n = floor(src_float)`, `n+1 = n+1` (1-based PNG indices)  
`frac = src_float - n`  
Role: `intermediate` if `0.12 ≤ frac ≤ 0.88`, else `near_src_*` (not a reliable mid sample).

---

## Frame mapping

| Out # | t (s) | SRC n | SRC n+1 | frac | Role | Reliable mid? |
|------:|------:|------:|--------:|-----:|------|:-------------:|
| 12 | 0.2292 | 7 | 8 | 0.875 | intermediate | yes |
| 21 | 0.4167 | 13 | 14 | 0.500 | intermediate | yes |
| 25 | 0.5000 | 16 | 17 | 0.000 | near_src_n | **no** |
| 36 | 0.7292 | 22 | 23 | 0.875 | intermediate | yes |
| 39 | 0.7917 | 24 | 25 | 0.750 | intermediate | yes |
| 130 | 2.6875 | 81 | 82 | 0.625 | intermediate | yes |

All six mappings: **OK** (no mapping UNKNOWN).  
Supporting MAE (arm ROI): out#25 vs SRC n ≈ **1.39** → near-copy of source; others diverge as expected for mid samples (`diff_stats.json`).

---

## Defect scores

Rubric 0–3. **Ghost** counted only when RIFE shows extra contours / translucent limbs / non-physical morphology **absent from both** adjacent source frames. Native camera motion blur alone is **not** Ghost.

| Frame | Ghost | Smear | Occlusion | Warp | Overall |
|------:|------:|------:|----------:|------:|--------:|
| 12 | 2 | 2 | 2 | 1 | 2 |
| 21 | 3 | 2 | 2 | 2 | 3 |
| 25 | 0 | 0 | 0 | 0 | 0 |
| 36 | 2 | 2 | 2 | 2 | 2 |
| 39 | 3 | 2 | 2 | 2 | 3 |
| 130 | 3 | 2 | 2 | 1 | 3 |

**Geometry extras:** ghost contour displacement / ghost area ratio / smear bbox area = **UNKNOWN** (no reliable unsupervised limb mask under heavy native blur).

No PSNR/SSIM absolute-quality claims (no GT intermediate).

---

## Aggregate

### All six C10-A focus frames

| Metric | Mean | High-count (≥2) | UNKNOWN |
|--------|-----:|----------------:|--------:|
| Ghost | 2.167 | 5 | 0 |
| Smear | 1.667 | 5 | 0 |
| Occlusion | 1.667 | 5 | 0 |
| Warp | 1.333 | 3 | 0 |
| Overall | 2.167 | 5 | 0 |

Overall ≥3 (severe): **3** frames (#21, #39, #130).

### Reliable intermediates only (exclude #25)

| Metric | Mean | High-count (≥2) | n |
|--------|-----:|----------------:|--:|
| Ghost | **2.6** | **5 / 5** | 5 |
| Smear | 2.0 | 5 / 5 | 5 |
| Occlusion | 2.0 | 5 / 5 | 5 |
| Warp | 1.6 | 3 / 5 | 5 |
| Overall | 2.6 | 5 / 5 | 5 |

---

## Evidence

Comparison sheets (SRC n | RIFE | SRC n+1) + arm/leg crops:

| Frame | Comparison | Arm crop | Leg crop |
|------:|------------|----------|----------|
| 12 | `...\sheets\frame_012_comparison.png` | `frame_012_arm_crop.png` | `frame_012_leg_crop.png` |
| 21 | `...\sheets\frame_021_comparison.png` | `frame_021_arm_crop.png` | `frame_021_leg_crop.png` |
| 25 | `...\sheets\frame_025_comparison.png` | `frame_025_arm_crop.png` | `frame_025_leg_crop.png` |
| 36 | `...\sheets\frame_036_comparison.png` | `frame_036_arm_crop.png` | `frame_036_leg_crop.png` |
| 39 | `...\sheets\frame_039_comparison.png` | `frame_039_arm_crop.png` | `frame_039_leg_crop.png` |
| 130 | `...\sheets\frame_130_comparison.png` | `frame_130_arm_crop.png` | `frame_130_leg_crop.png` |

Base path: `D:\GVFI-deps\rife-defect-audit\c10b\sheets\`

---

## Native blur confound

| Attribution | What |
|-------------|------|
| **Attributable to RIFE** | Discrete **double-ghost / translucent limb layers** and torso **occlusion fusion** on reliable mids **#12, #21, #36, #39, #130** — morphology not present as a second contour in either adjacent source still. P1 **warp/halo** at motion boundaries on #21, #36, #39 (score ≥2). |
| **Likely native (source)** | Continuous low-light **motion blur** streaks on arms/legs in SRC frames; out **#25** softness matches SRC n (near passthrough). |
| **UNKNOWN** | Exact geometric ghost area / displacement; how much residual blend vs warp contributes pixel-wise; whether every C10-A “高” tag was RIFE-only (#25 corrected to RIFE-attributed **0**). |

---

## C10-A → C10-B conclusion

**Question:** Is RIFE’s fast human-limb double-ghost a stable, repeatable **P0** failure mode?

**Answer: YES**

Evidence: 5/5 reliable intermediate focus frames score Ghost ≥2; 3/5 score Ghost =3; pattern repeats across early and late clip times (#12…#130). #25 was a motion hotspot in C10-A but is **not** a mid-interpolation sample (`frac=0`) and does **not** add RIFE-Ghost evidence.

---

## Safety check (C10-B)

| Check | Result |
|-------|--------|
| GVFI production code modified by C10-B | **No** (writes only under `D:\GVFI-deps\rife-defect-audit\c10b\` + this doc) |
| backend_mode still cli | **Yes** |
| RIFE still rife-v4.6 | **Yes** (existing output reused) |
| New model download | **No** |
| IFRNet / FILM run | **No** |
| VideoWorker modified | **No** |
| Original / enhanced MP4 overwritten | **No** |
| Report generated | **Yes** (this file) |

Note: repo may still show **pre-existing** dirty files under `ECCV2022-RIFE/` from earlier phases; C10-B did not edit them.

---

## Next Action

**Stop at C10-B.**

- Do **not** auto-enter C10-C.  
- Do **not** search new models.  
- Do **not** modify GVFI / `backend_mode` / RIFE config.

Entering C10-C requires an **explicit** user authorization after reviewing this baseline.
