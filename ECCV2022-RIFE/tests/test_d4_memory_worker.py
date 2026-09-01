from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import unittest

ENGINE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from main import VideoWorker


class MemoryVideoWorkerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ffmpeg = os.path.join(ENGINE_ROOT, "ffmpeg.exe")
        if not os.path.isfile(cls.ffmpeg):
            raise unittest.SkipTest("bundled ffmpeg.exe is unavailable")

    def test_validation_mode_skips_backend_and_does_not_claim_video_output(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            video = os.path.join(temp_dir, "input.mp4")
            output_dir = os.path.join(temp_dir, "output")
            subprocess.run(
                [
                    self.ffmpeg, "-v", "error", "-y", "-f", "lavfi",
                    "-i", "testsrc2=size=64x48:rate=10:duration=1",
                    "-c:v", "mpeg4", video,
                ],
                check=True,
            )
            worker = VideoWorker(
                [video],
                {
                    "backend_mode": "cli",
                    "pipeline_mode": "memory",
                    "fps": 20,
                    "scale": "原始",
                    "codec": "H.265 (HEVC)",
                    "queue_size": 2,
                    "worker_count": 1,
                },
                output_dir,
                False,
                True,
            )
            logs: list[str] = []
            results: list[tuple[bool, str]] = []
            worker.log_output.connect(logs.append)
            worker.task_finished.connect(lambda ok, message: results.append((ok, message)))
            worker.run()

            combined = "\n".join(logs)
            self.assertIn("reason=memory_pipeline_validation_only", combined)
            self.assertIn("memory frame pipeline consumed 10 frames", combined)
            self.assertIn("FRAME PIPELINE RESULT", combined)
            self.assertEqual(len(results), 1)
            self.assertTrue(results[0][0])
            self.assertIn("未生成输出视频", results[0][1])
            self.assertFalse(os.path.exists(os.path.join(output_dir, "input_enhanced.mp4")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
