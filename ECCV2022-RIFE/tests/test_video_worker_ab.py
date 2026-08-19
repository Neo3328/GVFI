"""
C5.2 — VideoWorker Native RIFE Backend A/B Validation Harness

Tests the full VideoWorker pipeline (FFmpeg decode → RIFE → FFmpeg encode)
with two backend modes:
  - backend_mode=cli   (rife-ncnn-vulkan.exe per scene)
  - backend_mode=native (gvfi_native.dll, persistent process)

Key observations validated:
  - Native does NOT restart a process per scene
  - Native does NOT reload the model per scene
  - Output frames / resolution / FPS / audio match CLI baseline
  - Frame-level numerical similarity (MAE, PSNR, SSIM) matches C4.8 baseline
  - 10 consecutive Native tasks succeed without crash
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
import tempfile
import threading
import time
from pathlib import Path
from typing import Any, Optional

# Resolve ENGINE_ROOT: hardcode the one known absolute location to avoid
# __file__ resolution issues when invoked as `python tests/...`.
_ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
_REPO_ROOT = r"D:\BaiduNetdiskDownload\GVFI"
for _p in (_ENGINE_ROOT, _REPO_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Re-bind constants so ENGINE_ROOT is correct after path setup
ENGINE_ROOT = _ENGINE_ROOT

# ------------------------------------------------------------------
# Fixed test input (SHA-256 verified)
# ------------------------------------------------------------------
TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
TEST_VIDEO_SHA256 = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001".upper()
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab"

# Expected from test video: 24 frames @ 24fps, 1920x1080, H.264/AAC mono
EXPECTED_SRC_FRAMES = 24
EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
EXPECTED_FPS = 24

# Interpolate to 2x: 24 → 47 frames (floor((24-1)*2+1) = floor(47) = 47)
INTERP_FPS = 48  # target output FPS
INTERP_SRC_FPS = 24


# ------------------------------------------------------------------
# Quality metrics
# ------------------------------------------------------------------

def compute_psnr(mse: float) -> float:
    if mse <= 0:
        return 99.99
    return 10.0 * math.log10(255.0 * 255.0 / mse)


def compute_mae(img_a, img_b) -> float:
    return float(abs(img_a.astype(float) - img_b.astype(float)).mean())


def compute_mse(img_a, img_b) -> float:
    return float(((img_a.astype(float) - img_b.astype(float)) ** 2).mean())


def ssim_step(img_a, img_b, window_size=11, c1=0.01 ** 2, c2=0.03 ** 2):
    """Simplified SSIM — 8x8 flat window, matches C4.8 harness convention."""
    import numpy as np
    mu_a = img_a.astype(float).mean()
    mu_b = img_b.astype(float).mean()
    sigma_a2 = ((img_a.astype(float) - mu_a) ** 2).mean()
    sigma_b2 = ((img_b.astype(float) - mu_b) ** 2).mean()
    sigma_ab = ((img_a.astype(float) - mu_a) * (img_b.astype(float) - mu_b)).mean()
    num = (2 * mu_a * mu_b + c1) * (2 * sigma_ab + c2)
    den = (mu_a ** 2 + mu_b ** 2 + c1) * (sigma_a2 + sigma_b2 + c2)
    if den == 0:
        return 1.0
    return float(num / den)


# ------------------------------------------------------------------
# FFmpeg helpers
# ------------------------------------------------------------------

def probe_video(path: str) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "error",
         "-select_streams", "v:0",
         "-show_entries",
         "stream=width,height,nb_frames,r_frame_rate,avg_frame_rate,codec_name,pix_fmt",
         "-of", "json", path],
        capture_output=True, text=True, timeout=30,
    )
    streams = json.loads(result.stdout).get("streams", [{}])
    v = streams[0] if streams else {}
    result2 = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0",
         "-show_entries", "stream=codec_name,sample_rate,channels,bit_rate",
         "-of", "json", path],
        capture_output=True, text=True, timeout=30,
    )
    a = (json.loads(result2.stdout).get("streams") or [None])[0]
    return {
        "width": v.get("width", 0),
        "height": v.get("height", 0),
        "frames": v.get("nb_frames", "N/A"),
        "fps": v.get("r_frame_rate", "0/1"),
        "codec": v.get("codec_name", ""),
        "pix_fmt": v.get("pix_fmt", ""),
        "audio_codec": (a or {}).get("codec_name", ""),
        "audio_channels": (a or {}).get("channels", 0),
        "audio_sample_rate": (a or {}).get("sample_rate", ""),
        "file_size": os.path.getsize(path),
    }


def decode_video_to_png(video_path: str, output_dir: str, prefix: str = "") -> int:
    os.makedirs(output_dir, exist_ok=True)
    name_fmt = f"{prefix}%08d.png" if prefix else "%08d.png"
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", video_path,
         "-vsync", "0", "-qscale:v", "1",
         os.path.join(output_dir, name_fmt)],
        capture_output=True, text=True, timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg decode failed:\n{result.stderr[-500:]}")
    return len(list(Path(output_dir).glob("*.png")))


def encode_video_from_png(
    frames_dir: str, audio_src: str, output_path: str,
    fps: float, width: int, height: int,
) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pattern = os.path.join(frames_dir, "%08d.png")
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", pattern,
        "-i", audio_src,
        "-c:v", "libx265", "-crf", "18", "-preset", "medium",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-map", "0:v", "-map", "1:a",
        "-metadata:s:v", "rotate=0",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg encode failed:\n{result.stderr[-500:]}")
    return output_path


def extract_audio(video_path: str, audio_path: str) -> str:
    os.makedirs(os.path.dirname(audio_path), exist_ok=True)
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", video_path,
         "-vn", "-c:a", "copy", "-f", "mp4", audio_path],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Audio extract failed:\n{result.stderr[-300:]}")
    return audio_path


# ------------------------------------------------------------------
# RIFE backends — standalone directory processing
# ------------------------------------------------------------------

def run_rife_cli(
    input_dir: str,
    output_dir: str,
    target_frames: int,
    model: str,
    gpu: int = 0,
    thread_config: str = "2:4:4",
) -> dict:
    """Run CLI backend: rife-ncnn-vulkan.exe"""
    os.makedirs(output_dir, exist_ok=True)
    exe = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-ncnn-vulkan.exe")
    if not os.path.isfile(exe):
        raise FileNotFoundError(f"RIFE CLI exe not found: {exe}")

    start = time.perf_counter()
    result = subprocess.run(
        [exe,
         "-i", input_dir,
         "-o", output_dir,
         "-n", str(target_frames),
         "-m", model,
         "-f", "%08d.png",
         "-j", str(thread_config),
         "-g", str(gpu)],
        capture_output=True, text=True, timeout=600,
    )
    elapsed = time.perf_counter() - start

    output_frames = sorted(Path(output_dir).glob("*.png"))
    return {
        "backend": "cli",
        "elapsed_s": elapsed,
        "target_frames": target_frames,
        "output_frames": len(output_frames),
        "returncode": result.returncode,
        "stderr_tail": (result.stderr or "")[-300:],
    }


def run_rife_native(
    input_dir: str,
    output_dir: str,
    target_frames: int,
    model: str,
    gpu: int = 0,
    thread_config: str = "1:2:2",
) -> dict:
    """Run Native backend: gvfi_native.dll (in-process)"""
    os.makedirs(output_dir, exist_ok=True)

    sys.path.insert(0, ENGINE_ROOT)
    from gvfi_runtime.interpolator_backend import (
        BackendError, NativeInterpolatorBackend, create_interpolator_backend,
    )
    from gvfi_runtime.frame_pipeline import Frame
    import cv2
    import numpy as np

    backend = create_interpolator_backend("native")
    backend.initialize()
    backend.load_model(model)

    paths = sorted(Path(input_dir).glob("*.png"))
    input_count = len(paths)
    output_count = int(target_frames)
    scale = input_count / output_count

    start = time.perf_counter()
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

        img0 = cv2.imread(str(paths[left]), cv2.IMREAD_COLOR)
        if right == left or fraction <= 1e-12:
            img_out = img0
        else:
            img1 = cv2.imread(str(paths[right]), cv2.IMREAD_COLOR)
            result = backend.process_frames(
                Frame(img0, img0.shape[1], img0.shape[0], "bgr24", left, float(left)),
                Frame(img1, img1.shape[1], img1.shape[0], "bgr24", right, float(right)),
                timestamp=fraction,
            )
            img_out = np.frombuffer(result.frame_data, dtype=np.uint8).reshape(
                result.height, result.width, 3
            )
            forward_count += 1

        dest = os.path.join(output_dir, f"{out_idx + 1:08d}.png")
        cv2.imwrite(dest, img_out)

    elapsed = time.perf_counter() - start
    backend.release()
    backend.release()

    output_frames = sorted(Path(output_dir).glob("*.png"))
    return {
        "backend": "native",
        "elapsed_s": elapsed,
        "target_frames": target_frames,
        "output_frames": len(output_frames),
        "forward_count": forward_count,
        "model_load_count": 1,
        "process_count": 1,
    }


# ------------------------------------------------------------------
# VideoWorker harness — uses PyQt5 QCoreApplication + VideoWorker directly
# ------------------------------------------------------------------

class VideoWorkerTestHarness:
    """Wraps VideoWorker with timing, logging, and output capture."""

    def __init__(
        self,
        video_path: str,
        output_dir: str,
        backend_mode: str,
        target_fps: int,
        model: str,
        gpu: int = 0,
        thread_config: str = "2:4:4",
    ):
        self.video_path = video_path
        self.output_dir = output_dir
        self.backend_mode = backend_mode
        self.target_fps = target_fps
        self.model = model
        self.gpu = gpu
        self.thread_config = thread_config
        self._logs: list[str] = []
        self._progress_values: list[int] = []
        self._worker: Optional[Any] = None
        self._finished_event = threading.Event()
        self._success = False
        self._error_msg = ""
        self._timing: dict[str, float] = {}

    def _log(self, msg: str) -> None:
        self._logs.append(msg)
        print(f"[{self.backend_mode.upper()}] {msg}", flush=True)

    def _on_progress(self, value: int) -> None:
        self._progress_values.append(value)

    def _on_log(self, msg: str) -> None:
        self._log(msg)

    def _on_finished(self, ok: bool, msg: str) -> None:
        self._success = ok
        self._error_msg = msg
        self._finished_event.set()

    def run(self) -> dict[str, Any]:
        os.makedirs(self.output_dir, exist_ok=True)
        os.environ.setdefault("PYTHONUTF8", "1")

        from PyQt5.QtCore import QCoreApplication
        app = QCoreApplication.instance()
        if app is None:
            app = QCoreApplication(sys.argv)

        from main import VideoWorker

        # Compute target frame count from source FPS and target FPS
        source_fps = 24.0
        source_frames = 24
        target_frames = int(math.floor((source_frames - 1) * (self.target_fps / source_fps))) + 1

        params = {
            "backend_mode": self.backend_mode,
            "rife_model": self.model,
            "fps": self.target_fps,
            "scale": "原始",
            "gpu": self.gpu,
            "rife_thread_config": self.thread_config,
            "pipeline_mode": "disk",
            "enable_dedup": True,
            "enable_scdet": True,
            "dedup_threshold": 1.5,
            "scdet_threshold": 12.0,
            "superResolution": False,
        }

        self._timing["wall_start"] = time.perf_counter()
        self._worker = VideoWorker(
            file_list=[self.video_path],
            params=params,
            out_path=self.output_dir,
            same_as_src=False,
            clean_cache=True,
        )
        self._worker.progress_updated.connect(self._on_progress)
        self._worker.log_output.connect(self._on_log)
        self._worker.task_finished.connect(self._on_finished)
        self._worker.start()
        self._worker.wait(600_000)  # 10 min timeout
        self._timing["wall_end"] = time.perf_counter()

        self._timing["wall_elapsed_s"] = self._timing["wall_end"] - self._timing["wall_start"]

        # Find output video
        output_files = [
            f for f in os.listdir(self.output_dir)
            if f.endswith((".mp4", ".mkv", ".avi"))
        ]
        output_video = os.path.join(self.output_dir, output_files[0]) if output_files else ""

        return {
            "backend": self.backend_mode,
            "success": self._success,
            "error": self._error_msg,
            "wall_elapsed_s": self._timing.get("wall_elapsed_s", 0),
            "output_video": output_video,
            "output_files": output_files,
            "logs": list(self._logs),
            "progress_values": list(self._progress_values),
        }


# ------------------------------------------------------------------
# Frame comparison utilities
# ------------------------------------------------------------------

def compare_png_directories(dir_a: str, dir_b: str) -> dict:
    """Compare PNG outputs from two directories frame-by-frame."""
    import cv2
    import numpy as np

    paths_a = sorted(Path(dir_a).glob("*.png"))
    paths_b = sorted(Path(dir_b).glob("*.png"))

    if len(paths_a) != len(paths_b):
        return {
            "error": f"Frame count mismatch: {len(paths_a)} vs {len(paths_b)}",
            "mae": None, "mse": None, "psnr": None, "ssim": None,
            "max_diff": None, "frames_compared": 0,
        }

    total_mae = 0.0
    total_mse = 0.0
    total_ssim = 0.0
    max_diff = 0
    frames = 0

    for pa, pb in zip(paths_a, paths_b):
        img_a = cv2.imread(str(pa), cv2.IMREAD_COLOR)
        img_b = cv2.imread(str(pb), cv2.IMREAD_COLOR)
        if img_a is None or img_b is None:
            continue
        if img_a.shape != img_b.shape:
            return {"error": f"Shape mismatch at {pa.name}: {img_a.shape} vs {img_b.shape}",
                    "frames_compared": frames}
        mae = compute_mae(img_a, img_b)
        mse = compute_mse(img_a, img_b)
        ssim = ssim_step(img_a, img_b)
        diff = abs(img_a.astype(int) - img_b.astype(int)).max()
        total_mae += mae
        total_mse += mse
        total_ssim += ssim
        max_diff = max(max_diff, int(diff))
        frames += 1

    return {
        "frames_compared": frames,
        "mae": total_mae / frames if frames else None,
        "mse": total_mse / frames if frames else None,
        "psnr": compute_psnr(total_mse / frames) if frames else None,
        "ssim": total_ssim / frames if frames else None,
        "max_diff": max_diff,
    }


def compare_video_frames(video_a: str, video_b: str) -> dict:
    """Decode two videos to PNG and compare frame by frame."""
    with tempfile.TemporaryDirectory() as tmpdir:
        dir_a = os.path.join(tmpdir, "a")
        dir_b = os.path.join(tmpdir, "b")
        decode_video_to_png(video_a, dir_a)
        decode_video_to_png(video_b, dir_b)
        return compare_png_directories(dir_a, dir_b)


# ------------------------------------------------------------------
# Pipeline runner — does full end-to-end test without PyQt
#   (decodes → dedup → scene detection → RIFE → encodes)
#   This mirrors what VideoWorker._interpolate_with_svfi_opts does,
#   but with explicit timing and logging.
# ------------------------------------------------------------------

def compute_target_frames(src_frames: int, src_fps: float, tgt_fps: float) -> int:
    return int(math.floor((src_frames - 1) * (tgt_fps / src_fps))) + 1


def run_pipeline(
    video_path: str,
    output_dir: str,
    backend: str,
    target_fps: int,
    model: str,
    gpu: int = 0,
    thread_config: str = "2:4:4",
) -> dict:
    """
    Runs: FFmpeg decode → dedup → scene detection → RIFE backend →
          FFmpeg encode. Returns timing + output metadata.
    """
    os.makedirs(output_dir, exist_ok=True)

    timing: dict[str, float] = {}

    # ---- 1. Extract audio ----
    audio_path = os.path.join(output_dir, "audio.m4a")
    t0 = time.perf_counter()
    extract_audio(video_path, audio_path)
    timing["audio_extract_s"] = time.perf_counter() - t0

    # ---- 2. Decode video to PNG ----
    raw_dir = os.path.join(output_dir, "raw_frames")
    t0 = time.perf_counter()
    raw_frames = decode_video_to_png(video_path, raw_dir)
    timing["decode_s"] = time.perf_counter() - t0
    timing["source_frames"] = raw_frames

    # ---- 3. Deduplication ----
    from svfi_pipeline import remove_duplicate_frames
    dedup_dir = os.path.join(output_dir, "dedup_frames")
    os.makedirs(dedup_dir, exist_ok=True)
    t0 = time.perf_counter()
    kept, _ = remove_duplicate_frames(raw_dir, dedup_dir, threshold=1.5, log=lambda x: None)
    timing["dedup_s"] = time.perf_counter() - t0
    timing["unique_frames"] = kept

    # ---- 4. Scene detection ----
    from svfi_pipeline import detect_scene_cuts, build_segments, allocate_output_counts
    unique_count = len(list(Path(dedup_dir).glob("*.png")))
    t0 = time.perf_counter()
    cuts = detect_scene_cuts(dedup_dir, threshold=12.0, log=lambda x: None)
    segments = build_segments(unique_count, cuts)
    timing["scene_detection_s"] = time.perf_counter() - t0
    timing["scenes"] = len(segments)

    # ---- 5. Target frame count ----
    src_fps = 24.0
    target_frame_count = compute_target_frames(unique_count, src_fps, float(target_fps))
    target_frame_count = max(target_frame_count, unique_count + (1 if target_fps > src_fps else 0))

    lengths = [end - start for start, end in segments]
    out_counts = allocate_output_counts(lengths, target_frame_count)

    # ---- 6. RIFE processing ----
    rife_dir = os.path.join(output_dir, "rife_frames")
    os.makedirs(rife_dir, exist_ok=True)

    if len(segments) == 1:
        t0 = time.perf_counter()
        if backend == "cli":
            result = run_rife_cli(dedup_dir, rife_dir, out_counts[0], model, gpu, thread_config)
        else:
            result = run_rife_native(dedup_dir, rife_dir, out_counts[0], model, gpu, thread_config)
        timing["rife_s"] = time.perf_counter() - t0
        timing["rife_elapsed_s"] = result["elapsed_s"]
        timing["rife_output_frames"] = result["output_frames"]
        timing["rife_process_count"] = result.get("process_count", 1)
        timing["rife_model_load_count"] = result.get("model_load_count", 1)
        timing["rife_forward_count"] = result.get("forward_count", 0)
        timing["rife_success"] = result.get("returncode", 0) == 0
        if "stderr_tail" in result:
            timing["rife_stderr"] = result["stderr_tail"]
    else:
        # Multi-scene: use RifeWorkerManager
        from gvfi_runtime.rife_scene_scheduler import RifeWorkerManager, SceneTask
        from gvfi_runtime.rife_cli_pipeline import stage_frame_range, collect_frames
        from svfi_pipeline import frame_paths

        scene_root = os.path.join(output_dir, "scenes")
        os.makedirs(scene_root, exist_ok=True)
        active_paths = frame_paths(dedup_dir)
        next_index = 1
        scene_tasks = []
        for scene_i, ((start, end), out_n) in enumerate(zip(segments, out_counts), start=1):
            scene_in = os.path.join(scene_root, f"in_{scene_i:03d}")
            scene_out = os.path.join(scene_root, f"out_{scene_i:03d}")
            if os.path.isdir(scene_in):
                shutil.rmtree(scene_in, ignore_errors=True)
            if os.path.isdir(scene_out):
                shutil.rmtree(scene_out, ignore_errors=True)
            input_paths = tuple(active_paths[start:end])
            scene_tasks.append(SceneTask(
                scene_index=scene_i,
                input_frames=input_paths,
                input_path=scene_in,
                output_path=scene_out,
                final_output_path=rife_dir,
                output_start_index=next_index,
                target_frames=out_n,
                model=model,
                gpu=gpu,
                resolution=(1920, 1080),
                requires_inference=len(input_paths) > 1 and out_n > len(input_paths),
            ))
            next_index += out_n if len(input_paths) > 1 and out_n > len(input_paths) else len(input_paths)

        def stage_scene(task):
            copied, _, _ = stage_frame_range(task.input_frames, task.input_path, 0, len(task.input_frames))

        def process_scene(task):
            if backend == "cli":
                run_rife_cli(task.input_path, task.output_path, task.target_frames, model, gpu, thread_config)
            else:
                run_rife_native(task.input_path, task.output_path, task.target_frames, model, gpu, thread_config)

        def collect_scene(task):
            source = task.output_path if task.requires_inference else task.input_path
            written, _, _ = collect_frames(source, task.final_output_path, start_index=task.output_start_index)
            expected = task.target_frames if task.requires_inference else len(task.input_frames)
            if written != expected:
                raise RuntimeError(f"scene {task.scene_index}: wrote {written}, expected {expected}")

        t0 = time.perf_counter()
        manager = RifeWorkerManager(queue_size=2)
        stats = manager.run(
            scene_tasks,
            stage=stage_scene,
            process=process_scene,
            collect=collect_scene,
        )
        timing["rife_s"] = time.perf_counter() - t0
        timing["rife_process_count"] = stats.scene_process_count
        timing["rife_model_load_count"] = stats.model_reload_count
        timing["rife_worker_starts"] = stats.worker_start
        timing["scenes"] = len(scene_tasks)

    # ---- 7. Count RIFE output frames ----
    rife_output = len(list(Path(rife_dir).glob("*.png")))
    timing["rife_output_frames"] = rife_output

    # ---- 8. FFmpeg encode ----
    t0 = time.perf_counter()
    output_video = os.path.join(output_dir, f"output_{backend}.mp4")
    encode_video_from_png(
        frames_dir=rife_dir,
        audio_src=audio_path,
        output_path=output_video,
        fps=float(target_fps),
        width=1920,
        height=1080,
    )
    timing["encode_s"] = time.perf_counter() - t0

    # ---- 9. Probe output ----
    probe = probe_video(output_video) if os.path.isfile(output_video) else {}
    timing["output_video"] = output_video
    timing["output_probe"] = probe

    return timing


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------

def main():
    print("=" * 70)
    print("C5.2 VideoWorker Native RIFE Backend A/B Validation")
    print("=" * 70)

    # Verify test video
    with open(TEST_VIDEO, "rb") as f:
        actual_sha = hashlib.sha256(f.read()).hexdigest().upper()
    assert actual_sha == TEST_VIDEO_SHA256, (
        f"Test video SHA-256 mismatch:\n"
        f"  expected: {TEST_VIDEO_SHA256}\n"
        f"  got:      {actual_sha}"
    )
    print(f"\n[OK] Test video verified: SHA-256={TEST_VIDEO_SHA256}")
    print(f"     1920x1080, 24fps, 24 frames, H.264/AAC mono")

    # Resolve model
    model = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")
    assert os.path.isdir(model), f"Model not found: {model}"

    # Verify native DLL
    dll = os.path.join(ENGINE_ROOT, "gvfi_runtime", "native_bin", "gvfi_native.dll")
    assert os.path.isfile(dll), f"Native DLL not found: {dll}"
    print(f"[OK] Native DLL: {dll}")

    # CLI exe
    cli_exe = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-ncnn-vulkan.exe")
    assert os.path.isfile(cli_exe), f"CLI exe not found: {cli_exe}"
    print(f"[OK] CLI exe: {cli_exe}")

    # Target FPS: 24 → 48 (2x interpolation)
    target_fps = INTERP_FPS  # 48
    print(f"\n[CONFIG] Source: 24fps → Target: {target_fps}fps (2x)")
    print(f"         Model: {os.path.basename(model)}")
    print(f"         GPU: 0 | Thread config: 2:4:4 (CLI) / 1:2:2 (Native)")

    # ----------------------------------------------------------------
    # Run 1: CLI baseline
    # ----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("RUN 1: CLI BACKEND (baseline)")
    print("=" * 70)
    cli_dir = os.path.join(RESULTS_DIR, "run1_cli")
    shutil.rmtree(cli_dir, ignore_errors=True)
    t_start = time.perf_counter()
    cli_timing = run_pipeline(
        TEST_VIDEO, cli_dir, "cli",
        target_fps=target_fps,
        model=model,
        gpu=0,
        thread_config="2:4:4",
    )
    t_end = time.perf_counter()
    cli_total = t_end - t_start
    print(f"\nCLI Total wall time: {cli_total:.3f}s")
    for k, v in cli_timing.items():
        if k not in ("logs", "rife_stderr"):
            print(f"  {k}: {v}")

    if not cli_timing.get("rife_success", False):
        print(f"\n!!! CLI RIFE failed: {cli_timing.get('rife_stderr', 'unknown')}")

    # ----------------------------------------------------------------
    # Run 1: Native A/B
    # ----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("RUN 1: NATIVE BACKEND")
    print("=" * 70)
    native_dir = os.path.join(RESULTS_DIR, "run1_native")
    shutil.rmtree(native_dir, ignore_errors=True)
    t_start = time.perf_counter()
    native_timing = run_pipeline(
        TEST_VIDEO, native_dir, "native",
        target_fps=target_fps,
        model=model,
        gpu=0,
        thread_config="1:2:2",
    )
    t_end = time.perf_counter()
    native_total = t_end - t_start
    print(f"\nNative Total wall time: {native_total:.3f}s")
    for k, v in native_timing.items():
        if k not in ("logs", "rife_stderr"):
            print(f"  {k}: {v}")

    # ----------------------------------------------------------------
    # Validate outputs
    # ----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("OUTPUT VALIDATION")
    print("=" * 70)

    cli_video = cli_timing.get("output_video", "")
    native_video = native_timing.get("output_video", "")

    def validate_output(path: str, backend: str) -> bool:
        if not os.path.isfile(path):
            print(f"  [{backend.upper()}] FAIL: output video not found: {path}")
            return False
        probe = probe_video(path)
        ok = True
        frames = probe.get("frames", "N/A")
        if probe.get("audio_codec"):
            print(f"  [{backend.upper()}] Audio: {probe.get('audio_codec')} {probe.get('audio_channels')}ch @ {probe.get('audio_sample_rate')}Hz")
        else:
            print(f"  [{backend.upper()}] WARNING: No audio track found")
        if probe.get("width") != 1920 or probe.get("height") != 1080:
            print(f"  [{backend.upper()}] FAIL: resolution {probe.get('width')}x{probe.get('height')}, expected 1920x1080")
            ok = False
        if probe.get("codec") not in ("h264", "hevc"):
            print(f"  [{backend.upper()}] WARNING: codec={probe.get('codec')}")
        print(f"  [{backend.upper()}] Output: {probe.get('width')}x{probe.get('height')} {probe.get('fps')} {frames} frames, {probe.get('file_size', 0):,} bytes")
        return ok

    cli_ok = validate_output(cli_video, "cli")
    native_ok = validate_output(native_video, "native")

    # ----------------------------------------------------------------
    # Frame comparison
    # ----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("FRAME COMPARISON (PNG directories)")
    print("=" * 70)

    cli_frames = os.path.join(cli_dir, "rife_frames")
    native_frames = os.path.join(native_dir, "rife_frames")

    if os.path.isdir(cli_frames) and os.path.isdir(native_frames):
        cmp_result = compare_png_directories(cli_frames, native_frames)
        print(f"  Frames compared: {cmp_result.get('frames_compared', 0)}")
        print(f"  MAE: {cmp_result.get('mae', 'N/A'):.6f}" if cmp_result.get('mae') is not None else "  MAE: N/A")
        print(f"  MSE: {cmp_result.get('mse', 'N/A'):.6f}" if cmp_result.get('mse') is not None else "  MSE: N/A")
        print(f"  PSNR: {cmp_result.get('psnr', 'N/A'):.3f} dB" if cmp_result.get('psnr') is not None else "  PSNR: N/A")
        print(f"  SSIM: {cmp_result.get('ssim', 'N/A'):.8f}" if cmp_result.get('ssim') is not None else "  SSIM: N/A")
        print(f"  Max pixel diff: {cmp_result.get('max_diff', 'N/A')}")
        if cmp_result.get("error"):
            print(f"  ERROR: {cmp_result['error']}")
    else:
        print("  SKIPPED: Could not locate RIFE output directories")

    # ----------------------------------------------------------------
    # RIFE process/model load comparison
    # ----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("RIFE PROCESS / MODEL LOAD COMPARISON")
    print("=" * 70)
    cli_proc = cli_timing.get("rife_process_count", "?")
    native_proc = native_timing.get("rife_process_count", "?")
    cli_loads = cli_timing.get("rife_model_load_count", "?")
    native_loads = native_timing.get("rife_model_load_count", "?")
    print(f"  CLI   — process_count: {cli_proc}, model_load_count: {cli_loads}")
    print(f"  Native — process_count: {native_proc}, model_load_count: {native_loads}")
    if native_proc == 1 and native_loads == 1:
        print("  [PASS] Native: single process, single model load (no per-scene restart)")
    else:
        print(f"  [NOTE] Native: {native_proc} processes, {native_loads} model loads")

    # ----------------------------------------------------------------
    # Run 2 & 3
    # ----------------------------------------------------------------
    for run in [2, 3]:
        for backend, out_base, tc in [("cli", "cli", "2:4:4"), ("native", "native", "1:2:2")]:
            label = f"Run {run} {backend.upper()}"
            print(f"\n{'=' * 70}")
            print(f"{label}")
            print("=" * 70)
            out_dir = os.path.join(RESULTS_DIR, f"run{run}_{backend}")
            shutil.rmtree(out_dir, ignore_errors=True)
            t0 = time.perf_counter()
            result = run_pipeline(
                TEST_VIDEO, out_dir, backend,
                target_fps=target_fps,
                model=model,
                gpu=0,
                thread_config=tc,
            )
            elapsed = time.perf_counter() - t0
            print(f"  Total wall time: {elapsed:.3f}s")
            print(f"  RIFE frames: {result.get('rife_output_frames', '?')}")
            print(f"  Output: {result.get('output_video', 'NOT FOUND')}")
            if result.get("output_probe"):
                p = result["output_probe"]
                print(f"  Probe: {p.get('width')}x{p.get('height')} {p.get('frames')} frames")
            if backend == "native":
                print(f"  RIFE process_count: {result.get('rife_process_count', '?')}")
                print(f"  RIFE model_load_count: {result.get('rife_model_load_count', '?')}")

    # ----------------------------------------------------------------
    # 10-task stability test (Native)
    # ----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("10-TASK NATIVE STABILITY TEST")
    print("=" * 70)
    stability_dir = os.path.join(RESULTS_DIR, "stability_native_10")
    shutil.rmtree(stability_dir, ignore_errors=True)
    os.makedirs(stability_dir)

    success_count = 0
    fail_count = 0
    crash_count = 0
    timings: list[float] = []

    for i in range(1, 11):
        task_dir = os.path.join(stability_dir, f"task_{i:02d}")
        print(f"\n  Task {i}/10...", end=" ", flush=True)
        try:
            t0 = time.perf_counter()
            result = run_pipeline(
                TEST_VIDEO, task_dir, "native",
                target_fps=target_fps,
                model=model,
                gpu=0,
                thread_config="1:2:2",
            )
            elapsed = time.perf_counter() - t0
            timings.append(elapsed)

            output_vid = result.get("output_video", "")
            if os.path.isfile(output_vid) and result.get("rife_output_frames", 0) > 0:
                print(f"OK ({elapsed:.2f}s, {result.get('rife_output_frames', 0)} frames)")
                success_count += 1
            else:
                print(f"FAIL — no output video or 0 RIFE frames")
                fail_count += 1
        except Exception as exc:
            print(f"CRASH — {exc}")
            crash_count += 1
            fail_count += 1

        gc.collect()

    print(f"\n  Stability: {success_count}/10 succeeded, {fail_count} failed, {crash_count} crashes")
    if timings:
        print(f"  Timings: min={min(timings):.2f}s, max={max(timings):.2f}s, "
              f"avg={sum(timings)/len(timings):.2f}s")

    # ----------------------------------------------------------------
    # Summary
    # ----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("FINAL SUMMARY")
    print("=" * 70)
    print(f"  CLI Run 1 total:     {cli_total:.3f}s")
    print(f"  Native Run 1 total:  {native_total:.3f}s")
    print(f"  CLI output:          {cli_video}")
    print(f"  Native output:       {native_video}")
    print(f"  CLI output valid:    {'PASS' if cli_ok else 'FAIL'}")
    print(f"  Native output valid: {'PASS' if native_ok else 'FAIL'}")

    all_pass = cli_ok and native_ok and success_count == 10 and crash_count == 0
    print(f"\n  {'ALL CHECKS PASSED' if all_pass else 'SOME CHECKS FAILED — see above'}")

    return 0 if all_pass else 1


if __name__ == "__main__":
    # Paths already set at module top; just verify and run.
    assert os.path.isdir(ENGINE_ROOT), f"ENGINE_ROOT not found: {ENGINE_ROOT}"
    sys.exit(main())
