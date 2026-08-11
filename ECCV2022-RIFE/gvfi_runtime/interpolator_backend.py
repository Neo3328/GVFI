"""Interpolator backend contracts and the current RIFE CLI implementation."""

from __future__ import annotations

import os
import hashlib
import math
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Callable, Optional

import cv2
import numpy as np

from .frame_pipeline import Frame
from .native_library import NativeLibraryError, NativeLibraryLoader, NativeResult


class BackendError(RuntimeError):
    """Base error for interpolation backend lifecycle and capability failures."""


class BackendCapabilityError(BackendError):
    """Raised when a backend cannot serve the requested data interface."""


class BackendNotImplementedError(BackendCapabilityError, NotImplementedError):
    """Raised when a declared backend capability is intentionally a placeholder."""


CommandRunner = Callable[[list[str], str, Optional[str]], None]


class InterpolatorBackend(ABC):
    """Backend-neutral in-memory interpolation contract."""

    name = "unknown"

    def __init__(self) -> None:
        self.initialized = False
        self.model_path = ""

    @abstractmethod
    def initialize(self) -> None:
        """Initialize backend runtime resources."""

    @abstractmethod
    def load_model(self, model_path: str) -> None:
        """Load or select a model for subsequent interpolation."""

    @abstractmethod
    def process_frames(
        self,
        frame0: Frame,
        frame1: Frame,
        *,
        timestamp: float,
    ) -> Frame:
        """Interpolate two in-memory frames into one in-memory frame."""

    @abstractmethod
    def release(self) -> None:
        """Release runtime and model resources."""


class RifeCLIBackend(InterpolatorBackend):
    """Compatibility backend around the existing rife-ncnn-vulkan executable."""

    name = "cli"

    def __init__(
        self,
        executable: str,
        working_directory: Optional[str],
        command_runner: CommandRunner,
    ) -> None:
        super().__init__()
        self.executable = executable
        self.working_directory = working_directory
        self._command_runner = command_runner

    def initialize(self) -> None:
        if not self.executable or not os.path.isfile(self.executable):
            raise BackendError(f"RIFE CLI executable is unavailable: {self.executable}")
        self.initialized = True

    def load_model(self, model_path: str) -> None:
        if not self.initialized:
            raise BackendError("RIFE CLI backend is not initialized")
        if not model_path or not os.path.isdir(model_path):
            raise BackendError(f"RIFE model directory is unavailable: {model_path}")
        self.model_path = model_path

    def process_frames(
        self,
        frame0: Frame,
        frame1: Frame,
        *,
        timestamp: float,
    ) -> Frame:
        raise BackendCapabilityError(
            "RIFE CLI accepts image paths only; use process_directory or the future native backend"
        )

    def process_directory(
        self,
        input_path: str,
        output_path: str,
        *,
        target_frames: int,
        gpu: Optional[int],
        thread_config: str,
    ) -> None:
        if not self.initialized or not self.model_path:
            raise BackendError("RIFE CLI backend is not ready")
        os.makedirs(output_path, exist_ok=True)
        command = [
            self.executable,
            "-i", input_path,
            "-o", output_path,
            "-n", str(int(target_frames)),
            "-m", self.model_path,
            "-f", "%08d.png",
            "-j", str(thread_config),
        ]
        if gpu is not None:
            command.extend(["-g", str(int(gpu))])
        self._command_runner(command, "RIFE Vulkan", self.working_directory)

    def release(self) -> None:
        self.model_path = ""
        self.initialized = False


