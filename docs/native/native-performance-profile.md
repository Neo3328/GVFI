# C6.1 — Native Backend Performance Profile

**Phase:** C6.1
**Date:** 2026-08-11
**Commit baseline:** `d9152dd7 feat: add native backend production fallback`
**Objective:** Identify performance bottlenecks in Native backend vs CLI

---

## 1. Test Configuration

| Parameter | Value |
|---|---|
| Test video | `D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4` |
| Resolution | 1920×1080 |
| Source FPS | 24 |
| Source frames | 24 |
| Target FPS | 48 (2× interpolation) |
| Output frames | 47 |
| Model | `rife-v4.6` |
| GPU | NVIDIA GeForce RTX 5060 Laptop |
| ncnn version | 1.0.20250503 |
| NCNN_VULKAN | ON |

---

## 2. Three Test Runs Summary

| Run | Native (s) | CLI (s) | Ratio | Native Frames | CLI Frames |
|---|---|---|---|---|---|
| 1 | 6.10 | 2.28 | 0.37× | 47 | 47 |
| 2 | 5.28 | 2.25 | 0.43× | 47 | 47 |
| 3 | 5.48 | 2.27 | 0.41× | 47 | 47 |
| **AVG** | **5.62** | **2.27** | **2.48×** | 47 | 47 |

**Finding:** Native is **2.48× slower** than CLI in wall-clock time.

---

## 3. Native Backend Timing Breakdown

### 3.1 Initialization Phase

| Phase | Time (ms) | % of Total RIFE | Classification |
|---|---|---|---|
| `init_load_dll` | 1.8 | 0.0% | One-time |
| `init_create` | 0.1 | 0.0% | One-time |
| `init_initialize` (Vulkan) | 515.0 | 9.2% | One-time |
| `model_hash_check` | 8.3 | 0.1% | One-time |
| `model_load` | 337.5 | 6.0% | One-time |
| `gpu_warmup` | 56.3 | 1.0% | One-time |
| **Init Total** | **919.0** | **16.4%** | |

**Note:** Initialization is a **one-time cost** amortized over the entire task. For a single-scene 47-frame task, it represents 16.4% of total time. For longer tasks, this percentage decreases.

### 3.2 Per-Frame Processing

| Phase | Time (ms/frame) | % of Forward | Classification |
|---|---|---|---|
| `frame_read` (cv2.imread) | 32.6 | 34.3% | **I/O** |
| `frame_convert_total` (ctypes) | 5.8 | 6.1% | CPU (Python) |
| `ctypes_gvfi_process` (GPU) | 42.5 | 44.7% | **GPU** |
| `frame_write` (cv2.imwrite) | 14.1 | 14.8% | **I/O** |
| **Per-Frame Total** | **48.3** | **100%** | |

**Note:** Only 46 frames require inference (forward). Frame 47 is a copy of source frame 24.

### 3.3 Total Time Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│ NATIVE BACKEND TIMING BREAKDOWN                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  GPU forward (ncnn Vulkan)    1956.2 ms   34.8%  █████████████│
│  Frame read (I/O)             1500.6 ms   26.7%  ████████████│
│  Initialization (one-time)       919.0 ms   16.4%  ███████     │
│  Frame write (I/O)              648.1 ms   11.5%  █████       │
│  Python ctypes overhead         267.6 ms    4.8%  ██          │
│  Model load (one-time)          337.5 ms    6.0%  ███         │
│  ─────────────────────────────  ────────  ──────                │
│  TOTAL                        5617.5 ms  100.0%                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. GPU vs CPU/I/O Breakdown

### Forward Time (Per Frame)

| Category | Time (ms) | % of Forward |
|---|---|---|
| GPU (ncnn Vulkan) | 42.5 | 44.7% |
| CPU (Python ctypes) | 5.8 | 6.1% |
| I/O (read + write) | 46.7 | 49.1% |
| **Total** | **95.0** | **100%** |

**Finding:** I/O is the **largest category** at 49.1%, followed by GPU at 44.7%.

### Cumulative Time (46 frames)

| Category | Time (ms) | % of Total |
|---|---|---|
| GPU (ncnn Vulkan) | 1956 | 34.8% |
| I/O (read + write) | 2149 | 38.3% |
| Initialization | 919 | 16.4% |
| Python ctypes | 268 | 4.8% |
| Model load | 337 | 6.0% |

---

## 5. ctypes Call Overhead

| Phase | Time (ms/frame) | % of ctypes Total |
|---|---|---|
| `frame_convert_tobytes` | 2.2 | 4.6% |
| `frame_convert_create_buffer` | 3.6 | 7.4% |
| `ctypes_gvfi_process` (GPU) | 42.5 | 88.0% |
| **Total ctypes** | **48.3** | **100%** |

