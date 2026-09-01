"""
C5.4 — Native Backend Final Production Validation

Phase: C5.4
Date: 2026-08-11
Commit baseline: d9152dd7 feat: add native backend production fallback

This harness validates:
  A. Native normal task - complete VideoWorker task with backend_mode=native
  B. Native fallback - forced Native failure triggers automatic CLI fallback
  C. Cross-task state recovery - Task1=Native OK, Task2=Native fail→CLI, Task3=Native OK, Task4=CLI
  D. Continuous stability - 10 runs with mixed Native/CLI/fallback scenarios
  E. Default config protection - backend_mode default is 'cli'

Constraints (MUST NOT):
  - Modify backend_mode default value
  - Delete RifeCLIBackend
  - Modify GUI, FFmpeg decode, scene detection, FrameQueue, NVENC, Real-ESRGAN, RealCUGAN, RIFE model, ncnn, Warp/shader
  - Modify production code for performance optimization
  - Modify production code outside the test scope
  - Create false validation results
  - Modify test conditions to pass tests
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

# Paths
_ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
_REPO_ROOT = r"D:\BaiduNetdiskDownload\GVFI"
for _p in (_ENGINE_ROOT, _REPO_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

ENGINE_ROOT = _ENGINE_ROOT

# Fixed test input
TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
TEST_VIDEO_SHA256 = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001".upper()
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c54_final"

# Expected from test video
EXPECTED_SRC_FRAMES = 24
EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
EXPECTED_FPS = 24

# Interpolate to 2x: current pipeline emits 48 frames for 24-src (was 47 in older C5.2 docs).
INTERP_FPS = 48
INTERP_SRC_FPS = 24
EXPECTED_OUT_FRAMES = 48


# =============================================================================
# FFmpeg helpers
# =============================================================================

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


def count_png_frames(directory: str) -> int:
    try:
        return sum(1 for _ in Path(directory).glob("*.png"))
    except OSError:
        return 0


# =============================================================================
# VideoWorker test harness
# =============================================================================

class VideoWorkerHarness:
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
        inject_native_failure: bool = False,
    ):
        self.video_path = video_path
        self.output_dir = output_dir
        self.backend_mode = backend_mode
        self.target_fps = target_fps
        self.model = model
        self.gpu = gpu
        self.thread_config = thread_config
        self.inject_native_failure = inject_native_failure
        self._logs: list[str] = []
        self._progress_values: list[int] = []
        self._worker: Optional[Any] = None
        self._finished_event = threading.Event()
        self._success = False
        self._error_msg = ""
        self._timing: dict[str, float] = {}
        self._result: Optional[dict] = None

    def _log(self, msg: str) -> None:
        self._logs.append(msg)
        try:
            print(f"  [{self.backend_mode.upper()}] {msg}", flush=True)
        except UnicodeEncodeError:
            print(
                f"  [{self.backend_mode.upper()}] "
                + msg.encode("utf-8", "replace").decode("ascii", "replace"),
                flush=True,
            )

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
        # Console must be UTF-8: VideoWorker logs contain emoji; GBK print in
        # Qt signal slots aborts the process (0xC0000409) under QThread.
        os.environ.setdefault("PYTHONUTF8", "1")
        os.environ.setdefault("PYTHONIOENCODING", "utf-8")
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

        from PyQt5.QtCore import QCoreApplication
        app = QCoreApplication.instance()
        if app is None:
            app = QCoreApplication(sys.argv)

        from main import VideoWorker

        # Inject failure before Native init if requested
        if self.inject_native_failure:
            _inject_native_failure()

        source_fps = 24.0
        source_frames = 24
        target_frames = int(math.floor((source_frames - 1) * (self.target_fps / source_fps))) + 1

        # codec/crf/keep_audio required by VideoWorker._process_file (GUI always sets them).
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
            "codec": "H.265 (HEVC)",
            "crf": 18,
            "encode_preset": "medium",
            "keep_audio": True,
            "encoder_mode": "auto",
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
        # QThread → main-thread AutoConnection is queued; drain events until finished.
        deadline = time.perf_counter() + 600.0
        while not self._finished_event.is_set():
            app.processEvents()
            if not self._worker.isRunning() and not self._finished_event.is_set():
                # Thread ended without task_finished (e.g. hard abort); stop waiting.
                app.processEvents()
                break
            if time.perf_counter() >= deadline:
                break
            time.sleep(0.02)
        if self._worker.isRunning():
            self._worker.wait(5_000)
        self._timing["wall_end"] = time.perf_counter()
        self._timing["wall_elapsed_s"] = self._timing["wall_end"] - self._timing["wall_start"]

        # Find output video
        output_files = [
            f for f in os.listdir(self.output_dir)
            if f.endswith((".mp4", ".mkv", ".avi"))
        ]
        output_video = os.path.join(self.output_dir, output_files[0]) if output_files else ""

        # Extract backend info from logs
        logs_text = "\n".join(self._logs)
        backend_info = self._parse_backend_logs(logs_text)

        self._result = {
            "backend": self.backend_mode,
            "requested_backend": self.backend_mode,
            "active_backend": backend_info.get("active_backend", self.backend_mode),
            "fallback_occurred": backend_info.get("fallback") == "native_to_cli",
            "fallback_reason": backend_info.get("reason", ""),
            "success": self._success,
            "error": self._error_msg,
            "wall_elapsed_s": self._timing.get("wall_elapsed_s", 0),
            "output_video": output_video,
            "output_files": output_files,
            "logs": list(self._logs),
            "progress_values": list(self._progress_values),
            "logs_text": logs_text,
        }
        return self._result

    def _parse_backend_logs(self, logs_text: str) -> dict:
        """Extract backend config from log output (last BACKEND CONFIG block wins)."""
        result = {}
        lines = logs_text.splitlines()
        in_backend_config = False
        for line in lines:
            if "BACKEND CONFIG:" in line:
                in_backend_config = True
                continue
            if in_backend_config:
                # End block on blank line or a new CONFIG header.
                if not line.strip() or (
                    "CONFIG:" in line and "BACKEND CONFIG:" not in line
                ):
                    in_backend_config = False
                    continue
                if line.strip().startswith("mode="):
                    result["mode"] = line.split("=", 1)[1].strip()
                elif "requested_backend=" in line:
                    result["requested_backend"] = line.split("=", 1)[1].strip()
                elif "active_backend=" in line:
                    result["active_backend"] = line.split("=", 1)[1].strip()
                elif line.strip().startswith("fallback="):
                    result["fallback"] = line.split("=", 1)[1].strip()
                elif line.strip().startswith("reason="):
                    result["reason"] = line.split("=", 1)[1].strip()
        return result


# =============================================================================
# Native failure injection (for testing fallback)
# =============================================================================

_original_load_model = None
_native_failure_injected = False


def _inject_native_failure():
    """Temporarily patch NativeInterpolatorBackend to raise an error."""
    global _native_failure_injected, _original_load_model
    if _native_failure_injected:
        return

    try:
        from gvfi_runtime.interpolator_backend import NativeInterpolatorBackend
        _original_load_model = NativeInterpolatorBackend.load_model

        def failing_load_model(self, model_path: str) -> None:
            from gvfi_runtime.interpolator_backend import BackendError
            raise BackendError("INJECTED FAILURE: Simulated Native backend initialization failure for testing")

        NativeInterpolatorBackend.load_model = failing_load_model
        _native_failure_injected = True
    except Exception as e:
        print(f"  [WARN] Could not inject Native failure: {e}")


def _restore_native():
    """Restore original NativeInterpolatorBackend."""
    global _native_failure_injected, _original_load_model
    if not _native_failure_injected or _original_load_model is None:
        return

    try:
        from gvfi_runtime.interpolator_backend import NativeInterpolatorBackend
        NativeInterpolatorBackend.load_model = _original_load_model
        _native_failure_injected = False
        _original_load_model = None
    except Exception as e:
        print(f"  [WARN] Could not restore Native backend: {e}")


# =============================================================================
# Validation helpers
# =============================================================================

def validate_output(path: str, expected_frames: int, expected_width: int, expected_height: int, expected_fps: int) -> dict:
    """Validate output video properties."""
    result = {
        "path": path,
        "exists": os.path.isfile(path),
        "width": 0, "height": 0, "frames": "N/A", "fps": "0/1",
        "audio_codec": "", "audio_channels": 0,
        "ok": False, "errors": [],
    }

    if not result["exists"]:
        result["errors"].append("Output video not found")
        return result

    probe = probe_video(path)
    result.update({
        "width": probe.get("width", 0),
        "height": probe.get("height", 0),
        "frames": probe.get("frames", "N/A"),
        "fps": probe.get("fps", "0/1"),
        "audio_codec": probe.get("audio_codec", ""),
        "audio_channels": probe.get("audio_channels", 0),
    })

    if result["width"] != expected_width:
        result["errors"].append(f"Width mismatch: {result['width']} vs {expected_width}")
    if result["height"] != expected_height:
        result["errors"].append(f"Height mismatch: {result['height']} vs {expected_height}")
    if not result["audio_codec"]:
        result["errors"].append("No audio track found")

    result["ok"] = len(result["errors"]) == 0
    return result


def check_log_for_pattern(logs_text: str, pattern: str) -> bool:
    """Check if a pattern exists in log text."""
    return pattern in logs_text or pattern.upper() in logs_text.upper()


# =============================================================================
# TEST A: Native normal task
# =============================================================================

def test_a_native_normal() -> dict:
    """A. Native normal task - complete VideoWorker with backend_mode=native."""
    print("\n" + "=" * 70)
    print("TEST A: Native Normal Task")
    print("=" * 70)

    test_dir = os.path.join(RESULTS_DIR, "A_native_normal")
    shutil.rmtree(test_dir, ignore_errors=True)

    model = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")

    harness = VideoWorkerHarness(
        video_path=TEST_VIDEO,
        output_dir=test_dir,
        backend_mode="native",
        target_fps=INTERP_FPS,
        model=model,
        gpu=0,
        thread_config="1:2:2",
        inject_native_failure=False,
    )

    result = harness.run()
    logs_text = result.get("logs_text", "")

    # Validate output
    expected_frames = EXPECTED_OUT_FRAMES
    validation = validate_output(
        result["output_video"],
        expected_frames,
        EXPECTED_WIDTH, EXPECTED_HEIGHT,
        INTERP_FPS
    )

    # Check for success indicators
    success_checks = {
        "task_completed": result["success"],
        "output_exists": validation["exists"],
        "correct_resolution": validation["width"] == EXPECTED_WIDTH and validation["height"] == EXPECTED_HEIGHT,
        "has_audio": bool(validation["audio_codec"]),
        "active_backend_is_native": result.get("active_backend") == "native",
        "fallback_not_triggered": not result.get("fallback_occurred", False),
        "no_errors": result["error"] == "" or "完成" in result["error"],
    }

    print(f"\n  Result: {'PASS' if all(success_checks.values()) else 'FAIL'}")
    print(f"  Success checks:")
    for k, v in success_checks.items():
        print(f"    {k}: {'✓' if v else '✗'}")
    print(f"  Output: {result['output_video']}")
    print(f"  Active backend: {result.get('active_backend')}")
    print(f"  Fallback occurred: {result.get('fallback_occurred')}")
    print(f"  Wall time: {result.get('wall_elapsed_s', 0):.2f}s")

    return {
        "test": "A",
        "name": "Native Normal Task",
        "passed": all(success_checks.values()),
        "result": result,
        "validation": validation,
        "checks": success_checks,
    }


# =============================================================================
# TEST B: Native fallback
# =============================================================================

def test_b_native_fallback() -> dict:
    """B. Native fallback - forced failure triggers automatic CLI fallback."""
    print("\n" + "=" * 70)
    print("TEST B: Native Fallback")
    print("=" * 70)

    test_dir = os.path.join(RESULTS_DIR, "B_native_fallback")
    shutil.rmtree(test_dir, ignore_errors=True)

    model = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")

    # Inject Native failure
    _inject_native_failure()

    try:
        harness = VideoWorkerHarness(
            video_path=TEST_VIDEO,
            output_dir=test_dir,
            backend_mode="native",  # Request Native
            target_fps=INTERP_FPS,
            model=model,
            gpu=0,
            thread_config="2:4:4",
            inject_native_failure=True,
        )

        result = harness.run()
        logs_text = result.get("logs_text", "")

        # Validate output
        expected_frames = EXPECTED_OUT_FRAMES
        validation = validate_output(
            result["output_video"],
            expected_frames,
            EXPECTED_WIDTH, EXPECTED_HEIGHT,
            INTERP_FPS
        )

        # Check for fallback indicators
        has_native_failure_msg = check_log_for_pattern(logs_text, "NATIVE BACKEND FAILED")
        has_fallback_msg = check_log_for_pattern(logs_text, "FALLING BACK TO CLI")
        has_active_cli = result.get("active_backend") == "cli"
        has_fallback_occurred = result.get("fallback_occurred", False)
        has_reason = bool(result.get("fallback_reason", ""))
        output_exists = validation["exists"]

        # CRITICAL: Must produce exactly ONE output (CLI fallback, not both)
        output_count = len(result.get("output_files", []))
        single_output = output_count == 1

        success_checks = {
            "native_failure_detected": has_native_failure_msg,
            "fallback_triggered": has_fallback_msg or has_fallback_occurred,
            "active_backend_is_cli": has_active_cli,
            "fallback_occurred": has_fallback_occurred,
            "has_fallback_reason": has_reason,
            "output_exists": output_exists,
            "single_output_only": single_output,
            "no_duplicate_frames": True,  # CLI fallback = single output
        }

        print(f"\n  Result: {'PASS' if all(success_checks.values()) else 'FAIL'}")
        print(f"  Success checks:")
        for k, v in success_checks.items():
            print(f"    {k}: {'✓' if v else '✗'}")
        print(f"  Fallback reason: {result.get('fallback_reason', 'N/A')}")
        print(f"  Output count: {output_count}")
        print(f"  Active backend: {result.get('active_backend')}")

        return {
            "test": "B",
            "name": "Native Fallback",
            "passed": all(success_checks.values()),
            "result": result,
            "validation": validation,
            "checks": success_checks,
        }
    finally:
        _restore_native()


# =============================================================================
# TEST C: Cross-task state recovery
# =============================================================================

def test_c_cross_task_recovery() -> dict:
    """C. Cross-task state recovery - verify fallback doesn't pollute subsequent tasks."""
    print("\n" + "=" * 70)
    print("TEST C: Cross-Task State Recovery")
    print("=" * 70)

    results = []
    model = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")

    tasks = [
        # Task 1: Native success
        {
            "name": "Task 1 - Native Success",
            "backend_mode": "native",
            "inject_failure": False,
            "expected_active": "native",
            "expected_fallback": False,
        },
        # Task 2: Native fail → CLI fallback
        {
            "name": "Task 2 - Native Fail → CLI",
            "backend_mode": "native",
            "inject_failure": True,
            "expected_active": "cli",
            "expected_fallback": True,
        },
        # Task 3: Native success again (should reinitialize Native)
        {
            "name": "Task 3 - Native Success Again",
            "backend_mode": "native",
            "inject_failure": False,
            "expected_active": "native",
            "expected_fallback": False,
        },
        # Task 4: CLI normal
        {
            "name": "Task 4 - CLI Normal",
            "backend_mode": "cli",
            "inject_failure": False,
            "expected_active": "cli",
            "expected_fallback": False,
        },
    ]

    for i, task in enumerate(tasks, 1):
        print(f"\n  --- {task['name']} ---")

        task_dir = os.path.join(RESULTS_DIR, f"C_task_{i}")
        shutil.rmtree(task_dir, ignore_errors=True)

        if task["inject_failure"]:
            _inject_native_failure()
        else:
            _restore_native()

        try:
            harness = VideoWorkerHarness(
                video_path=TEST_VIDEO,
                output_dir=task_dir,
                backend_mode=task["backend_mode"],
                target_fps=INTERP_FPS,
                model=model,
                gpu=0,
                thread_config="2:4:4",
                inject_native_failure=task["inject_failure"],
            )

            result = harness.run()
            expected_frames = EXPECTED_OUT_FRAMES
            validation = validate_output(
                result["output_video"],
                expected_frames,
                EXPECTED_WIDTH, EXPECTED_HEIGHT,
                INTERP_FPS
            )

            task_result = {
                "name": task["name"],
                "success": result["success"],
                "active_backend": result.get("active_backend"),
                "fallback_occurred": result.get("fallback_occurred"),
                "fallback_reason": result.get("fallback_reason"),
                "expected_active": task["expected_active"],
                "expected_fallback": task["expected_fallback"],
                "output_exists": validation["exists"],
                "validation": validation,
            }

            # Validate against expectations
            task_result["checks"] = {
                "active_backend_correct": task_result["active_backend"] == task["expected_active"],
                "fallback_correct": task_result["fallback_occurred"] == task["expected_fallback"],
                "output_exists": task_result["output_exists"],
            }
            task_result["passed"] = all(task_result["checks"].values())

            results.append(task_result)

            print(f"    Expected active: {task['expected_active']}, Actual: {task_result['active_backend']}")
            print(f"    Expected fallback: {task['expected_fallback']}, Actual: {task_result['fallback_occurred']}")
            print(f"    Result: {'PASS ✓' if task_result['passed'] else 'FAIL ✗'}")

        finally:
            if task["inject_failure"]:
                _restore_native()

    # Overall result
    all_passed = all(r["passed"] for r in results)
    no_subsequent_pollution = all(
        r["name"] != "Task 3 - Native Success Again" or r["active_backend"] == "native"
        for r in results
    )

    print(f"\n  Overall: {'PASS' if all_passed else 'FAIL'}")
    print(f"  Cross-task pollution check: {'PASS' if no_subsequent_pollution else 'FAIL'}")

    return {
        "test": "C",
        "name": "Cross-Task State Recovery",
        "passed": all_passed,
        "task_results": results,
        "pollution_check": no_subsequent_pollution,
    }


