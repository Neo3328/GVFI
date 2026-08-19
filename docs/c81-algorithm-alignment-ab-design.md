# C8.1+ Design — Algorithm / Timing / Encode Isolation A/B

**Phase:** Design only (post C8.1 visual review)  
**Date:** 2026-08-12  
**Status:** NOT EXECUTED · NOT C8.2 · NO code changes

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Experiment Goal

Design a **controlled black-box A/B matrix** that can separately attribute observed GVFI↔Steam-SVFI differences to:

| ID | Hypothesis |
|----|------------|
| **A** | Frame mapping / temporal phase policy |
| **B** | Public VFI algorithm family (GmfSs vs RIFE) |
| **C** | Encode / color / bit-depth path |

**Non-goals (this design):** modify GVFI production, change `backend_mode`, reverse Steam SVFI, crack DRM, extract private weights, run any experiment, enter C8.2.

**Prior facts (frozen):**

- P0: Steam SVFI public VFI = `GmfSs` / `GmfSs_pg_104`; GVFI = RIFE → algorithm family **[DIFF]**
- Strong P1: same output index can show different burned-in OSD times (e.g. out#24 ≈ GVFI `12@0.500` vs SVFI `11@0.458`) → phase **[DIFF]**
- Ghost/warp/HF morphology **[DIFF]** under index-aligned compare (phase-confounded)
- Dup frames **[SAME]** on C8.1 clip; Scene/Dedupe/SR/live-action still **[UNKNOWN]**

---

## Variables

### Independent (intentionally varied)

| Variable | Levels | Notes |
|----------|--------|-------|
| `VFI_FAMILY` | `GmfSs` · `RIFE` · (optional open GmfSs-on-GVFI) | Only via **public** SVFI GUI/ini keys or legal open impl |
| `PRODUCT` | `GVFI-CLI` · `Steam-SVFI-OLS` | Black-box products |
| `ALIGN_MODE` | `BY_OUT_INDEX` · `BY_BURNED_TIME` | Analysis axis, not a render knob |
| `ENCODE_LOCK` | `LOCKED_H265_8BIT_CRF18` · `PRODUCT_DEFAULT` | Prefer locked for C |
| `COLOR_LOCK` | `TAGGED_BT709_SDR` input + matched encode tags · `UNTAGGED` | Prefer tagged source |
| `SR` | **OFF** | Fixed for isolation |
| `TARGET_FPS` | **48** (2× on 24fps) | Fixed primary matrix |
| `DEDUP` / `SCDET` | Prefer **OFF** for isolation arms; optional ON later | See confounders |

### Dependent (measured)

- Burned-in OSD time \(t^\*\), source frame id \(n^\*\)
- Pair residual after time align: MAE / PSNR / SSIM / maxΔ
- Visual rubric scores (ghost / warp / HF / text / face)
- File size, codec, pix_fmt, color tags (ffprobe)

### Controlled / locked (target)

| Knob | Target lock | How to verify |
|------|-------------|----------------|
| Input file | Byte-identical path | hash |
| Resolution | 1920×1080 (or fixed per clip) | ffprobe |
| Src FPS / duration | 24 fps, fixed length | ffprobe + OSD |
| Target FPS | 48 | logs + `nb_frames` ≈ duration×48 |
| SR | off | ini / GVFI args |
| Bit depth (render) | 8-bit | ini `H265,8bit` / GVFI encode probe |
| Encode | H.265 yuv420p CRF18 medium CPU (or both PNG seq) | logs + ffprobe |
| GPU | same discrete GPU id | logs |
| Promote/post sliders (SVFI) | **0 / neutral / off** if public | ini snapshot |
| Audio | keep or strip **both** the same | decide once |

### Unknown / hard to lock (document, do not pretend)

- Exact SVFI timestep formula vs GVFI/`rife-ncnn-vulkan -n`
- SVFI internal promote residual even when sliders “50”
- Whether SVFI “RIFE” equals ncnn RIFE v4.6 (names can differ)
- Scene/dedupe residual interaction with phase
- Any non-public post path

---

## Gates (must pass before any future execution)

| Gate | Check | Pass criteria | Fail action |
|------|-------|---------------|-------------|
| **G0** | Steam SVFI **public** VFI dropdown / ini accepts RIFE | Screenshot or OLS log shows load of a **named public RIFE model** after setting `vfi_algo`/`vfi_model` via GUI-exported ini | **Arm B2 / B3 NO-GO**; do not invent values |
| **G1** | OSD burn-in readable on all clips | Timecode + integer frame id legible after decode | Rebuild sources with larger OSD |
| **G2** | Encode lock feasible on both products | Both can emit H.265 8-bit CRF18 **or** both PNG sequences | Fall back to PNG path for metric arms |
| **G3** | Legal open GmfSs for GVFI (optional arm) | SPDX/license clear + public weights; no Steam extraction | **Arm B4 NO-GO** |

**Current status (design-time, not re-probed here):**

- C8.1 used SVFI `vfi_algo=GmfSs` only. **G0 is not yet PASS.**  
  → Until G0 is confirmed from **public UI**, “SVFI-RIFE vs GVFI-RIFE” remains **conditional**.
- **Do not guess** model strings. If GUI shows RIFE options, record exact public names (e.g. whatever the UI lists) into the run sheet.

---

## Test Matrix

Fixed: `SR=off`, `target_fps=48`, same GPU, same inputs, prefer `DEDUP=off` + `SCDET=off` for isolation arms.

### Clip set (select before run)

| Clip ID | Content | Why |
|---------|---------|-----|
| **S0** | Existing synthetic bars + diagonal + checker + **burned OSD** (C8.1 lineage) | Timing ruler; HF geometry |
| **S1** | Synthetic: scrolling **fine text** + thin lines + known \(t\) | Text ghosting / fine-line |
| **L1** | Live-action: face close-up, moderate motion | Face structure UNKNOWN→testable |
| **L2** | Live-action: fast sports / handheld / occlusion | Warp / motion edges |
| **L3** | High-frequency texture (fabric, foliage, city lights) | HF retain |
| **C1** | Hard cut every ~0.5–1.0 s (optional later) | Scene policy — **not** in primary isolation |

All clips: embed **burned-in** `HH:MM:SS.mmm` + source frame index (large, high-contrast). Prefer **tagged** SDR BT.709 sources for color arms.

### Primary arms

| Arm | Product | VFI (public) | Encode | Align for score | Isolates |
|-----|---------|--------------|--------|-----------------|----------|
| **A1** | GVFI-CLI | RIFE (prod) | LOCKED or PNG | BY_OUT_INDEX **and** BY_BURNED_TIME | Baseline; quantify phase vs index |
| **A2** | Steam-SVFI | GmfSs_pg_104 (as C8.1) | same lock | same dual align | Cross-product status quo |
| **B1** | Steam-SVFI | GmfSs | lock | BY_BURNED_TIME | Family B vs A1 after phase fix |
| **B2** | Steam-SVFI | **RIFE (if G0 PASS)** | lock | BY_BURNED_TIME | Same product, family change |
| **B3** | GVFI-CLI | RIFE | lock | BY_BURNED_TIME vs B2 | **SVFI-RIFE vs GVFI-RIFE** |
| **B4** | GVFI + legal open GmfSs | open GmfSs | lock | BY_BURNED_TIME vs A2/B1 | Optional mirror; **design only until licensed** |
| **C1a** | Both | **fixed same VFI arm** | PRODUCT_DEFAULT | BY_BURNED_TIME | Encode/color confound |
| **C1b** | Both | same as C1a | LOCKED / PNG | BY_BURNED_TIME | Residual after encode lock |

**If G0 FAIL:** drop B2/B3. Report: *cannot complete same-family RIFE cross-product A/B from public settings.*  
**If G3 FAIL:** drop B4. Report: *no legal GVFI-side GmfSs arm.*

### Minimal executable subset (when someone later runs)

1. A1 + A2 on S0+S1+L1+L2 (dual alignment) → separate **A** from quality claims  
2. If G0: B2 + B3 on S0+L2 → isolate **B** under RIFE name  
3. C1a vs C1b on one clip → bound **C**

---

## Frame Alignment Method

### 1. Build the burned-in time axis

For each decoded output frame \(i = 0..N-1\):

1. OCR or template-read OSD → \((t_i^\*, n_i^\*)\)  
   - \(t^\*\): seconds from burned timecode  
   - \(n^\*\): burned source frame integer (preferred primary key when present)
2. Record confidence; reject pairs with unreadable OSD (do not impute).
3. Store `manifest.jsonl`: `{product, clip, out_index, t_star, n_star, path}`.

### 2. Pair by actual time (not out_index)

**Primary key:** burned source frame \(n^\*\) when both sides have integer OSD.  
**Secondary:** \(t^\*\) within tolerance \(\varepsilon_t = 0.5 / f_{\mathrm{src}}\) (e.g. ~20.8 ms at 24 fps).

Algorithm:

```
for each GVFI frame g:
  candidates = SVFI frames with |n*_s - n*_g| == 0
             else |t*_s - t*_g| <= ε_t
  if unique best candidate: emit pair (g, s, Δt, Δn)
  else: mark UNPAIRED
```

Report:

- pairing coverage %  
- median |Δt|, |Δn|  
- histogram of phase residual  
- list of out_index pairs that **disagree** on \(n^\*\) (C8.1-style confounders)

### 3. Dual reporting (mandatory)

Every metric table has two columns:

| Column | Meaning |
|--------|---------|
| **Index-aligned** | same `out_index` (legacy; known confounded) |
| **Time-aligned** | paired by \(n^\*\)/\(t^\*\) |

**Rule:** subjective “better” claims and PSNR/SSIM for quality **only** from time-aligned pairs (or declare UNPAIRED).

### 4. Phase-only diagnostic (Arm A)

On S0/S1, plot \(n^\*(i)\) and \(t^\*(i)\) vs `out_index` for GVFI vs SVFI.  
If curves diverge while endpoint \(n^*\) matches → **mapping policy [DIFF]** without needing VFI quality judgment.

---

## Metrics

### Timing / mapping (Hypothesis A)

| Metric | Definition |
|--------|------------|
| Phase bias | median \(n^*_{\mathrm{GVFI}}-n^*_{\mathrm{SVFI}}\) at same out_index |
| Pairing coverage | % frames with unique time pair |
| Cadence | Δ\(t^*\) between successive outs; detect holds/dups |
| Exact dup | consecutive pixel-identical frames (expect rare if dedup off) |

### Pixel (Hypothesis B, time-aligned only)

| Metric | Notes |
|--------|-------|
| MAE / PSNR / SSIM / maxΔ | Global + ROI |
| ROI set | face bbox (L1), text band (S1), motion mag mask (L2), HF patch (L3) |
| Worst-k frames | by PSNR **after** time align |

### Encode / color (Hypothesis C)

| Metric | Notes |
|--------|-------|
| ffprobe | codec, pix_fmt, color_range/space/transfer/primaries, bitrate, size |
| PNG round-trip Δ | decode→PNG both; compare before/after re-encode lock |
| Solid-bar ΔE (S0) | crude color shift on known patches |

### Visual rubric (human, forced choice)

Per time-aligned pair, score each side 0–2 for: ghosting, warping, edge tear, face, fine text/lines, texture, local anomaly, naturalness.  
**Forced:** SAME / A-better / B-better / UNKNOWN — never infer from MAE alone.

---

## Visual Review Method

1. Decode both MP4 → PNG; keep `out_index` filenames.  
2. Build time-aligned contact sheets: `pair_{nstar}_gvfi|svfi|diff.png`.  
3. Always review: endpoints, max |Δn| at same out_index, worst time-aligned PSNR, top motion ROIs.  
4. For text/face: 2×–3× crops.  
5. Blind label when possible (randomize left/right).  
6. Record stills under a new results dir (future); **do not** reverse SVFI.

---

## Expected Interpretations

| Observation pattern | Supports | Does **not** prove |
|---------------------|----------|---------------------|
| Index-aligned metrics poor, time-aligned much better, \(n^*\) curves differ | **A** phase/mapping | Algorithm quality ranking |
| G0 PASS: B2≈B3 time-aligned; both ≪ B1 gap to GmfSs | **B** family dominates cross-product gap | That GVFI RIFE equals academic RIFE |
| G0 PASS: B2≪B3 still large gap | Implementation / preprocess / residual mapping inside same public name | Private SVFI secrets (unknown) |
| G0 FAIL | Cannot isolate B via SVFI-RIFE | That RIFE is “fine” or “broken” |
| C1a large, C1b shrinks | **C** encode/color material | VFI ranking |
| C1b still large after PNG lock + time align + same public RIFE | Residual preprocess / timestep / unknown post | Exact root module without more arms |
| B4 legal GmfSs-on-GVFI ≈ SVFI GmfSs | Family portability | Steam binary identity |

---

## Confounders (still not isolatable by this matrix alone)

| Confounder | Why remains |
|------------|-------------|
| SVFI RIFE ≠ GVFI ncnn RIFE v4.6 | Same marketing name ≠ same weights/graph |
| Timestep formula | Even with matched \(n^*\) on average, sub-frame \(t\) may differ |
| Dedupe/scdet | Soft thresholds; “off” may still differ |
| SVFI promote / hidden post | Public sliders ≠ proof of zero effect |
| Decode path (hwaccel vs CPU PNG) | Upstream of VFI |
| Chunking / audio mux | Minor A/V skew |
| Steam license / OLS version skew | Environment |
| Short clip bias | 1s S0 cannot speak for long-form scene logic |

---

## What each experiment proves / cannot prove

| Arm | Can prove | Cannot prove |
|-----|-----------|--------------|
| A1 vs A2 dual-align | Whether index PSNR was phase-confounded; magnitude of mapping [DIFF] | Which VFI is “better” |
| B1 vs A1 time-aligned | Residual gap after phase correction under GmfSs vs RIFE products | Gap is only model weights |
| B2 (SVFI RIFE) | Within SVFI, public family switch effect | Cross-product fairness |
| B3 (SVFI-RIFE vs GVFI-RIFE) | Whether same **public family name** still diverges | Binary/weight identity |
| B4 (legal GmfSs on GVFI) | Whether open GmfSs closes gap to Steam GmfSs | Steam private parity |
| C1a/b | Encode/color contribution bound | That encode is the main “looks better” cause |

---

## Go / No-Go Criteria

### Go (future execution allowed only if explicitly requested)

- Design accepted; **G1** materials ready (OSD).  
- Run sheet lists exact public SVFI keys from GUI export (no guessed model ids).  
- G0 decided: PASS → include B2/B3; FAIL → document impossibility of SVFI-RIFE arm.  
- G3 decided before any GVFI-GmfSs work.  
- Still **black-box only**; no production code edits in the experiment plan.

### No-Go

- Any step requiring reverse engineering, DRM bypass, or private weight copy.  
- Claiming quality winners from **index-aligned** metrics alone.  
- Changing GVFI `backend_mode` / RIFE / ncnn “to match SVFI” under this design.  
- Treating this document as authorization to enter **C8.2** or to run jobs.

### Success criteria for a future executed round (informational)

| Claim you want | Minimum evidence |
|----------------|------------------|
| “Phase explained index PSNR” | Time-aligned PSNR ≫ index-aligned; \(n^*\) curves diverge |
| “Family is P0” | After time align + encode lock, GmfSs↔RIFE gap ≫ SVFI-RIFE↔GVFI-RIFE gap (G0 required) |
| “Encode is secondary” | C1b residual ≪ B gap |
| “Need implementation deep-dive” | G0 PASS and B3 still large after time align + encode lock + SR off |

---

## Deliverables when later executed (not now)

- `docs/c8x-algorithm-alignment-ab-results.md` (future)  
- Per-arm ini/argv snapshots, ffprobe, manifests, time-aligned metrics JSON, contact sheets  
- Explicit G0/G3 PASS/FAIL section

---

## Stop

This file is **design only**. No experiments run. No code modified. No C8.2.
