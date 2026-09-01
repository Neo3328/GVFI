# Color Pipeline Fix (BT.709 / Limited Range)

## 1. Problem

Output videos looked wrong compared to the source:

- Washed / gray appearance
- Inaccurate colors
- Lower saturation
- Players interpreting colors incorrectly

Root cause: the encode step converted PNG frames (full-range RGB) to YUV and wrote `yuv420p` **without** reliable BT.709 colorspace / range tags, so players guessed the matrix/transfer and often displayed incorrect colors.

## 2. Modified files

| File | Change |
|------|--------|
| `ECCV2022-RIFE/main.py` | SDR encode path: BT.709 conversion + stream tags; skip forcing BT.709 on HEVC 10-bit |

No changes to AI models, RIFE parameters, GPU scheduling, GUI, or project layout.

## 3. What changed

### Pipeline (unchanged stages)

```text
input video
  → FFmpeg decode to PNG frames (RGB)
  → optional dedup / scene / RIFE (PNG)
  → optional Real-ESRGAN (PNG)
  → FFmpeg encode PNG sequence → output video
```

### Encode (fixed)

For ordinary SDR outputs (H.265 8-bit / AV1), the merge command now includes:

```text
-vf scale=in_range=full:out_color_matrix=bt709:out_range=tv
-colorspace bt709
-color_primaries bt709
-color_trc bt709
-color_range tv
-pix_fmt yuv420p
```

Notes:

- PNG inputs are treated as **full-range RGB**.
- Output YUV uses **limited (tv) range** + **BT.709** matrix/primaries/transfer.
- **HEVC 10-bit** path is left without forced BT.709 tags (avoid breaking existing HDR-style encodes).
- ProRes path unchanged.

## 4. Test results

Fixed test clip (12 frames from an upload sample), encoded with the legacy vs fixed command lines:

| Stream field | Before (pix_fmt only) | After (BT.709 fix) |
|--------------|------------------------|--------------------|
| `pix_fmt` | `yuv420p` | `yuv420p` |
| `color_space` | `unknown` | `bt709` |
| `color_transfer` | `bt709` (incomplete tagging) | `bt709` |
| `color_primaries` | `bt709` (incomplete tagging) | `bt709` |
| `color_range` | `tv` | `tv` |

Artifacts (local only, not committed):

- `ECCV2022-RIFE/user_data/color_pipeline_test/before_no_bt709.mp4`
- `ECCV2022-RIFE/user_data/color_pipeline_test/after_bt709.mp4`

Probe command:

```bat
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,color_space,color_transfer,color_primaries,color_range -of default=noprint_wrappers=1 output.mp4
```

Expected after fix:

```text
pix_fmt=yuv420p
color_space=bt709
color_transfer=bt709
color_primaries=bt709
color_range=tv
```
