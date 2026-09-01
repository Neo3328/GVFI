"""
C6.1 — Native Backend Performance Profiling

Phase: C6.1
Date: 2026-08-11
Objective: Profile Native backend to identify performance bottlenecks

This script profiles the Native backend without modifying production code.
It runs 3 test iterations and reports timing breakdown for each phase.
"""

from __future__ import annotations

import gc
import hashlib
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
MODEL = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE\rife-ncnn-vulkan-20221029-windows\rife-v4.6"
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c61_profile"

INTERP_FPS = 48
EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
EXPECTED_SRC_FRAMES = 24
EXPECTED_OUT_FRAMES = 47  # floor((24-1) * 48/24) + 1 = 47

# Cleanup
shutil.rmtree(RESULTS_DIR, ignore_errors=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

print("=" * 70)
print("C6.1 — Native Backend Performance Profiling")
print("=" * 70)


# =============================================================================
# Profiling Instrumented Native Backend
# =============================================================================

class ProfilingNativeBackend:
    """Native backend with detailed timing instrumentation."""

    def __init__(self, model_path: str):
        import ctypes
        import hashlib as _hashlib
        from gvfi_runtime.native_library import (
            NativeLibraryLoader, NativeResult, NativeLibraryError,
            _PIXEL_FORMATS
        )
        from gvfi_runtime.frame_pipeline import Frame

        self._Frame = Frame
        self._NativeLibraryLoader = NativeLibraryLoader
        self._NativeResult = NativeResult
        self._NativeLibraryError = NativeLibraryError
        self._PIXEL_FORMATS = _PIXEL_FORMATS

        # Timing accumulators
        self.timings = {
            "init_load_dll": 0.0,
            "init_create": 0.0,
            "init_initialize": 0.0,
            "model_hash_check": 0.0,
            "model_load": 0.0,
            "gpu_warmup": 0.0,
            "frame_read": 0.0,
            "frame_convert_memoryview": 0.0,
            "frame_convert_tobytes": 0.0,
            "frame_convert_create_buffer": 0.0,
            "frame_convert_total": 0.0,
            "ctypes_call_setup": 0.0,
            "ctypes_gvfi_process": 0.0,
            "ctypes_call_total": 0.0,
            "gpu_forward": 0.0,
            "frame_create_output": 0.0,
            "frame_write": 0.0,
            "total_forward": 0.0,
            "forward_count": 0,
        }

        self._library = self._NativeLibraryLoader(None)
        self.model_path = model_path
        self.initialized = False
        self.model_loaded = False

    def initialize(self) -> None:
        t0 = time.perf_counter()
        self._library.load()
        self.timings["init_load_dll"] = time.perf_counter() - t0

        t0 = time.perf_counter()
        self._library.create()
        self.timings["init_create"] = time.perf_counter() - t0

        t0 = time.perf_counter()
        self._library.initialize()
        self.timings["init_initialize"] = time.perf_counter() - t0

        self.initialized = True

    def load_model(self) -> None:
        import hashlib
        model_path = self.model_path
        param_path = os.path.join(model_path, "flownet.param")
        bin_path = os.path.join(model_path, "flownet.bin")

        # Hash check timing
        t0 = time.perf_counter()
        for path in (param_path, bin_path):
            with open(path, "rb") as f:
                hashlib.sha256(f.read()).hexdigest()
        self.timings["model_hash_check"] = time.perf_counter() - t0

        # Model load timing
        t0 = time.perf_counter()
        result = self._library.load_model(param_path, bin_path)
        self.timings["model_load"] = time.perf_counter() - t0

        if result != self._NativeResult.SUCCESS:
            raise RuntimeError(f"Model load failed: {result}")

        self.model_loaded = True

        # GPU warmup - run one dummy forward
        t0 = time.perf_counter()
        dummy_frame = self._Frame(
            bytes(EXPECTED_WIDTH * EXPECTED_HEIGHT * 3),
            EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", 0, 0.0
        )
        self._library.process(dummy_frame, dummy_frame, 0.5)
        self.timings["gpu_warmup"] = time.perf_counter() - t0

    def process_single(self, frame0_data, frame1_data, width, height, timestamp) -> bytes:
        """Process a single frame pair with detailed timing."""
        import ctypes
        import numpy as np

        self.timings["forward_count"] += 1

        # Frame conversion timing
        t_conv_start = time.perf_counter()

        # Create Frame objects
        f0 = self._Frame(frame0_data, width, height, "bgr24", 0, 0.0)
        f1 = self._Frame(frame1_data, width, height, "bgr24", 1, 1.0)

        # Convert frame timing breakdown
        for frame in [f0, f1]:
            # memoryview cast
            t0 = time.perf_counter()
            data = memoryview(frame.frame_data).cast("B").tobytes()
            self.timings["frame_convert_tobytes"] += time.perf_counter() - t0

            # create_string_buffer
            t0 = time.perf_counter()
            buffer = ctypes.create_string_buffer(data)
            self.timings["frame_convert_create_buffer"] += time.perf_counter() - t0

        self.timings["frame_convert_total"] += time.perf_counter() - t_conv_start

        # ctypes call timing
        t_ctypes_start = time.perf_counter()

        result, output = self._library.process(f0, f1, timestamp)

        self.timings["ctypes_gvfi_process"] += time.perf_counter() - t_ctypes_start

        if result != self._NativeResult.SUCCESS:
            raise RuntimeError(f"Process failed: {result}")

        self.timings["total_forward"] += time.perf_counter() - t_conv_start

        return bytes(output.frame_data)

    def release(self) -> None:
        self._library.release()
        self._library.destroy()


def run_native_profile(input_frames_dir: str, output_dir: str, target_frames: int) -> dict:
    """Run profiling on Native backend."""
    import cv2
    import numpy as np
    from gvfi_runtime.frame_pipeline import Frame

    os.makedirs(output_dir, exist_ok=True)

    # Create profiling backend
    backend = ProfilingNativeBackend(MODEL)
    backend.initialize()
    backend.load_model()

    paths = sorted(Path(input_frames_dir).glob("*.png"))
    input_count = len(paths)
    output_count = int(target_frames)
    scale = input_count / output_count

    # Process each output frame
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

        # Read frames with timing
        t_read = time.perf_counter()
        img0 = cv2.imread(str(paths[left]), cv2.IMREAD_COLOR)
        img1 = cv2.imread(str(paths[right]), cv2.IMREAD_COLOR) if right != left else img0
        backend.timings["frame_read"] += time.perf_counter() - t_read

        if right == left or fraction <= 1e-12:
            output_image = img0
        else:
            # Process with profiling
            output_data = backend.process_single(
                bytes(img0), bytes(img1),
                img0.shape[1], img0.shape[0], fraction
            )
            output_image = np.frombuffer(output_data, dtype=np.uint8).reshape(
                img0.shape[0], img0.shape[1], 3
            )

        # Write with timing
        t_write = time.perf_counter()
        dest = os.path.join(output_dir, f"{out_idx + 1:08d}.png")
        cv2.imwrite(dest, output_image)
        backend.timings["frame_write"] += time.perf_counter() - t_write

    backend.release()
    return backend.timings


def run_cli_profile(input_frames_dir: str, output_dir: str, target_frames: int) -> dict:
    """Run CLI backend for comparison."""
    os.makedirs(output_dir, exist_ok=True)

    exe = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-ncnn-vulkan.exe")

    t0 = time.perf_counter()
    result = subprocess.run([
        exe, "-i", input_frames_dir, "-o", output_dir,
        "-n", str(target_frames), "-m", MODEL, "-f", "%08d.png",
        "-j", "2:4:4", "-g", "0"
    ], capture_output=True, text=True, timeout=300)
    total_time = time.perf_counter() - t0

    return {
        "total_time": total_time,
        "returncode": result.returncode,
        "stderr": result.stderr[-200:] if result.stderr else "",
    }


def decode_video_to_frames(video_path: str, output_dir: str) -> int:
    """Decode video to PNG frames."""
    os.makedirs(output_dir, exist_ok=True)
    result = subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vsync", "0", "-qscale:v", "1",
        os.path.join(output_dir, "%08d.png")
    ], capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        raise RuntimeError(f"Decode failed: {result.stderr[-300:]}")

    return len(list(Path(output_dir).glob("*.png")))


