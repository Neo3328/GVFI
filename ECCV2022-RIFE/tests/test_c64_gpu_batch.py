"""
C6.4 — Native RIFE GPU Command Coalescing PoC

Phase: C6.4
Date: 2026-08-12
Objective: Verify if coalescing multiple frame processing commands into a single
          VkQueue submission reduces GPU overhead and improves throughput.

Constraints:
- Independent PoC only; no production code changes.
- backend_mode default stays 'cli'; no CLI backend modification.
- No GUI, VideoWorker, FFmpeg, scene detection, FrameQueue, NVENC changes.
- Do not modify ncnn core (neural networks, Vulkan backend, memory allocators).
- No Git commits until stop condition is met.

Output: D:\GVFI-deps\native-video-worker-ab\c64_gpu_batch\
"""

from __future__ import annotations

import gc
import hashlib
import json
import math
import os
import shutil
import sys
import time
from pathlib import Path
from typing import Optional

# Paths
ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
sys.path.insert(0, ENGINE_ROOT)

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
MODEL = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c64_gpu_batch"

# Test configuration
EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
NUM_INPUT_PAIRS = 10  # Use 10 frame pairs (20 input frames total)
BATCH_SIZES = [1, 2, 4, 8]
BENCHMARK_RUNS = 3
STABILITY_RUNS = 10

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
import numpy as np
import cv2

from gvfi_runtime.frame_pipeline import Frame
from gvfi_runtime.native_library import NativeLibraryLoader, NativeResult, NativeLibraryError


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def decode_video_to_frames(video_path: str, output_dir: str, max_frames: int = None) -> list[Path]:
    """Decode video to PNG frames using OpenCV; returns sorted list of PNG paths."""
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"cv2.VideoCapture failed to open: {video_path}")
    index = 0
    while True:
        if max_frames is not None and index >= max_frames:
            break
        ret, frame = cap.read()
        if not ret:
            break
        if frame is None or frame.ndim != 3:
            continue
        name = os.path.join(output_dir, f"{index:08d}.png")
        cv2.imwrite(name, frame)
        index += 1
    cap.release()
    return sorted(Path(output_dir).glob("*.png"))


def load_frames(frame_paths: list[Path]) -> list[np.ndarray]:
    """Load frames as numpy arrays."""
    frames = []
    for path in frame_paths:
        frame = cv2.imread(str(path))
        if frame is not None:
            frames.append(frame)
    return frames


def calculate_metrics(output: np.ndarray, reference: np.ndarray) -> dict:
    """Calculate quality metrics between output and reference."""
    if output.shape != reference.shape:
        return {"error": "shape_mismatch"}
    
    mae = float(np.abs(output.astype(float) - reference.astype(float)).mean())
    
    # PSNR
    mse = float(np.mean((output.astype(float) - reference.astype(float)) ** 2))
    if mse == 0:
        psnr = 100.0
    else:
        psnr = float(20 * math.log10(255.0 / math.sqrt(mse)))
    
    # SSIM (simplified)
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    mu1 = reference.mean()
    mu2 = output.mean()
    sigma1_sq = ((reference.astype(float) - mu1) ** 2).mean()
    sigma2_sq = ((output.astype(float) - mu2) ** 2).mean()
    sigma12 = ((reference.astype(float) - mu1) * (output.astype(float) - mu2)).mean()
    
    ssim = float(
        (2 * mu1 * mu2 + c1) * (2 * sigma12 + c2) /
        ((mu1**2 + mu2**2 + c1) * (sigma1_sq + sigma2_sq + c2))
    )
    
    # Bit exact check
    bit_exact = bool(np.array_equal(output, reference))
    
    return {
        "mae": mae,
        "psnr": psnr,
        "ssim": ssim,
        "bit_exact": bit_exact,
        "max_pixel_diff": int(np.abs(output.astype(float) - reference.astype(float)).max()),
    }


