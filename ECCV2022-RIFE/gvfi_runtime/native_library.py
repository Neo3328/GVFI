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


class _NativeBackendInfo(ctypes.Structure):
    _fields_ = [
        ("struct_size", ctypes.c_uint32),
        ("abi_version", ctypes.c_uint32),
        ("ncnn_enabled", ctypes.c_int32),
        ("initialized", ctypes.c_int32),
        ("model_loaded", ctypes.c_int32),
        ("device_index", ctypes.c_int32),
        ("vulkan_api_version", ctypes.c_uint32),
        ("gpu_name", ctypes.c_char * 256),
        ("ncnn_version", ctypes.c_char * 64),
    ]


class _NativeBatchProfile(ctypes.Structure):
    _fields_ = [
        ("struct_size", ctypes.c_uint32),
        ("abi_version", ctypes.c_uint32),
        ("batch_size", ctypes.c_int32),
        ("vk_submit_count", ctypes.c_int32),
        ("total_ms", ctypes.c_double),
        ("record_ms", ctypes.c_double),
        ("submit_ms", ctypes.c_double),
        ("postprocess_ms", ctypes.c_double),
    ]


class _NativePipelineProfile(ctypes.Structure):
    _fields_ = [
        ("struct_size", ctypes.c_uint32),
        ("abi_version", ctypes.c_uint32),
        ("depth", ctypes.c_int32),
        ("frame_count", ctypes.c_int32),
        ("submit_count", ctypes.c_int32),
        ("wall_ms", ctypes.c_double),
        ("sum_job_ms", ctypes.c_double),
        ("avg_frame_ms", ctypes.c_double),
        ("overlap_ratio", ctypes.c_double),
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
        dll.gvfi_release.restype = ctypes.c_int
        dll.gvfi_release.argtypes = [ctypes.c_void_p]
        dll.gvfi_get_backend_info.restype = ctypes.c_int
        dll.gvfi_get_backend_info.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(_NativeBackendInfo),
        ]
        dll.gvfi_load_model.restype = ctypes.c_int
        dll.gvfi_load_model.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_char_p]
        dll.gvfi_process.restype = ctypes.c_int
        dll.gvfi_process.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(_NativeFrame),
            ctypes.POINTER(_NativeFrame),
            ctypes.c_double,
            ctypes.POINTER(_NativeFrame),
        ]
        # Batch processing
        dll.gvfi_process_batch.restype = ctypes.c_int
        dll.gvfi_process_batch.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(_NativeFrame),  # frames0 array
            ctypes.POINTER(_NativeFrame),  # frames1 array
            ctypes.POINTER(ctypes.c_double),  # timestamps array
            ctypes.POINTER(_NativeFrame),  # outputs array
            ctypes.c_int,  # batch_size
        ]
        dll.gvfi_get_last_batch_profile.restype = ctypes.c_int
        dll.gvfi_get_last_batch_profile.argtypes = [
            ctypes.POINTER(_NativeBatchProfile),
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

    def backend_info(self) -> dict:
        dll = self._require_dll()
        self._require_handle()
        info = _NativeBackendInfo()
        info.struct_size = ctypes.sizeof(info)
        self._require_success(
            dll.gvfi_get_backend_info(self.handle, ctypes.byref(info)),
            "gvfi_get_backend_info",
        )
        return {
            "abi_version": int(info.abi_version),
            "ncnn_enabled": bool(info.ncnn_enabled),
            "initialized": bool(info.initialized),
            "model_loaded": bool(info.model_loaded),
            "device_index": int(info.device_index),
            "vulkan_api_version": int(info.vulkan_api_version),
            "gpu_name": bytes(info.gpu_name).split(b"\0", 1)[0].decode("utf-8", "replace"),
            "ncnn_version": bytes(info.ncnn_version)
            .split(b"\0", 1)[0]
            .decode("ascii", "replace"),
        }

    def load_model(self, param_path: str, bin_path: str) -> NativeResult:
        dll = self._require_dll()
        self._require_handle()
        if not param_path or not bin_path:
            raise NativeLibraryError("native model requires param and bin paths")
        return NativeResult(
            dll.gvfi_load_model(
                self.handle,
                os.fsencode(param_path),
                os.fsencode(bin_path),
            )
        )

    def process(self, frame0: Frame, frame1: Frame, timestamp: float) -> tuple[NativeResult, Optional[Frame]]:
        dll = self._require_dll()
        self._require_handle()
        native0, buffer0 = self._convert_frame(frame0)
        native1, buffer1 = self._convert_frame(frame1)
        if frame0.width != frame1.width or frame0.height != frame1.height:
            raise NativeLibraryError("native input frame dimensions must match")
        format_name = str(frame0.pixel_format or "").lower()
        format_info = _PIXEL_FORMATS.get(format_name)
        if format_info is None or format_info[1] != 3:
            raise NativeLibraryError("native RIFE output currently supports RGB24/BGR24")
        output_buffer = ctypes.create_string_buffer(int(frame0.width) * int(frame0.height) * 3)
        output = _NativeFrame(
            ctypes.cast(output_buffer, ctypes.c_void_p),
            len(output_buffer),
            int(frame0.width),
            int(frame0.height),
            int(frame0.width) * 3,
            format_info[0],
            int(frame0.frame_index),
            float(timestamp),
        )
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
        if result is not NativeResult.SUCCESS:
            return result, None
        data_size = int(frame0.width) * int(frame0.height) * 3
        return result, Frame(
            bytes(output_buffer.raw[:data_size]),
            int(output.width),
            int(output.height),
            format_name,
            int(output.frame_index),
            float(output.timestamp),
        )

    def process_batch(
        self,
        frames0: list[Frame],
        frames1: list[Frame],
        timestamps: list[float],
    ) -> tuple[NativeResult, list[Optional[Frame]]]:
        """C6.4/C6.5 experimental batch ABI — NOT used by VideoWorker production path.

        Production NativeInterpolatorBackend uses ``process()`` / ``gvfi_process`` only.
        Kept for C6.x regression/profile harnesses; do not wire into VideoWorker.
        """
        dll = self._require_dll()
        self._require_handle()

        batch_size = len(frames0)
        if batch_size != len(frames1) or batch_size != len(timestamps):
            raise NativeLibraryError("frames0, frames1, and timestamps must have same length")

        if batch_size <= 0:
            raise NativeLibraryError("batch_size must be positive")

        # Validate all frames have same dimensions
        width = frames0[0].width
        height = frames0[0].height
        format_name = str(frames0[0].pixel_format or "").lower()
        format_info = _PIXEL_FORMATS.get(format_name)
        if format_info is None or format_info[1] != 3:
            raise NativeLibraryError("native RIFE output currently supports RGB24/BGR24")

        # Prepare frame arrays and buffers
        native0_list = []
        native1_list = []
        buffers0 = []
        buffers1 = []
        output_buffers = []
        native_outputs = []

        for i in range(batch_size):
            if frames0[i].width != width or frames0[i].height != height:
                raise NativeLibraryError(f"frame {i} dimensions don't match batch dimensions")
            native0, buf0 = self._convert_frame(frames0[i])
            native1, buf1 = self._convert_frame(frames1[i])
            native0_list.append(native0)
            native1_list.append(native1)
            buffers0.append(buf0)
            buffers1.append(buf1)

            output_buf = ctypes.create_string_buffer(width * height * 3)
            output_buffers.append(output_buf)
            native_out = _NativeFrame(
                ctypes.cast(output_buf, ctypes.c_void_p),
                len(output_buf),
                width,
                height,
                width * 3,
                format_info[0],
                int(frames0[i].frame_index),
                float(timestamps[i]),
            )
            native_outputs.append(native_out)

        # Convert to ctypes arrays
        frames0_array = (_NativeFrame * batch_size)(*native0_list)
        frames1_array = (_NativeFrame * batch_size)(*native1_list)
        timestamps_array = (ctypes.c_double * batch_size)(*timestamps)
        outputs_array = (_NativeFrame * batch_size)(*native_outputs)

        result = NativeResult(
            dll.gvfi_process_batch(
                self.handle,
                frames0_array,
                frames1_array,
                timestamps_array,
                outputs_array,
                batch_size,
            )
        )

        _ = buffers0, buffers1
        if result is not NativeResult.SUCCESS:
            return result, [None] * batch_size

        # Convert outputs back to Frame objects
        frames_out = []
        for i in range(batch_size):
            data_size = width * height * 3
            frames_out.append(Frame(
                bytes(output_buffers[i].raw[:data_size]),
                width,
                height,
                format_name,
                int(native_outputs[i].frame_index),
                float(native_outputs[i].timestamp),
            ))

        return result, frames_out

    def get_last_batch_profile(self) -> dict:
        """C6.5 profiling ABI — timings from last ``gvfi_process_batch`` only.

        Not invoked by VideoWorker. Retained for steady-state profile tests.
        """
        dll = self._require_dll()
        profile = _NativeBatchProfile()
        profile.struct_size = ctypes.sizeof(profile)
        status = NativeResult(dll.gvfi_get_last_batch_profile(ctypes.byref(profile)))
        if status is not NativeResult.SUCCESS:
            raise NativeLibraryError(f"gvfi_get_last_batch_profile failed: {status.name}")
        return {
            "abi_version": int(profile.abi_version),
            "batch_size": int(profile.batch_size),
            "vk_submit_count": int(profile.vk_submit_count),
            "total_ms": float(profile.total_ms),
            "record_ms": float(profile.record_ms),
            "submit_ms": float(profile.submit_ms),
            "postprocess_ms": float(profile.postprocess_ms),
        }

    def release(self) -> None:
        if self.dll is None or not self.handle.value:
            return
        self._require_success(self.dll.gvfi_release(self.handle), "gvfi_release")

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


class PipelinePocLoader:
    """C6.6-only pipeline overlap handle. Independent of production gvfi_handle_t."""

    def __init__(self, library_path=None):
        self.library_path = library_path
        self.dll = None
        self.handle = ctypes.c_void_p()

    def load(self):
        if self.dll is not None:
            return
        path = self.library_path or next(
            (candidate for candidate in _candidate_paths() if os.path.isfile(candidate)),
            "",
        )
        if not path or not os.path.isfile(path):
            raise NativeLibraryError("gvfi_native.dll was not found")
        dll = ctypes.CDLL(path)
        self._bind(dll)
        self.library_path = os.path.abspath(path)
        self.dll = dll

    @staticmethod
    def _bind(dll):
        dll.gvfi_pipeline_create.restype = ctypes.c_int
        dll.gvfi_pipeline_create.argtypes = [ctypes.POINTER(ctypes.c_void_p)]
        dll.gvfi_pipeline_destroy.restype = ctypes.c_int
        dll.gvfi_pipeline_destroy.argtypes = [ctypes.c_void_p]
        dll.gvfi_pipeline_initialize.restype = ctypes.c_int
        dll.gvfi_pipeline_initialize.argtypes = [ctypes.c_void_p]
        dll.gvfi_pipeline_load_model.restype = ctypes.c_int
        dll.gvfi_pipeline_load_model.argtypes = [
            ctypes.c_void_p,
            ctypes.c_char_p,
            ctypes.c_char_p,
        ]
        dll.gvfi_pipeline_process_sequence.restype = ctypes.c_int
        dll.gvfi_pipeline_process_sequence.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(_NativeFrame),
            ctypes.POINTER(_NativeFrame),
            ctypes.POINTER(ctypes.c_double),
            ctypes.POINTER(_NativeFrame),
            ctypes.c_int,
            ctypes.c_int,
        ]
        dll.gvfi_pipeline_get_last_profile.restype = ctypes.c_int
        dll.gvfi_pipeline_get_last_profile.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(_NativePipelineProfile),
        ]

    def create(self):
        dll = self._require_dll()
        handle = ctypes.c_void_p()
        status = NativeResult(dll.gvfi_pipeline_create(ctypes.byref(handle)))
        if status is not NativeResult.SUCCESS or not handle.value:
            raise NativeLibraryError(f"gvfi_pipeline_create failed: {status.name}")
        self.handle = handle

    def initialize(self):
        self._require_success(
            self._require_dll().gvfi_pipeline_initialize(self.handle),
            "gvfi_pipeline_initialize",
        )

    def load_model(self, param_path, bin_path):
        return NativeResult(
            self._require_dll().gvfi_pipeline_load_model(
                self.handle,
                param_path.encode("utf-8"),
                bin_path.encode("utf-8"),
            )
        )

    def process_sequence(self, frames0, frames1, timestamps, depth):
        dll = self._require_dll()
        if not self.handle.value:
            raise NativeLibraryError("pipeline handle is not created")
        frame_count = len(frames0)
        if frame_count != len(frames1) or frame_count != len(timestamps):
            raise NativeLibraryError("pipeline sequence length mismatch")
        width = int(frames0[0].width)
        height = int(frames0[0].height)
        format_name = str(frames0[0].pixel_format or "").lower()
        format_info = _PIXEL_FORMATS.get(format_name)
        if format_info is None or format_info[1] != 3:
            raise NativeLibraryError("pipeline PoC supports RGB24/BGR24 only")

        native0_list = []
        native1_list = []
        buffers0 = []
        buffers1 = []
        output_buffers = []
        native_outputs = []
        for i in range(frame_count):
            native0, buf0 = NativeLibraryLoader._convert_frame(frames0[i])
            native1, buf1 = NativeLibraryLoader._convert_frame(frames1[i])
            native0_list.append(native0)
            native1_list.append(native1)
            buffers0.append(buf0)
            buffers1.append(buf1)
            output_buf = ctypes.create_string_buffer(width * height * 3)
            output_buffers.append(output_buf)
            native_outputs.append(
                _NativeFrame(
                    ctypes.cast(output_buf, ctypes.c_void_p),
                    len(output_buf),
                    width,
                    height,
                    width * 3,
                    format_info[0],
                    int(frames0[i].frame_index),
                    float(timestamps[i]),
                )
            )

        frames0_array = (_NativeFrame * frame_count)(*native0_list)
        frames1_array = (_NativeFrame * frame_count)(*native1_list)
        timestamps_array = (ctypes.c_double * frame_count)(*timestamps)
        outputs_array = (_NativeFrame * frame_count)(*native_outputs)

        result = NativeResult(
            dll.gvfi_pipeline_process_sequence(
                self.handle,
                frames0_array,
                frames1_array,
                timestamps_array,
                outputs_array,
                frame_count,
                int(depth),
            )
        )
        _ = buffers0, buffers1
        profile = self.get_last_profile() if result is NativeResult.SUCCESS else {}
        if result is not NativeResult.SUCCESS:
            return result, [None] * frame_count, profile

        frames_out = []
        data_size = width * height * 3
        for i in range(frame_count):
            frames_out.append(
                Frame(
                    bytes(output_buffers[i].raw[:data_size]),
                    width,
                    height,
                    format_name,
                    int(native_outputs[i].frame_index),
                    float(native_outputs[i].timestamp),
                )
            )
        return result, frames_out, profile

    def get_last_profile(self):
        profile = _NativePipelineProfile()
        profile.struct_size = ctypes.sizeof(profile)
        status = NativeResult(
            self._require_dll().gvfi_pipeline_get_last_profile(
                self.handle, ctypes.byref(profile)
            )
        )
        if status is not NativeResult.SUCCESS:
            raise NativeLibraryError(
                f"gvfi_pipeline_get_last_profile failed: {status.name}"
            )
        return {
            "abi_version": int(profile.abi_version),
            "depth": int(profile.depth),
            "frame_count": int(profile.frame_count),
            "submit_count": int(profile.submit_count),
            "wall_ms": float(profile.wall_ms),
            "sum_job_ms": float(profile.sum_job_ms),
            "avg_frame_ms": float(profile.avg_frame_ms),
            "overlap_ratio": float(profile.overlap_ratio),
            "cpu_wait_proxy_ms": float(profile.sum_job_ms),
            "fence_wait_proxy_ms": float(profile.sum_job_ms),
            "total_gpu_job_ms": float(profile.sum_job_ms),
        }

    def destroy(self):
        if self.dll is None or not self.handle.value:
            return
        self._require_success(
            self.dll.gvfi_pipeline_destroy(self.handle), "gvfi_pipeline_destroy"
        )
        self.handle = ctypes.c_void_p()

    def _require_dll(self):
        if self.dll is None:
            raise NativeLibraryError("pipeline native library is not loaded")
        return self.dll

    @staticmethod
    def _require_success(result, operation):
        status = NativeResult(result)
        if status is not NativeResult.SUCCESS:
            raise NativeLibraryError(f"{operation} failed: {status.name}")