def probe_video(path: str) -> dict:
    """Probe video metadata."""
    result = subprocess.run([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,nb_frames",
        "-of", "json", path
    ], capture_output=True, text=True, timeout=30)

    import json
    data = json.loads(result.stdout)
    stream = data.get("streams", [{}])[0]
    return {
        "width": stream.get("width", 0),
        "height": stream.get("height", 0),
        "frames": stream.get("nb_frames", "N/A"),
    }


# =============================================================================
# Main profiling run
# =============================================================================

def run_profile_iteration(run_num: int) -> dict:
    """Run a single profiling iteration."""
    print(f"\n{'=' * 60}")
    print(f"ITERATION {run_num}/3")
    print("=" * 60)

    iteration_dir = os.path.join(RESULTS_DIR, f"run_{run_num}")
    raw_dir = os.path.join(iteration_dir, "raw_frames")
    native_out = os.path.join(iteration_dir, "native_output")
    cli_out = os.path.join(iteration_dir, "cli_output")

    shutil.rmtree(iteration_dir, ignore_errors=True)
    os.makedirs(iteration_dir, exist_ok=True)

    # Decode video
    print("  Decoding video...")
    t_decode = time.perf_counter()
    src_frames = decode_video_to_frames(TEST_VIDEO, raw_dir)
    decode_time = time.perf_counter() - t_decode
    print(f"  Decoded {src_frames} frames in {decode_time:.3f}s")

    # Run Native backend
    print("  Running Native backend...")
    t_native_start = time.perf_counter()
    native_timings = run_native_profile(raw_dir, native_out, EXPECTED_OUT_FRAMES)
    native_total = time.perf_counter() - t_native_start
    print(f"  Native total: {native_total:.3f}s")

    # Run CLI backend (for comparison)
    print("  Running CLI backend...")
    t_cli_start = time.perf_counter()
    cli_result = run_cli_profile(raw_dir, cli_out, EXPECTED_OUT_FRAMES)
    cli_total = time.perf_counter() - t_cli_start
    print(f"  CLI total: {cli_total:.3f}s")

    # Count output frames
    native_frames = len(list(Path(native_out).glob("*.png")))
    cli_frames = len(list(Path(cli_out).glob("*.png")))

    return {
        "run": run_num,
        "source_frames": src_frames,
        "target_frames": EXPECTED_OUT_FRAMES,
        "native_output_frames": native_frames,
        "cli_output_frames": cli_frames,
        "decode_time_s": decode_time,
        "native_total_s": native_total,
        "cli_total_s": cli_total,
        "native_timings": native_timings,
        "cli_result": cli_result,
        "speedup": cli_total / native_total if native_total > 0 else 0,
    }


