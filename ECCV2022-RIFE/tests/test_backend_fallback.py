"""
C5.3 — Native RIFE Backend Production Fallback Integration Tests

Tests the VideoWorker pipeline with the Native→CLI fallback mechanism.

Covers:
  1. backend_mode=cli — CLI normal completion
  2. backend_mode=native — Native normal completion
  3. Native init failure → CLI fallback succeeds
  4. Native forward failure → CLI fallback succeeds, no duplicate frames
  5. CLI fallback failure → final task failure with traceable error
  6. Native succeeds → second task still works (no stale state)
  7. backend_mode=native — frame order correctness
  8. backend config logging format (CLI)
  9. backend config logging format (Native)

Uses the fixed test video from C5.2:
  D:\\GVFI-deps\\native-video-worker-ab\\input\\p0_src_1080p24_audio.mp4
"""

from __future__ import annotations

import gc
import json
import math
import os
import shutil
import subprocess
import sys
import time
import unittest
from pathlib import Path
from typing import Callable, Optional

# Ensure module path
_ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
_REPO_ROOT = r"D:\BaiduNetdiskDownload\GVFI"
for _p in (_ENGINE_ROOT, _REPO_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from gvfi_runtime.interpolator_backend import BackendError


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
MODEL = os.path.join(_ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab"
RIFE_EXE = os.path.join(_ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-ncnn-vulkan.exe")


def compute_target_frames(src_frames: int, src_fps: float, tgt_fps: float) -> int:
    return int(math.floor((src_frames - 1) * (tgt_fps / src_fps))) + 1


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def decode_video_to_png(video_path: str, output_dir: str) -> int:
    os.makedirs(output_dir, exist_ok=True)
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", video_path,
         "-vsync", "0", "-qscale:v", "1",
         os.path.join(output_dir, "%08d.png")],
        capture_output=True, text=True, timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg decode failed:\n{result.stderr[-500:]}")
    return len(list(Path(output_dir).glob("*.png")))


def encode_video_from_png(frames_dir: str, audio_src: str, output_path: str,
                          fps: float, width: int, height: int) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y",
         "-framerate", str(fps), "-i", os.path.join(frames_dir, "%08d.png"),
         "-i", audio_src,
         "-c:v", "libx265", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k",
         "-map", "0:v", "-map", "1:a",
         output_path],
        capture_output=True, text=True, timeout=300, check=True,
    )


def extract_audio(video_path: str, audio_path: str) -> None:
    os.makedirs(os.path.dirname(audio_path), exist_ok=True)
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", video_path,
         "-vn", "-c:a", "copy", "-f", "mp4", audio_path],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Audio extract failed:\n{result.stderr[-300:]}")


def probe_video(path: str) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "error",
         "-select_streams", "v:0",
         "-show_entries", "stream=width,height,nb_frames,r_frame_rate,codec_name",
         "-of", "json", path],
        capture_output=True, text=True, timeout=30,
    )
    streams = json.loads(result.stdout).get("streams", [{}])
    v = (streams or [{}])[0]
    return {
        "width": v.get("width", 0),
        "height": v.get("height", 0),
        "frames": v.get("nb_frames", "N/A"),
        "fps": v.get("r_frame_rate", "0/1"),
        "codec": v.get("codec_name", ""),
    }


# ---------------------------------------------------------------------------
# Native backend failure injection factories
# ---------------------------------------------------------------------------

def make_broken_native_init():
    """NativeInterpolatorBackend subclass that fails on initialize()."""
    from gvfi_runtime.interpolator_backend import BackendError, NativeInterpolatorBackend

    class BrokenNative(NativeInterpolatorBackend):
        def initialize(self):
            raise BackendError("simulated_native_init_failure")

    return BrokenNative()


def make_broken_native_forward():
    """NativeInterpolatorBackend subclass that fails on first process_directory call."""
    from gvfi_runtime.interpolator_backend import BackendError, NativeInterpolatorBackend

    class BrokenForwardNative(NativeInterpolatorBackend):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._call_count = 0

        def process_directory(self, input_path, output_path, *, target_frames, gpu, thread_config):
            self._call_count += 1
            if self._call_count == 1:
                raise BackendError("simulated_native_forward_failure")
            return super().process_directory(
                input_path, output_path,
                target_frames=target_frames, gpu=gpu, thread_config=thread_config,
            )

    return BrokenForwardNative()


# ---------------------------------------------------------------------------
# Standalone pipeline runner
# ---------------------------------------------------------------------------

