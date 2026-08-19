# C9.2-C — IFRNet vs RIFE-v4.6 Controlled Offline A/B

**Date:** 2026-08-12  
**Phase:** Isolated offline A/B only · **not** C9.3 · **not** production integration  
**Prior:** C9.2-A `PASS-WITH-UNKNOWN` · C9.2-B Smoke **PASS**  
**Question:** Does IFRNet show an **observable quality advantage** vs RIFE on these clips (especially real motion)?

**Production preserved:**  
- Modified GVFI: **NO**  
- Modified `backend_mode`: **NO** (still `cli`)  
- Modified RIFE / VideoWorker: **NO** (no VideoWorker invocation this phase)  
- IFRNet weight commercial redistrib SPDX: still **UNKNOWN**  
- This report is **not** commercial license clearance and **not** production-integration authorization  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision box

| Item | Result |
|------|--------|
| Overall visual vs RIFE | **[DIFF]** locally (fast limbs / motion edges); **not** a clear IFRNet win |
| Aggregate time-aligned pixels | Near-identical when phase-matched; see caveats |
| Frame mapping | **[DIFF]** (~1-slot phase on p0 / some real outs) |
| Duplicate frames | **[SAME]** pattern (1 exact trailing dup each side) |
| **C9.2-C Verdict** | **WEAK-GO** |

**WEAK-GO meaning here:** Offline IFRNet path is runnable and shows **local morphology differences** vs RIFE on fast limbs, but evidence does **not** prove an overall quality advantage worth replacing RIFE. **Do not** change production. **Do not** auto-enter C9.3.

---

## 1. Configuration

| Side | Implementation | Model | Isolation |
|------|----------------|-------|-----------|
| **A** | `rife-ncnn-vulkan.exe` offline directory 2× | **rife-v4.6** (same pack as GVFI CLI) | `D:\GVFI-deps\ifrnet-c92c\*\rife_frames` |
| **B** | `ifrnet-ncnn-vulkan.exe` offline directory 2× | **IFRNet_Vimeo90K** (release 20220720) | `D:\GVFI-deps\ifrnet-c92c\*\ifrnet_frames` |

Why offline RIFE CLI (not a fresh VideoWorker job): authorization forbids VideoWorker integration; PNG↔PNG removes encode confound for A↔B. Bridge check vs prior C8.1 GVFI CLI decode on p0: PSNR≈38.5 / SSIM≈0.9999 → expected encode residual only.

| Clip | Source | A/B IO |
|------|--------|--------|
| p0 OSD | `...\input\p0_src_1080p24_audio.mp4` · 1920×1080 · 24fps · 24f | 48 outs · encode review @48fps |
| Real dance | `...\c81_real_content\input\L1L2_douyin_t3s.mp4` · 720×1038 · **30fps** · 90f | **True 2×** → 180 outs @60fps nominal |

**Note:** Prior C8 real GVFI run was **30→48 (144f)**. Primary C9.2-C real arm uses **true 2×** for both engines so timelines match. Vimeo90K port rejects custom `-n`/`-s` (only GoPro supports custom).

SR: **OFF**. Metrics on **decoded PNG** (libx264 review mp4s exist but are not quality oracles).

