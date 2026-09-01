from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import unittest

ENGINE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime.media_contract import build_output_video_filter, probe_media_contract


class MediaFormatSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ffmpeg = os.path.join(ENGINE_ROOT, "ffmpeg.exe")
        cls.ffprobe = os.path.join(ENGINE_ROOT, "ffprobe.exe")
        if not os.path.isfile(cls.ffmpeg) or not os.path.isfile(cls.ffprobe):
            raise unittest.SkipTest("bundled FFmpeg tools are unavailable")

    def encode(self, output: str, arguments: list[str]) -> None:
        result = subprocess.run(
            [self.ffmpeg, "-v", "error", "-y", *arguments, output],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=90,
        )
        if result.returncode != 0:
            self.fail((result.stderr or b"").decode("utf-8", "replace")[-2000:])

    def test_h264_hevc10_and_av1_are_detected(self) -> None:
        cases = (
            ("h264.mp4", ["-f", "lavfi", "-i", "testsrc2=size=64x48:rate=5:duration=0.4", "-c:v", "libx264", "-pix_fmt", "yuv420p"], "h264", 8),
            ("hevc10.mp4", ["-f", "lavfi", "-i", "testsrc2=size=64x48:rate=5:duration=0.4", "-c:v", "libx265", "-x265-params", "log-level=error", "-pix_fmt", "yuv420p10le"], "hevc", 10),
            ("av1.mkv", ["-f", "lavfi", "-i", "testsrc2=size=64x48:rate=5:duration=0.4", "-c:v", "libaom-av1", "-cpu-used", "8", "-crf", "40"], "av1", 8),
        )
        with tempfile.TemporaryDirectory() as root:
            for filename, arguments, codec, depth in cases:
                with self.subTest(codec=codec):
                    path = os.path.join(root, filename)
                    self.encode(path, arguments)
                    contract = probe_media_contract(self.ffprobe, path)
                    self.assertEqual(contract.video_codec, codec)
                    self.assertEqual(contract.bit_depth, depth)

    def test_odd_dimensions_and_alpha_are_reported(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            odd = os.path.join(root, "odd.mkv")
            self.encode(
                odd,
                ["-f", "lavfi", "-i", "testsrc=size=65x65:rate=1:duration=1", "-c:v", "ffv1", "-pix_fmt", "bgr0"],
            )
            odd_contract = probe_media_contract(self.ffprobe, odd)
            self.assertEqual((odd_contract.width, odd_contract.height), (65, 65))
            padded = os.path.join(root, "odd-padded.mp4")
            self.encode(
                padded,
                [
                    "-i", odd,
                    "-vf", build_output_video_filter(True),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p",
                ],
            )
            padded_contract = probe_media_contract(self.ffprobe, padded)
            self.assertEqual((padded_contract.width, padded_contract.height), (66, 66))

            alpha = os.path.join(root, "alpha.mov")
            self.encode(
                alpha,
                ["-f", "lavfi", "-i", "color=red@0.5:size=64x48:rate=1:duration=1,format=rgba", "-c:v", "qtrle", "-pix_fmt", "argb"],
            )
            alpha_contract = probe_media_contract(self.ffprobe, alpha)
            self.assertTrue(alpha_contract.has_alpha)
            self.assertTrue(any("alpha" in warning for warning in alpha_contract.warnings))

    def test_multiple_audio_streams_and_rotation_are_reported(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            source = os.path.join(root, "multi.mp4")
            self.encode(
                source,
                [
                    "-f", "lavfi", "-i", "color=black:size=64x48:rate=5:duration=1",
                    "-f", "lavfi", "-i", "sine=frequency=440:duration=1",
                    "-f", "lavfi", "-i", "sine=frequency=880:duration=1",
                    "-map", "0:v:0", "-map", "1:a:0", "-map", "2:a:0",
                    "-c:v", "libx264", "-c:a", "aac", "-shortest",
                ],
            )
            contract = probe_media_contract(self.ffprobe, source)
            self.assertEqual(contract.audio_stream_count, 2)
            self.assertTrue(any("first audio" in warning for warning in contract.warnings))

            rotated = os.path.join(root, "rotated.mp4")
            result = subprocess.run(
                [
                    self.ffmpeg, "-v", "error", "-y",
                    "-display_rotation:v:0", "90", "-i", source,
                    "-map", "0", "-c", "copy", rotated,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=30,
            )
            self.assertEqual(result.returncode, 0)
            rotated_contract = probe_media_contract(self.ffprobe, rotated)
            self.assertEqual(rotated_contract.rotation, 90)


if __name__ == "__main__":
    unittest.main(verbosity=2)
