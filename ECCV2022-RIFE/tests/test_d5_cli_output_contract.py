from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest

ENGINE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from main import VideoWorker

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"


@unittest.skipUnless(os.path.isfile(TEST_VIDEO), "fixed D5 test video unavailable")
class CliOutputContractTests(unittest.TestCase):
    def test_full_cli_output_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as output_dir:
            worker = VideoWorker(
                [TEST_VIDEO],
                {
                    "backend_mode": "cli",
                    "pipeline_mode": "disk",
                    "fps": 48,
                    "scale": "原始",
                    "codec": "H.265 (HEVC)",
                    "keep_audio": True,
                    "enable_dedup": True,
                    "enable_scdet": True,
                },
                output_dir,
                False,
                True,
            )
            results = []
            worker.task_finished.connect(lambda ok, message: results.append((ok, message)))
            worker.run()
            self.assertEqual(len(results), 1)
            self.assertTrue(results[0][0], results[0][1])
            output = os.path.join(output_dir, "p0_src_1080p24_audio_enhanced.mp4")
            self.assertTrue(os.path.isfile(output))
            probe = subprocess.run(
                [
                    worker.FFPROBE, "-v", "error", "-show_streams",
                    "-of", "json", output,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                timeout=30,
            )
            streams = json.loads(probe.stdout.decode("utf-8"))["streams"]
            video = next(stream for stream in streams if stream["codec_type"] == "video")
            audio = next(stream for stream in streams if stream["codec_type"] == "audio")
            self.assertEqual(video["codec_name"], "hevc")
            self.assertEqual((video["width"], video["height"]), (1920, 1080))
            self.assertEqual(video["avg_frame_rate"], "48/1")
            self.assertEqual(video["color_range"], "tv")
            self.assertEqual(video["color_space"], "bt709")
            self.assertEqual(video["color_transfer"], "bt709")
            self.assertEqual(video["color_primaries"], "bt709")
            self.assertEqual(audio["codec_name"], "aac")


if __name__ == "__main__":
    unittest.main(verbosity=2)
