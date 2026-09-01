# C8.0 — SVFI vs GVFI Audit (read-only)

**Phase:** C8.0  
**Date:** 2026-08-12  
**Constraint:** Audit only. No production code changes. No Native performance work. Default `backend_mode` remains `cli`.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Purpose

Locate *why Steam SVFI can look / feel clearly better than GVFI* by documenting **what GVFI actually does today**, and what the repo knows (and does **not** know) about SVFI.

**Hard rule for all later C8 work:** do **not** assume SVFI and GVFI use the same model, timestep policy, color path, or scheduler. This document separates **facts from GVFI code** vs **SVFI-inspired naming** vs **unverified SVFI ground truth**.

---

## Executive findings (C8.0)

1. In this repository, **“SVFI” is mostly branding / inspired preprocess / UI presets**. There is **no** Steam SVFI binary, weights, or official config pack in-tree.
2. GVFI production VFI is **RIFE ncnn (Vulkan)** via `rife-ncnn-vulkan.exe` by default (`backend_mode=cli`), optionally `gvfi_native.dll`.
3. `svfi_pipeline.py` implements **open approximations** of dedupe + scene-cut + target-frame allocation. Header explicitly: *Does not copy proprietary SVFI binaries or models.*
4. `PROJECT_AUDIT.md` states SVFI-like speed comes from **overlapped decode/infer/encode scheduling**; GVFI borrowed only the **dedupe + scene shell**, not the scheduler.
5. Existing A/B docs (`c72-cli-native-ab.md`, etc.) compare **CLI RIFE vs Native RIFE**, **not** GVFI vs Steam SVFI.
6. Quality-gap hypotheses for later phases (not proven here): model choice (anime vs v4.6), color metadata history, disk PNG pipeline, per-scene process cold-start, timestep policy vs SVFI, SR defaults, missing SVFI-specific post (blend/transition).

---

## GVFI production pipeline (current)

```text
input video
  → [optional] FFmpeg extract audio → AAC 192k
  → FFmpeg decode → raw_frames/%08d.png
  → [optional] MAD dedupe → dedup_frames/
  → [optional] hist scene-cut → scenes/in_NNN/
  → RIFE per scene (CLI exe default | Native DLL)
       → rife_frames/ contiguous PNGs
  → [optional] Real-ESRGAN ncnn → sr_frames/
  → FFmpeg encode PNG seq (+ SDR BT.709 tags) → output
```

Orchestrator: `ECCV2022-RIFE/main.py` `VideoWorker`  
Preprocess: `ECCV2022-RIFE/svfi_pipeline.py`  
Backends: `ECCV2022-RIFE/gvfi_runtime/interpolator_backend.py`  
API defaults: `ECCV2022-RIFE/gvfi_api.py`  
Tools: `ECCV2022-RIFE/tool_resolver.py`

Default `backend_mode`: **`cli`** (API + VideoWorker). Native failure → `_switch_to_cli`.

---

## A. 输入帧 (Input frames)

### A.1 Input video (generic production contract)

| Item | GVFI production behavior |
|------|--------------------------|
| Container/codec | Whatever FFmpeg can decode; no forced input pix_fmt |
| Resolution | Preserved on decode (no scale on extract) |
| FPS | Probed via ffprobe `avg_frame_rate` / `r_frame_rate`; fallback **30.0** |
| Frame count | Count of extracted PNGs (`original_count`) |

C7.x validation used a fixed clip for Native work (not product default):  
`D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4` — 1920×1080, 24 fps, 24 frames, H.264, AAC.

### A.2 Decode parameters (disk path — production)

```text
{ffmpeg} -y -i {input}
  -vsync 0
  -qscale:v 1
  {temp}/raw_frames/%08d.png
```

Source: `main.py` (`VideoWorker._process_file`).

| Field | On decode | Notes |
|-------|-----------|--------|
| pixel format | **Not forced** | FFmpeg default PNG writer; typically 8-bit RGB PNG |
| color range | **Not set** | No `-color_range` / `-vf zscale` on extract |
| colorspace | **Not set** | No `-colorspace` on extract |
| transfer (trc) | **Not set** | |
| primaries | **Not set** | |
| hwaccel | **Not used** | CPU decode + PNG encode to disk |

Docs (`docs/fixes/color-pipeline-fix.md`) treat intermediate PNGs as **full-range RGB** at encode time.

**Memory PoC path** (`gvfi_runtime/frame_pipeline.py`, not production RIFE):  
`-f rawvideo -pix_fmt rgb24 -vsync 0 -` — still not the default VideoWorker RIFE path.