**Finding:** The actual ctypes call overhead (`tobytes` + `create_buffer`) is **5.8ms/frame (12%)**, which is small compared to the GPU forward time (42.5ms/frame, 88%).

---

## 6. Bottleneck Analysis

### Ranked by Contribution

| Rank | Bottleneck | Time (ms/frame) | % of Forward | Type |
|---|---|---|---|---|
| 1 | **GPU forward (ncnn Vulkan)** | 42.5 ms | 44.7% | Compute |
| 2 | **Frame read (cv2.imread)** | 32.6 ms | 34.3% | I/O |
| 3 | **Frame write (cv2.imwrite)** | 14.1 ms | 14.8% | I/O |
| 4 | Python ctypes overhead | 5.8 ms | 6.1% | Python |
| 5 | GPU warmup (amortized) | 1.2 ms | 1.3% | One-time |

### Key Insights

1. **GPU is the primary compute bottleneck** — ncnn Vulkan forward takes 42.5ms per frame
2. **I/O is the largest overall bottleneck** — Read (32.6ms) + Write (14.1ms) = 46.7ms/frame (49.1%)
3. **Python ctypes overhead is minimal** — Only 5.8ms/frame (6.1%)

---

## 7. Comparison with CLI

| Metric | Native | CLI | Notes |
|---|---|---|---|
| Total time | 5.62s | 2.27s | Native 2.48× slower |
| Time/frame | 48.3ms | ~2.3ms | CLI is batch processing |
| Process model | In-process DLL | Subprocess per scene |
| Frame I/O | cv2.imread/imwrite | Internal to exe |
| GPU utilization | Per-frame calls | Batched Vulkan queues |

**CLI Advantage:** The `rife-ncnn-vulkan.exe` CLI processes the entire directory in **one subprocess call**, using internal Vulkan queues to overlap:
- Load frames from disk
- Upload to GPU
- Execute inference
- Download from GPU
- Save frames to disk

**Native Disadvantage:** Python calls `process_frames()` **46 times** (once per interpolated frame), each time:
1. Reading frame from disk (cv2.imread)
2. Converting to ctypes buffer
3. Crossing Python→ctypes→C++ boundary
4. GPU forward
5. Crossing back
6. Converting output
7. Writing to disk (cv2.imwrite)

---

## 8. Warmup Impact

| Phase | Time (ms) | Impact |
|---|---|---|
| First run total | 6100ms | — |
| Subsequent runs | 5278-5476ms | — |
| GPU warmup (one-time) | 56.3ms | ~1% of first run |

**Finding:** GPU warmup is negligible (1%) and doesn't explain the 2.48× slowdown.

---

## 9. Conclusions

### Primary Bottleneck
**I/O (frame read/write) is the largest bottleneck** at 49.1% of forward time.

### Secondary Bottleneck
**GPU pipeline efficiency** — CLI batches operations internally while Native does them one-by-one from Python.

### ctypes Overhead
**Minimal** — Only 6.1% of forward time. The Python→ctypes boundary is not the primary cause.

---

## 10. Optimization Recommendations

### High Priority (Largest Impact)

| Optimization | Expected Impact | Complexity |
|---|---|---|
| **Batch frame read** — Pre-load frames in memory | ~50% reduction in I/O | Medium |
| **Batch frame write** — Buffer outputs, write async | ~25% reduction in I/O | Medium |
| **Frame cache** — Reuse already-loaded frames | ~30% reduction in reads | Low |

### Medium Priority

| Optimization | Expected Impact | Complexity |
|---|---|---|
| **Vulkan queue batching** — Send multiple frames without waiting | ~20% speedup | High |
| **Memory pool** — Pre-allocate ctypes buffers | ~5% speedup | Low |
| **GPU memory reuse** — Avoid reallocation per frame | ~10% speedup | High |

### Low Priority (Minimal Impact)

| Optimization | Expected Impact | Complexity |
|---|---|---|
| Reduce ctypes overhead | ~5% speedup | Low |

---

## 11. Next Steps

The profiling data shows that the **most impactful optimization** would be:

> **Batch frame I/O** — Pre-loading frames into memory and writing them asynchronously.

This could reduce the I/O component by 50-75%, potentially bringing Native closer to CLI performance.

---

## 12. Artifacts

| Artifact | Location |
|---|---|
| Profiling script | `ECCV2022-RIFE/tests/test_c61_profile.py` |
| Raw results | `D:\GVFI-deps\native-video-worker-ab\c61_profile\` |
| JSON results | `D:\GVFI-deps\native-video-worker-ab\c61_profile\profile_results.json` |

---

Developed by Mr. Gong
Copyright © 2026 Mr. Gong. All Rights Reserved.
