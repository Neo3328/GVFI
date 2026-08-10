#!/usr/bin/env python3
"""Tests for the ordered RIFE scene worker scheduler."""

from __future__ import annotations

import hashlib
import os
import sys
import tempfile
import threading
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE_ROOT = os.path.dirname(os.path.dirname(HERE))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime.rife_scene_scheduler import (  # noqa: E402
    RifeWorkerManager,
    SceneTask,
    SceneTaskQueue,
)


def make_task(root: str, index: int, *, model: str = "rife-v4.6", gpu: int = 0) -> SceneTask:
    frame = os.path.join(root, f"source-{index}.png")
    with open(frame, "wb") as handle:
        handle.write(f"scene-{index}".encode("ascii"))
    return SceneTask(
        scene_index=index,
        input_frames=(frame,),
        input_path=os.path.join(root, f"in-{index}"),
        output_path=os.path.join(root, f"out-{index}"),
        final_output_path=os.path.join(root, "final"),
        output_start_index=index,
        target_frames=1,
        model=model,
        gpu=gpu,
        resolution=(1920, 1080),
        requires_inference=True,
    )


class TestSceneTaskQueue(unittest.TestCase):
    def test_fifo_and_graceful_close(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            tasks = [make_task(root, index) for index in (1, 2)]
            task_queue = SceneTaskQueue(maxsize=2)
            for task in tasks:
                task_queue.put(task)
            task_queue.close()
            self.assertEqual(task_queue.get(), tasks[0])
            self.assertEqual(task_queue.get(), tasks[1])
            self.assertIsNone(task_queue.get())


class TestRifeWorkerManager(unittest.TestCase):
    def test_compatible_tasks_are_ordered_and_staging_overlaps_processing(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            tasks = [make_task(root, index) for index in (1, 2, 3)]
            process_started = threading.Event()
            second_staged = threading.Event()
            processed = []
            collected = []

            def stage(task: SceneTask) -> None:
                os.makedirs(task.input_path)
                if task.scene_index == 2:
                    second_staged.set()

            def process(task: SceneTask) -> None:
                if task.scene_index == 1:
                    process_started.set()
                    self.assertTrue(second_staged.wait(timeout=1.0))
                self.assertTrue(process_started.is_set())
                processed.append(task.scene_index)

            def collect(task: SceneTask) -> None:
                collected.append(task.scene_index)

            manager = RifeWorkerManager(queue_size=2)
            stats = manager.run(
                tasks, stage=stage, process=process, collect=collect
            )
            self.assertEqual(processed, [1, 2, 3])
            self.assertEqual(collected, [1, 2, 3])
            self.assertEqual(stats.worker_start, 1)
            self.assertEqual(stats.model_reload_count, 3)
            self.assertEqual(stats.scene_process_count, 3)
            self.assertEqual(manager.state_snapshot(), {1: "completed", 2: "completed", 3: "completed"})

    def test_compatibility_changes_start_new_worker_group(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            tasks = [
                make_task(root, 1),
                make_task(root, 2),
                make_task(root, 3, model="rife-v4"),
            ]
            stats = RifeWorkerManager().run(
                tasks,
                stage=lambda _task: None,
                process=lambda _task: None,
                collect=lambda _task: None,
            )
            self.assertEqual(stats.worker_start, 2)
            self.assertEqual(stats.compatibility_switch_count, 1)
            self.assertIn("worker_start=2", stats.format_log())

    def test_scene_outputs_preserve_order_and_hashes(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            tasks = [make_task(root, index) for index in (1, 2, 3)]
            output = []

            def collect(task: SceneTask) -> None:
                with open(task.input_frames[0], "rb") as handle:
                    payload = handle.read()
                output.append(hashlib.sha256(payload).hexdigest())

            RifeWorkerManager().run(
                tasks,
                stage=lambda _task: None,
                process=lambda _task: None,
                collect=collect,
            )
            expected = [
                hashlib.sha256(f"scene-{index}".encode("ascii")).hexdigest()
                for index in (1, 2, 3)
            ]
            self.assertEqual(output, expected)

    def test_staging_failure_closes_queue_and_records_state(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            tasks = [make_task(root, index) for index in (1, 2)]
            manager = RifeWorkerManager(queue_size=1)

            def stage(task: SceneTask) -> None:
                if task.scene_index == 2:
                    raise OSError("staging failed")

            with self.assertRaisesRegex(RuntimeError, "scene staging failed"):
                manager.run(
                    tasks,
                    stage=stage,
                    process=lambda _task: None,
                    collect=lambda _task: None,
                )
            self.assertEqual(manager.state_snapshot()[1], "completed")
            self.assertEqual(manager.state_snapshot()[2], "failed")


if __name__ == "__main__":
    unittest.main()
