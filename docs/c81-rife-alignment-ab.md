# C8.1 — Public-config RIFE alignment A/B (Steam SVFI ncnn_rife/rife-v4.6 vs GVFI CLI RIFE)

**Date:** 2026-08-12  
**Scope:** Public-config RIFE alignment only · black-box SVFI · no GVFI production edits · no `backend_mode` default change · not C8.2  
**Claim limit:** Same public names ≠ identical ncnn internals. Pixel diff ≠ subjective better. File size ≠ quality.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. Inputs

| Role | Path | Status |
|------|------|--------|
| Primary (MUST) | `D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4` | Ran (1080p24 OSD synthetic, ~1s, with audio) |
| Face / human | Searched `D:\GVFI-deps` + repo for legal local face/motion/HF mp4 | **UNKNOWN** — none suitable found; **not downloaded** |
| Extra HF / fine-text motion | Same search | **UNKNOWN** — not invented |

Work root: `D:\GVFI-deps\native-video-worker-ab\c81_rife_align\`

---

## 2. SVFI config

INI (UTF-8 **without BOM**):  
`D:\GVFI-deps\native-video-worker-ab\c81_rife_align\svfi_ncnn_rife_v46.ini`  
Structure from `c81_ab\c81_svfi_ab.ini`; RIFE keys from G0 sample `SVFI_Config_339_29a08d_ncnn_rife.ini`.

### Exact keys used (material)

| Key | Value |
|-----|-------|
| `vfi_algo` | `ncnn_rife` |
| `vfi_model` | `rife-v4.6` |
| `target_fps` | `48` |
| `rife_exp` | `1` |
| `use_sr` | `false` |
| `use_ncnn` | `false` (same as working G0 sample with `ncnn_rife`) |
| `render_encoder` | `"H265,8bit"` |
| `render_crf` | `18` |
| `render_hwaccel_mode` | `CPU` |
| `is_no_scdet` | `true` |
| `remove_dup_mode` | `0` |
| `is_no_dedup_render` | `true` |
| `output_dir` | `D:/GVFI-deps/native-video-worker-ab/c81_rife_align/svfi_out` |
| `dump_dir` | `D:/GVFI-deps/native-video-worker-ab/c81_rife_align/svfi_dump` |

### Run

```text
one_line_shot_args.exe -i p0_src_1080p24_audio.mp4 --config svfi_ncnn_rife_v46.ini -t c81rife0000001
```

Steam was running; `steam -applaunch 1692080` used before OLS. Logs: `svfi_run.log` (empty stdout redirect) / `svfi_run.err`.

### Model load evidence

- Log: `VfiPools - INFO - RIFE Anytime Model Loaded`
- Output name: `p0_src_1080p24_audio-48.000fps.rife-v4.6.DBG.000001.mp4`
- Dump copy of ini under task dump folder; concat escape references `svfi_ncnn_rife_v46.ini`
- **Verdict:** public config **`rife-v4.6` / `ncnn_rife` loaded for this OLS task** (black-box; no claim on private weight identity)

Wall: OLS process ~53 s; log `Program Finished ... 0:00:21.766988`.

---

## 3. GVFI config

Harness: `ECCV2022-RIFE/tests/test_c54_final_validation.py` → `VideoWorkerHarness`  
Engine cwd: `D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE`

| Param | Value |
|-------|-------|
| `backend_mode` | `"cli"` (**explicit harness arg only**; production default untouched) |
| `target_fps` / `fps` | `48` |
| `rife_model` | `...\rife-ncnn-vulkan-20221029-windows\rife-v4.6` |
| `superResolution` | `False` |
| `scale` | original (`原始`) |
| `codec` / `crf` / preset | `H.265 (HEVC)` / `18` / `medium` |
| `keep_audio` | `True` |
| `encoder_mode` | `auto` → log: `hevc_nvenc` |
| `enable_dedup` / `enable_scdet` | `True` / `True` (harness defaults; clip: 0 dups, 0 scenes) |
| Output | `c81_rife_align\gvfi_cli\p0_src_1080p24_audio_enhanced.mp4` |

Wall: **~6.81 s**. Logs: `gvfi_cli_run.log` / `gvfi_cli_result.json`.

---

## 4. Params (locked vs varied)

| Dimension | Locked / noted |
|-----------|----------------|
| Source | Same `p0` mp4 |
| Target FPS | 48 both |
| Public RIFE model name | `rife-v4.6` both (SVFI public id / GVFI folder) |
| SR | off both |
| Resolution | 1920×1080 both |
| CRF intent | 18 both |
| Encoder path | **Not identical:** GVFI `hevc_nvenc`; SVFI `libx265` CPU (from OLS ffmpeg log) |
| Scene / dedupe | Soft-isolated via public keys; not proof of identical internal policies |
| Internals | **Not claimed equal** |

---

## 5. SAME / DIFF / UNKNOWN matrix

| Item | Tag | Evidence |
|------|-----|----------|
| Input clip | [SAME] | Shared `p0_src_1080p24_audio.mp4` |
| Public VFI family name | [SAME] | SVFI `ncnn_rife` + GVFI CLI RIFE |
| Public model id `rife-v4.6` | [SAME] | ini + output filename + GVFI model path |
| Identical ncnn graph/weights | [UNKNOWN] | Forbidden to reverse; names only |
| Output FPS / frame count | [SAME] | 48/1, `nb_frames=48` |
| Resolution | [SAME] | 1920×1080 |
| Video codec family | [SAME] | hevc Main yuv420p |
| Encoder implementation | [DIFF] | nvenc vs libx265 |
| File size | [DIFF] | 2,323,260 B vs 1,297,479 B — **not quality** |
| Audio | [SAME]/approx) / packet [DIFF] | AAC mono 44.1k; 44 vs 45 packets |
| Frame mapping `n*` seq | [SAME] | Identical 48-length sequences (see §6) |
| Index-aligned pixels | [DIFF] [CONFOUNDED label kept] | MAE~0.93, PSNR~35.9 — but here **not phase-confounded** (dn*=0) |
| Time-aligned pixels | [DIFF] | Same numbers as index (align ≡ index on this clip) |
| Dup / stutter | [SAME] | 0 identical consecutive pairs each |
| Ghost / warp / HF morphology | [DIFF] mild / [UNKNOWN] severity | Synthetic geometry; residual HF edges differ; no face clip |
| Face quality | [UNKNOWN] | Missing legal face clip |
| Subjective “looks better” | [UNKNOWN] | Synthetic OSD clip only; encode confound |

---

## 6. Alignment method

1. Decode both MP4 → PNG (`frames_gvfi/`, `frames_svfi/`), 48 frames each.
2. OCR: **unavailable** (no easyocr/pytesseract/tesseract).
3. Fallback: match top-left OSD crop `420×90` and content (exclude `500×120`) to **source** frame templates via MAE → `n_star` (0..23), `t_star = n_star/24`.
4. OSD↔content agree: GVFI 38/48, SVFI 38/48; sequences still **identical across products**.
5. Pair: `n_star` primary, else `|Δt| ≤ 1/(2·24)s`. Coverage: **100%** (48/48). High `|Δn|` at same out_index: **none**.
6. Index-aligned metrics still labeled **[CONFOUNDED]** per protocol; on this RIFE↔RIFE run they coincide with time-aligned (mapping [SAME]).

`n*` sequences (both sides):  
`[0,1,1,2,2,...,22,22,23,23,23]`

Artifacts: `manifest_gvfi.json`, `manifest_svfi.json`, `metrics.json`.

---

## 7. Time-aligned metrics

Source: `D:\GVFI-deps\native-video-worker-ab\c81_rife_align\metrics.json`

### Index-aligned [CONFOUNDED]

| Metric | Mean | Min | Max |
|--------|------|-----|-----|
| MAE | 0.9326 | 0.5931 | 1.7060 |
| PSNR | 35.93 | 28.26 | 41.32 |
| SSIM | 0.99931 | 0.99726 | 0.99993 |
| maxdiff | 154.0 | 59 | 231 |

### Time-aligned (formal)

| Metric | Mean | Min | Max |
|--------|------|-----|-----|
| MAE | 0.9326 | 0.5931 | 1.7060 |
| PSNR | **35.93** | 28.26 | 41.32 |
| SSIM | 0.99931 | 0.99726 | 0.99993 |
| maxdiff | 154.0 | 59 | 231 |

Pairing coverage: **100.0%**. Unique-`n*` subset (n=24): PSNR mean **32.96** (one pair per source index; mid-heavy).

Worst time-aligned PSNR outs: **44, 34, 40** (PSNR ~28.3–28.5). Best: **1, 48, 47** (~40–41).

### ffprobe

| | GVFI | SVFI |
|--|------|------|
| Frames / fps / res | 48 / 48/1 / 1920×1080 | 48 / 48/1 / 1920×1080 |
| Video | hevc yuv420p | hevc yuv420p |
| Size | 2,323,260 B | 1,297,479 B |
| Audio | aac 44.1k mono (44 pkts) | aac 44.1k mono (45 pkts) |

---

## 8. Visual samples

Side-by-sides under `c81_rife_align\visual\`:

- Endpoints: `side_index_01.png`, `side_index_48.png`
- Mid: `side_mid_index_12/24/25/26.png`
- Worst time-aligned PSNR: `side_time_worst_g34_s34.png`, `g40_s40`, `g44_s44`
- OSD crops: `osd_crops\side_osd_*.png`

### Review notes (human, forced tags)

| Location | Observation | Tag |
|----------|-------------|-----|
| Out 1 / 48 | Color bars / geometry visually near-indistinguishable; OSD phase matches | content near-[SAME]; timing [SAME] |
| Mid 12/24/26 | Same out_index shows matching green-bar phase (unlike prior GmfSs A/B); residual edge/HF softness and bitrate texture differ | timing [SAME]; HF/encode [DIFF] |
| Worst PSNR 34/40/44 | Checkerboard / diagonal regions show local absdiff; no large warp mismatch like GmfSs-vs-RIFE phase errors | residual [DIFF]; not “winner” |
| Text OSD | Mild encode/ghost differences possible; no OCR digits transcribed | [UNKNOWN] fine digits |
| Face | No face material | [UNKNOWN] |

---

## 9. Observations

1. **G0 public RIFE path works end-to-end** on Steam OLS with `vfi_algo=ncnn_rife`, `vfi_model=rife-v4.6`, `use_ncnn=false`.
2. On this OSD clip, **frame mapping matches** GVFI CLI RIFE (`dn*=0` for all 48). Prior C8.1 GmfSs↔RIFE timing [DIFF] does **not** reproduce under RIFE↔RIFE public names.
3. Time-aligned PSNR mean **~35.9** with SSIM **~0.999** — closer than prior index-confounded GmfSs A/B (~32.3), but **not pixel-identical** (maxdiff still high; encode paths differ).
4. **Encode confound remains material** (nvenc vs libx265, ~1.8× size). Do not rank VFI quality from bitrate or file size.
5. Missing face/HF clips → face / naturalistic motion / fine-text rankings stay **UNKNOWN**.
6. No production code changed; `backend_mode` default not touched; C8.2 not entered.

---

## 10. Final A/B/C/D judgment

User letter meanings (strict):

| Letter | Meaning |
|--------|---------|
| **A** | SVFI-RIFE ≈ GVFI-RIFE |
| **B** | SVFI-RIFE 明显优于 GVFI-RIFE |
| **C** | GVFI-RIFE 明显优于 SVFI-RIFE |
| **D** | 无法可靠判断 |

### Letter: **A**

| Letter | Applies? | Why |
|--------|----------|-----|
| **A** | **Yes** | On runnable p0: public RIFE names [SAME]; `n*` mapping [SAME]; time-aligned SSIM≈0.999 / PSNR≈35.9; endpoint & worst-PSNR stills show no clear one-sided ghost/warp win |
| B | No | No evidence SVFI is **obviously** better; file size smaller ≠ quality; residual [DIFF] looks encode/HF soft, not a clear VFI win |
| C | No | No evidence GVFI is **obviously** better |
| D | No for p0 ranking | Time-align coverage 100%; p0 judgment possible. Face/HF clips remain **UNKNOWN** (do not extend A to live-action) |

**Honest summary:** Under **public-config RIFE alignment** (`ncnn_rife`/`rife-v4.6` vs GVFI CLI `rife-v4.6`) on the OSD clip, Steam SVFI and GVFI are **approximately aligned** (A). Residual pixel/encode [DIFF] remains; internals not proven identical; face/fast-motion/HF materials missing → those axes stay UNKNOWN. Do **not** treat file size or index-only metrics as quality winners.

---

## Artifacts

| Item | Path |
|------|------|
| Report | `docs/c81-rife-alignment-ab.md` |
| Metrics JSON | `D:\GVFI-deps\native-video-worker-ab\c81_rife_align\metrics.json` |
| SVFI ini | `...\c81_rife_align\svfi_ncnn_rife_v46.ini` |
| SVFI out | `...\svfi_out\p0_src_1080p24_audio-48.000fps.rife-v4.6.DBG.000001.mp4` |
| GVFI out | `...\gvfi_cli\p0_src_1080p24_audio_enhanced.mp4` |
| Visuals | `...\c81_rife_align\visual\` |
