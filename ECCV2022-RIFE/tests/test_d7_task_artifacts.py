from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

ENGINE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from main import VideoWorker

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"


@unittest.skipUnless(os.path.isfile(TEST_VIDEO), "fixed D7 input unavailable")
class VideoWorkerArtifactTests(unittest.TestCase):
    def params(self) -> dict:
        return {
            "backend_mode": "cli", "pipeline_mode": "disk", "fps": 48,
            "scale": "原始", "codec": "H.265 (HEVC)", "keep_audio": True,
            "enable_dedup": True, "enable_scdet": True,
        }

    def test_existing_output_is_preserved_and_report_records_real_output(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            existing = os.path.join(root, "p0_src_1080p24_audio_enhanced.mp4")
            marker = b"existing-output-must-survive"
            with open(existing, "wb") as handle:
                handle.write(marker)
            worker = VideoWorker([TEST_VIDEO], self.params(), root, False, True)
            results = []
            worker.task_finished.connect(lambda ok, message: results.append((ok, message)))
            worker.run()
            self.assertTrue(results[0][0], results[0][1])
            with open(existing, "rb") as handle:
                self.assertEqual(handle.read(), marker)
            self.assertEqual(len(worker.completed_outputs), 1)
            self.assertTrue(worker.completed_outputs[0].endswith("_enhanced_001.mp4"))
            self.assertTrue(os.path.isfile(worker.completed_outputs[0]))
            self.assertTrue(os.path.isfile(worker.report_path))
            with open(worker.report_path, "r", encoding="utf-8") as handle:
                report = json.load(handle)
            self.assertEqual(report["outputs"], worker.completed_outputs)
            self.assertTrue(report["output_validations"][0]["decodable"])
            self.assertTrue(report["disk_estimates"][0]["sufficient"])

    def test_initialization_failure_still_writes_report(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            missing = os.path.join(root, "missing.mp4")
            worker = VideoWorker([missing], self.params(), root, False, True)
            results = []
            worker.task_finished.connect(lambda ok, message: results.append((ok, message)))
            worker.run()
            self.assertFalse(results[0][0])
            self.assertTrue(os.path.isfile(worker.report_path))
            with open(worker.report_path, "r", encoding="utf-8") as handle:
                report = json.load(handle)
            self.assertEqual(report["lifecycle"]["state"], "failed")
            self.assertIn("输入视频不存在", report["failure_detail"])

    def test_failed_output_validation_quarantines_generated_video(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            worker = VideoWorker([TEST_VIDEO], self.params(), root, False, True)
            results = []
            worker.task_finished.connect(lambda ok, message: results.append((ok, message)))
            with patch("main.validate_output_video", side_effect=RuntimeError("forced validation failure")):
                worker.run()
            self.assertFalse(results[0][0])
            self.assertEqual(worker.completed_outputs, [])
            invalid = [name for name in os.listdir(root) if name.endswith(".invalid")]
            self.assertEqual(len(invalid), 1)
            self.assertTrue(os.path.isfile(worker.report_path))


if __name__ == "__main__":
    unittest.main(verbosity=2)
