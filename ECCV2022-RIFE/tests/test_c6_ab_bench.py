"""
Phase D3 — Fixed-video A/B: CLI (disk) vs Native batch (disk), 3+ rounds.

Measures the RIFE stage directly (process_directory) on the fixed 24-frame
1080p24 test video's extracted frames:
  - total time (RIFE stage only)
  - native call-boundary stats (batch_count / frame_count / call_count / png IO)
  - output frame count & order (byte-identical PNG names vs mapping)
  - frame-level MAE / MSE / PSNR between CLI and Native outputs
  - audio is untouched by this stage (VideoWorker A/B covers it; here the
    decode/encode stages are excluded to isolate the call boundary change)

Run:  python tests/test_c6_ab_bench.py
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np

_ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
_REPO_ROOT = r"D:\BaiduNetdiskDownload\GVFI"
for _p in (_ENGINE_ROOT, _REPO_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import cv2
from gvfi_runtime.frame_pipeline import Frame
from gvfi_runtime.interpolator_backend import (
    NativeInterpolatorBackend,
    RifeCLIBackend,
    map_native_directory_sample,
)

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
TEST_VIDEO_SHA256 = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001".upper()
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c6-batch-ab"

MODEL_DIR = r"D:\BaiduNetdiskDownload\GVFI\AI_Tools\rife-ncnn-vulkan-20221029-windows\rife-v4.6"
CLI_EXE = r"D:\BaiduNetdiskDownload\GVFI\AI_Tools\rife-ncnn-vulkan-20221029-windows\rife-ncnn-vulkan.exe"

INTERP_FPS = 48
SRC_FPS = 24
TARGET_FRAMES = 47  # floor((24-1)*2+1) — matches C5.2


def compute_mae(a, b):
    return float(abs(a.astype(float) - b.astype(float)).mean())


def compute_mse(a, b):
    return float(((a.astype(float) - b.astype(float)) ** 2).mean())


def compute_psnr(mse):
    if mse <= 0:
        return 99.99
    return 10.0 * np.log10(255.0 * 255.0 / mse)


def extract_frames(video: str, dest_dir: str) -> int:
    os.makedirs(dest_dir, exist_ok=True)
    result = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", video, "-vsync", "0", "-qscale:v", "1",
         os.path.join(dest_dir, "%08d.png")],
        capture_output=True, text=True, timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg extract failed: {result.stderr[-1000:]}")
    return len(list(Path(dest_dir).glob("*.png")))


class NullLog:
    def emit(self, message: str) -> None:
        pass


def run_cli_round(input_dir: str, out_dir: str) -> dict:
    os.makedirs(out_dir, exist_ok=True)
    log = NullLog()
    backend = RifeCLIBackend(CLI_EXE, None, lambda cmd, stage, wd: _run_cli(cmd))
    backend.initialize()
    backend.load_model(MODEL_DIR)
    started = time.perf_counter()
    try:
        backend.process_directory(
            input_dir, out_dir,
            target_frames=TARGET_FRAMES, gpu=0, thread_config="2:4:4",
        )
    finally:
        backend.release()
    total = time.perf_counter() - started
    return {"total_time": total, "rife_time": total}


def _run_cli(command):
    result = subprocess.run(command, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"CLI failed ({result.returncode}): {result.stderr[-1000:]}")


def run_native_round(input_dir: str, out_dir: str) -> dict:
    os.makedirs(out_dir, exist_ok=True)
    log = NullLog()
    backend = NativeInterpolatorBackend(log_callback=log.emit)
    backend.initialize()
    backend.load_model(MODEL_DIR)
    started = time.perf_counter()
    try:
        backend.process_directory(
            input_dir, out_dir,
            target_frames=TARGET_FRAMES, gpu=0, thread_config="1:2:2",
        )
    finally:
        stats = backend.stats()
        backend.release()
    total = time.perf_counter() - started
    stats["total_time"] = total
    return stats


def compare_dirs(cli_dir: str, native_dir: str) -> dict:
    cli_files = sorted(Path(cli_dir).glob("*.png"))
    nat_files = sorted(Path(native_dir).glob("*.png"))
    result = {
        "cli_frames": len(cli_files),
        "native_frames": len(nat_files),
        "order_match": len(cli_files) == len(nat_files),
        "mae": None,
        "mse": None,
        "psnr": None,
    }
    if len(cli_files) != len(nat_files):
        return result
    mae_sum = mse_sum = 0.0
    count = 0
    for cf, nf in zip(cli_files, nat_files):
        if cf.name != nf.name:
            result["order_match"] = False
        a = cv2.imread(str(cf))
        b = cv2.imread(str(nf))
        if a is None or b is None or a.shape != b.shape:
            result["order_match"] = False
            continue
        mae_sum += compute_mae(a, b)
        mse_sum += compute_mse(a, b)
        count += 1
    if count:
        avg_mae = mae_sum / count
        avg_mse = mse_sum / count
        result["mae"] = avg_mae
        result["mse"] = avg_mse
        result["psnr"] = compute_psnr(avg_mse)
    return result


def main():
    print("=" * 70)
    print("Phase D3 — CLI vs Native batch fixed-video A/B (RIFE stage)")
    print("=" * 70)

    # Verify video + model + exe + dll
    with open(TEST_VIDEO, "rb") as f:
        actual = hashlib.sha256(f.read()).hexdigest().upper()
    assert actual == TEST_VIDEO_SHA256, f"video sha mismatch: {actual}"
    assert os.path.isdir(MODEL_DIR), f"model missing: {MODEL_DIR}"
    assert os.path.isfile(CLI_EXE), f"CLI exe missing: {CLI_EXE}"
    print(f"[OK] video={os.path.basename(TEST_VIDEO)} model={os.path.basename(MODEL_DIR)}")

    with tempfile.TemporaryDirectory() as tmp:
        src_frames = os.path.join(tmp, "src")
        n = extract_frames(TEST_VIDEO, src_frames)
        print(f"[OK] extracted {n} source frames (expect 24)")

        rounds = []
        for rnd in range(1, 4):  # 3 rounds
            print(f"\n--- Round {rnd} ---")
            cli_out = os.path.join(RESULTS_DIR, f"round{rnd}_cli")
            nat_out = os.path.join(RESULTS_DIR, f"round{rnd}_native")
            shutil.rmtree(cli_out, ignore_errors=True)
            shutil.rmtree(nat_out, ignore_errors=True)

            cli_stats = run_cli_round(src_frames, cli_out)
            print(f"  CLI   : total={cli_stats['total_time']:.3f}s frames={len(list(Path(cli_out).glob('*.png')))}")

            nat_stats = run_native_round(src_frames, nat_out)
            nat_frames = len(list(Path(nat_out).glob("*.png")))
            print(f"  Native: total={nat_stats['total_time']:.3f}s frames={nat_frames}")
            print(f"          batch_count={nat_stats['native_batch_count']} "
                  f"frame_count={nat_stats['native_frame_count']} "
                  f"call_count={nat_stats['python_to_native_call_count']} "
                  f"png_read={nat_stats['png_read_count']} "
                  f"png_write={nat_stats['png_write_count']} "
                  f"infer={nat_stats['native_inference_time']:.3f}s")

            cmp = compare_dirs(cli_out, nat_out)
            print(f"  Compare: order_match={cmp['order_match']} "
                  f"MAE={cmp['mae']:.4f} MSE={cmp['mse']:.4f} PSNR={cmp['psnr']:.2f}dB")
            rounds.append({
                "round": rnd,
                "cli": cli_stats,
                "native": nat_stats,
                "compare": cmp,
            })

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY (3 rounds)")
    print("=" * 70)
    for r in rounds:
        c, n, cmp = r["cli"], r["native"], r["compare"]
        speedup = c["total_time"] / n["total_time"] if n["total_time"] else 0
        print(f"  R{r['round']}: CLI={c['total_time']:.3f}s Native={n['total_time']:.3f}s "
              f"({speedup:.2f}x) calls={n['python_to_native_call_count']} "
              f"PSNR={cmp['psnr']:.2f}dB frames={cmp['native_frames']}")

    with open(os.path.join(RESULTS_DIR, "c6-batch-ab-summary.json"), "w", encoding="utf-8") as f:
        json.dump(rounds, f, ensure_ascii=False, indent=2, default=str)
    print(f"\n[SAVED] {os.path.join(RESULTS_DIR, 'c6-batch-ab-summary.json')}")


if __name__ == "__main__":
    main()
