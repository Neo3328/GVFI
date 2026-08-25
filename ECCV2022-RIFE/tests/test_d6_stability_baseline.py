from __future__ import annotations

import argparse
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

import cv2
import numpy as np

ENGINE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPO_ROOT = os.path.dirname(ENGINE_ROOT)
for path in (ENGINE_ROOT, REPO_ROOT):
    if path not in sys.path:
        sys.path.insert(0, path)

from gvfi_runtime.frame_pipeline import Frame
from gvfi_runtime.interpolator_backend import NativeInterpolatorBackend
from gvfi_runtime.resource_monitor import sample_resources, summarize_resources
from main import VideoWorker

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
TEST_SHA256 = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001"
MODEL = os.path.join(
    ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6"
)
RESULTS_ROOT = r"D:\GVFI-deps\native-video-worker-ab\d6-stability"


def percentile(values: list[float], value: float) -> float:
    ordered = sorted(values)
    rank = (len(ordered) - 1) * value / 100.0
    lower = math.floor(rank)
    upper = math.ceil(rank)
    if lower == upper:
        return ordered[lower]
    weight = rank - lower
    return ordered[lower] * (1.0 - weight) + ordered[upper] * weight


def load_pair() -> tuple[np.ndarray, np.ndarray]:
    capture = cv2.VideoCapture(TEST_VIDEO)
    frames = []
    while len(frames) < 2:
        ok, frame = capture.read()
        if not ok or frame is None:
            break
        frames.append(frame)
    capture.release()
    if len(frames) != 2:
        raise RuntimeError("fixed video did not provide two frames")
    return frames[0], frames[1]


def native_forward_baseline(soak_minutes: float) -> dict:
    image0, image1 = load_pair()
    height, width = image0.shape[:2]
    frame0 = Frame(image0.tobytes(), width, height, "bgr24", 0, 0.0)
    frame1 = Frame(image1.tobytes(), width, height, "bgr24", 1, 1.0 / 24.0)
    backend = NativeInterpolatorBackend()
    samples = []
    timings_ms = []
    failures = []
    nan_inf = 0
    completed = 0
    try:
        backend.initialize()
        backend.load_model(MODEL)
        for _ in range(5):
            backend.process_frames(frame0, frame1, timestamp=0.5)
        samples.append(sample_resources(0))
        target = 100
        deadline = time.monotonic() + max(0.0, soak_minutes) * 60.0
        while completed < target or (soak_minutes > 0 and time.monotonic() < deadline):
            started = time.perf_counter()
            try:
                output = backend.process_frames(frame0, frame1, timestamp=0.5)
                timings_ms.append((time.perf_counter() - started) * 1000.0)
                array = np.frombuffer(output.frame_data, dtype=np.uint8)
                if array.size != width * height * 3 or not np.isfinite(array).all():
                    nan_inf += 1
                del output, array
            except Exception as exc:
                failures.append(f"{type(exc).__name__}: {exc}")
                break
            completed += 1
            if completed % 10 == 0:
                gc.collect()
                samples.append(sample_resources(0))
    finally:
        backend.release()
        gc.collect()
        samples.append(sample_resources(0))
    return {
        "requested_forwards": 100,
        "soak_minutes": soak_minutes,
        "completed_forwards": completed,
        "failed_forwards": len(failures),
        "failures": failures,
        "nan_inf_outputs": nan_inf,
        "timing_ms": {
            "first": timings_ms[0] if timings_ms else None,
            "average": sum(timings_ms) / len(timings_ms) if timings_ms else None,
            "p50": percentile(timings_ms, 50) if timings_ms else None,
            "p95": percentile(timings_ms, 95) if timings_ms else None,
            "p99": percentile(timings_ms, 99) if timings_ms else None,
            "minimum": min(timings_ms) if timings_ms else None,
            "maximum": max(timings_ms) if timings_ms else None,
        },
        "resources": summarize_resources(samples),
        "samples": [sample.as_dict() for sample in samples],
        "pass": completed >= 100 and not failures and nan_inf == 0,
    }


