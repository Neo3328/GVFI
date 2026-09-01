"""
C6.2 — Native RIFE Memory I/O Optimization PoC

Phase: C6.2
Date: 2026-08-11
Objective: Verify if pre-loading all frames into RAM and batch writing outputs
          can significantly reduce Native VideoWorker total time.

Constraints:
- Independent PoC only; no production code changes.
- backend_mode default stays 'cli'; no CLI backend modification.
- No GUI, FFmpeg, scene detection, FrameQueue, NVENC, Real-ESRGAN, RealCUGAN changes.
- No ncnn/Warp/shader/ABI changes unless proven necessary.
- No Git commits until stop condition is met.
- C5.3 Native→CLI fallback must remain unchanged.

This script compares two paths on the same input PNG frames:
  A. Baseline (current process_directory):
     PNG → cv2.imread per frame → ctypes/native forward → cv2.imwrite per frame
  B. Memory I/O PoC:
     PNG → preload ALL frames to RAM → ctypes/native forward (per-frame)
         → RAM output buffer → batch cv2.imwrite ALL outputs

Output: D:\\GVFI-deps\\native-video-worker-ab\\c62_memory_io\\
"""

from __future__ import annotations

import gc
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

# Paths
ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
sys.path.insert(0, ENGINE_ROOT)

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
MODEL = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c62_memory_io"
CLI_EXE = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-ncnn-vulkan.exe")

# Test configuration
INTERP_FPS = 48
EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
EXPECTED_SRC_FRAMES = 24
EXPECTED_OUT_FRAMES = 47  # floor((24-1) * 48/24) + 1 = 47
BENCHMARK_RUNS = 3
STABILITY_RUNS = 10

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
import numpy as np
import cv2

from gvfi_runtime.frame_pipeline import Frame
from gvfi_runtime.native_library import (
    NativeLibraryLoader, NativeResult, NativeLibraryError,
)


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def decode_video_to_frames(video_path: str, output_dir: str) -> list[Path]:
    """Decode video to PNG frames using OpenCV VideoCapture; returns sorted list of PNG paths."""
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"cv2.VideoCapture failed to open: {video_path}")
    index = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame is None or frame.ndim != 3:
            continue
        name = os.path.join(output_dir, f"{index + 1:08d}.png")
        cv2.imwrite(name, frame)
        index += 1
    cap.release()
    return sorted(Path(output_dir).glob("*.png"))


def run_cli(input_dir: str, output_dir: str, target_frames: int) -> float:
    """Run CLI as reference; returns wall-clock time."""
    os.makedirs(output_dir, exist_ok=True)
    t0 = time.perf_counter()
    subprocess.run([
        CLI_EXE, "-i", input_dir, "-o", output_dir,
        "-n", str(target_frames), "-m", MODEL,
        "-f", "%08d.png", "-j", "2:4:4", "-g", "0",
    ], capture_output=True, timeout=300)
    return time.perf_counter() - t0


# ---------------------------------------------------------------------------
# Timing accumulator
# ---------------------------------------------------------------------------

class TimingAccumulator:
    def __init__(self) -> None:
        self._data: dict[str, float] = {}
        self._counts: dict[str, int] = {}

    def add(self, name: str, value: float, count: int = 1) -> None:
        self._data[name] = self._data.get(name, 0.0) + value
        self._counts[name] = self._counts.get(name, 0) + count

    def get(self, name: str) -> float:
        return self._data.get(name, 0.0)

    def per_item(self, name: str) -> float:
        c = self._counts.get(name, 0)
        return self._data.get(name, 0.0) / c if c > 0 else 0.0

    def count(self, name: str) -> int:
        return self._counts.get(name, 0)

    def as_dict(self) -> dict:
        return {k: float(v) for k, v in self._data.items()}


# ---------------------------------------------------------------------------
# Baseline path — mirrors current NativeInterpolatorBackend.process_directory
# ---------------------------------------------------------------------------