### A.3 Probe helpers

- Size: ffprobe `width,height`
- FPS: ffprobe rate fields; invalid → 30
- Tools resolved by `tool_resolver.find_file("ffmpeg.exe"|"ffprobe.exe")` (path env-dependent)

---

## B. Scene / dedupe

Module: `ECCV2022-RIFE/svfi_pipeline.py`  
Entry: `VideoWorker._interpolate_with_svfi_opts` in `main.py`.

### B.1 Defaults

| Param | Default | Meaning |
|-------|---------|---------|
| `enable_dedup` | **True** | Remove held/duplicate frames |
| `enable_scdet` | **True** | Scene-cut segmented RIFE |
| `dedup_threshold` | **1.5** | MAD on 8-bit gray |
| `scdet_threshold` | **12.0** | Hist distance ~0–100 |

API: `gvfi_api.py` maps `enableDedup` / `enableScdet` / thresholds the same way.

### B.2 Dedup algorithm

- Load PNG → Qt `QImage` → `Format_Grayscale8`
- Score: **mean absolute difference** between consecutive frames
- Keep first of a near-identical run if MAD ≤ threshold
- Write kept frames to `dedup_frames/%08d.png` (hardlink or copy)

**Not claimed bit-identical to Steam SVFI.** Labeled “SVFI-like remove_dup” in comments.

### B.3 Scene detection algorithm

- Downscale gray to max width **320**
- Score: **64-bin histogram correlation** → `(1 - corr) * 100`
- Cut at index `i` when score ≥ `scdet_threshold` (`i > 0`)
- Comment cites “similar spirit to SVFI scdet_threshold defaults (12 / 80)”; `max_threshold=80` exists on the signature but is **unused** in the cut loop body

### B.4 Scene boundaries / per-scene inputs

- `build_segments(frame_count, cut_indices)` → half-open `[start, end)` covering all unique frames
- Each multi-frame scene copied to `scenes/in_NNN/`, RIFE’d separately, collected into `rife_frames/` with contiguous indices
- **No cross-cut interpolation** (strict scene isolation)
- Single-frame scenes: may skip RIFE and copy

### B.5 Target frame count (duration-preserving)

```text
duration = original_count / source_fps
target = round(duration * target_fps)
if target_fps > source_fps:
  target = max(target, original_count + 1)
# then also:
target = max(target, unique_count + (1 if target_fps > source_fps else 0))
```

**Important:** duration uses **`original_count` (pre-dedup)**, not unique count after dedupe.

**Example 24 src @ 24 → 48 fps:** `round(1.0 * 48) = 48`.

Per-scene `-n` / Native `target_frames` come from `allocate_output_counts(segment_lengths, target_frame_count)`.

---

## C. 插值 (Interpolation)

### C.1 Engine / model

| Item | Production default |
|------|--------------------|
| Engine | **RIFE**, NCNN Vulkan |
| Default backend | **CLI** `rife-ncnn-vulkan.exe` (build tree `rife-ncnn-vulkan-20221029-windows`) |
| Default model dir name | **`rife-v4.6`** (`tool_resolver.DEFAULT_RIFE_MODEL_NAME`) |
| Alternate | `backend_mode=native` → `gvfi_native.dll` + same flownet files |
| Precision UI | Logged; **not** passed through to CLI flags in current backend |

Bundled model dirs commonly include rife / HD / UHD / anime / v2–v4.6. Resolver prefers **v4.6** when auto-picking; **UI presets may still select `rife-anime`** (see §F) — that is a product-config risk for “looks worse than SVFI”, not proof of SVFI’s model.

Native model hash checks exist in `NativeInterpolatorBackend` for `flownet.param` / `flownet.bin` (integrity), independent of Steam SVFI.

### C.2 RIFE CLI invocation

```text
{rife-ncnn-vulkan.exe}
  -i {scene_in_dir}
  -o {scene_out_dir}
  -n {allocated_frames}
  -m {model_dir}
  -f %08d.png
  -j {load:proc:save}     # default 2:4:4; UHD may clamp to 1:2:2
  [-g {gpu}]              # API often passes gpu=0
```

Source: `RifeCLIBackend.process_directory` in `interpolator_backend.py`.

CLI **internal timestep policy** for `-n` is inside the ncnn binary — **not reimplemented in Python**. Do not assume it equals Native’s inclusive map.

### C.3 Native frame mapping (C7.1.1)