Work root: `D:\GVFI-deps\ifrnet-c92c\` · logs · `metrics.json` · `visual\`

---

## 2. Time alignment

Protocol inherits C8: burned \(n^\*\) / \(t^\*\) on p0 via OSD+content template match; real clip has **no OSD** → \(n^\*\) from nearest source content MAE (downscaled).

| Clip | Pairing coverage | Index vs Time |
|------|------------------|---------------|
| p0 | 46/48 (95.8%) | Both reported |
| real | 156/180 (**86.7%**) | Both reported; ≥70% → usable |

**Quality claims use Time-aligned only.** Index-aligned labeled and reported but **not** used as sole quality ranker.

### Frame mapping

| Clip | `n*` seq | Tag |
|------|----------|-----|
| p0 | RIFE ≈ `[0,1,1,2,2,…]` · IFRNet ≈ `[0,0,1,1,2,2,…]` · max \|Δn\*\| at same out = **1** (22 outs nonzero) | **[DIFF]** (1-slot phase) |
| real | max \|Δn\*\| = **1** · 39 outs nonzero | **[DIFF]** (mild) |

This phase shift explains why **index-aligned PSNR is extremely high** while naive same-`n*` pairing can pull mid↔endpoint and depress time-aligned PSNR on p0 — treat p0 time-PSNR with that confound in mind; prefer index when `dn*=0` subsets / visual sheets.

---

## 3. Metrics (VFI↔VFI · **no Ground Truth**)

Do **not** treat PSNR/SSIM as absolute quality.

### p0

| Table | n | MAE mean | PSNR mean | SSIM mean |
|-------|---|----------|-----------|-----------|
| **Index-aligned** | 48 | 0.52 | **66.16** | **0.9993** |
| **Time-aligned** | 46 | 2.45 | 27.09 | 0.9883 |

Index near-equality ⇒ engines produce nearly the same pixels at the same output slot. Time table depressed by 1-frame mapping **[DIFF]**.

### real dance

| Table | n | MAE mean | PSNR mean | SSIM mean |
|-------|---|----------|-----------|-----------|
| **Index-aligned** | 180 | 0.18 | **72.66** | **0.9988** |
| **Time-aligned** | 156 | 0.53 | **58.99** | **0.9900** |

Worst time-aligned PSNR outs (real): 44, 48, 14, 151, 162 (~25–27 dB) — still local; mean remains high.

Exact consecutive dups: **1** each side (tail `t=1.0` write pattern) → **[SAME]** behavior class.

Bridge offline-RIFE PNG vs prior GVFI CLI mp4 decode (p0): PSNR **38.49** / SSIM **0.9999** / MAE **1.15** — encode path residual, not algorithm ranking.

---

## 4. Visual observations

Sources: `visual/real_*.png`, `visual/p0_*.png`. Tags only; **no** “IFRNet better” without aligned evidence.

| Topic | p0 OSD | Real dance | Tag |
|-------|--------|------------|-----|
| Ghosting | Subtle on moving diagonal; both soft | Fast arms: RIFE clearer **double-edge ghost**; IFRNet more **smear** | **[DIFF]** morph |
| Warping | Mild near checker / line | Limb–background pull differs slightly | **[DIFF]** local |
| Fast limbs | N/A (synthetic) | Both fail clean limbs; **tradeoff** not one-sided win | **[DIFF]** / no winner |
| Motion edges | Small HF edge diffs | Soft vs smear edges | **[DIFF]** |
| Fine lines / HF | Dots / checker near-[SAME] with tiny sharpness deltas | Shirt/building HF near-[SAME] | **[SAME]** / tiny **[DIFF]** |
| Face | N/A | Present but dark/soft; no clear side win | **[UNKNOWN]** advantage |
| Frame mapping | 1-slot phase | Mild phase | **[DIFF]** |
| Duplicate frames | 1 trailing each | 1 trailing each | **[SAME]** |

**Subjective bottom line:** Observable **local** differences on fast human motion, but **not** a consistent IFRNet superiority. Aggregate pixels at matched output indices are nearly **[SAME]**.

---

## 5. History link

| Prior | Result |
|-------|--------|
| C8.1 | SVFI-RIFE ≈ GVFI-RIFE on real (**[SAME]** class) |
| C8.1 A | GmfSs vs RIFE → limb morph **[DIFF]** |
| C9 | FILM TOP-1 quality thesis; IFRNet TOP product-shaped |
| C9.1-B | FILM GPU smoke **FAIL** on this host |
| C9.2-B | IFRNet GPU smoke **PASS** |
| **C9.2-C** | IFRNet vs RIFE: runnable; local morph **[DIFF]**; **no clear overall quality win** |

Answers: “Does IFRNet produce a RIFE-missing **observable quality advantage** on real motion?” → **Not demonstrated as overall advantage** (local morph only).

---

## 6. Commercial / process caveats

1. IFRNet **weights redistrib SPDX = UNKNOWN** (unchanged).  
2. Experiment ≠ commercial permission.  
3. Experiment ≠ production integration authorization.  
4. `backend_mode` unmodified (`cli`).  
5. Stop — **no** auto C9.3.

---

## 7. Verdict

| Label | Apply? |
|-------|--------|
| GO (stable + clear visual advantage) | **No** — advantage not clear |
| **WEAK-GO** (local signal, not overall) | **Yes** |
| NO-GO (unrunnable / zero signal / not worth eng) | Partial: quality-replacement **NO**; eng path already proven in C9.2-B |
| UNKNOWN | Face-advantage / counsel weights |

### Final

# C9.2-C Verdict = WEAK-GO

**Recommended next action:** Keep production **RIFE `rife-v4.6` + `backend_mode=cli`**. Treat IFRNet as an optional offline research/alternate backend candidate only if a later phase is explicitly authorized. Do **not** auto-start C9.3.

**Report path:** `docs/c92-ifrnet-ab.md`