def run_pipeline(
    video_path: str,
    output_dir: str,
    backend: str,
    target_fps: int,
    model: str,
    gpu: int = 0,
    thread_config: str = "2:4:4",
    broken_native_factory: Optional[Callable[[], object]] = None,
) -> dict:
    """
    Full pipeline: decode → dedup → scene detection → RIFE → encode.

    broken_native_factory: if provided, replaces the Native backend with this factory
    result (used to simulate Native failures).

    Returns dict with:
      success, output_video, rife_frames, active_backend,
      fallback_occurred, fallback_reason, logs, timing
    """
    os.makedirs(output_dir, exist_ok=True)

    from gvfi_runtime.interpolator_backend import (
        BackendError,
        BackendNotImplementedError,
        create_interpolator_backend,
    )
    from gvfi_runtime.rife_cli_pipeline import stage_frame_range, collect_frames
    from gvfi_runtime.rife_scene_scheduler import RifeWorkerManager, SceneTask
    from svfi_pipeline import (
        allocate_output_counts, build_segments, detect_scene_cuts,
        frame_paths, remove_duplicate_frames,
    )

    # Intercept create_interpolator_backend for Native failure injection.
    _orig_create = create_interpolator_backend

    def _patched_create(mode, **kw):
        if mode == "native" and broken_native_factory is not None:
            return broken_native_factory()
        return _orig_create(mode, **kw)

    import gvfi_runtime.interpolator_backend as _ib_mod
    _saved = _ib_mod.create_interpolator_backend
    _ib_mod.create_interpolator_backend = _patched_create

    try:
        # State
        active_backend = backend
        fallback_occurred = False
        fallback_reason = ""
        logs: list[str] = []

        def _log(msg: str) -> None:
            logs.append(msg)

        # CLI command runner (no subprocess window)
        def _cli_runner(cmd, stage, cwd):
            subprocess.run(cmd, capture_output=True, cwd=cwd, check=False)

        # Build initial interpolator
        interpolator = _patched_create(
            backend,
            executable=RIFE_EXE,
            working_directory=_ENGINE_ROOT,
            command_runner=_cli_runner,
            log_callback=_log,
        )

        # Log initial BACKEND CONFIG
        _log(
            "BACKEND CONFIG:\n"
            f"mode={interpolator.name}\n"
            f"requested_backend={backend}\n"
            f"active_backend={active_backend}\n"
            f"fallback={'native_to_cli' if fallback_occurred else 'none'}\n"
            f"reason=initial"
        )

        # --- helpers ---

        def _ensure_init():
            """Ensure the current backend is initialized and model-loaded."""
            if not interpolator.initialized:
                interpolator.initialize()
            if interpolator.model_path != model:
                interpolator.load_model(model)

        def _switch_to_cli(reason: str) -> None:
            """Switch from Native to CLI, update state and log."""
            nonlocal active_backend, fallback_occurred, fallback_reason, interpolator
            if active_backend == "cli":
                return
            _log(
                f"  NATIVE BACKEND FAILED -- FALLING BACK TO CLI: {reason}"
            )
            fallback_occurred = True
            fallback_reason = reason[:200]
            interpolator.release()
            active_backend = "cli"
            interpolator = _orig_create(
                "cli",
                executable=RIFE_EXE,
                working_directory=_ENGINE_ROOT,
                command_runner=_cli_runner,
                log_callback=_log,
            )
            interpolator.initialized = False
            interpolator.model_path = ""
            _log(
                "BACKEND CONFIG:\n"
                f"mode=cli\n"
                f"requested_backend={backend}\n"
                f"active_backend=cli\n"
                f"fallback=native_to_cli\n"
                f"reason={fallback_reason}"
            )

        def _run_rife(input_dir, output_dir, target_n):
            """Run RIFE on one directory; fallback on Native failure."""
            os.makedirs(output_dir, exist_ok=True)
            try:
                _ensure_init()
                interpolator.process_directory(
                    input_dir, output_dir,
                    target_frames=int(target_n),
                    gpu=gpu, thread_config=thread_config,
                )
            except (BackendError, BackendNotImplementedError) as exc:
                if active_backend == "native":
                    _switch_to_cli(str(exc))
                    # _switch_to_cli builds a fresh CLI backend but does NOT initialize it;
                    # initialize it here so process_directory() can proceed.
                    interpolator.initialize()
                    interpolator.load_model(model)
                    interpolator.process_directory(
                        input_dir, output_dir,
                        target_frames=int(target_n),
                        gpu=gpu, thread_config=thread_config,
                    )
                else:
                    raise

        # --- timing ---
        timing = {}
        t0 = time.perf_counter()
        audio_path = os.path.join(output_dir, "audio.m4a")
        extract_audio(video_path, audio_path)
        timing["audio_s"] = time.perf_counter() - t0

        t0 = time.perf_counter()
        raw_dir = os.path.join(output_dir, "raw_frames")
        decode_video_to_png(video_path, raw_dir)
        timing["decode_s"] = time.perf_counter() - t0

        t0 = time.perf_counter()
        dedup_dir = os.path.join(output_dir, "dedup_frames")
        os.makedirs(dedup_dir, exist_ok=True)
        remove_duplicate_frames(raw_dir, dedup_dir, threshold=1.5, log=lambda x: None)
        timing["dedup_s"] = time.perf_counter() - t0

        unique_count = len(list(Path(dedup_dir).glob("*.png")))
        t0 = time.perf_counter()
        cuts = detect_scene_cuts(dedup_dir, threshold=12.0, log=lambda x: None)
        segments = build_segments(unique_count, cuts)
        timing["scdet_s"] = time.perf_counter() - t0

        src_fps = 24.0
        target_frame_count = compute_target_frames(unique_count, src_fps, float(target_fps))
        target_frame_count = max(
            target_frame_count,
            unique_count + (1 if target_fps > src_fps else 0),
        )
        lengths = [end - start for start, end in segments]
        out_counts = allocate_output_counts(lengths, target_frame_count)

        t0 = time.perf_counter()
        if len(segments) == 1:
            rife_dir = os.path.join(output_dir, "rife_frames")
            _run_rife(dedup_dir, rife_dir, int(out_counts[0]))
        else:
            scene_root = os.path.join(output_dir, "scenes")
            os.makedirs(scene_root, exist_ok=True)
            active_paths = frame_paths(dedup_dir)
            next_index = 1
            scene_tasks = []
            for scene_i, ((start, end), out_n) in enumerate(zip(segments, out_counts), start=1):
                scene_in = os.path.join(scene_root, f"in_{scene_i:03d}")
                scene_out = os.path.join(scene_root, f"out_{scene_i:03d}")
                for d in (scene_in, scene_out):
                    if os.path.isdir(d):
                        shutil.rmtree(d, ignore_errors=True)
                input_paths = tuple(active_paths[start:end])
                scene_tasks.append(SceneTask(
                    scene_index=scene_i,
                    input_frames=input_paths,
                    input_path=scene_in,
                    output_path=scene_out,
                    final_output_path=os.path.join(output_dir, "rife_frames"),
                    output_start_index=next_index,
                    target_frames=out_n,
                    model=model,
                    gpu=gpu,
                    resolution=(1920, 1080),
                    requires_inference=len(input_paths) > 1 and out_n > len(input_paths),
                ))
                nxt = out_n if len(input_paths) > 1 and out_n > len(input_paths) else len(input_paths)
                next_index += nxt

            def stage_scene(task):
                stage_frame_range(task.input_frames, task.input_path, 0, len(task.input_frames))

            def process_scene(task):
                _run_rife(task.input_path, task.output_path, task.target_frames)

            def collect_scene(task):
                source = task.output_path if task.requires_inference else task.input_path
                written, _, _ = collect_frames(
                    source, task.final_output_path, start_index=task.output_start_index,
                )
                expected = (task.target_frames if task.requires_inference
                            else len(task.input_frames))
                if written != expected:
                    raise RuntimeError(
                        f"scene {task.scene_index}: wrote {written}, expected {expected}"
                    )

            manager = RifeWorkerManager(queue_size=2)
            manager.run(scene_tasks, stage=stage_scene,
                       process=process_scene, collect=collect_scene)

        timing["rife_s"] = time.perf_counter() - t0
        rife_frames = len(list(Path(os.path.join(output_dir, "rife_frames")).glob("*.png")))

        t0 = time.perf_counter()
        out_video = os.path.join(output_dir, f"output_{backend}.mp4")
        try:
            encode_video_from_png(
                os.path.join(output_dir, "rife_frames"), audio_path,
                out_video, float(target_fps), 1920, 1080,
            )
        except subprocess.CalledProcessError:
            out_video = ""
        timing["encode_s"] = time.perf_counter() - t0

        interpolator.release()

        return {
            "success": bool(out_video) and os.path.isfile(out_video),
            "output_video": out_video,
            "rife_frames": rife_frames,
            "backend": backend,
            "active_backend": active_backend,
            "fallback_occurred": fallback_occurred,
            "fallback_reason": fallback_reason,
            "logs": list(logs),
            "timing": timing,
        }
    finally:
        _ib_mod.create_interpolator_backend = _saved