def probe_output(ffprobe: str, output: str) -> dict:
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_streams", "-of", "json", output],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, timeout=30,
    )
    streams = json.loads(result.stdout.decode("utf-8"))["streams"]
    video = next(item for item in streams if item["codec_type"] == "video")
    audio = next(item for item in streams if item["codec_type"] == "audio")
    return {
        "width": video["width"],
        "height": video["height"],
        "fps": video["avg_frame_rate"],
        "frames": int(video.get("nb_frames") or 0),
        "color_space": video.get("color_space"),
        "color_transfer": video.get("color_transfer"),
        "audio_codec": audio.get("codec_name"),
    }


def full_worker_baseline() -> dict:
    root = os.path.join(RESULTS_ROOT, "video-worker")
    shutil.rmtree(root, ignore_errors=True)
    os.makedirs(root, exist_ok=True)
    samples = [sample_resources(0)]
    tasks = []
    for index in range(1, 11):
        output_dir = os.path.join(root, f"task-{index:02d}")
        worker = VideoWorker(
            [TEST_VIDEO],
            {
                "backend_mode": "native", "pipeline_mode": "disk", "fps": 48,
                "scale": "原始", "codec": "H.265 (HEVC)", "keep_audio": True,
                "enable_dedup": True, "enable_scdet": True, "gpu": 0,
            },
            output_dir, False, True,
        )
        logs = []
        result = []
        worker.log_output.connect(logs.append)
        worker.task_finished.connect(lambda ok, message: result.append((ok, message)))
        started = time.perf_counter()
        worker.run()
        elapsed = time.perf_counter() - started
        output = os.path.join(output_dir, "p0_src_1080p24_audio_enhanced.mp4")
        metadata = probe_output(worker.FFPROBE, output) if os.path.isfile(output) else {}
        combined = "\n".join(logs)
        ok = bool(result and result[0][0]) and metadata == {
            "width": 1920, "height": 1080, "fps": "48/1", "frames": 48,
            "color_space": "bt709", "color_transfer": "bt709", "audio_codec": "aac",
        }
        tasks.append({
            "task": index,
            "pass": ok,
            "elapsed_seconds": elapsed,
            "result": result[0] if result else None,
            "metadata": metadata,
            "fallback": "FALLBACK TO CLI" in combined,
            "vulkan_error": "Vulkan" in combined and "FAILED" in combined,
        })
        del worker
        gc.collect()
        samples.append(sample_resources(0))
    return {
        "successful_tasks": sum(1 for task in tasks if task["pass"]),
        "failed_tasks": sum(1 for task in tasks if not task["pass"]),
        "fallback_tasks": sum(1 for task in tasks if task["fallback"]),
        "tasks": tasks,
        "resources": summarize_resources(samples),
        "samples": [sample.as_dict() for sample in samples],
        "pass": all(task["pass"] and not task["fallback"] for task in tasks),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--soak-minutes", type=float, default=0.0)
    args = parser.parse_args()
    if not os.path.isfile(TEST_VIDEO) or not os.path.isdir(MODEL):
        raise RuntimeError("fixed D6 input or model is unavailable")
    digest = hashlib.sha256(Path(TEST_VIDEO).read_bytes()).hexdigest().upper()
    if digest != TEST_SHA256:
        raise RuntimeError(f"fixed input SHA-256 mismatch: {digest}")
    os.makedirs(RESULTS_ROOT, exist_ok=True)
    report = {
        "input": TEST_VIDEO,
        "input_sha256": digest,
        "model": MODEL,
        "native_forward": native_forward_baseline(args.soak_minutes),
        "video_worker": full_worker_baseline(),
    }
    report["pass"] = report["native_forward"]["pass"] and report["video_worker"]["pass"]
    output = os.path.join(RESULTS_ROOT, "d6-stability.json")
    with open(output, "w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)
    print(
        "D6 summary: "
        f"forward={report['native_forward']['completed_forwards']}/100, "
        f"worker={report['video_worker']['successful_tasks']}/10, "
        f"fallback={report['video_worker']['fallback_tasks']}, "
        f"pass={report['pass']}"
    )
    print(f"D6 report: {output}")
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