def run_baseline(input_frames: list[Path], output_dir: str, target_frames: int) -> tuple[TimingAccumulator, int]:
    """
    Replicates current NativeInterpolatorBackend.process_directory exactly:
      - cv2.imread per frame
      - ctypes/native forward (per frame)
      - cv2.imwrite per frame
    Returns (timings, output_count).
    """
    t = TimingAccumulator()
    os.makedirs(output_dir, exist_ok=True)

    # --- Initialize native backend ---
    t0_init_start = time.perf_counter()

    lib = NativeLibraryLoader(None)
    t0 = time.perf_counter()
    lib.load()
    t.add("init_load_dll", time.perf_counter() - t0)

    t0 = time.perf_counter()
    lib.create()
    t.add("init_create", time.perf_counter() - t0)

    t0 = time.perf_counter()
    lib.initialize()
    t.add("init_initialize", time.perf_counter() - t0)

    # Model load
    param_path = os.path.join(MODEL, "flownet.param")
    bin_path = os.path.join(MODEL, "flownet.bin")
    t0 = time.perf_counter()
    lib.load_model(param_path, bin_path)
    t.add("model_load", time.perf_counter() - t0)

    # GPU warmup
    t0 = time.perf_counter()
    dummy = Frame(bytes(EXPECTED_WIDTH * EXPECTED_HEIGHT * 3),
                  EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", 0, 0.0)
    lib.process(dummy, dummy, 0.5)
    t.add("gpu_warmup", time.perf_counter() - t0)

    t.add("init_total", time.perf_counter() - t0_init_start)

    # --- Per-frame processing ---
    input_count = len(input_frames)
    output_count = int(target_frames)
    scale = input_count / output_count
    forward_count = 0

    for out_idx in range(output_count):
        if input_count == 1:
            left = right = 0
            fraction = 0.0
        else:
            position = out_idx * scale
            left = int(math.floor(position))
            fraction = position - left
            if left >= input_count - 1:
                left = input_count - 2
                fraction = 1.0
            right = left + 1

        # --- Frame read ---
        t0_read = time.perf_counter()
        img0 = cv2.imread(str(input_frames[left]), cv2.IMREAD_COLOR)
        if right != left:
            img1 = cv2.imread(str(input_frames[right]), cv2.IMREAD_COLOR)
        else:
            img1 = img0
        t.add("frame_read", time.perf_counter() - t0_read)

        if right == left or fraction <= 1e-12:
            output_image = img0
        else:
            # --- ctypes conversion + forward ---
            t0_conv = time.perf_counter()
            f0 = Frame(bytes(img0), img0.shape[1], img0.shape[0], "bgr24", left, float(left))
            f1 = Frame(bytes(img1), img1.shape[1], img1.shape[0], "bgr24", right, float(right))

            # Breakdown of ctypes conversion
            t0_tb = time.perf_counter()
            _ = memoryview(f0.frame_data).cast("B").tobytes()
            t.add("ctypes_tobytes", time.perf_counter() - t0_tb)

            t0_tb = time.perf_counter()
            _ = memoryview(f1.frame_data).cast("B").tobytes()
            t.add("ctypes_tobytes", time.perf_counter() - t0_tb)

            t.add("frame_convert_total", time.perf_counter() - t0_conv)

            # --- GPU forward ---
            t0_fwd = time.perf_counter()
            result, output_frame = lib.process(f0, f1, fraction)
            t.add("gpu_forward", time.perf_counter() - t0_fwd)
            t.add("ctypes_call_total", time.perf_counter() - t0_conv)
            forward_count += 1

            if result != NativeResult.SUCCESS:
                raise RuntimeError(f"Forward failed: {result}")
            output_image = np.frombuffer(bytes(output_frame.frame_data), dtype=np.uint8) \
                .reshape(EXPECTED_HEIGHT, EXPECTED_WIDTH, 3)

        # --- Frame write ---
        t0_write = time.perf_counter()
        cv2.imwrite(os.path.join(output_dir, f"{out_idx + 1:08d}.png"), output_image)
        t.add("frame_write", time.perf_counter() - t0_write)

    # Cleanup
    lib.release()
    lib.destroy()

    t.add("forward_count", float(forward_count), forward_count)
    return t, output_count


# ---------------------------------------------------------------------------
# Memory I/O PoC path
# ---------------------------------------------------------------------------

def run_memory_io(input_frames: list[Path], output_dir: str, target_frames: int) -> tuple[TimingAccumulator, int]:
    """
    Memory I/O optimization:
      1. Pre-load ALL source frames into RAM (numpy arrays)
      2. Per-frame ctypes/native forward (no GPU batching — that's C6.3)
      3. Buffer ALL outputs in RAM
      4. Batch write ALL PNGs at end

    Does NOT change: RGB/BGR, 1/255, FP16, padding, crop, RGB8 contract.
    """
    t = TimingAccumulator()
    os.makedirs(output_dir, exist_ok=True)

    # --- Initialize native backend ---
    t0_init_start = time.perf_counter()

    lib = NativeLibraryLoader(None)
    t0 = time.perf_counter()
    lib.load()
    t.add("init_load_dll", time.perf_counter() - t0)

    t0 = time.perf_counter()
    lib.create()
    t.add("init_create", time.perf_counter() - t0)

    t0 = time.perf_counter()
    lib.initialize()
    t.add("init_initialize", time.perf_counter() - t0)

    # Model load
    param_path = os.path.join(MODEL, "flownet.param")
    bin_path = os.path.join(MODEL, "flownet.bin")
    t0 = time.perf_counter()
    lib.load_model(param_path, bin_path)
    t.add("model_load", time.perf_counter() - t0)

    # GPU warmup
    t0 = time.perf_counter()
    dummy = Frame(bytes(EXPECTED_WIDTH * EXPECTED_HEIGHT * 3),
                  EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", 0, 0.0)
    lib.process(dummy, dummy, 0.5)
    t.add("gpu_warmup", time.perf_counter() - t0)

    t.add("init_total", time.perf_counter() - t0_init_start)

    # --- PHASE 1: Pre-load ALL source frames into RAM ---
    t0_preload = time.perf_counter()
    source_frames: list[np.ndarray] = []
    for frame_path in input_frames:
        img = cv2.imread(str(frame_path), cv2.IMREAD_COLOR)
        if img is None or img.ndim != 3 or img.shape[2] != 3:
            raise RuntimeError(f"Failed to read: {frame_path}")
        source_frames.append(img)
    t.add("input_preload", time.perf_counter() - t0_preload)
    t.add("input_preload_per_frame", (time.perf_counter() - t0_preload) / len(source_frames))

    # --- PHASE 2: Per-frame forward (ctypes unchanged, only I/O optimized) ---
    input_count = len(source_frames)
    output_count = int(target_frames)
    scale = input_count / output_count
    forward_count = 0

    # Pre-allocate output buffer in RAM (list of numpy arrays)
    output_frames: list[np.ndarray] = []

    for out_idx in range(output_count):
        if input_count == 1:
            left = right = 0
            fraction = 0.0
        else:
            position = out_idx * scale
            left = int(math.floor(position))
            fraction = position - left
            if left >= input_count - 1:
                left = input_count - 2
                fraction = 1.0
            right = left + 1

        img0 = source_frames[left]
        if right == left or fraction <= 1e-12:
            output_image = img0.copy()
        else:
            img1 = source_frames[right]

            # ctypes conversion (unchanged from baseline)
            t0_conv = time.perf_counter()
            f0 = Frame(bytes(img0), img0.shape[1], img0.shape[0], "bgr24", left, float(left))
            f1 = Frame(bytes(img1), img1.shape[1], img1.shape[0], "bgr24", right, float(right))

            t0_tb = time.perf_counter()
            _ = memoryview(f0.frame_data).cast("B").tobytes()
            t.add("ctypes_tobytes", time.perf_counter() - t0_tb)

            t0_tb = time.perf_counter()
            _ = memoryview(f1.frame_data).cast("B").tobytes()
            t.add("ctypes_tobytes", time.perf_counter() - t0_tb)

            t.add("frame_convert_total", time.perf_counter() - t0_conv)

            # GPU forward (unchanged)
            t0_fwd = time.perf_counter()
            result, output_frame = lib.process(f0, f1, fraction)
            t.add("gpu_forward", time.perf_counter() - t0_fwd)
            t.add("ctypes_call_total", time.perf_counter() - t0_conv)
            forward_count += 1

            if result != NativeResult.SUCCESS:
                raise RuntimeError(f"Forward failed: {result}")
            output_image = np.frombuffer(bytes(output_frame.frame_data), dtype=np.uint8) \
                .reshape(EXPECTED_HEIGHT, EXPECTED_WIDTH, 3)

        # Buffer output in RAM (no disk write yet)
        output_frames.append(output_image.copy())

    t.add("forward_count", float(forward_count), forward_count)

    # --- PHASE 3: Batch write all outputs ---
    t0_batch_write = time.perf_counter()
    for out_idx, frame in enumerate(output_frames):
        cv2.imwrite(os.path.join(output_dir, f"{out_idx + 1:08d}.png"), frame)
    t.add("output_batch_write", time.perf_counter() - t0_batch_write)

    # Cleanup
    lib.release()
    lib.destroy()

    return t, output_count


# ---------------------------------------------------------------------------
# Correctness comparison
# ---------------------------------------------------------------------------

def compute_metrics(baseline_dir: str, memory_dir: str, output_count: int) -> dict:
    """Compute pixel-level comparison between baseline and memory I/O outputs."""
    metrics = {}
    all_mae, all_psnr, all_ssim, all_max_diff = [], [], [], []
    bit_exact_count = 0

    for i in range(1, output_count + 1):
        name = f"{i:08d}.png"
        b_path = os.path.join(baseline_dir, name)
        m_path = os.path.join(memory_dir, name)

        if not os.path.exists(b_path) or not os.path.exists(m_path):
            continue

        b = cv2.imread(b_path, cv2.IMREAD_COLOR).astype(np.float32)
        m = cv2.imread(m_path, cv2.IMREAD_COLOR).astype(np.float32)

        if b.shape != m.shape:
            metrics[name] = {"error": "shape_mismatch", "baseline": b.shape, "memory": m.shape}
            continue

        diff = np.abs(b - m)
        mae = float(np.mean(diff))
        max_diff = int(np.max(diff))

        # PSNR
        mse = float(np.mean(diff ** 2))
        psnr = 40.0 if mse < 1e-10 else 20.0 * math.log10(255.0 / math.sqrt(mse))

        # SSIM (simplified per-channel mean)
        mu_b, mu_m = np.mean(b), np.mean(m)
        sigma_b2, sigma_m2 = np.var(b), np.var(m)
        sigma_bm = np.mean((b - mu_b) * (m - mu_m))
        c1, c2 = 6.5025, 58.5225  # k1=0.01, k2=0.03
        ssim = float(
            (2 * mu_b * mu_m + c1) * (2 * sigma_bm + c2) /
            ((mu_b**2 + mu_m**2 + c1) * (sigma_b2 + sigma_m2 + c2))
        )

        is_bit_exact = (max_diff == 0)
        if is_bit_exact:
            bit_exact_count += 1

        all_mae.append(mae)
        all_psnr.append(psnr)
        all_ssim.append(ssim)
        all_max_diff.append(max_diff)

        metrics[name] = {
            "mae": round(mae, 4),
            "psnr": round(psnr, 2),
            "ssim": round(ssim, 4),
            "max_diff": max_diff,
            "bit_exact": is_bit_exact,
        }

    summary = {
        "frames_compared": len(all_mae),
        "bit_exact_count": bit_exact_count,
        "bit_exact_pct": round(bit_exact_count / len(all_mae) * 100, 1) if all_mae else 0,
        "mean_mae": round(float(np.mean(all_mae)), 4) if all_mae else None,
        "mean_psnr": round(float(np.mean(all_psnr)), 2) if all_psnr else None,
        "mean_ssim": round(float(np.mean(all_ssim)), 4) if all_ssim else None,
        "max_max_diff": int(max(all_max_diff)) if all_max_diff else 0,
        "all_bit_exact": bit_exact_count == len(all_mae),
    }
    return {"summary": summary, "per_frame": metrics}


# ---------------------------------------------------------------------------
# Single run runner
# ---------------------------------------------------------------------------

def run_single_iteration(
    iteration: int,
    raw_dir: Path,
    target_frames: int,
) -> dict:
    """Run one full iteration: baseline + memory_io + CLI."""
    iter_dir = os.path.join(RESULTS_DIR, f"iter_{iteration}")
    baseline_dir = os.path.join(iter_dir, "baseline_output")
    memory_dir = os.path.join(iter_dir, "memory_output")
    cli_dir = os.path.join(iter_dir, "cli_output")

    # Use same raw frames for both paths (decode once)
    if not list(Path(raw_dir).glob("*.png")):
        input_frames = decode_video_to_frames(TEST_VIDEO, str(raw_dir))
    else:
        input_frames = sorted(Path(raw_dir).glob("*.png"))

    print(f"\n  Iter {iteration}: {len(input_frames)} source frames → {target_frames} outputs")

    # --- Baseline ---
    print(f"  → Baseline (disk I/O)...")
    t0 = time.perf_counter()
    baseline_t, baseline_count = run_baseline(input_frames, baseline_dir, target_frames)
    baseline_total = time.perf_counter() - t0

    # --- Memory I/O ---
    print(f"  → Memory I/O PoC (RAM preload + batch write)...")
    t0 = time.perf_counter()
    memory_t, memory_count = run_memory_io(input_frames, memory_dir, target_frames)
    memory_total = time.perf_counter() - t0

    # --- CLI reference ---
    print(f"  → CLI reference...")
    cli_time = run_cli(str(raw_dir), cli_dir, target_frames)

    # --- Correctness ---
    print(f"  → Correctness comparison...")
    metrics = compute_metrics(baseline_dir, memory_dir, target_frames)

    return {
        "iteration": iteration,
        "source_frames": len(input_frames),
        "target_frames": target_frames,
        "baseline_output_frames": baseline_count,
        "memory_output_frames": memory_count,
        "cli_output_frames": len(list(Path(cli_dir).glob("*.png"))) if os.path.exists(cli_dir) else 0,
        "baseline_total_s": round(baseline_total, 4),
        "memory_total_s": round(memory_total, 4),
        "cli_total_s": round(cli_time, 4),
        "baseline_speedup_vs_cli": round(cli_time / baseline_total, 4),
        "memory_speedup_vs_cli": round(cli_time / memory_total, 4),
        "memory_speedup_vs_baseline": round(baseline_total / memory_total, 4),
        "baseline_timings": baseline_t.as_dict(),
        "memory_timings": memory_t.as_dict(),
        "correctness": metrics["summary"],
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    print("=" * 70)
    print("C6.2 — Native RIFE Memory I/O Optimization PoC")
    print("=" * 70)

    # Verify prerequisites
    print(f"\n[CHECK] Test video: {TEST_VIDEO}")
    print(f"[CHECK] Model: {MODEL}")
    print(f"[CHECK] CLI exe: {CLI_EXE}")
    for path, label in [(TEST_VIDEO, "video"), (MODEL, "model"), (CLI_EXE, "CLI exe")]:
        if not os.path.exists(path):
            print(f"[FATAL] {label} not found: {path}")
            return 1

    # Verify test video hash
    with open(TEST_VIDEO, "rb") as f:
        actual_sha = hashlib.sha256(f.read()).hexdigest().upper()
    expected_sha = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001".upper()
    if actual_sha != expected_sha:
        print(f"\n[WARN] Test video SHA-256 mismatch!")
        print(f"  Expected: {expected_sha}")
        print(f"  Actual:   {actual_sha}")

    # Setup
    shutil.rmtree(RESULTS_DIR, ignore_errors=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    # Shared raw frames directory
    raw_dir = Path(os.path.join(RESULTS_DIR, "raw_frames"))
    os.makedirs(raw_dir, exist_ok=True)
    input_frames = decode_video_to_frames(TEST_VIDEO, str(raw_dir))
    print(f"\n[INFO] Decoded {len(input_frames)} frames to {raw_dir}")

    # ---------------------------------------------------------------------------
    # Phase 1: Benchmark runs (baseline vs memory I/O vs CLI)
    # ---------------------------------------------------------------------------
    print(f"\n{'=' * 60}")
    print(f"PHASE 1: BENCHMARK ({BENCHMARK_RUNS} iterations)")
    print(f"{'=' * 60}")

    benchmark_results = []
    for i in range(1, BENCHMARK_RUNS + 1):
        try:
            result = run_single_iteration(i, raw_dir, EXPECTED_OUT_FRAMES)
            benchmark_results.append(result)

            print(f"\n  Iter {i} summary:")
            print(f"    Baseline:  {result['baseline_total_s']:.3f}s "
                  f"(vs CLI: {result['baseline_speedup_vs_cli']:.2f}x)")
            print(f"    Memory I/O: {result['memory_total_s']:.3f}s "
                  f"(vs CLI: {result['memory_speedup_vs_cli']:.2f}x)")
            print(f"    Memory vs Baseline speedup: {result['memory_speedup_vs_baseline']:.2f}x")
            corr = result["correctness"]
            print(f"    Correctness: bit-exact={corr['bit_exact_count']}/{corr['frames_compared']} "
                  f"({corr['bit_exact_pct']}%), MAE={corr['mean_mae']}, PSNR={corr['mean_psnr']} dB")

        except Exception as e:
            print(f"\n[ERROR] Iteration {i} failed: {e}")
            import traceback
            traceback.print_exc()

    if not benchmark_results:
        print("\n[FATAL] No benchmark results collected!")
        return 1

    # ---------------------------------------------------------------------------
    # Phase 2: 10-run stability test (memory I/O only)
    # ---------------------------------------------------------------------------
    print(f"\n{'=' * 60}")
    print(f"PHASE 2: STABILITY TEST ({STABILITY_RUNS} iterations, memory I/O)")
    print(f"{'=' * 60}")

    stability_results = []
    stability_ok = True
    for i in range(1, STABILITY_RUNS + 1):
        iter_dir = os.path.join(RESULTS_DIR, f"stability_{i}")
        memory_dir = os.path.join(iter_dir, "memory_output")
        try:
            t0 = time.perf_counter()
            t, count = run_memory_io(input_frames, memory_dir, EXPECTED_OUT_FRAMES)
            elapsed = time.perf_counter() - t0
            success = (count == EXPECTED_OUT_FRAMES)
            nan_detected = False  # Native produces valid output checked in run_memory_io
            stability_results.append({
                "iteration": i,
                "success": success,
                "output_frames": count,
                "elapsed_s": round(elapsed, 4),
                "nan_detected": nan_detected,
            })
            status = "OK" if success else "FAIL"
            print(f"  Stability {i:2d}/{STABILITY_RUNS}: {status} — {elapsed:.3f}s — {count} frames")
            if not success:
                stability_ok = False
        except Exception as e:
            stability_results.append({
                "iteration": i,
                "success": False,
                "output_frames": 0,
                "elapsed_s": 0.0,
                "error": str(e),
                "nan_detected": False,
            })
            stability_ok = False
            print(f"  Stability {i:2d}/{STABILITY_RUNS}: FAIL — {e}")

    # ---------------------------------------------------------------------------
    # Aggregate results
    # ---------------------------------------------------------------------------
    print(f"\n{'=' * 60}")
    print("AGGREGATE RESULTS")
    print(f"{'=' * 60}")

    # Average benchmark timings
    def avg_field(field: str) -> float:
        vals = [r[field] for r in benchmark_results if field in r]
        return sum(vals) / len(vals) if vals else 0.0

    def avg_nested(path: str) -> float:
        vals = []
        for r in benchmark_results:
            d = r
            for k in path.split("."):
                d = d.get(k, {})
            if isinstance(d, (int, float)):
                vals.append(d)
        return sum(vals) / len(vals) if vals else 0.0

    avg_baseline = avg_field("baseline_total_s")
    avg_memory = avg_field("memory_total_s")
    avg_cli = avg_field("cli_total_s")
    avg_baseline_per_frame = avg_nested("baseline_timings.frame_read") / EXPECTED_OUT_FRAMES
    avg_memory_per_frame = avg_nested("memory_timings.input_preload_per_frame")
    avg_write_baseline = avg_nested("baseline_timings.frame_write") / EXPECTED_OUT_FRAMES
    avg_write_memory = avg_nested("memory_timings.output_batch_write") / EXPECTED_OUT_FRAMES
    avg_forward = avg_nested("memory_timings.gpu_forward") / EXPECTED_OUT_FRAMES
    avg_ctypes = avg_nested("memory_timings.frame_convert_total") / EXPECTED_OUT_FRAMES

    print(f"\n  Timing averages ({BENCHMARK_RUNS} runs):")
    print(f"    {'Method':<20} {'Total (s)':<12} {'vs CLI':<10} {'vs Baseline'}")
    print(f"    {'-'*20} {'-'*12} {'-'*10} {'-'*12}")
    print(f"    {'CLI (reference)':<20} {avg_cli:<12.3f} {'1.00x':<10} {'—'}")
    print(f"    {'Baseline (disk I/O)':<20} {avg_baseline:<12.3f} "
          f"{avg_cli/avg_baseline:<10.2f}x {'1.00x'}")
    print(f"    {'Memory I/O PoC':<20} {avg_memory:<12.3f} "
          f"{avg_cli/avg_memory:<10.2f}x {avg_baseline/avg_memory:<10.2f}x")

    print(f"\n  Per-frame breakdown (memory I/O path):")
    print(f"    {'Phase':<30} {'ms/frame':<12} {'Classification'}")
    print(f"    {'-'*30} {'-'*12} {'-'*15}")
    print(f"    {'Input preload (all frames)':<30} "
          f"{avg_memory_per_frame*1000:<12.3f}  I/O (one-time)")
    print(f"    {'GPU forward (ncnn Vulkan)':<30} "
          f"{avg_forward*1000:<12.3f}  Compute")
    print(f"    {'ctypes conversion':<30} "
          f"{avg_ctypes*1000:<12.3f}  Python")
    print(f"    {'Output batch write (all)':<30} "
          f"{avg_write_memory*1000:<12.3f}  I/O (one-time)")

    # I/O savings
    baseline_io = avg_nested("baseline_timings.frame_read") + avg_nested("baseline_timings.frame_write")
    memory_io = avg_nested("memory_timings.input_preload") + avg_nested("memory_timings.output_batch_write")
    io_savings_pct = (baseline_io - memory_io) / baseline_io * 100 if baseline_io > 0 else 0

    print(f"\n  I/O savings:")
    print(f"    Baseline I/O:     {baseline_io*1000:.1f} ms ({baseline_io/avg_baseline*100:.1f}% of total)")
    print(f"    Memory I/O:       {memory_io*1000:.1f} ms ({memory_io/avg_memory*100:.1f}% of total)")
    print(f"    Savings:          {io_savings_pct:.1f}%")

    # Speedup
    memory_speedup = avg_baseline / avg_memory
    print(f"\n  Speedup:")
    print(f"    Memory I/O vs Baseline: {memory_speedup:.2f}x")
    print(f"    Memory I/O vs CLI:      {avg_cli/avg_memory:.2f}x")
    print(f"    Baseline vs CLI:        {avg_cli/avg_baseline:.2f}x")

    # Correctness
    all_corr = [r["correctness"] for r in benchmark_results]
    total_compared = sum(c["frames_compared"] for c in all_corr)
    total_bit_exact = sum(c["bit_exact_count"] for c in all_corr)
    all_mae = [c["mean_mae"] for c in all_corr if c.get("mean_mae") is not None]
    all_psnr = [c["mean_psnr"] for c in all_corr if c.get("mean_psnr") is not None]
    all_ssim = [c["mean_ssim"] for c in all_corr if c.get("mean_ssim") is not None]

    print(f"\n  Correctness ({BENCHMARK_RUNS} runs, {total_compared} frames):")
    print(f"    Bit-exact: {total_bit_exact}/{total_compared} "
          f"({total_bit_exact/total_compared*100:.1f}%)")
    if all_mae:
        print(f"    Mean MAE:  {sum(all_mae)/len(all_mae):.4f}")
    if all_psnr:
        print(f"    Mean PSNR: {sum(all_psnr)/len(all_psnr):.2f} dB")
    if all_ssim:
        print(f"    Mean SSIM: {sum(all_ssim)/len(all_ssim):.4f}")

    # Stability
    stability_success = sum(1 for r in stability_results if r["success"])
    print(f"\n  Stability ({STABILITY_RUNS} runs):")
    print(f"    Success: {stability_success}/{STABILITY_RUNS}")
    print(f"    {'All OK!' if stability_ok else 'FAILURES DETECTED'}")

    # ---------------------------------------------------------------------------
    # Decision
    # ---------------------------------------------------------------------------
    print(f"\n{'=' * 60}")
    print("DECISION")
    print(f"{'=' * 60}")

    stop_condition_met = memory_speedup < 1.05
    if stop_condition_met:
        print(f"\n  STOP CONDITION MET: Memory I/O speedup = {memory_speedup:.2f}x < 1.05x threshold.")
        print(f"  No significant benefit from memory I/O optimization.")
        recommend = "STOP — do not proceed to C6.3"
    elif memory_speedup >= 1.50:
        print(f"\n  Memory I/O speedup = {memory_speedup:.2f}x >= 1.50x threshold.")
        recommend = "PROCEED to C6.3 (significant benefit)"
    else:
        print(f"\n  Memory I/O speedup = {memory_speedup:.2f}x (moderate benefit, < 1.50x).")
        recommend = "PROCEED to C6.3 only if GPU batching can add significant value"

    print(f"  Recommendation: {recommend}")

    # ---------------------------------------------------------------------------
    # Save results
    # ---------------------------------------------------------------------------
    results_json = {
        "phase": "C6.2",
        "date": "2026-08-11",
        "benchmark_runs": BENCHMARK_RUNS,
        "stability_runs": STABILITY_RUNS,
        "expected_output_frames": EXPECTED_OUT_FRAMES,
        "benchmark_results": benchmark_results,
        "stability_results": stability_results,
        "aggregate": {
            "avg_baseline_total_s": round(avg_baseline, 4),
            "avg_memory_total_s": round(avg_memory, 4),
            "avg_cli_total_s": round(avg_cli, 4),
            "memory_speedup_vs_baseline": round(memory_speedup, 4),
            "io_savings_pct": round(io_savings_pct, 2),
            "correctness": {
                "total_frames_compared": total_compared,
                "total_bit_exact": total_bit_exact,
                "bit_exact_pct": round(total_bit_exact / total_compared * 100, 2),
                "mean_mae": round(sum(all_mae) / len(all_mae), 4) if all_mae else None,
                "mean_psnr_db": round(sum(all_psnr) / len(all_psnr), 2) if all_psnr else None,
                "mean_ssim": round(sum(all_ssim) / len(all_ssim), 4) if all_ssim else None,
            },
            "stability": {
                "runs": STABILITY_RUNS,
                "success": stability_success,
                "all_passed": stability_ok,
            },
        },
        "recommendation": recommend,
    }

    results_file = os.path.join(RESULTS_DIR, "c62_results.json")
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results_json, f, indent=2, ensure_ascii=False)
    print(f"\n[INFO] Results saved to: {results_file}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
