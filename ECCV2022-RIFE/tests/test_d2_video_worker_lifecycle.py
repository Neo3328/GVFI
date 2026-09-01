from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

ENGINE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

import main
from gvfi_runtime.interpolator_backend import BackendError
from gvfi_runtime.task_lifecycle import TaskState


class FakeBackend:
    def __init__(self, name: str, release_error: Exception | None = None) -> None:
        self.name = name
        self.initialized = False
        self.model_path = ""
        self.release_count = 0
        self.release_error = release_error

    def release(self) -> None:
        self.release_count += 1
        if self.release_error:
            raise self.release_error


def tools() -> dict[str, str]:
    return {
        "base_dir": ENGINE_ROOT,
        "rife_exe": os.path.join(ENGINE_ROOT, "rife.exe"),
        "rife_dir": ENGINE_ROOT,
        "rife_model": os.path.join(ENGINE_ROOT, "model"),
        "esgan_exe": os.path.join(ENGINE_ROOT, "esgan.exe"),
        "models_dir": os.path.join(ENGINE_ROOT, "models"),
        "ffmpeg": os.path.join(ENGINE_ROOT, "ffmpeg.exe"),
        "ffprobe": os.path.join(ENGINE_ROOT, "ffprobe.exe"),
    }


class VideoWorkerLifecycleTests(unittest.TestCase):
    def make_worker(self, initial: FakeBackend, cli: FakeBackend | None = None):
        cli = cli or FakeBackend("cli")

        def factory(mode, **_kwargs):
            return initial if mode == "native" else cli

        with patch.object(main, "resolve_runtime_tools", return_value=tools()), patch.object(
            main, "create_interpolator_backend", side_effect=factory
        ):
            worker = main.VideoWorker([], {"backend_mode": "native"}, "", False, True)
        return worker, cli

    def test_fallback_is_explicit_and_structured(self) -> None:
        native = FakeBackend("native")
        worker, _cli = self.make_worker(native)
        logs: list[str] = []
        worker.log_output.connect(logs.append)
        worker._switch_to_cli(
            BackendError("simulated Vulkan failure", stage="vulkan_initialize"),
            "backend_initialize",
        )
        combined = "\n".join(logs)
        self.assertIn("NATIVE BACKEND FAILED", combined)
        self.assertIn("FALLBACK TO CLI", combined)
        self.assertIn("failure_stage=vulkan_initialize", combined)
        self.assertEqual(native.release_count, 1)
        snapshot = worker.lifecycle.snapshot()
        self.assertEqual(snapshot["active_backend"], "cli")
        self.assertTrue(snapshot["fallback_occurred"])

    def test_cancel_request_is_cooperative_and_observable(self) -> None:
        worker, _cli = self.make_worker(FakeBackend("native"))
        worker.stop()
        self.assertEqual(worker.lifecycle.snapshot()["state"], TaskState.CANCELLING.value)
        with self.assertRaises(main.TaskCancelled):
            worker._ensure_running()

    def test_release_failure_is_logged_without_raising(self) -> None:
        native = FakeBackend("native", RuntimeError("release failure"))
        worker, _cli = self.make_worker(native)
        logs: list[str] = []
        worker.log_output.connect(logs.append)
        worker._release_backend()
        self.assertIn("BACKEND RELEASE FAILED", "\n".join(logs))
        snapshot = worker.lifecycle.snapshot()
        self.assertEqual(len(snapshot["release_failures"]), 1)
        self.assertEqual(snapshot["last_failure"], None)


if __name__ == "__main__":
    unittest.main(verbosity=2)