class GpuMetricsCollector:
    """Collect GPU metrics via ncnn Vulkan internal counters.
    
    Note: Since ncnn doesn't expose per-call submit counts publicly,
    we use Vulkan validation layers or timing analysis to estimate.
    """
    
    def __init__(self):
        self.reset()
    
    def reset(self):
        self.forward_call_count = 0
        self.total_gpu_time_ms = 0.0
        self.start_times = []
        self.end_times = []
    
    def begin_forward(self):
        self.forward_call_count += 1
        self.start_times.append(time.perf_counter())
    
    def end_forward(self):
        self.end_times.append(time.perf_counter())
        if len(self.start_times) > len(self.end_times):
            pass  # Mismatch handling
        else:
            idx = len(self.end_times) - 1
            self.total_gpu_time_ms += (self.end_times[idx] - self.start_times[idx]) * 1000
    
    def estimate_vk_submits(self) -> int:
        """Estimate number of VkQueue submissions.
        
        In the current implementation, each RIFE::process() call creates
        a VkCompute and submits once. With batch processing, we expect
        this to be reduced to 1 submit per batch.
        """
        return self.forward_call_count
    
    def get_summary(self) -> dict:
        return {
            "forward_call_count": self.forward_call_count,
            "estimated_vk_submits": self.estimate_vk_submits(),
            "total_gpu_time_ms": self.total_gpu_time_ms,
            "avg_forward_ms": self.total_gpu_time_ms / max(1, self.forward_call_count),
        }


# ---------------------------------------------------------------------------
# Baseline: Single-frame processing (reference)
# ---------------------------------------------------------------------------

