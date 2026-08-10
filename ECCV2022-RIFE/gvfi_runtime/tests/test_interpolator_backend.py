#!/usr/bin/env python3
"""Tests for the Phase C0 interpolator backend contract."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE_ROOT = os.path.dirname(os.path.dirname(HERE))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime.frame_pipeline import Frame  # noqa: E402
from gvfi_runtime.interpolator_backend import (  # noqa: E402
    BackendCapabilityError,
    BackendNotImplementedError,
    NativeInterpolatorBackend,
    RifeCLIBackend,
    create_interpolator_backend,
)


class TestRifeCLIBackend(unittest.TestCase):
    def test_directory_command_preserves_existing_cli_contract(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            executable = os.path.join(root, "rife-ncnn-vulkan.exe")
            model = os.path.join(root, "rife-v4.6")
            input_path = os.path.join(root, "input")
            output_path = os.path.join(root, "output")
            open(executable, "wb").close()
            os.makedirs(model)
            os.makedirs(input_path)
            calls = []

            backend = RifeCLIBackend(
                executable,
                root,
                lambda command, stage, cwd: calls.append((command, stage, cwd)),
            )
            backend.initialize()
            backend.load_model(model)
            backend.process_directory(
                input_path,
                output_path,
                target_frames=48,
                gpu=0,
                thread_config="2:4:4",
            )

            self.assertEqual(calls[0][1:], ("RIFE Vulkan", root))
            self.assertEqual(
                calls[0][0],
                [
                    executable,
                    "-i", input_path,
                    "-o", output_path,
                    "-n", "48",
                    "-m", model,
                    "-f", "%08d.png",
                    "-j", "2:4:4",
                    "-g", "0",
                ],
            )
            backend.release()
            self.assertFalse(backend.initialized)

    def test_cli_frame_interface_rejects_memory_without_png_fallback(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            executable = os.path.join(root, "rife.exe")
            model = os.path.join(root, "model")
            open(executable, "wb").close()
            os.makedirs(model)
            backend = RifeCLIBackend(executable, root, lambda *_args: None)
            backend.initialize()
            backend.load_model(model)
            frame = Frame(b"\x00\x00\x00", 1, 1, "rgb24", 0, 0.0)
            with self.assertRaises(BackendCapabilityError):
                backend.process_frames(frame, frame, timestamp=0.5)


class TestNativeBackendPlaceholder(unittest.TestCase):
    def test_native_mode_initializes_but_does_not_claim_inference(self) -> None:
        backend = create_interpolator_backend("native")
        self.assertIsInstance(backend, NativeInterpolatorBackend)
        backend.initialize()
        backend.load_model("rife-v4.6")
        self.assertTrue(backend.initialized)
        frame = Frame(b"\x00\x00\x00", 1, 1, "rgb24", 0, 0.0)
        with self.assertRaisesRegex(BackendNotImplementedError, "not implemented") as error:
            backend.process_frames(frame, frame, timestamp=0.5)
        self.assertIsInstance(error.exception, NotImplementedError)
        backend.release()
        backend.release()
        self.assertFalse(backend.initialized)
        self.assertEqual(backend.model_path, "")

    def test_unknown_mode_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            create_interpolator_backend("other")


if __name__ == "__main__":
    unittest.main()