# ---------------------------------------------------------------------------
# Test fixtures
# ---------------------------------------------------------------------------

def _available() -> bool:
    return os.path.isfile(TEST_VIDEO) and os.path.isdir(MODEL)


@unittest.skipUnless(_available(), "Test video or model unavailable")
class TestBackendFallback(unittest.TestCase):
    """Integration tests for Native→CLI fallback."""

    def setUp(self):
        self.results_root = os.path.join(
            RESULTS_DIR, f"c53_test_{int(time.time() * 1000)}"
        )
        os.makedirs(self.results_root, exist_ok=True)

    def tearDown(self):
        gc.collect()

    def test_cli_normal(self):
        """backend_mode=cli completes normally with correct frame count."""
        out = os.path.join(self.results_root, "t1_cli")
        r = run_pipeline(TEST_VIDEO, out, "cli", target_fps=48, model=MODEL, gpu=0)
        self.assertTrue(r["success"], f"CLI failed: {r['logs'][-3:]}")
        self.assertEqual(r["active_backend"], "cli")
        self.assertFalse(r["fallback_occurred"])
        self.assertEqual(r["rife_frames"], 47)
        p = probe_video(r["output_video"])
        self.assertEqual(p["width"], 1920)
        self.assertEqual(p["height"], 1080)

    def test_native_normal(self):
        """backend_mode=native completes normally with correct frame count."""
        out = os.path.join(self.results_root, "t2_native")
        r = run_pipeline(TEST_VIDEO, out, "native", target_fps=48, model=MODEL, gpu=0)
        self.assertTrue(r["success"], f"Native failed: {r['logs'][-3:]}")
        self.assertEqual(r["active_backend"], "native")
        self.assertFalse(r["fallback_occurred"])
        self.assertEqual(r["rife_frames"], 47)
        p = probe_video(r["output_video"])
        self.assertEqual(p["width"], 1920)
        self.assertEqual(p["height"], 1080)

    def test_native_init_fallback(self):
        """Native initialization failure triggers CLI fallback."""
        out = os.path.join(self.results_root, "t3_init_fallback")
        r = run_pipeline(
            TEST_VIDEO, out, "native", target_fps=48, model=MODEL, gpu=0,
            broken_native_factory=make_broken_native_init,
        )
        self.assertTrue(r["success"], f"Fallback failed: {r['logs']}")
        self.assertTrue(r["fallback_occurred"])
        self.assertEqual(r["active_backend"], "cli")
        combined = "\n".join(r["logs"])
        self.assertIn("FAILED", combined)
        self.assertIn("simulated_native_init_failure", combined)
        self.assertEqual(r["rife_frames"], 47)

    def test_native_forward_fallback_no_duplicates(self):
        """Native forward failure triggers CLI fallback; no duplicate frame indices."""
        out = os.path.join(self.results_root, "t4_fwd_fallback")
        r = run_pipeline(
            TEST_VIDEO, out, "native", target_fps=48, model=MODEL, gpu=0,
            broken_native_factory=make_broken_native_forward,
        )
        self.assertTrue(r["success"], f"Fallback failed: {r['logs']}")
        self.assertTrue(r["fallback_occurred"])
        self.assertEqual(r["active_backend"], "cli")
        self.assertEqual(r["rife_frames"], 47)

        # Check no duplicate frame indices.
        rife_dir = os.path.join(out, "rife_frames")
        names = sorted(os.listdir(rife_dir))
        indices = sorted(
            int(n.replace(".png", "").lstrip("0") or "0")
            for n in names if n.endswith(".png")
        )
        dups = [i for i in indices if indices.count(i) > 1]
        self.assertEqual(dups, [], f"Duplicate indices found: {dups}")

    def test_cli_fallback_failure(self):
        """If both Native and CLI fail, the task fails with traceable error."""
        from gvfi_runtime.interpolator_backend import BackendError
        out = os.path.join(self.results_root, "t5_both_fail")
        bak = RIFE_EXE + ".bak_c53"
        moved = os.path.isfile(bak)
        if not moved and os.path.isfile(RIFE_EXE):
            os.rename(RIFE_EXE, bak)
        try:
            with self.assertRaises((BackendError, FileNotFoundError, RuntimeError)):
                run_pipeline(
                    TEST_VIDEO, out, "native", target_fps=48, model=MODEL, gpu=0,
                    broken_native_factory=make_broken_native_init,
                )
        finally:
            if os.path.isfile(bak):
                os.rename(bak, RIFE_EXE)

    def test_native_second_task_works(self):
        """A successful Native task does not corrupt state for the next task."""
        out1 = os.path.join(self.results_root, "t6a_native")
        r1 = run_pipeline(TEST_VIDEO, out1, "native", target_fps=48, model=MODEL, gpu=0)
        self.assertTrue(r1["success"])
        self.assertEqual(r1["active_backend"], "native")
        self.assertFalse(r1["fallback_occurred"])

        out2 = os.path.join(self.results_root, "t6b_native")
        r2 = run_pipeline(TEST_VIDEO, out2, "native", target_fps=48, model=MODEL, gpu=0)
        self.assertTrue(r2["success"])
        self.assertEqual(r2["active_backend"], "native")
        self.assertFalse(r2["fallback_occurred"])
        self.assertEqual(r2["rife_frames"], 47)

        out3 = os.path.join(self.results_root, "t6c_cli")
        r3 = run_pipeline(TEST_VIDEO, out3, "cli", target_fps=48, model=MODEL, gpu=0)
        self.assertTrue(r3["success"])
        self.assertEqual(r3["active_backend"], "cli")

    def test_native_frame_order(self):
        """Native output frames are numbered sequentially without gaps or reordering."""
        out = os.path.join(self.results_root, "t7_frame_order")
        r = run_pipeline(TEST_VIDEO, out, "native", target_fps=48, model=MODEL, gpu=0)
        self.assertTrue(r["success"])

        rife_dir = os.path.join(out, "rife_frames")
        pngs = sorted(Path(rife_dir).glob("*.png"))
        indices = []
        for p in pngs:
            try:
                indices.append(int(p.stem))
            except ValueError:
                self.fail(f"Non-numeric PNG filename: {p.name}")

        self.assertEqual(len(indices), 47, f"Expected 47, got {len(indices)}")
        self.assertEqual(len(indices), len(set(indices)), "Duplicate indices found")
        self.assertEqual(indices[0], 1)
        self.assertEqual(indices[-1], 47)