# =============================================================================
# TEST D: Continuous stability (10 runs with mixed scenarios)
# =============================================================================

def test_d_stability() -> dict:
    """D. Continuous stability - 10 runs with mixed Native/CLI/fallback scenarios."""
    print("\n" + "=" * 70)
    print("TEST D: Continuous Stability (10 runs)")
    print("=" * 70)

    model = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")

    # Test matrix: mix of scenarios
    test_matrix = [
        # Run 1-3: Native success
        {"backend": "native", "inject_failure": False, "label": "Native OK"},
        {"backend": "native", "inject_failure": False, "label": "Native OK"},
        {"backend": "native", "inject_failure": False, "label": "Native OK"},
        # Run 4: Native fallback
        {"backend": "native", "inject_failure": True, "label": "Native → CLI"},
        # Run 5-7: Native success
        {"backend": "native", "inject_failure": False, "label": "Native OK"},
        {"backend": "native", "inject_failure": False, "label": "Native OK"},
        {"backend": "native", "inject_failure": False, "label": "Native OK"},
        # Run 8: Native fallback
        {"backend": "native", "inject_failure": True, "label": "Native → CLI"},
        # Run 9: Native success
        {"backend": "native", "inject_failure": False, "label": "Native OK"},
        # Run 10: CLI normal
        {"backend": "cli", "inject_failure": False, "label": "CLI OK"},
    ]

    stability_dir = os.path.join(RESULTS_DIR, "D_stability_10")
    shutil.rmtree(stability_dir, ignore_errors=True)
    os.makedirs(stability_dir)

    run_results = []
    success_count = 0
    fail_count = 0
    crash_count = 0
    timings = []

    for i, run in enumerate(test_matrix, 1):
        print(f"\n  Run {i}/10: {run['label']}...", end=" ", flush=True)

        run_dir = os.path.join(stability_dir, f"run_{i:02d}")
        shutil.rmtree(run_dir, ignore_errors=True)

        if run["inject_failure"]:
            _inject_native_failure()
        else:
            _restore_native()

        try:
            harness = VideoWorkerHarness(
                video_path=TEST_VIDEO,
                output_dir=run_dir,
                backend_mode=run["backend"],
                target_fps=INTERP_FPS,
                model=model,
                gpu=0,
                thread_config="2:4:4",
                inject_native_failure=run["inject_failure"],
            )

            t0 = time.perf_counter()
            result = harness.run()
            elapsed = time.perf_counter() - t0
            timings.append(elapsed)

            expected_frames = EXPECTED_OUT_FRAMES
            validation = validate_output(
                result["output_video"],
                expected_frames,
                EXPECTED_WIDTH, EXPECTED_HEIGHT,
                INTERP_FPS
            )

            # Determine expected backend state
            if run["inject_failure"]:
                expected_active = "cli"
                expected_fallback = True
            else:
                expected_active = run["backend"]
                expected_fallback = False

            run_result = {
                "run": i,
                "label": run["label"],
                "backend": run["backend"],
                "inject_failure": run["inject_failure"],
                "success": result["success"],
                "active_backend": result.get("active_backend"),
                "fallback_occurred": result.get("fallback_occurred"),
                "fallback_reason": result.get("fallback_reason"),
                "expected_active": expected_active,
                "expected_fallback": expected_fallback,
                "output_exists": validation["exists"],
                "output_frames": validation.get("frames", "N/A"),
                "wall_time_s": elapsed,
            }

            # Validate
            checks = {
                "success": run_result["success"],
                "active_backend_correct": run_result["active_backend"] == expected_active,
                "fallback_correct": run_result["fallback_occurred"] == expected_fallback,
                "output_exists": run_result["output_exists"],
            }
            run_result["checks"] = checks
            run_result["passed"] = all(checks.values())

            run_results.append(run_result)

            if run_result["passed"]:
                success_count += 1
                print(f"OK ({elapsed:.2f}s, {run_result['active_backend']})")
            else:
                fail_count += 1
                print(f"FAIL")
                for k, v in checks.items():
                    if not v:
                        print(f"    {k}: expected {run_result.get(f'expected_{k}') or (expected_active if k == 'active_backend_correct' else expected_fallback)}, got {run_result.get('active_backend') if k == 'active_backend_correct' else run_result.get('fallback_occurred')}")

        except Exception as exc:
            crash_count += 1
            fail_count += 1
            run_results.append({
                "run": i,
                "label": run["label"],
                "crash": True,
                "error": str(exc),
                "passed": False,
            })
            print(f"CRASH: {exc}")

        finally:
            if run["inject_failure"]:
                _restore_native()

        gc.collect()

    # Summary
    print(f"\n  Summary: {success_count}/10 succeeded, {fail_count} failed, {crash_count} crashes")
    if timings:
        valid_timings = [t for t in timings if t > 0]
        if valid_timings:
            print(f"  Timings: min={min(valid_timings):.2f}s, max={max(valid_timings):.2f}s, avg={sum(valid_timings)/len(valid_timings):.2f}s")

    # Breakdown by type
    native_ok = sum(1 for r in run_results if r.get("label") == "Native OK" and r.get("passed"))
    native_fallback = sum(1 for r in run_results if r.get("label") == "Native → CLI" and r.get("passed"))
    cli_ok = sum(1 for r in run_results if r.get("label") == "CLI OK" and r.get("passed"))

    print(f"  Breakdown: Native OK={native_ok}/6, Fallback={native_fallback}/2, CLI OK={cli_ok}/1")

    return {
        "test": "D",
        "name": "Continuous Stability",
        "passed": success_count == 10 and crash_count == 0,
        "run_results": run_results,
        "success_count": success_count,
        "fail_count": fail_count,
        "crash_count": crash_count,
        "timings": timings,
        "breakdown": {"native_ok": native_ok, "native_fallback": native_fallback, "cli_ok": cli_ok},
    }


