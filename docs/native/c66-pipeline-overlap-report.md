# Phase C6.6 — Pipeline Overlap PoC Report

**GVFI — Native RIFE Depth-2 Pipeline Overlap**  
**Developed by Mr. Gong**  
**Copyright © 2026 Mr. Gong. All Rights Reserved.**

---

## 1. Method

- Independent `PipelineRifeWorker` + PoC ABI (not production VideoWorker path)
- Baseline: depth=1 sequential `RIFE::process` / `process_v4`
- Pipeline: depth=2 sliding-window concurrent slots (own VkCompute/allocator/fence per job via ncnn)
- Warmup=3, steady=20
- Input: 10 pairs @ 1920x1080
- Stop rule: require ≥ ~15% steady-state frame-ms gain to continue

## 2. Correctness

| Mode | bit-exact | MAE | PSNR | SSIM | maxΔ | NaN/Inf |
|------|:---------:|----:|-----:|-----:|-----:|:-------:|
| baseline_depth1 | 10/10 | 0.000000 | 100.0000 | 1.000000 | 0 | False |
| pipeline_depth2 | 10/10 | 0.000000 | 100.0000 | 1.000000 | 0 | False |

## 3. Steady-state

| Mode | avg_frame_ms | P50 | P95 | submit/round | overlap | vs baseline |
|------|-------------:|----:|----:|-------------:|--------:|------------:|
| baseline_depth1 | 39.122 | 39.063 | 42.239 | 10.0 | 0.000 | 0.00% |
| pipeline_depth2 | 38.601 | 38.028 | 42.686 | 10.0 | 0.449 | 1.33% |

## 4. Stability

- Runs: 10
- Crashes: 0
- NaN/Inf: 0
- Frame loss: 0
- PASS: True

## 5. Verdict

STOP C6.6: depth-2 steady-state gain=1.33% (< 15% threshold). Do not expand to depth 3/4 or production integration. Measured overlap_ratio≈0.449; Vk submit count unchanged (1/frame).

---

Analysis: `docs/native/c66-pipeline-overlap-analysis.md`
JSON: `D:\GVFI-deps\native-video-worker-ab\c66_pipeline_overlap\c66_results.json`
