from __future__ import annotations

import threading
import unittest

from gvfi_runtime.errors import BackendRuntimeError, ErrorCode
from gvfi_runtime.task_lifecycle import TaskLifecycle, TaskState


class TaskLifecycleTests(unittest.TestCase):
    def test_success_lifecycle_and_release(self) -> None:
        lifecycle = TaskLifecycle("task-1", "cli")
        lifecycle.transition(TaskState.VALIDATING)
        lifecycle.transition(TaskState.INITIALIZING)
        lifecycle.transition(TaskState.RUNNING)
        lifecycle.transition(TaskState.SUCCEEDED)
        lifecycle.mark_released("cli")
        snapshot = lifecycle.snapshot()
        self.assertEqual(snapshot["state"], "succeeded")
        self.assertEqual(snapshot["released_backends"], ["cli"])
        self.assertIsNotNone(snapshot["finished_at"])

    def test_fallback_records_stage_code_and_backend(self) -> None:
        lifecycle = TaskLifecycle("task-2", "native")
        failure = lifecycle.record_fallback(
            BackendRuntimeError("Vulkan init failed", stage="vulkan_initialize"),
            "backend_initialize",
        )
        self.assertEqual(failure.code, ErrorCode.BACKEND_ERROR.value)
        self.assertEqual(failure.stage, "vulkan_initialize")
        snapshot = lifecycle.snapshot()
        self.assertTrue(snapshot["fallback_occurred"])
        self.assertEqual(snapshot["active_backend"], "cli")

    def test_terminal_state_is_not_reopened_by_late_cancel(self) -> None:
        lifecycle = TaskLifecycle("task-3", "cli")
        lifecycle.transition(TaskState.SUCCEEDED)
        lifecycle.transition(TaskState.CANCELLING)
        self.assertEqual(lifecycle.snapshot()["state"], "succeeded")

    def test_release_failure_does_not_replace_primary_failure(self) -> None:
        lifecycle = TaskLifecycle("task-release", "native")
        lifecycle.record_failure(RuntimeError("forward"), "backend_process")
        lifecycle.record_release_failure(RuntimeError("release"), "native")
        snapshot = lifecycle.snapshot()
        self.assertEqual(snapshot["last_failure"]["message"], "forward")
        self.assertEqual(snapshot["release_failures"][0]["details"]["backend"], "native")
        self.assertEqual(snapshot["released_backends"], [])

    def test_snapshot_is_safe_during_concurrent_release_updates(self) -> None:
        lifecycle = TaskLifecycle("task-4", "native")
        threads = [
            threading.Thread(target=lifecycle.mark_released, args=(f"backend-{i}",))
            for i in range(8)
        ]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertEqual(len(lifecycle.snapshot()["released_backends"]), 8)


if __name__ == "__main__":
    unittest.main()
