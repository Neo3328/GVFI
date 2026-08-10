#!/usr/bin/env python3
"""Tests for RIFE CLI scheduling and file lifecycle helpers."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE_ROOT = os.path.dirname(os.path.dirname(HERE))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime.rife_cli_pipeline import (  # noqa: E402
    RifePipelineStats,
    collect_frames,
    stage_frame_range,
)


class TestRifeCliPipeline(unittest.TestCase):
    def test_stage_uses_links_and_collect_moves_without_duplicate_content(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            source = os.path.join(temp_dir, "source")
            staged = os.path.join(temp_dir, "staged")
            final = os.path.join(temp_dir, "final")
            os.makedirs(source)
            paths = []
            for index in range(3):
                path = os.path.join(source, f"{index + 1:08d}.png")
                with open(path, "wb") as handle:
                    handle.write(bytes([index]) * 32)
                paths.append(path)

            written, stage_time, copy_fallbacks = stage_frame_range(paths, staged, 0, 3)
            self.assertEqual(written, 3)
            self.assertGreaterEqual(stage_time, 0.0)
            self.assertEqual(copy_fallbacks, 0)
            for index, source_path in enumerate(paths, start=1):
                staged_path = os.path.join(staged, f"{index:08d}.png")
                self.assertTrue(os.path.samefile(source_path, staged_path))

            collected, collect_time, copy_fallbacks = collect_frames(staged, final, 5)
            self.assertEqual(collected, 3)
            self.assertGreaterEqual(collect_time, 0.0)
            self.assertEqual(copy_fallbacks, 0)
            self.assertEqual(sorted(os.listdir(final)), ["00000005.png", "00000006.png", "00000007.png"])
            self.assertEqual(os.listdir(staged), [])
            self.assertTrue(os.path.isfile(paths[0]))

    def test_stats_log_reports_process_and_model_load_counts(self) -> None:
        stats = RifePipelineStats(
            process_count=2,
            total_frames=48,
            startup_time=0.5,
            inference_time=1.5,
            io_time=0.25,
            gpu_sample_total=180,
            gpu_sample_count=2,
        )
        text = stats.format_log()
        self.assertIn("process_count=2", text)
        self.assertIn("model_load_count=2", text)
        self.assertIn("average_frames_per_process=24.00", text)
        self.assertIn("gpu_usage=90.0%", text)


if __name__ == "__main__":
    unittest.main()
