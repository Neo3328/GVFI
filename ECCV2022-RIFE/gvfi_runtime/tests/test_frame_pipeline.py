#!/usr/bin/env python3
"""Tests for the Phase B1 in-memory frame pipeline foundation."""

from __future__ import annotations

import gc
import os
import queue
import subprocess
import sys
import tempfile
import threading
import tracemalloc
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE_ROOT = os.path.dirname(os.path.dirname(HERE))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime.frame_pipeline import (  # noqa: E402
    Frame,
    FramePipeline,
    FramePipelineError,
    FramePipelineResult,
    FrameQueue,
    FrameQueueClosed,
    decode_and_consume,
)


class TestFrameQueue(unittest.TestCase):
    def test_frame_is_memory_data_not_a_path(self) -> None:
        frame = Frame(b"\x00\x01", 1, 1, "rgb24", 7, 0.25)
        self.assertEqual(frame.frame_data, b"\x00\x01")
        self.assertEqual(frame.frame_index, 7)
        self.assertEqual(frame.timestamp, 0.25)

    def test_bounded_blocking_and_stop(self) -> None:
        frames = FrameQueue(maxsize=1)
        first = Frame(b"a", 1, 1, "gray8", 0, 0.0)
        second = Frame(b"b", 1, 1, "gray8", 1, 1.0)
        frames.put(first)
        with self.assertRaises(queue.Full):
            frames.put(second, timeout=0.02)

        waiting = []
        empty = FrameQueue(maxsize=1)
        thread = threading.Thread(target=lambda: self._wait_for_stop(empty, waiting))
        thread.start()
        empty.stop()
        thread.join(timeout=1.0)
        self.assertFalse(thread.is_alive())
        self.assertEqual(waiting, ["stopped"])

        frames.stop()
        self.assertIs(frames.get(), first)
        with self.assertRaises(FrameQueueClosed):
            frames.get()
        stats = frames.stats()
        self.assertEqual(stats["put_count"], 1)
        self.assertEqual(stats["get_count"], 1)
        self.assertEqual(stats["peak_size"], 1)
        self.assertEqual(stats["close_reason"], "stopped")

    def test_close_discards_frames_and_wakes_blocked_producer(self) -> None:
        frames = FrameQueue(maxsize=1)
        frame = Frame(b"a", 1, 1, "gray8", 0, 0.0)
        frames.put(frame)
        outcomes = []

        def blocked_put() -> None:
            try:
                frames.put(frame)
            except FrameQueueClosed as exc:
                outcomes.append(exc.reason)

        thread = threading.Thread(target=blocked_put)
        thread.start()
        frames.stop("consumer_failed", RuntimeError("boom"), discard=True)
        thread.join(timeout=1.0)
        self.assertFalse(thread.is_alive())
        self.assertEqual(outcomes, ["consumer_failed"])
        stats = frames.stats()
        self.assertGreaterEqual(stats["dropped_frames"], 1)
        self.assertEqual(stats["error"], "boom")

    @staticmethod
    def _wait_for_stop(frames: FrameQueue, result: list[str]) -> None:
        try:
            frames.get()
        except FrameQueueClosed:
            result.append("stopped")

    def test_pipeline_has_separate_input_and_output_queues(self) -> None:
        pipeline = FramePipeline.create(queue_size=2)
        self.assertIsNot(pipeline.input_queue, pipeline.output_queue)
        self.assertEqual(pipeline.input_queue.maxsize, 2)
        self.assertEqual(pipeline.output_queue.maxsize, 2)
        pipeline.stop()


class TestMemoryDecode(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ffmpeg = os.path.join(ENGINE_ROOT, "ffmpeg.exe")
        if not os.path.isfile(cls.ffmpeg):
            raise unittest.SkipTest("bundled ffmpeg.exe is unavailable")

    def test_ffmpeg_decode_consumes_all_frames_and_releases_memory(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            video = os.path.join(temp_dir, "sample.mp4")
            subprocess.run(
                [self.ffmpeg, "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=64x48:rate=10:duration=1", "-c:v", "mpeg4", video],
                check=True,
            )
            tracemalloc.start()
            baseline = tracemalloc.get_traced_memory()[0]
            for _ in range(3):
                results: list[FramePipelineResult] = []
                self.assertEqual(
                    decode_and_consume(
                        self.ffmpeg, video, 64, 48,
                        queue_size=2, worker_count=2, fps=10,
                        stats_callback=results.append,
                    ),
                    10,
                )
                self.assertEqual(results[0].consumed_frames, 10)
                self.assertLessEqual(results[0].input_queue["peak_size"], 2)
                self.assertLessEqual(results[0].output_queue["peak_size"], 2)
                gc.collect()
            current, peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            self.assertLess(current - baseline, 512 * 1024)
            self.assertLess(peak - baseline, 4 * 1024 * 1024)

    def test_single_frame_input(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            video = os.path.join(temp_dir, "single.mp4")
            subprocess.run(
                [
                    self.ffmpeg, "-v", "error", "-y", "-f", "lavfi",
                    "-i", "color=size=32x24:rate=1:duration=1",
                    "-frames:v", "1", "-c:v", "mpeg4", video,
                ],
                check=True,
            )
            self.assertEqual(decode_and_consume(self.ffmpeg, video, 32, 24), 1)

    def test_corrupt_input_reports_pipeline_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            video = os.path.join(temp_dir, "corrupt.mp4")
            with open(video, "wb") as output:
                output.write(b"not a video")
            with self.assertRaises(FramePipelineError) as raised:
                decode_and_consume(self.ffmpeg, video, 32, 24)
            self.assertEqual(
                raised.exception.stats["input_queue"]["close_reason"],
                "ffmpeg_failed",
            )

    def test_processor_failure_propagates_without_deadlock(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            video = os.path.join(temp_dir, "sample.mp4")
            subprocess.run(
                [
                    self.ffmpeg, "-v", "error", "-y", "-f", "lavfi",
                    "-i", "testsrc2=size=64x48:rate=10:duration=1",
                    "-c:v", "mpeg4", video,
                ],
                check=True,
            )

            def fail_frame(_frame: Frame) -> Frame:
                raise RuntimeError("processor boom")

            with self.assertRaises(FramePipelineError) as raised:
                decode_and_consume(
                    self.ffmpeg, video, 64, 48,
                    queue_size=1, worker_count=2, frame_processor=fail_frame,
                )
            stats = raised.exception.stats
            self.assertIn("failed", stats["input_queue"]["close_reason"])
            self.assertIn("processor boom", stats["input_queue"]["error"])

    def test_pre_cancelled_decode_exits_and_reports_stopped(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            video = os.path.join(temp_dir, "sample.mp4")
            subprocess.run(
                [
                    self.ffmpeg, "-v", "error", "-y", "-f", "lavfi",
                    "-i", "testsrc2=size=32x24:rate=10:duration=1",
                    "-c:v", "mpeg4", video,
                ],
                check=True,
            )
            stopped = threading.Event()
            stopped.set()
            results: list[FramePipelineResult] = []
            self.assertEqual(
                decode_and_consume(
                    self.ffmpeg, video, 32, 24,
                    stop_event=stopped, stats_callback=results.append,
                ),
                0,
            )
            self.assertTrue(results[0].stopped)


if __name__ == "__main__":
    unittest.main()
