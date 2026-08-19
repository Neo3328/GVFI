# C7.2 — CLI vs Native Final Production A/B Validation

Developed by Mr. Gong
Copyright © 2026 Mr. Gong. All Rights Reserved.

## Constraints
- Validation only — no production logic changes
- Default `backend_mode` remains **cli**
- Same video / model / resolution / GPU / output spec

## Test input
- Video: `D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4`
- SHA-256: `F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001`
- Target: 1920x1080 @ 48 fps, 48 frames
- Thread config (both): `2:4:4`

## Quality gates (per-run ×10)
- CLI series: **PASS** (10/10, crashes=0)
- Native series: **PASS** (10/10, crashes=0)

## Steady-state timing (exclude run 1 warmup)

| Metric | CLI mean±σ | Native mean±σ | CLI/Native |
|---|---|---|---|
| wall_elapsed_s | 4.772±0.054 | 9.319±0.075 | 0.512x |
| startup_time_s | 1.343±0.019 | 0.208±0.004 | 6.452x |
| inference_time_s (interp/GPU forward) | 0.944±0.022 | 5.190±0.045 | 0.182x |
| io_time_s | 0.824±0.018 | 0.855±0.022 | 0.965x |
| gpu_usage_pct | 50.411±5.008 | 45.256±1.362 | 1.114x |

Peak VRAM: sampled via `nvidia-smi memory.used` before/after each run (not a true peak watermark; see JSON for per-run values).

## Frame comparison (last good CLI vs last good Native)
- avg MAE: 1.822838652182999
- avg PSNR: 28.138900306483944
- avg SSIM: 0.9930375740532952
- max pixel Δ: 255
- last-2 MAE/PSNR/SSIM: 1.5591604777520576 / 34.985588796847445 / 0.9928416068599002
- Native dups / CLI dups (compare decode): 0 / 0

## Fallback
- **PASS** — {'task_success': True, 'fallback_occurred': True, 'active_cli': True, 'requested_native': True, 'output_exists': True}

## Default backend_mode
- Value: `cli`
- Protected: **PASS**

## Verdict
Functional A/B PASS; default must remain **cli**. Steady-state speedup insufficient for default switch (wall CLI/Native=0.512007810043908, inference CLI/Native=0.18184153625484362, gate>=1.15). C7.2 does not authorize flipping backend_mode.

JSON: `D:\GVFI-deps\native-video-worker-ab\c72_ab\c72_results.json`
