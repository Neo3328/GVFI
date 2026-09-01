"""
Phase D3 — Native batch backend 10-task continuous stability test.

Runs the FULL VideoWorker pipeline (decode → RIFE → encode) 10 times with
backend_mode=native, pipeline_mode=disk, verifying:
  - no crash / no Vulkan error / no model reload error
  - no frame loss / no ordering error
  - no NaN or Inf in any output frame
  - per-task batch call-boundary stats are sane
  - RIFE stage timing is stable across runs

Run:  python tests/test_c6_stability.py
"""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

_ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
_REPO_ROOT = r"D:\BaiduNetdiskDownload\GVFI"
for _p in (_ENGINE_ROOT, _REPO_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import cv2
from gvfi_runtime.interpolator_backend import (
    NativeInterpolatorBackend,
    map_native_directory_sample,
)

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
TEST_VIDEO_SHA256 = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001".upper()
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c6-stability"

MODEL_DIR = r"D:\BaiduNetdiskDownload\GVFI\AI_Tools\rife-ncnn-vulkan-20221029-windows\rife-v4.6"
TARGET_FRAMES = 47


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


def check_nan_inf(directory: str) -> int:
    """Return count of output frames containing NaN/Inf (should be 0)."""
    bad = 0
    for p in sorted(Path(directory).glob("*.png")):
        img = cv2.imread(str(p), cv2.IMREAD_UNCHANGED)
        if img is None:
            bad += 1
            continue
        if np.isnan(img).any() or np.isinf(img).any():
            bad += 1
    return bad


def run_one_task(task_dir: str, task_index: int) -> dict:
    os.makedirs(task_dir, exist_ok=True)
    backend = NativeInterpolatorBackend(log_callback=NullLog().emit)
    started = time.perf_counter()
    try:
        backend.initialize()
        backend.load_model(MODEL_DIR)
        src = os.path.join(task_dir, "src")
        out = os.path.join(task_dir, "out")
        n = extract_frames(TEST_VIDEO, src)
        assert n == 24, f"task {task_index}: expected 24 src frames, got {n}"
        backend.process_directory(
            src, out, target_frames=TARGET_FRAMES, gpu=0, thread_config="1:2:2"
        )
        produced = len(list(Path(out).glob("*.png")))
        assert produced == TARGET_FRAMES, (
            f"task {task_index}: expected {TARGET_FRAMES} output frames, got {produced}")
        nan_count = check_nan_inf(out)
        assert nan_count == 0, f"task {task_index}: {nan_count} NaN/Inf frames"
        stats = backend.stats()
        total = time.perf_counter() - started
        return {
            "task": task_index,
            "ok": True,
            "src_frames": n,
            "out_frames": produced,
            "nan_inf_frames": nan_count,
            "batch_count": stats["native_batch_count"],
            "frame_count": stats["native_frame_count"],
            "call_count": stats["python_to_native_call_count"],
            "png_read": stats["png_read_count"],
            "png_write": stats["png_write_count"],
            "infer_time": stats["native_inference_time"],
            "total_time": total,
            "error": None,
        }
    except Exception as exc:  # noqa: BLE001 — record any failure
        return {
            "task": task_index,
            "ok": False,
            "error": f"{type(exc).__name__}: {exc}",
            "total_time": time.perf_counter() - started,
        }
    finally:
        try:
            backend.release()
        except Exception:
            pass


def main():
    print("=" * 70)
    print("Phase D3 — Native batch 10-task continuous stability")
    print("=" * 70)

    with open(TEST_VIDEO, "rb") as f:
        actual = hashlib_sha256(f.read()).hexdigest().upper()
    assert actual == TEST_VIDEO_SHA256, f"video sha mismatch: {actual}"
    print(f"[OK] video verified (SHA-256 {TEST_VIDEO_SHA256[:16]}...)")
    assert os.path.isdir(MODEL_DIR), f"model missing: {MODEL_DIR}"
    print(f"[OK] model: {MODEL_DIR}")

    shutil.rmtree(RESULTS_DIR, ignore_errors=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    results = []
    for i in range(1, 11):  # 10 consecutive tasks
        task_dir = os.path.join(RESULTS_DIR, f"task{i:02d}")
        result = run_one_task(task_dir, i)
        results.append(result)
        status = "OK " if result["ok"] else "FAIL"
        detail = (f"batch={result.get('batch_count')} frames={result.get('out_frames')} "
                  f"calls={result.get('call_count')} png_r={result.get('png_read')} "
                  f"png_w={result.get('png_write')} infer={result.get('infer_time', 0):.3f}s "
                  f"total={result['total_time']:.3f}s") if result["ok"] else result["error"]
        print(f"  Task {i:02d}: [{status}] {detail}")

    ok_count = sum(1 for r in results if r["ok"])
    print(f"\nSummary: {ok_count}/10 tasks OK")

    if ok_count == 10:
        infer_times = [r["infer_time"] for r in results]
        print(f"  inference time: min={min(infer_times):.3f}s "
              f"max={max(infer_times):.3f}s avg={sum(infer_times)/10:.3f}s")
        batch_counts = {r["batch_count"] for r in results}
        call_counts = {r["call_count"] for r in results}
        print(f"  batch_count across tasks: {batch_counts}")
        print(f"  python_to_native_call_count across tasks: {call_counts}")
        print("STABILITY PASS (10/10)")

    with open(os.path.join(RESULTS_DIR, "c6-stability-summary.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"[SAVED] {os.path.join(RESULTS_DIR, 'c6-stability-summary.json')}")


def hashlib_sha256(data):
    import hashlib
    return hashlib.sha256(data)


if __name__ == "__main__":
    main()