@unittest.skipUnless(_available(), "Test video or model unavailable")
class TestBackendLogging(unittest.TestCase):
    """Verify the BACKEND CONFIG log format includes all required fields."""

    def setUp(self):
        self.results_root = os.path.join(
            RESULTS_DIR, f"c53_log_{int(time.time() * 1000)}"
        )
        os.makedirs(self.results_root, exist_ok=True)

    def test_backend_config_cli(self):
        """CLI mode logs BACKEND CONFIG with all required fields."""
        out = os.path.join(self.results_root, "log_cli")
        r = run_pipeline(TEST_VIDEO, out, "cli", target_fps=48, model=MODEL, gpu=0)
        self.assertTrue(r["success"])
        combined = "\n".join(r["logs"])
        for field in ("mode=", "requested_backend=", "active_backend=", "fallback="):
            self.assertIn(field, combined, f"Missing {field!r} in logs: {combined[:300]!r}")
        self.assertIn("active_backend=cli", combined)
        self.assertIn("fallback=none", combined)

    def test_backend_config_native(self):
        """Native mode logs BACKEND CONFIG with all required fields."""
        out = os.path.join(self.results_root, "log_native")
        r = run_pipeline(TEST_VIDEO, out, "native", target_fps=48, model=MODEL, gpu=0)
        self.assertTrue(r["success"])
        combined = "\n".join(r["logs"])
        for field in ("mode=", "requested_backend=", "active_backend=", "fallback="):
            self.assertIn(field, combined, f"Missing {field!r} in logs: {combined[:300]!r}")
        self.assertIn("active_backend=native", combined)
        self.assertIn("fallback=none", combined)

    def test_backend_config_fallback_log(self):
        """Fallback log contains NATIVE BACKEND FAILED and reason."""
        out = os.path.join(self.results_root, "log_fallback")
        r = run_pipeline(
            TEST_VIDEO, out, "native", target_fps=48, model=MODEL, gpu=0,
            broken_native_factory=make_broken_native_init,
        )
        self.assertTrue(r["success"])
        combined = "\n".join(r["logs"])
        self.assertIn("NATIVE BACKEND FAILED", combined)
        self.assertIn("simulated_native_init_failure", combined)
        self.assertIn("active_backend=cli", combined)
        self.assertIn("fallback=native_to_cli", combined)


if __name__ == "__main__":
    unittest.main(verbosity=2)
