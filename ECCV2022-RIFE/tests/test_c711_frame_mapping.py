#!/usr/bin/env python3
"""C7.1.1 — unit tests for Native directory frame mapping and failure detail."""

from __future__ import annotations

import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE_ROOT = os.path.dirname(HERE)
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime.interpolator_backend import map_native_directory_sample  # noqa: E402


class TestNativeDirectoryFrameMapping(unittest.TestCase):
    def _collect(self, input_count: int, output_count: int):
        return [
            map_native_directory_sample(i, input_count, output_count)
            for i in range(output_count)
        ]

    def _assert_unique_left_fraction(self, samples):
        keys = [(left, round(frac, 12)) for left, _right, frac in samples]
        self.assertEqual(len(keys), len(set(keys)), f"duplicate (left,fraction): {keys}")

    def test_24_to_48_endpoints_and_no_collapse(self):
        samples = self._collect(24, 48)
        self.assertEqual(samples[0], (0, 0, 0.0))
        self.assertEqual(samples[47], (23, 23, 0.0))
        left46, right46, frac46 = samples[46]
        left47, right47, frac47 = samples[47]
        self.assertEqual((left47, right47, frac47), (23, 23, 0.0))
        self.assertNotEqual((left46, round(frac46, 12)), (left47, round(frac47, 12)))
        self.assertEqual(left46, 22)
        self.assertEqual(right46, 23)
        self.assertGreater(frac46, 0.5)
        self.assertLess(frac46, 0.6)
        self._assert_unique_left_fraction(samples)

    def test_common_ratios(self):
        for input_count, output_count in ((24, 48), (24, 72), (30, 60), (24, 24)):
            with self.subTest(input_count=input_count, output_count=output_count):
                samples = self._collect(input_count, output_count)
                self.assertEqual(len(samples), output_count)
                self.assertEqual(samples[0][:2], (0, 0))
                self.assertEqual(samples[0][2], 0.0)
                last = input_count - 1
                self.assertEqual(samples[-1], (last, last, 0.0))
                self._assert_unique_left_fraction(samples)
                # Strictly non-decreasing timeline positions.
                positions = [
                    left + frac for left, _right, frac in samples
                ]
                for a, b in zip(positions, positions[1:]):
                    self.assertLess(a, b)

    def test_single_input_or_output(self):
        self.assertEqual(map_native_directory_sample(0, 1, 8), (0, 0, 0.0))
        self.assertEqual(map_native_directory_sample(0, 24, 1), (0, 0, 0.0))


class TestEmitFailureDetailNoNameMangling(unittest.TestCase):
    def test_emit_failure_detail_uses_real_traceback(self):
        os.chdir(ENGINE_ROOT)
        from PyQt5.QtCore import QCoreApplication

        app = QCoreApplication.instance() or QCoreApplication(sys.argv)
        from main import VideoWorker

        worker = VideoWorker(
            file_list=[],
            params={
                "backend_mode": "cli",
                "fps": 48,
                "scale": "原始",
                "codec": "H.265 (HEVC)",
                "crf": 18,
            },
            out_path=os.path.join(ENGINE_ROOT, "temp_cache"),
            same_as_src=False,
            clean_cache=True,
        )
        logs: list[str] = []
        worker.log_output.connect(logs.append)

        try:
            raise RuntimeError("c711_probe")
        except RuntimeError as exc:
            worker._emit_failure_detail("unit-test", exc)

        text = "\n".join(logs)
        self.assertIn("RuntimeError", text)
        self.assertIn("c711_probe", text)
        self.assertIn("Python traceback", text)
        self.assertNotIn("_VideoWorker__traceback", text)
        del app


if __name__ == "__main__":
    unittest.main()
