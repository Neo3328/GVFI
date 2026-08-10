"""ctypes loader for the versioned GVFI native interpolation C ABI."""

from __future__ import annotations

import ctypes
import os
from enum import IntEnum
from typing import Optional

from .frame_pipeline import Frame


class NativeResult(IntEnum):
    SUCCESS = 0
    FAILED = 1
    NOT_IMPLEMENTED = 2
    INVALID_ARGUMENT = 3


class NativeLibraryError(RuntimeError):
    """Raised when the native library cannot be loaded or called safely."""


class _NativeFrame(ctypes.Structure):
    _fields_ = [
        ("data", ctypes.c_void_p),
        ("data_size", ctypes.c_size_t),
        ("width", ctypes.c_uint32),
        ("height", ctypes.c_uint32),
        ("row_stride", ctypes.c_uint32),
        ("pixel_format", ctypes.c_int),
        ("frame_index", ctypes.c_int64),
        ("timestamp", ctypes.c_double),
    ]


_PIXEL_FORMATS = {
    "rgb24": (1, 3),
    "bgr24": (2, 3),
    "rgba": (3, 4),
    "rgba32": (3, 4),
    "bgra": (4, 4),
    "bgra32": (4, 4),
}


def _candidate_paths() -> list[str]:
    here = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(here, "..", ".."))
    return [
        os.path.join(here, "native_bin", "gvfi_native.dll"),
        os.path.join(project_root, "native", "build", "gvfi_native.dll"),
        os.path.join(project_root, "native", "build", "Release", "gvfi_native.dll"),
        os.path.join(project_root, "native", "build", "Debug", "gvfi_native.dll"),
    ]


class NativeLibraryLoader:
    """Own one DLL binding and one opaque interpolation instance."""

    VERSION_PREFIX = "gvfi_native/"

    def __init__(self, library_path: Optional[str] = None) -> None:
        self.library_path = library_path
        self.dll: Optional[ctypes.CDLL] = None
        self.handle = ctypes.c_void_p()
        self.version = ""

    def load(self) -> str:
        if self.dll is not None:
            return self.version
        path = self.library_path or next(
            (candidate for candidate in _candidate_paths() if os.path.isfile(candidate)),
            "",
        )
        if not path or not os.path.isfile(path):
            raise NativeLibraryError("gvfi_native.dll was not found")
        try:
            dll = ctypes.CDLL(path)
            self._bind(dll)
            raw_version = dll.gvfi_version()
        except (OSError, AttributeError) as exc:
            raise NativeLibraryError(f"invalid gvfi native library: {path}") from exc
        version = raw_version.decode("ascii", "strict") if raw_version else ""
        if not version.startswith(self.VERSION_PREFIX):
            raise NativeLibraryError(f"unsupported gvfi native version: {version!r}")
        self.library_path = os.path.abspath(path)
        self.dll = dll
        self.version = version
        return version

    @staticmethod
    def _bind(dll: ctypes.CDLL) -> None:
        dll.gvfi_version.restype = ctypes.c_char_p
        dll.gvfi_version.argtypes = []
        dll.gvfi_create.restype = ctypes.c_int
        dll.gvfi_create.argtypes = [ctypes.POINTER(ctypes.c_void_p)]
        dll.gvfi_destroy.restype = ctypes.c_int
        dll.gvfi_destroy.argtypes = [ctypes.c_void_p]
        dll.gvfi_initialize.restype = ctypes.c_int
        dll.gvfi_initialize.argtypes = [ctypes.c_void_p]
        dll.gvfi_process.restype = ctypes.c_int
        dll.gvfi_process.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(_NativeFrame),
            ctypes.POINTER(_NativeFrame),
            ctypes.c_double,
            ctypes.POINTER(_NativeFrame),
        ]

    def create(self) -> None:
        dll = self._require_dll()
        if self.handle.value:
            return
        handle = ctypes.c_void_p()
        self._require_success(dll.gvfi_create(ctypes.byref(handle)), "gvfi_create")
        if not handle.value:
            raise NativeLibraryError("gvfi_create returned a null handle")
        self.handle = handle

    def initialize(self) -> None:
        dll = self._require_dll()
        self._require_handle()
        self._require_success(dll.gvfi_initialize(self.handle), "gvfi_initialize")

    def process(self, frame0: Frame, frame1: Frame, timestamp: float) -> NativeResult:
        dll = self._require_dll()
        self._require_handle()
        native0, buffer0 = self._convert_frame(frame0)
        native1, buffer1 = self._convert_frame(frame1)
        output = _NativeFrame()
        result = NativeResult(
            dll.gvfi_process(
                self.handle,
                ctypes.byref(native0),
                ctypes.byref(native1),
                float(timestamp),
                ctypes.byref(output),
            )
        )
        _ = buffer0, buffer1
        return result

    def destroy(self) -> None:
        if self.dll is None or not self.handle.value:
            return
        result = NativeResult(self.dll.gvfi_destroy(self.handle))
        self.handle = ctypes.c_void_p()
        if result is not NativeResult.SUCCESS:
            raise NativeLibraryError(f"gvfi_destroy failed: {result.name}")

    def _require_dll(self) -> ctypes.CDLL:
        if self.dll is None:
            raise NativeLibraryError("native library is not loaded")
        return self.dll

    def _require_handle(self) -> None:
        if not self.handle.value:
            raise NativeLibraryError("native instance is not created")

    @staticmethod
    def _require_success(result: int, operation: str) -> None:
        status = NativeResult(result)
        if status is not NativeResult.SUCCESS:
            raise NativeLibraryError(f"{operation} failed: {status.name}")

    @staticmethod
    def _convert_frame(frame: Frame) -> tuple[_NativeFrame, ctypes.Array]:
        format_name = str(frame.pixel_format or "").lower()
        format_info = _PIXEL_FORMATS.get(format_name)
        if format_info is None:
            raise NativeLibraryError(f"unsupported native pixel format: {frame.pixel_format}")
        pixel_format, channels = format_info
        try:
            data = memoryview(frame.frame_data).cast("B").tobytes()
        except (TypeError, ValueError) as exc:
            raise NativeLibraryError("frame_data must expose a contiguous byte buffer") from exc
        expected_size = int(frame.width) * int(frame.height) * channels
        if frame.width <= 0 or frame.height <= 0 or len(data) != expected_size:
            raise NativeLibraryError(
                f"invalid frame buffer size: expected {expected_size}, got {len(data)}"
            )
        buffer = ctypes.create_string_buffer(data)
        native = _NativeFrame(
            ctypes.cast(buffer, ctypes.c_void_p),
            len(data),
            int(frame.width),
            int(frame.height),
            int(frame.width) * channels,
            pixel_format,
            int(frame.frame_index),
            float(frame.timestamp),
        )
        return native, buffer
