"""C5 isolated Native RIFE lifecycle and output-contract checks."""

from __future__ import annotations

import hashlib
import math
import os
import sys
import unittest
import subprocess
import tempfile

import numpy as np
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENGINE = os.path.join(ROOT, "ECCV2022-RIFE")
if ENGINE not in sys.path:
    sys.path.insert(0, ENGINE)

from gvfi_runtime.frame_pipeline import Frame  # noqa: E402
from gvfi_runtime.interpolator_backend import (  # noqa: E402
    BackendError,
    NativeInterpolatorBackend,
)


MODEL = os.path.join(ENGINE, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")
DLL = os.path.join(ENGINE, "gvfi_runtime", "native_bin", "gvfi_native.dll")
PARAM_SHA256 = "28DF14D57A225725EE5386F52EBA422488450D37C9F40800ED4F62E8BA846692"
BIN_SHA256 = "F334ED2260149CE0188A6DCF049844E8B0CDD912E01CBCFB63553157D2508958"


def _available() -> bool:
    return os.path.isfile(DLL) and os.path.isfile(os.path.join(MODEL, "flownet.param"))


@unittest.skipUnless(_available(), "Native DLL and production RIFE model are unavailable")
class TestNativeBackend(unittest.TestCase):
    def setUp(self) -> None:
        self.backend = NativeInterpolatorBackend(DLL)
        self.backend.initialize()

    def tearDown(self) -> None:
        self.backend.release()
        self.backend.release()

    def test_native_lifecycle(self) -> None:
        info = self.backend.backend_info()
        self.assertTrue(info["initialized"])
        self.assertTrue(info["ncnn_enabled"])
        self.assertIn("RTX 5060", info["gpu_name"])

    def test_native_model_load(self) -> None:
        self.backend.load_model(MODEL)
        self.assertTrue(self.backend.backend_info()["model_loaded"])
        for name, expected in (("flownet.param", PARAM_SHA256), ("flownet.bin", BIN_SHA256)):
            with open(os.path.join(MODEL, name), "rb") as stream:
                digest = hashlib.sha256(stream.read()).hexdigest().upper()
            self.assertEqual(digest, expected)

    def test_native_forward(self) -> None:
        self.backend.load_model(MODEL)
        width = height = 64
        first = np.arange(width * height * 3, dtype=np.uint8).reshape(height, width, 3)
        second = np.flip(first, axis=1).copy()
        output = self.backend.process_frames(
            Frame(first, width, height, "bgr24", 0, 0.0),
            Frame(second, width, height, "bgr24", 1, 1.0),
            timestamp=0.5,
        )
        self.assertEqual((output.width, output.height, output.pixel_format), (width, height, "bgr24"))

    def test_native_output_contract(self) -> None:
        self.backend.load_model(MODEL)
        width = height = 64
        first = bytes([0, 64, 255]) * (width * height)
        second = bytes([255, 64, 0]) * (width * height)
        output = self.backend.process_frames(
            Frame(first, width, height, "rgb24", 4, 0.0),
            Frame(second, width, height, "rgb24", 5, 1.0),
            timestamp=0.5,
        )
        self.assertEqual((output.width, output.height, output.pixel_format), (width, height, "rgb24"))
        self.assertEqual(len(output.frame_data), width * height * 3)
        self.assertTrue(all(math.isfinite(float(value)) for value in output.frame_data))
        self.assertEqual(len(hashlib.sha256(bytes(output.frame_data)).digest()), 32)

    def test_native_repeat_forward(self) -> None:
        self.backend.load_model(MODEL)
        width = height = 64
        frame = bytes([64, 128, 192]) * (width * height)
        left = Frame(frame, width, height, "bgr24", 0, 0.0)
        right = Frame(bytes([192, 128, 64]) * (width * height), width, height, "bgr24", 1, 1.0)
        for _ in range(100):
            output = self.backend.process_frames(left, right, timestamp=0.5)
            self.assertEqual(len(output.frame_data), width * height * 3)

    def test_native_failure_path(self) -> None:
        with self.assertRaises(BackendError):
            self.backend.load_model(os.path.dirname(MODEL))

    def test_native_cli_comparison(self) -> None:
        benchmark = r"D:\GVFI-deps\rife-quality-benchmark\inputs\anime_people"
        cli = os.path.join(ENGINE, "rife-ncnn-vulkan-20221029-windows", "rife-ncnn-vulkan.exe")
        if not os.path.isdir(benchmark) or not os.path.isfile(cli):
            self.skipTest("C4.8 comparison fixture is unavailable")
        self.backend.load_model(MODEL)
        with tempfile.TemporaryDirectory() as root:
            cli_output = os.path.join(root, "cli")
            native_output = os.path.join(root, "native")
            os.makedirs(cli_output)
            subprocess.run(
                [cli, "-i", benchmark, "-o", cli_output, "-n", "3", "-m", MODEL,
                 "-g", "0", "-f", "%08d.png", "-j", "1:2:2"],
                check=True,
                capture_output=True,
            )
            self.backend.process_directory(
                benchmark, native_output, target_frames=3, gpu=0, thread_config="1:2:2"
            )
            cli_paths = sorted(os.path.join(cli_output, name) for name in os.listdir(cli_output))
            native_paths = sorted(os.path.join(native_output, name) for name in os.listdir(native_output))
            self.assertEqual(len(cli_paths), len(native_paths))
            cli_frame = cv2.imread(cli_paths[1], cv2.IMREAD_COLOR)
            native_frame = cv2.imread(native_paths[1], cv2.IMREAD_COLOR)
            self.assertEqual(cli_frame.shape, native_frame.shape)
            delta = np.abs(cli_frame.astype(np.int16) - native_frame.astype(np.int16))
            self.assertLess(float(delta.mean()), 0.05)
            self.assertLessEqual(int(delta.max()), 3)


if __name__ == "__main__":
    unittest.main()