```text
position = output_index * (input_count - 1) / (output_count - 1)
left = floor(position); fraction = position - left
last output → exact last input frame (no duplicate collapse)
```

Function: `map_native_directory_sample` in `interpolator_backend.py`.

### C.4 24→48 time points (Native explicit; CLI opaque)

For a **single scene** with 24 unique inputs and `output_count=48`:

| out idx | position = i×23/47 | sample |
|--------:|--------------------|--------|
| 0 | 0.000 | copy input 0 |
| 1 | 0.489 | interp 0→1 @ t≈0.489 |
| … | … | … |
| 46 | 22.511 | interp 22→23 @ t≈0.511 |
| 47 | 23.000 | copy input 23 |

- **No duplicate `(left, fraction)` pairs** after C7.1.1.
- **No missing endpoint:** last output is last input.
- Midpoints are **not** exactly `k+0.5` for all k; they follow inclusive linspace.

CLI with `-n 48` on the same 24 inputs: timesteps determined by **rife-ncnn-vulkan**; GVFI only requests count. C7.2 showed CLI vs Native MAE≈1.8 / SSIM≈0.99 on one clip — similar but **not identical**.

### C.5 Order relative to SR

**RIFE first, then optional Real-ESRGAN.** Never SR-before-RIFE on the production disk path.

---

## D. 后处理 (Post-process)

### D.1 Super-resolution (optional)

| Item | Behavior |
|------|----------|
| Condition | `scale != "原始"` |
| Binary | `realesrgan-ncnn-vulkan.exe` |
| Args | `-i {rife_frames} -o {sr_frames} -s {2\|3\|4} -n {model} -f png [-m models] [-g gpu]` |
| Default `-n` mapping | `realesrgan` → `realesr-animevideov3`; UI `realcugan` still maps to an **ESRGAN ncnn** name (not a separate RealCUGAN product binary on this path) |

If scale is `原始` / SR off: skip; encode from `rife_frames`.

### D.2 Sharpen / denoise / blend / mask / scene transition

| Feature | In VideoWorker production path? |
|---------|----------------------------------|
| Sharpen | **No** dedicated stage |
| Denoise | **No** |
| Blend / morph across cuts | **No** (hard scene isolation) |
| External mask post | **No** |
| Scene transition dissolve | **No** |

Any warping/occlusion handling is **inside RIFE ncnn**, not a separate GVFI post module.

### D.3 Encode (for completeness of “looks better”)

| Item | Production (typical API SDR HEVC) |
|------|-----------------------------------|
| Codec | H.265 via auto HW (`hevc_nvenc` / qsv / amf) or `libx265` |
| CRF / quality | API `quality` → CRF (e.g. ~18); preset medium/slow |
| pix_fmt | `yuv420p` (8-bit SDR) |
| Color | SDR: `-vf scale=in_range=full:out_color_matrix=bt709:out_range=tv` + bt709 tags (`color-pipeline-fix.md`) |
| Audio | Extracted AAC 192k remuxed, or `-an` |

Historical audit (`PROJECT_AUDIT.md`) described missing BT.709 tags as a washed-out look; **encode path has since been fixed** for SDR. Still: **decode still does not preserve source HDR/10-bit** (PNG 8-bit collapse).

---

## E. SVFI-related inventory in this repo

### E.1 Files mentioning SVFI / svfi (summary)

| Area | Role |
|------|------|
| `ECCV2022-RIFE/svfi_pipeline.py` | Inspired dedupe / scdet / frame allocation |
| `main.py` `_interpolate_with_svfi_opts`, window “SVFI Optimized” | Pipeline + branding |
| `ui_prefs.py` preset `SVFI风格` | Local preset (often `rife-anime`, high fps, SR) |
| `web-ui/.../presets.ts` `svfi-style` | Web preset (`gvfi:rife-anime`, SR on) |
| `web-ui/.../svfi-panel.tsx` | **Misnomer:** SR/quality UI, not Steam VFI |
| `web-ui/.../svfi-progress-line.ts` | tqdm-like log UX |
| `PROJECT_AUDIT.md` | Scheduler / quality gap analysis vs SVFI *goals* |
| `PRD.md` / `DEVELOPMENT_PLAN.md` / `CHANGELOG.md` | Protect `svfi_pipeline` contract name |

**Not found in-repo:** Steam SVFI `.exe`, proprietary weights, official SVFI config dumps, or a measured GVFI↔SVFI A/B report.

### E.2 What the repo claims about SVFI (directional only)