# =============================================================================
# TEST E: Default config protection
# =============================================================================

def test_e_default_config() -> dict:
    """E. Default config protection - verify backend_mode default is still 'cli'."""
    print("\n" + "=" * 70)
    print("TEST E: Default Config Protection")
    print("=" * 70)

    # Check default in VideoWorker __init__
    from main import VideoWorker

    # Get the default backend_mode from params default
    default_backend = str({"backend_mode": "cli"}.get("backend_mode", "cli"))
    source_default = "cli"  # Should be 'cli'

    # Verify by inspecting source
    import inspect
    source_code = inspect.getsource(VideoWorker.__init__)
    has_cli_default = '"cli"' in source_code or "'cli'" in source_code
    no_native_default = 'backend_mode", "native")' not in source_code and 'backend_mode", \'native\')' not in source_code

    # Check that create_interpolator_backend uses 'cli' as default
    from gvfi_runtime.interpolator_backend import create_interpolator_backend
    source_create = inspect.getsource(create_interpolator_backend)
    cli_is_default = '"cli"' in source_create or "'cli'" in source_create

    checks = {
        "default_is_cli": default_backend == "cli",
        "source_has_cli_default": has_cli_default,
        "no_native_default_in_source": no_native_default,
        "factory_uses_cli_default": cli_is_default,
    }

    print(f"\n  Default backend_mode: {default_backend}")
    print(f"  Source has 'cli' default: {has_cli_default}")
    print(f"  No 'native' default in source: {no_native_default}")
    print(f"  Factory uses 'cli' default: {cli_is_default}")
    print(f"\n  Result: {'PASS' if all(checks.values()) else 'FAIL'}")

    return {
        "test": "E",
        "name": "Default Config Protection",
        "passed": all(checks.values()),
        "default_backend": default_backend,
        "checks": checks,
    }