def main():
    print("\n[INFO] Test video:", TEST_VIDEO)
    print("[INFO] Model:", MODEL)
    print("[INFO] Expected: {} src frames -> {} output frames".format(
        EXPECTED_SRC_FRAMES, EXPECTED_OUT_FRAMES))

    # Verify test video
    with open(TEST_VIDEO, "rb") as f:
        actual_sha = hashlib.sha256(f.read()).hexdigest().upper()
    expected_sha = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001".upper()
    if actual_sha != expected_sha:
        print(f"\n[WARN] Test video SHA-256 mismatch!")
        print(f"  Expected: {expected_sha}")
        print(f"  Actual:   {actual_sha}")

    # Run 3 iterations
    results = []
    for i in range(1, 4):
        try:
            result = run_profile_iteration(i)
            results.append(result)
        except Exception as e:
            print(f"\n[ERROR] Iteration {i} failed: {e}")
            import traceback
            traceback.print_exc()

    if not results:
        print("\n[FATAL] No results collected!")
        return 1

    # =============================================================================
    # Analyze and report results
    # =============================================================================

    print("\n" + "=" * 70)
    print("DETAILED TIMING ANALYSIS")
    print("=" * 70)

    # Aggregate timings across runs
    timing_keys = [
        "init_load_dll",
        "init_create",
        "init_initialize",
        "model_hash_check",
        "model_load",
        "gpu_warmup",
        "frame_read",
        "frame_convert_tobytes",
        "frame_convert_create_buffer",
        "frame_convert_total",
        "ctypes_gvfi_process",
        "frame_write",
        "total_forward",
    ]

    # Calculate averages
    avg_timings = {}
    for key in timing_keys:
        values = [r["native_timings"].get(key, 0) for r in results]
        avg_timings[key] = sum(values) / len(values)

    # Calculate averages for totals
    avg_decode = sum(r["decode_time_s"] for r in results) / len(results)
    avg_native = sum(r["native_total_s"] for r in results) / len(results)
    avg_cli = sum(r["cli_total_s"] for r in results) / len(results)

    print("\n" + "-" * 60)
    print("INITIALIZATION PHASE")
    print("-" * 60)
    print(f"  {'Phase':<30} {'Avg (ms)':<12} {'% of Total':<12} {'Classification'}")
    print("-" * 60)

    init_total = sum(avg_timings[k] for k in [
        "init_load_dll", "init_create", "init_initialize",
        "model_hash_check", "model_load", "gpu_warmup"
    ])

    for key in ["init_load_dll", "init_create", "init_initialize",
                "model_hash_check", "model_load", "gpu_warmup"]:
        ms = avg_timings[key] * 1000
        pct = (avg_timings[key] / avg_native * 100) if avg_native > 0 else 0
        print(f"  {key:<30} {ms:>10.3f} ms {pct:>10.1f}%")

    print(f"  {'-'*30} {'-'*10} {'-'*10}")
    print(f"  {'Init Total':<30} {init_total*1000:>10.3f} ms {(init_total/avg_native*100):>10.1f}%")

    print("\n" + "-" * 60)
    print("PER-FRAME PROCESSING (average over {} frames)".format(EXPECTED_OUT_FRAMES))
    print("-" * 60)
    print(f"  {'Phase':<30} {'Avg (ms)':<12} {'% of Native':<12} {'Classification'}")
    print("-" * 60)

    forward_total = avg_timings["total_forward"]
    forward_count = results[0]["native_timings"]["forward_count"]
    ms_per_frame = forward_total * 1000 / forward_count if forward_count > 0 else 0

    for key in ["frame_read", "frame_convert_total", "ctypes_gvfi_process", "frame_write"]:
        ms = avg_timings[key] * 1000 / forward_count if forward_count > 0 else 0
        pct = (avg_timings[key] / forward_total * 100) if forward_total > 0 else 0
        classification = {
            "frame_read": "I/O",
            "frame_convert_total": "CPU (Python)",
            "ctypes_gvfi_process": "GPU (ncnn Vulkan)",
            "frame_write": "I/O",
        }[key]
        print(f"  {key:<30} {ms:>10.3f} ms {pct:>10.1f}%  {classification}")

    print(f"  {'-'*30} {'-'*10} {'-'*10}")
    print(f"  {'Forward Total':<30} {ms_per_frame:>10.3f} ms {'100.0%':>10}  (per frame)")
    print(f"  {'Forward Count':<30} {forward_count:>10.0f} frames")

    print("\n" + "-" * 60)
    print("CTYPES CALL BREAKDOWN")
    print("-" * 60)

    ctypes_total = avg_timings["frame_convert_total"] + avg_timings["ctypes_gvfi_process"]
    ms_ctypes = ctypes_total * 1000 / forward_count if forward_count > 0 else 0

    for key in ["frame_convert_tobytes", "frame_convert_create_buffer", "ctypes_gvfi_process"]:
        ms = avg_timings[key] * 1000 / forward_count if forward_count > 0 else 0
        pct = (avg_timings[key] / ctypes_total * 100) if ctypes_total > 0 else 0
        print(f"  {key:<35} {ms:>8.3f} ms/frame {pct:>8.1f}%")

    print(f"  {'-'*35} {'-'*8} {'-'*8}")
    print(f"  {'Total ctypes overhead':<35} {ms_ctypes:>8.3f} ms/frame {'100.0%':>8}")

    print("\n" + "-" * 60)
    print("TOTALS COMPARISON")
    print("-" * 60)
    print(f"  {'Metric':<30} {'Native':<15} {'CLI':<15} {'Ratio'}")
    print("-" * 60)
    print(f"  {'Decode time':<30} {avg_decode*1000:>12.1f} ms {avg_decode*1000:>12.1f} ms  1.0x")
    print(f"  {'Native RIFE total':<30} {avg_native*1000:>12.1f} ms {avg_cli*1000:>12.1f} ms  {avg_native/avg_cli:.2f}x")
    print(f"  {'-'*30} {'-'*15} {'-'*15}")

    # Calculate breakdown percentages
    print("\n" + "-" * 60)
    print("NATIVE TIMING BREAKDOWN (% of total RIFE time)")
    print("-" * 60)

    breakdown = {
        "Initialization": init_total,
        "Frame read (I/O)": avg_timings["frame_read"],
        "Frame convert (Python)": avg_timings["frame_convert_total"],
        "GPU forward (ncnn Vulkan)": avg_timings["ctypes_gvfi_process"],
        "Frame write (I/O)": avg_timings["frame_write"],
    }

    for name, time_val in breakdown.items():
        ms = time_val * 1000
        pct = (time_val / avg_native * 100) if avg_native > 0 else 0
        bar = "█" * int(pct / 2)
        print(f"  {name:<25} {ms:>10.1f} ms {pct:>6.1f}% {bar}")

    print(f"  {'-'*25} {'-'*10} {'-'*6}")
    print(f"  {'TOTAL':<25} {avg_native*1000:>10.1f} ms {'100.0%':>6}")

    # Individual run results
    print("\n" + "-" * 60)
    print("INDIVIDUAL RUN RESULTS")
    print("-" * 60)
    print(f"  {'Run':<6} {'Native (s)':<12} {'CLI (s)':<12} {'Speedup':<10} {'Native Frames':<15} {'CLI Frames'}")
    print("-" * 60)
    for r in results:
        print(f"  {r['run']:<6} {r['native_total_s']:>10.2f}s {r['cli_total_s']:>10.2f}s {r['speedup']:>8.2f}x "
              f"{r['native_output_frames']:>13} {r['cli_output_frames']}")

    print(f"  {'-'*6} {'-'*10} {'-'*10} {'-'*8}")
    print(f"  {'AVG':<6} {avg_native:>10.2f}s {avg_cli:>10.2f}s {avg_native/avg_cli:>8.2f}x")

    # GPU vs CPU breakdown
    print("\n" + "-" * 60)
    print("GPU vs CPU/I/O BREAKDOWN")
    print("-" * 60)

    cpu_io_time = avg_timings["frame_read"] + avg_timings["frame_convert_total"] + avg_timings["frame_write"]
    gpu_time = avg_timings["ctypes_gvfi_process"]

    cpu_io_pct = (cpu_io_time / forward_total * 100) if forward_total > 0 else 0
    gpu_pct = (gpu_time / forward_total * 100) if forward_total > 0 else 0

    print(f"  GPU (ncnn Vulkan): {gpu_time*1000:.1f} ms total, {gpu_pct:.1f}% of forward time")
    print(f"  CPU/I/O:           {cpu_io_time*1000:.1f} ms total, {cpu_io_pct:.1f}% of forward time")
    print(f"  GPU/CPU ratio:    {gpu_time/cpu_io_time:.2f}x" if cpu_io_time > 0 else "  GPU/CPU ratio: N/A")

    # Save results to JSON
    import json
    results_file = os.path.join(RESULTS_DIR, "profile_results.json")
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump({
            "avg_timings": {k: float(v) for k, v in avg_timings.items()},
            "avg_native_total": float(avg_native),
            "avg_cli_total": float(avg_cli),
            "avg_decode": float(avg_decode),
            "runs": [{
                "run": r["run"],
                "native_total_s": float(r["native_total_s"]),
                "cli_total_s": float(r["cli_total_s"]),
                "speedup": float(r["speedup"]),
            } for r in results]
        }, f, indent=2)
    print(f"\n[INFO] Results saved to: {results_file}")

    # Identify bottleneck
    print("\n" + "=" * 70)
    print("BOTTLENECK ANALYSIS")
    print("=" * 70)

    bottlenecks = [
        ("GPU (ncnn Vulkan forward)", avg_timings["ctypes_gvfi_process"]),
        ("Python ctypes overhead", avg_timings["frame_convert_total"]),
        ("Frame I/O (read)", avg_timings["frame_read"]),
        ("Frame I/O (write)", avg_timings["frame_write"]),
    ]

    bottlenecks.sort(key=lambda x: x[1], reverse=True)

    print("\n  Per-frame time breakdown (sorted by contribution):")
    total_per_frame = sum(b[1] for b in bottlenecks)
    for name, time_val in bottlenecks:
        pct = (time_val / total_per_frame * 100) if total_per_frame > 0 else 0
        print(f"    {name:<30} {time_val*1000/forward_count:>8.3f} ms ({pct:.1f}%)")

    # Warmup impact
    warmup_ms = avg_timings["gpu_warmup"] * 1000
    print(f"\n  GPU warmup (one-time): {warmup_ms:.1f} ms")
    print(f"  Impact on steady-state: negligible (amortized over {forward_count} frames)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
