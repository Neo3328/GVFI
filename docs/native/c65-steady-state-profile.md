# Phase C6.5 — Steady-state GPU Command Coalescing Profile

**GVFI — Native RIFE Batch Steady-state Profiling**  
**Developed by Mr. Gong**  
**Copyright © 2026 Mr. Gong. All Rights Reserved.**

---

## 1. Objective

Validate whether C6.4 GPU command coalescing provides **steady-state** performance benefit after excluding model load, Vulkan first-init, and I/O.

## 2. Method

- Init + model load: once per process
- Warmup rounds per batch size: 3
- Steady-state rounds per batch size: 20
- Input pairs: 10 @ 1920x1080
- Timing source: in-process `process_v4_batch` phase timers via `gvfi_get_last_batch_profile`
- Algorithm unchanged; instrumentation only

## 3. Correctness

| Batch | bit-exact | MAE | PSNR | SSIM | maxΔ | NaN/Inf |
|------:|:---------:|----:|-----:|-----:|-----:|:-------:|
| 1 | 10/10 | 0.000000 | 100.0000 | 1.000000 | 0 | False |
| 2 | 10/10 | 0.000000 | 100.0000 | 1.000000 | 0 | False |
| 4 | 10/10 | 0.000000 | 100.0000 | 1.000000 | 0 | False |
| 8 | 10/10 | 0.000000 | 100.0000 | 1.000000 | 0 | False |

## 4. Steady-state Timings (`process_v4_batch`)

| Batch | total_ms | record_ms | submit_ms | post_ms | vk submits | avg_batch_ms | avg_frame_ms | P50 | P95 |
|------:|---------:|----------:|----------:|--------:|-----------:|-------------:|-------------:|----:|----:|
| 1 | 7433.282 | 427.192 | 6988.766 | 0.008 | 200 | 37.166 | 37.166 | 37.261 | 40.883 |
| 2 | 7478.608 | 430.521 | 7039.558 | 0.004 | 100 | 74.786 | 37.393 | 74.558 | 77.547 |
| 4 | 7509.672 | 440.695 | 7062.952 | 0.003 | 60 | 125.161 | 37.548 | 148.796 | 154.875 |
| 8 | 7479.206 | 429.271 | 7044.979 | 0.002 | 40 | 186.980 | 37.396 | 187.689 | 302.235 |

### Relative to Batch 1 (avg_frame_ms)

| Batch | avg_frame_ms | vs batch1 |
|------:|-------------:|----------:|
| 1 | 37.166 | 1.000x |
| 2 | 37.393 | 0.994x |
| 4 | 37.548 | 0.990x |
| 8 | 37.396 | 0.994x |

## 5. Stability

- Runs: 10
- Crashes: 0
- Failed forwards: 0
- NaN/Inf: 0
- Frame loss: 0
- PASS: True

## 6. Verdict (data-only)

No meaningful steady-state frame-time gain vs Batch 1 (best batch=1, relative=1.000x). Command coalescing reduces measured Vk submit count, but avg_frame_ms does not show a clear benefit under this workload.

---

Raw JSON: `D:\GVFI-deps\native-video-worker-ab\c65_steady_state\c65_results.json`