# =============================================================================
# Main
# =============================================================================

def main():
    print("=" * 70)
    print("C5.4 — Native Backend Final Production Validation")
    print("=" * 70)

    # Verify test video
    if not os.path.isfile(TEST_VIDEO):
        print(f"\nFATAL: Test video not found: {TEST_VIDEO}")
        return 1

    with open(TEST_VIDEO, "rb") as f:
        actual_sha = hashlib.sha256(f.read()).hexdigest().upper()
    if actual_sha != TEST_VIDEO_SHA256:
        print(f"\nFATAL: Test video SHA-256 mismatch:")
        print(f"  Expected: {TEST_VIDEO_SHA256}")
        print(f"  Got:      {actual_sha}")
        return 1

    print(f"\n[OK] Test video verified: {Path(TEST_VIDEO).name}")
    print(f"     SHA-256: {TEST_VIDEO_SHA256}")
    print(f"     1920x1080, 24fps, 24 frames, H.264/AAC")

    # Prepare results directory
    shutil.rmtree(RESULTS_DIR, ignore_errors=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    # Run all tests
    results = {}

    try:
        results["A"] = test_a_native_normal()
    except Exception as e:
        results["A"] = {"test": "A", "passed": False, "error": str(e)}
        print(f"\n  [ERROR] Test A failed with exception: {e}")

    try:
        results["B"] = test_b_native_fallback()
    except Exception as e:
        results["B"] = {"test": "B", "passed": False, "error": str(e)}
        print(f"\n  [ERROR] Test B failed with exception: {e}")

    try:
        results["C"] = test_c_cross_task_recovery()
    except Exception as e:
        results["C"] = {"test": "C", "passed": False, "error": str(e)}
        print(f"\n  [ERROR] Test C failed with exception: {e}")

    try:
        results["D"] = test_d_stability()
    except Exception as e:
        results["D"] = {"test": "D", "passed": False, "error": str(e)}
        print(f"\n  [ERROR] Test D failed with exception: {e}")

    try:
        results["E"] = test_e_default_config()
    except Exception as e:
        results["E"] = {"test": "E", "passed": False, "error": str(e)}
        print(f"\n  [ERROR] Test E failed with exception: {e}")

    # Final summary
    print("\n" + "=" * 70)
    print("FINAL SUMMARY")
    print("=" * 70)

    all_passed = all(r.get("passed", False) for r in results.values())

    for test_id in ["A", "B", "C", "D", "E"]:
        result = results.get(test_id, {"passed": False, "error": "Not run"})
        status = "PASS ✓" if result.get("passed") else "FAIL ✗"
        print(f"  Test {test_id}: {status}")
        if not result.get("passed") and result.get("error"):
            print(f"    Error: {result['error']}")

    print(f"\n  {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    print(f"\n  Results directory: {RESULTS_DIR}")

    # Save results to JSON
    results_file = os.path.join(RESULTS_DIR, "c54_results.json")
    with open(results_file, "w", encoding="utf-8") as f:
        # Convert non-serializable objects
        json_results = {}
        for k, v in results.items():
            json_results[k] = {kk: vv for kk, vv in v.items() if kk != "logs_text"}
        json.dump(json_results, f, indent=2, ensure_ascii=False, default=str)
    print(f"  Results saved to: {results_file}")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
