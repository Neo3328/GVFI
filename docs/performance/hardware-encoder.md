# Perf: Hardware encoder support for HEVC output (P0-5)

## 1. Problem

The merge step always used **`libx265`** (CPU). After GPU inference finished, the GPU idled while the CPU encoded for a long time, dragging total job time.

Original command (SDR H.265 path):

```
-c:v libx265 -crf <crf> -preset <preset> -x265-params log-level=error -pix_fmt yuv420p
```

## 2. Encoder selection logic

`libx265` is **not removed** — it remains the guaranteed fallback.

Priority (functional probe, not just `-encoders` listing — each candidate must actually encode 3 test frames):

```
hevc_nvenc (NVIDIA) → hevc_qsv (Intel) → hevc_amf (AMD) → libx265 (CPU fallback)
```

Internal config `encoder_mode` (default `auto`, no GUI change):

| Mode | Behavior |
|------|----------|
| `auto` | hardware if probe succeeds, else `libx265` |
| `hardware` | hardware if available, else `libx265` (reason logged) |
| `software` | always `libx265` |

Probe results are cached per ffmpeg path. Job-start and merge-step log:

```
ENCODER CONFIG:
hardware_encoder=hevc_nvenc
reason=hw_probe_ok
```

or on machines without a supported GPU:

```
ENCODER CONFIG:
hardware_encoder=libx265
reason=no_supported_gpu
```

## 3. Quality parameter mapping

The single canonical quality value (`quality` → CRF from P0-2) maps per encoder; user quality settings stay effective:

| Encoder | Mapping |
|---------|---------|
| `libx265` | `-crf <crf> -preset <encode_preset>` (unchanged) |
| `hevc_nvenc` | `-rc vbr -cq <crf> -b:v 0 -preset p5 -tune hq` |
| `hevc_qsv` | `-global_quality <crf> -preset medium` (ICQ) |
| `hevc_amf` | `-rc cqp -qp_i <crf> -qp_p <crf> -quality balanced` |

10-bit HEVC uses `p010le` on hardware encoders / `yuv420p10le` on libx265. The BT.709 `-vf` chain and color tags from P0-1 are applied before the codec args and are unchanged.

### Files

- `ECCV2022-RIFE/tool_resolver.py` — `detect_hevc_hw_encoder`, `select_hevc_encoder`, `hevc_encoder_quality_args`
- `ECCV2022-RIFE/main.py` — HEVC merge path uses selected encoder; ENCODER CONFIG logs; desktop params carry `encoder_mode=auto`
- `ECCV2022-RIFE/gvfi_api.py` — pass `encoder_mode` (default `auto`) through worker params
- `docs/performance/hardware-encoder.md` — this document

## 4. Test results

Hardware: RTX 5060 Laptop (8 GB). Input: 48 × 1080p PNG frames (RIFE output from the P0-4 bench) + 1s AAC audio, merged with the exact pipeline command (BT.709 vf chain + tags), CRF/CQ 17.

| Metric | libx265 (before) | hevc_nvenc (after) |
|--------|------------------|--------------------|
| Wall time | 1.076 s | **0.440 s** (~2.4× faster) |
| CPU time (total) | 5.73 s (~22% all-cores) | **0.91 s** (~9% all-cores) |
| Output size | 1750 KB | 2309 KB (+32% at same CQ number) |
| SSIM vs source frames | 0.99884 | **0.99948** |

Verification (both files, via ffprobe + full decode):

1. Playable — full decode passes with no errors.
2. Audio — AAC 44.1 kHz present and mapped.
3. Color — `color_space=bt709`, `color_primaries=bt709`, `color_range=tv`, `pix_fmt=yuv420p`; tags identical between the two encoders (P0-1 behavior preserved).
4. Resolution/FPS — 1920×1080 @ 48 fps on both, unchanged.

Notes: NVENC at the same CQ number yields slightly larger files but equal-or-better SSIM; visual quality is comparable. AV1 / ProRes paths are untouched.