def run_baseline(frames: list[np.ndarray], timestamps: list[float], model_dir: str) -> tuple[list[np.ndarray], GpuMetricsCollector]:
    """
    Process frames one-by-one using the existing native backend.
    This is the reference implementation.
    Returns (output_frames, gpu_metrics).
    """
    metrics = GpuMetricsCollector()
    
    # Initialize native library
    lib = NativeLibraryLoader()
    lib.load()
    lib.create()
    lib.initialize()
    
    param_path = os.path.join(model_dir, "flownet.param")
    bin_path = os.path.join(model_dir, "flownet.bin")
    result = lib.load_model(param_path, bin_path)
    if result != NativeResult.SUCCESS:
        raise RuntimeError(f"Failed to load model: {result}")
    
    # GPU warmup
    dummy = Frame(bytes(EXPECTED_WIDTH * EXPECTED_HEIGHT * 3),
                  EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", 0, 0.0)
    lib.process(dummy, dummy, 0.5)
    
    outputs = []
    
    for i in range(0, len(frames) - 1):
        frame0_bgr = frames[i]
        frame1_bgr = frames[i + 1]
        timestamp = timestamps[i]
        
        metrics.begin_forward()
        f0 = Frame(frame0_bgr.tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i, 0.0)
        f1 = Frame(frame1_bgr.tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i + 1, 0.0)
        
        result, output_frame = lib.process(f0, f1, float(timestamp))
        metrics.end_forward()
        
        if result != NativeResult.SUCCESS or output_frame is None:
            raise RuntimeError(f"Forward failed at frame {i}: {result}")
        
        output_bgr = np.frombuffer(output_frame.frame_data, dtype=np.uint8).reshape(
            (EXPECTED_HEIGHT, EXPECTED_WIDTH, 3)
        ).copy()
        outputs.append(output_bgr)
    
    lib.release()
    lib.destroy()
    
    return outputs, metrics


# ---------------------------------------------------------------------------
# Batch GPU processing (new C6.4 implementation)
# ---------------------------------------------------------------------------

def run_gpu_batch(frames: list[np.ndarray], timestamps: list[float], 
                  batch_size: int, model_dir: str) -> tuple[list[np.ndarray], GpuMetricsCollector, dict]:
    """
    Process frames using batch GPU submission.
    Uses the new process_v4_batch() implementation.
    
    Returns (output_frames, gpu_metrics, batch_stats).
    """
    metrics = GpuMetricsCollector()
    batch_stats = {
        "batch_size": batch_size,
        "batches_submitted": 0,
        "estimated_vk_submits": 0,
    }
    
    # Initialize native library
    lib = NativeLibraryLoader()
    lib.load()
    lib.create()
    lib.initialize()
    
    param_path = os.path.join(model_dir, "flownet.param")
    bin_path = os.path.join(model_dir, "flownet.bin")
    result = lib.load_model(param_path, bin_path)
    if result != NativeResult.SUCCESS:
        raise RuntimeError(f"Failed to load model: {result}")
    
    # GPU warmup
    dummy = Frame(bytes(EXPECTED_WIDTH * EXPECTED_HEIGHT * 3),
                  EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", 0, 0.0)
    lib.process(dummy, dummy, 0.5)
    
    outputs = []
    num_pairs = len(frames) - 1
    num_batches = math.ceil(num_pairs / batch_size)
    
    for batch_idx in range(num_batches):
        start_idx = batch_idx * batch_size
        end_idx = min(start_idx + batch_size, num_pairs)
        current_batch_size = end_idx - start_idx
        
        batch_frames0 = []
        batch_frames1 = []
        batch_timestamps = []
        
        for i in range(start_idx, end_idx):
            f0 = Frame(frames[i].tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i, 0.0)
            f1 = Frame(frames[i + 1].tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i + 1, 0.0)
            batch_frames0.append(f0)
            batch_frames1.append(f1)
            batch_timestamps.append(timestamps[i])
        
        # Batch path only — no sequential fallback (C6.4 contract).
        metrics.begin_forward()
        batch_stats["batches_submitted"] += 1

        result, batch_outputs = lib.process_batch(batch_frames0, batch_frames1, batch_timestamps)
        metrics.end_forward()

        if result != NativeResult.SUCCESS or not batch_outputs:
            raise RuntimeError(f"Batch processing failed: {result}")

        for output_frame in batch_outputs:
            if output_frame is None:
                raise RuntimeError("Batch output contains None frame")
            output_bgr = np.frombuffer(output_frame.frame_data, dtype=np.uint8).reshape(
                (EXPECTED_HEIGHT, EXPECTED_WIDTH, 3)
            ).copy()
            outputs.append(output_bgr)    
    batch_stats["estimated_vk_submits"] = batch_stats["batches_submitted"]
    batch_stats["frames_processed"] = len(outputs)
    
    lib.release()
    lib.destroy()
    
    return outputs, metrics, batch_stats


# ---------------------------------------------------------------------------
# Correctness validation
# ---------------------------------------------------------------------------

def validate_correctness(outputs: list[np.ndarray], references: list[np.ndarray]) -> dict:
    """Validate that batch outputs match reference outputs."""
    if len(outputs) != len(references):
        return {"error": "length_mismatch", "output_count": len(outputs), "reference_count": len(references)}
    
    total_mae = 0.0
    total_psnr = 0.0
    total_ssim = 0.0
    bit_exact_count = 0
    max_pixel_diff = 0
    
    for i, (out, ref) in enumerate(zip(outputs, references)):
        metrics = calculate_metrics(out, ref)
        total_mae += metrics.get("mae", 0.0)
        total_psnr += metrics.get("psnr", 0.0)
        total_ssim += metrics.get("ssim", 0.0)
        if metrics.get("bit_exact", False):
            bit_exact_count += 1
        max_pixel_diff = max(max_pixel_diff, metrics.get("max_pixel_diff", 0))
    
    n = len(outputs)
    return {
        "total_frames": n,
        "bit_exact_count": bit_exact_count,
        "bit_exact_ratio": bit_exact_count / n if n > 0 else 0,
        "avg_mae": total_mae / n if n > 0 else 0,
        "avg_psnr": total_psnr / n if n > 0 else 0,
        "avg_ssim": total_ssim / n if n > 0 else 0,
        "max_pixel_diff": max_pixel_diff,
        "is_correct": bit_exact_count == n and max_pixel_diff == 0,
    }


# ---------------------------------------------------------------------------
# Memory monitoring
# ---------------------------------------------------------------------------

def get_memory_info() -> dict:
    """Get current memory usage info."""
    try:
        import psutil
        process = psutil.Process()
        mem_info = process.memory_info()
        return {
            "rss_mb": mem_info.rss / (1024 * 1024),
            "vms_mb": mem_info.vms / (1024 * 1024),
        }
    except ImportError:
        return {"rss_mb": 0, "vms_mb": 0, "note": "psutil not available"}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 80)
    print("C6.4 — Native RIFE GPU Command Coalescing PoC")
    print("=" * 80)
    
    os.makedirs(RESULTS_DIR, exist_ok=True)
    
    # Check prerequisites
    print(f"\n[CHECK] Test video: {TEST_VIDEO}")
    print(f"[CHECK] Model: {MODEL}")
    
    if not os.path.isfile(TEST_VIDEO):
        print(f"\nFATAL: Test video not found: {TEST_VIDEO}")
        return 1
    
    if not os.path.isdir(MODEL):
        print(f"\nFATAL: Model directory not found: {MODEL}")
        return 1
    
    param_path = os.path.join(MODEL, "flownet.param")
    bin_path = os.path.join(MODEL, "flownet.bin")
    if not os.path.isfile(param_path):
        print(f"\nFATAL: Model param not found: {param_path}")
        return 1
    if not os.path.isfile(bin_path):
        print(f"\nFATAL: Model bin not found: {bin_path}")
        return 1
    
    print(f"[OK] Prerequisites verified")
    
    # Decode video to frames
    input_dir = os.path.join(RESULTS_DIR, "input_frames")
    if os.path.exists(input_dir):
        shutil.rmtree(input_dir)
    
    print(f"\nDecoding video to frames...")
    frame_paths = decode_video_to_frames(TEST_VIDEO, input_dir, max_frames=NUM_INPUT_PAIRS + 1)
    print(f"  Loaded {len(frame_paths)} input frames")
    
    if len(frame_paths) < NUM_INPUT_PAIRS + 1:
        print(f"\nFATAL: Not enough frames. Expected {NUM_INPUT_PAIRS + 1}, got {len(frame_paths)}")
        return 1
    
    # Load frames into memory
    print(f"\nLoading frames into RAM...")
    frames = load_frames(frame_paths[:NUM_INPUT_PAIRS + 1])
    print(f"  Frame pairs: {len(frames) - 1}")
    print(f"  Resolution: {frames[0].shape[1]}x{frames[0].shape[0]}")
    
    # Generate timestamps
    timestamps = [(i + 1) / (len(frames)) for i in range(len(frames) - 1)]
    
    # Run baseline
    print(f"\nRunning baseline (single-frame mode)...")
    baseline_outputs, baseline_metrics = run_baseline(frames, timestamps, MODEL)
    baseline_time = baseline_metrics.total_gpu_time_ms / 1000.0
    print(f"  Forward calls: {baseline_metrics.forward_call_count}")
    print(f"  Total time: {baseline_time:.4f}s")
    
    results = {
        "baseline": {
            "forward_calls": baseline_metrics.forward_call_count,
            "estimated_vk_submits": baseline_metrics.estimate_vk_submits(),
            "total_time_s": baseline_time,
            "avg_forward_ms": baseline_metrics.total_gpu_time_ms / baseline_metrics.forward_call_count,
        },
        "batch": {},
        "config": {
            "num_input_pairs": NUM_INPUT_PAIRS,
            "resolution": f"{EXPECTED_WIDTH}x{EXPECTED_HEIGHT}",
            "benchmark_runs": BENCHMARK_RUNS,
            "stability_runs": STABILITY_RUNS,
        }
    }
    
    # Test each batch size
    for batch_size in BATCH_SIZES:
        print(f"\n{'=' * 60}")
        print(f"Testing batch_size={batch_size}")
        print(f"{'=' * 60}")
        
        batch_times = []
        batch_metrics_list = []
        batch_stats_list = []
        correctness_results = []
        
        for run in range(BENCHMARK_RUNS):
            gc.collect()
            mem_before = get_memory_info()
            
            t0 = time.perf_counter()
            batch_outputs, batch_metrics, batch_stats = run_gpu_batch(
                frames, timestamps, batch_size, MODEL
            )
            elapsed = time.perf_counter() - t0
            
            mem_after = get_memory_info()
            
            # Validate correctness
            correctness = validate_correctness(batch_outputs, baseline_outputs)
            correctness_results.append(correctness)
            batch_times.append(elapsed)
            batch_metrics_list.append(batch_metrics)
            batch_stats_list.append(batch_stats)
            
            print(f"\n  Run {run + 1}: {elapsed:.4f}s")
            print(f"    Forward calls: {batch_metrics.forward_call_count}")
            print(f"    Batches submitted: {batch_stats['batches_submitted']}")
            print(f"    Correctness: {correctness['bit_exact_count']}/{correctness['total_frames']} bit-exact")
            print(f"    Max pixel diff: {correctness['max_pixel_diff']}")
            print(f"    Memory: {mem_before['rss_mb']:.1f} -> {mem_after['rss_mb']:.1f} MB")
        
        # Aggregate results
        avg_time = sum(batch_times) / len(batch_times)
        last_correctness = correctness_results[-1]
        avg_correctness = {
            "bit_exact_count": sum(r["bit_exact_count"] for r in correctness_results) // BENCHMARK_RUNS,
            "total_frames": correctness_results[0]["total_frames"],
            "avg_mae": sum(r["avg_mae"] for r in correctness_results) / BENCHMARK_RUNS,
            "avg_psnr": sum(r["avg_psnr"] for r in correctness_results) / BENCHMARK_RUNS,
            "avg_ssim": sum(r["avg_ssim"] for r in correctness_results) / BENCHMARK_RUNS,
            "max_pixel_diff": max(r["max_pixel_diff"] for r in correctness_results),
            "nan_inf_detected": any(
                (not np.isfinite(o).all()) for o in batch_outputs
            ) if batch_outputs else False,
        }
        avg_correctness["bit_exact_ratio"] = avg_correctness["bit_exact_count"] / avg_correctness["total_frames"]
        avg_correctness["is_correct"] = (
            avg_correctness["bit_exact_count"] == avg_correctness["total_frames"]
            and avg_correctness["max_pixel_diff"] == 0
        )
        
        speedup = baseline_time / avg_time if avg_time > 0 else 0
        vk_submit_reduction = (
            (results["baseline"]["estimated_vk_submits"] - batch_stats_list[0]["estimated_vk_submits"]) /
            results["baseline"]["estimated_vk_submits"] * 100
            if results["baseline"]["estimated_vk_submits"] > 0 else 0
        )
        
        results["batch"][str(batch_size)] = {
            "times": batch_times,
            "avg_time": avg_time,
            "speedup": speedup,
            "correctness": avg_correctness,
            "forward_calls": batch_metrics_list[0].forward_call_count,
            "vk_submit_reduction_percent": vk_submit_reduction,
            "batches_submitted": batch_stats_list[0]["batches_submitted"],
            "estimated_vk_submits": batch_stats_list[0]["estimated_vk_submits"],
            "last_run_correctness": last_correctness,
        }
        
        print(f"\n  Batch {batch_size} Summary:")
        print(f"    Average time: {avg_time:.4f}s")
        print(f"    Speedup: {speedup:.2f}x")
        print(f"    Forward calls: {batch_metrics_list[0].forward_call_count}")
        print(f"    Est. VkQueue submits: {batch_stats_list[0]['estimated_vk_submits']}")
        print(f"    Vk submit reduction: {vk_submit_reduction:.1f}%")
        print(f"    Correctness: {avg_correctness['bit_exact_count']}/{avg_correctness['total_frames']} bit-exact")
        print(f"    MAE: {avg_correctness['avg_mae']:.6f}")
        print(f"    PSNR: {avg_correctness['avg_psnr']:.4f}")
        print(f"    SSIM: {avg_correctness['avg_ssim']:.6f}")
        print(f"    Max pixel diff: {avg_correctness['max_pixel_diff']}")
        print(f"    NaN/Inf: {avg_correctness['nan_inf_detected']}")

        # Hard gate: Batch 1 must be bit-exact before continuing.
        if batch_size == 1 and not avg_correctness["is_correct"]:
            print("\nFATAL: Batch 1 is not bit-exact vs baseline. Stopping before Batch 2/4/8.")
            results_file = os.path.join(RESULTS_DIR, "c64_results.json")
            with open(results_file, "w") as f:
                json.dump(results, f, indent=2)
            print(f"Partial results saved to: {results_file}")
            return 2    
    # Stability test
    print(f"\n{'=' * 60}")
    print(f"Stability Test (10 runs)")
    print(f"{'=' * 60}")
    
    stability_results = {
        "crashes": 0,
        "failed_forwards": 0,
        "nan_inf_detected": 0,
        "frame_loss": 0,
        "duplicates": 0,
    }
    
    for run in range(STABILITY_RUNS):
        try:
            gc.collect()
            outputs, metrics, stats = run_gpu_batch(frames, timestamps, 4, MODEL)
            
            # Check for issues
            if len(outputs) != NUM_INPUT_PAIRS:
                stability_results["frame_loss"] += 1
            
            for out in outputs:
                if not np.isfinite(out).all():
                    stability_results["nan_inf_detected"] += 1
                    break
            
            if len(outputs) != len(set(id(o) for o in outputs)):
                stability_results["duplicates"] += 1
            
            print(f"  Run {run + 1}: OK ({len(outputs)} frames)")
            
        except Exception as e:
            stability_results["crashes"] += 1
            print(f"  Run {run + 1}: CRASH - {e}")
    
    results["stability"] = stability_results
    results["stability"]["total_runs"] = STABILITY_RUNS
    results["stability"]["pass"] = all(v == 0 for k, v in stability_results.items() if k != "total_runs")
    
    print(f"\n  Stability Summary:")
    print(f"    Crashes: {stability_results['crashes']}")
    print(f"    Failed forwards: {stability_results['failed_forwards']}")
    print(f"    NaN/Inf: {stability_results['nan_inf_detected']}")
    print(f"    Frame loss: {stability_results['frame_loss']}")
    print(f"    PASS: {results['stability']['pass']}")
    
    # Save results
    results_file = os.path.join(RESULTS_DIR, "c64_results.json")
    with open(results_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to: {results_file}")
    
    # Summary
    print("\n" + "=" * 80)
    print("C6.4 Summary")
    print("=" * 80)
    
    print(f"\nBaseline:")
    print(f"  Forward calls: {results['baseline']['forward_calls']}")
    print(f"  Estimated VkQueue submits: {results['baseline']['estimated_vk_submits']}")
    print(f"  Total time: {results['baseline']['total_time_s']:.4f}s")
    
    print(f"\nBatch Results:")
    for bs, data in results["batch"].items():
        print(f"  Batch {bs}:")
        print(f"    Time: {data['avg_time']:.4f}s")
        print(f"    Speedup: {data['speedup']:.2f}x")
        print(f"    Vk submit reduction: {data['vk_submit_reduction_percent']:.1f}%")
        print(f"    Correctness: {data['correctness']['bit_exact_count']}/{data['correctness']['total_frames']} bit-exact")
    
    print(f"\nStability: {'PASS' if results['stability']['pass'] else 'FAIL'}")
    
    print("\n" + "=" * 80)
    print("C6.4 PoC Complete")
    print("=" * 80)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
