# Phase D6 Stability and Resource Baseline

## Test identity

- Date: 2026-08-25
- Input: `D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4`
- SHA-256: `F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001`
- Resolution/FPS: 1920x1080 at 24 FPS
- Backend: Native RIFE, Vulkan GPU 0
- Pipeline: disk
- Output: 1920x1080, 48 FPS, 48 frames, HEVC, AAC, BT.709 limited range
- Raw report: `D:\GVFI-deps\native-video-worker-ab\d6-stability\d6-stability.json`

## 100-forward persistent-backend test

The backend was initialized and loaded once, warmed up five times, then executed 100
1080p interpolations in the same process.

| Metric | Result |
|---|---:|
| Completed | 100/100 |
| Failed forwards | 0 |
| NaN/Inf outputs | 0 |
| First measured forward | 40.975 ms |
| Average | 46.136 ms |
| P50 | 45.614 ms |
| P95 | 51.946 ms |
| P99 | 56.002 ms |
| Minimum | 40.340 ms |
| Maximum | 56.478 ms |

Resource samples included backend release:

| Resource | Start | End | Peak | Delta |
|---|---:|---:|---:|---:|
| RSS | 404.5 MiB | 207.1 MiB | 404.5 MiB | -197.4 MiB |
| Private bytes | 1617.7 MiB | 945.6 MiB | 1617.7 MiB | -672.1 MiB |
| GPU memory | 4382 MiB | 3983 MiB | 4573 MiB | -399 MiB |

Result: PASS. Persistent forward execution did not retain the backend allocation after
release in this run.

## Ten complete VideoWorker tasks

Each task created, initialized, used, and released a fresh Native backend.

| Metric | Result |
|---|---:|
| Successful tasks | 10/10 |
| Failed tasks | 0 |
| Native-to-CLI fallback | 0 |
| Vulkan errors | 0 |
| Output contract failures | 0 |
| Minimum task time | 8.38 s |
| Maximum task time | 11.14 s |

Resource samples after each task:

| Resource | Start | End | Peak | Delta |
|---|---:|---:|---:|---:|
| RSS | 141.3 MiB | 244.0 MiB | 394.9 MiB | +102.7 MiB |
| Private bytes | 872.6 MiB | 1013.1 MiB | 1197.6 MiB | +140.5 MiB |
| GPU memory | 3983 MiB | 3768 MiB | 4053 MiB | -215 MiB |

RSS and private bytes were not monotonic: both rose during early tasks, returned near
baseline during tasks 5-8, rose again during task 9, then partially fell after task 10.
This pattern is compatible with allocator/OS working-set retention, but a ten-task run
cannot prove the absence of a slow leak.

## Gate result

- Correctness/stability gate: PASS
- Crash/fallback gate: PASS
- GPU release evidence: PASS for this run
- Memory-leak closure: NOT YET PROVEN
- Multi-hour soak: NOT EXECUTED

The harness supports `--soak-minutes N` for a future scheduled run. No multi-hour result
is claimed in this phase.