class NativeInterpolatorBackend(InterpolatorBackend):
    """Persistent in-process RIFE v4.6 backend backed by gvfi_native.dll."""

    MODEL_HASHES = {
        "flownet.param": "28DF14D57A225725EE5386F52EBA422488450D37C9F40800ED4F62E8BA846692",
        "flownet.bin": "F334ED2260149CE0188A6DCF049844E8B0CDD912E01CBCFB63553157D2508958",
    }

    def __init__(self, library_path: Optional[str] = None, log_callback: Optional[Callable[[str], None]] = None) -> None:
        super().__init__()
        self._library = NativeLibraryLoader(library_path)
        self._log = log_callback or (lambda _message: None)
        self._forward_count = 0

    name = "native"

    def initialize(self) -> None:
        try:
            self._library.load()
            self._library.create()
            self._library.initialize()
            self.initialized = True
        except NativeLibraryError as exc:
            self._library.destroy()
            raise BackendError(str(exc)) from exc

    def load_model(self, model_path: str) -> None:
        if not self.initialized:
            raise BackendError("native backend is not initialized")
        model_path = str(model_path or "")
        param_path = os.path.join(model_path, "flownet.param")
        bin_path = os.path.join(model_path, "flownet.bin")
        for path in (param_path, bin_path):
            if not os.path.isfile(path):
                raise BackendError(f"native RIFE model file is unavailable: {path}")
            digest = hashlib.sha256()
            with open(path, "rb") as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    digest.update(chunk)
            expected = self.MODEL_HASHES[os.path.basename(path)]
            if digest.hexdigest().upper() != expected:
                raise BackendError(f"native RIFE model hash mismatch: {path}")
        try:
            result = self._library.load_model(param_path, bin_path)
        except NativeLibraryError as exc:
            raise BackendError(str(exc)) from exc
        if result is NativeResult.NOT_IMPLEMENTED:
            raise BackendNotImplementedError("ncnn Vulkan backend is not enabled")
        if result is not NativeResult.SUCCESS:
            raise BackendError(f"native model loading failed: {result.name}")
        self.model_path = model_path
        info = self.backend_info()
        self._log("MODEL LOAD:\nbackend=native\nmodel=" + model_path +
                  f"\ngpu={info['gpu_name']}\nncnn={info['ncnn_version']}")

    def process_frames(
        self,
        frame0: Frame,
        frame1: Frame,
        *,
        timestamp: float,
    ) -> Frame:
        if not self.initialized:
            raise BackendError("native backend is not initialized")
        started_at = time.perf_counter()
        try:
            result, output = self._library.process(frame0, frame1, timestamp)
        except NativeLibraryError as exc:
            raise BackendError(str(exc)) from exc
        if result is NativeResult.NOT_IMPLEMENTED:
            raise BackendNotImplementedError("native interpolation is not implemented")
        if result is not NativeResult.SUCCESS or output is None:
            raise BackendError(f"native RIFE forward failed: {result.name}")
        self._forward_count += 1
        if self._forward_count == 1 or self._forward_count % 100 == 0:
            self._log("RIFE NATIVE FORWARD:\n" +
                      f"frame_index={frame0.frame_index}\n" +
                      f"input_resolution={frame0.width}x{frame0.height}\n" +
                      f"elapsed_ms={(time.perf_counter() - started_at) * 1000.0:.3f}")
        return output

    def process_directory(self, input_path: str, output_path: str, *, target_frames: int,
                          gpu: Optional[int], thread_config: str) -> None:
        del gpu, thread_config
        if not self.initialized or not self.model_path:
            raise BackendError("native RIFE backend is not ready")
        paths = sorted(Path(input_path).glob("*.png"))
        output_count = int(target_frames)
        if not paths or output_count <= 0:
            raise BackendError("native RIFE directory input is empty or target count is invalid")
        os.makedirs(output_path, exist_ok=True)
        cache = {}

        def read_frame(index):
            if index not in cache:
                image = cv2.imread(str(paths[index]), cv2.IMREAD_COLOR)
                if image is None or image.ndim != 3 or image.shape[2] != 3:
                    raise BackendError(f"native RIFE failed to read RGB8 input: {paths[index]}")
                cache.clear()
                cache[index] = image
            return cache[index]

        input_count = len(paths)
        scale = input_count / output_count
        for output_index in range(output_count):
            if input_count == 1:
                left = right = 0
                fraction = 0.0
            else:
                position = output_index * scale
                left = int(math.floor(position))
                fraction = position - left
                if left >= input_count - 1:
                    left = input_count - 2
                    fraction = 1.0
                right = left + 1
            image0 = read_frame(left)
            if right == left or fraction <= 1e-12:
                output_image = image0
            else:
                image1 = read_frame(right)
                if image0.shape != image1.shape:
                    raise BackendError("native RIFE input frame dimensions changed within a scene")
                height, width = image0.shape[:2]
                result = self.process_frames(
                    Frame(image0, width, height, "bgr24", left, float(left)),
                    Frame(image1, width, height, "bgr24", right, float(right)),
                    timestamp=fraction,
                )
                output_image = np.frombuffer(result.frame_data, dtype=np.uint8).reshape(result.height, result.width, 3)
            destination = os.path.join(output_path, f"{output_index + 1:08d}.png")
            if not cv2.imwrite(destination, output_image):
                raise BackendError(f"native RIFE failed to write output: {destination}")

    def backend_info(self) -> dict:
        if not self.initialized:
            raise BackendError("native backend is not initialized")
        try:
            return self._library.backend_info()
        except NativeLibraryError as exc:
            raise BackendError(str(exc)) from exc

    def release(self) -> None:
        try:
            self._library.release()
        finally:
            try:
                self._library.destroy()
            finally:
                self.model_path = ""
                self.initialized = False
                self._forward_count = 0


def create_interpolator_backend(
    mode: str,
    *,
    executable: str = "",
    working_directory: Optional[str] = None,
    command_runner: Optional[CommandRunner] = None,
    native_library_path: Optional[str] = None,
    log_callback: Optional[Callable[[str], None]] = None,
) -> InterpolatorBackend:
    normalized = str(mode or "cli").strip().lower()
    if normalized == "native":
        return NativeInterpolatorBackend(native_library_path, log_callback)
    if normalized != "cli":
        raise ValueError(f"unsupported interpolator backend: {mode}")
    if command_runner is None:
        raise ValueError("CLI backend requires a command runner")
    return RifeCLIBackend(executable, working_directory, command_runner)