From `PROJECT_AUDIT.md` (paraphrase):

- SVFI also uses an **ncnn-family** toolchain.
- SVFI is faster largely due to **overlapped decode / infer / encode** (and tunable threads / HW encode), not because GVFI lacks RIFE entirely.
- GVFI copied **dedupe + scene detection shell**, not the **scheduling kernel**.

These are **engineering hypotheses / observations**, not a controlled visual A/B against a pinned SVFI build.

### E.3 Naming traps

| Name | Actual meaning |
|------|----------------|
| `svfi_pipeline` | GVFI open preprocess helpers |
| `SVFI风格` / `svfi-style` | Product preset → often **rife-anime + SR** |
| `SvfiPanel` | Upscale/quality panel |
| “RIFE Pro - SVFI Optimized” | PyQt window title branding |

---

## F. Candidate gap areas for later C8 (not proven)

Do not treat these as root causes until measured against a real SVFI run:

1. **Model / preset:** UI “SVFI风格” → `rife-anime` vs tool default `rife-v4.6` vs unknown Steam SVFI model.
2. **Timestep / `-n` policy:** CLI binary vs Native linspace vs SVFI’s frame times.
3. **Color / bit depth:** 8-bit PNG intermediate; HDR sources crushed; encode tags fixed only for SDR.
4. **Pipeline shape:** full PNG disk stages + per-scene process restart vs SVFI overlap.
5. **Post:** SVFI may apply transitions / filters GVFI does not expose.
6. **SR:** anime ESRGAN defaults on live-action content (plastic look).
7. **Param plumbing:** historical frontend/backend contract gaps (precision ignored, etc.) — re-verify current `gvfi_api` before blaming.

---

## G. Local Steam SVFI probe (this machine — 2026-08-12)

Path: `D:\Steam\steamapps\common\SVFI`  
Product: **SVFI 8.0.14 Professional - Steam**  
CLI: `one_line_shot_args.exe -i INPUT --config CONFIG -t TASK_ID` (+ pipe RGB/Y4M options, colormatrix `{470bg,170m,2020ncl,709}`)

### Snapshot from `SVFI.ini` (user prefs — not a controlled A/B yet)

| Area | Steam SVFI (observed) | GVFI production (typical) |
|------|------------------------|---------------------------|
| Target FPS | `target_fps=120`, `rife_exp=2` | Often 48/120 via UI; API default can differ |
| Scene | `scdet_threshold=12`, `scdet_max_threshold=80` | threshold **12**; max **80 unused** in code |
| SR | `use_sr=false` in this ini; algo realCUGAN / RealESRGAN_x2plus.pth available | Optional realesrgan-ncnn; “realcugan” name maps to ESRGAN ncnn |
| Encode | CRF **16**, H.265 **10bit**, preset slow, hwaccel mode CPU in this ini | Typical SDR **8bit** yuv420p + BT.709 tags; CRF ~18 |
| Promote filters | deblur/denoise/details/dehalo/sharp/compression sliders present | **No** equivalent post stage |
| Audio | `is_save_audio=true` | AAC extract/remux |
| Dump | Preference `dump_dir=D:/SVFI` | GVFI temp_cache |

`Configs\` / `models\` listing returned empty in the probe shell (permissions/path or empty install view) — model files still need a follow-up directory walk for C8.1.

---

## H. C8.0 exit criteria / next step

**C8.0 complete when this audit exists and is accurate to current code** (this file).

**Do not** change production defaults or start Native optimization.

**Suggested C8.1:** pin one Steam SVFI task (same source as GVFI), export full ini + logs + output, and map **RIFE model name / exp / color / 10bit / promote filters** side-by-side — still without changing GVFI production until gaps are evidenced.

---

## Key source index

| Topic | Path |
|-------|------|
| Orchestration | `ECCV2022-RIFE/main.py` |
| Dedupe / scdet / targets | `ECCV2022-RIFE/svfi_pipeline.py` |
| CLI / Native / mapping | `ECCV2022-RIFE/gvfi_runtime/interpolator_backend.py` |
| API defaults | `ECCV2022-RIFE/gvfi_api.py` |
| Tools / encoder / models | `ECCV2022-RIFE/tool_resolver.py` |
| Color encode fix | `docs/fixes/color-pipeline-fix.md` |
| Historical SVFI speed notes | `PROJECT_AUDIT.md` |
| CLI vs Native A/B (not vs SVFI) | `docs/native/c72-cli-native-ab.md` |
