#!/usr/bin/env python3
"""Integration tests for the Phase C2 native C ABI skeleton."""

from __future__ import annotations

import ctypes
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE_ROOT = os.path.dirname(os.path.dirname(HERE))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime.frame_pipeline import Frame  # noqa: E402
from gvfi_runtime.native_library import (  # noqa: E402
    NativeLibraryLoader,
    NativeResult,
    _NativeFrame,
)


class TestNativeLibraryLoader(unittest.TestCase):
    def setUp(self) -> None:
        self.loader = NativeLibraryLoader()

    def tearDown(self) -> None:
        self.loader.destroy()

    def test_dll_lifecycle_and_process_status(self) -> None:
        self.assertEqual(self.loader.load(), "gvfi_native/0.4.0")
        self.loader.create()
        handle = self.loader.handle.value
        self.assertTrue(handle)
        self.loader.create()
        self.assertEqual(self.loader.handle.value, handle)
        self.loader.initialize()
        info = self.loader.backend_info()
        self.assertEqual(info["abi_version"], 1)
        self.assertTrue(info["initialized"])
        self.assertTrue(info["ncnn_enabled"])
        self.assertFalse(info["model_loaded"])
        self.assertGreaterEqual(info["device_index"], 0)
        self.assertTrue(info["gpu_name"])
        self.assertTrue(info["ncnn_version"])
        self.assertIs(self.loader.load_model("test.param", "test.bin"), NativeResult.FAILED)

        frame0 = Frame(b"\x00\x00\x00", 1, 1, "rgb24", 0, 0.0)
        frame1 = Frame(b"\xff\xff\xff", 1, 1, "rgb24", 1, 1.0)
        result, output = self.loader.process(frame0, frame1, 0.5)
        self.assertIs(result, NativeResult.FAILED)
        self.assertIsNone(output)

        self.loader.destroy()
        self.loader.destroy()
        self.assertFalse(self.loader.handle.value)

    def test_c_abi_invalid_argument_code(self) -> None:
        self.loader.load()
        self.assertEqual(
            NativeResult(self.loader.dll.gvfi_create(None)),
            NativeResult.INVALID_ARGUMENT,
        )
        self.loader.create()
        self.loader.initialize()
        output = _NativeFrame()
        self.assertEqual(
            NativeResult(
                self.loader.dll.gvfi_process(
                    self.loader.handle,
                    None,
                    None,
                    ctypes.c_double(0.5),
                    ctypes.byref(output),
                )
            ),
            NativeResult.INVALID_ARGUMENT,
        )


if __name__ == "__main__":
    unittest.main()
