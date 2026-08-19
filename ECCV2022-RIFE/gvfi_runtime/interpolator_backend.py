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


def map_native_directory_sample(
    output_index: int,
    input_count: int,
    output_count: int,
) -> tuple[int, int, float]:
    """Map one output frame index onto an inclusive input-timeline sample.

    Uses endpoint-inclusive positions:
      position = output_index * (input_count - 1) / (output_count - 1)

    Returns ``(left, right, fraction)`` where ``fraction`` is in ``[0, 1)``
    relative to ``[left, right]``. The final output index always samples the
    last input frame as ``(n-1, n-1, 0.0)``. Distinct output indices never
    collapse to the same ``(left, fraction)`` pair for ``output_count > 1``.
    """
    if input_count <= 0 or output_count <= 0:
        raise ValueError("input_count and output_count must be positive")
    if output_index < 0 or output_index >= output_count:
        raise ValueError("output_index out of range")

    if input_count == 1 or output_count == 1:
        return 0, 0, 0.0

    position = output_index * (input_count - 1) / (output_count - 1)
    last = input_count - 1
    # Final slot (and any float that lands on/past the end) → exact last frame.
    if output_index == output_count - 1 or position >= last:
        return last, last, 0.0

    left = int(math.floor(position))
    if left >= last:
        return last, last, 0.0
    fraction = position - left
    if fraction <= 1e-12:
        return left, left, 0.0
    return left, left + 1, float(fraction)


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
        self._stats = {
            "native_batch_count": 0,
            "native_frame_count": 0,
            "python_to_native_call_count": 0,
            "png_read_count": 0,
            "png_write_count": 0,
            "native_inference_time": 0.0,
            "total_time": 0.0,
        }

    name = "native"

    def reset_stats(self) -> None:
        """Reset per-task call-boundary counters (kept across scenes within a task)."""
        for key in self._stats:
            self._stats[key] = 0

    def stats(self) -> dict:
        """Snapshot of per-task call-boundary statistics."""
        return dict(self._stats)

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
        started_at = time.perf_counter()
        paths = sorted(Path(input_path).glob("*.png"))
        output_count = int(target_frames)
        if not paths or output_count <= 0:
            raise BackendError("native RIFE directory input is empty or target count is invalid")
        os.makedirs(output_path, exist_ok=True)
        input_count = len(paths)

        # Bounded LRU frame cache: each input frame is read from disk at most
        # once per process_directory call. Old frames are evicted past capacity.
        from collections import OrderedDict
        cache: OrderedDict[int, np.ndarray] = OrderedDict()
        CACHE_CAPACITY = 64

        def read_frame(index: int) -> np.ndarray:
            if index in cache:
                cache.move_to_end(index)
                return cache[index]
            image = cv2.imread(str(paths[index]), cv2.IMREAD_COLOR)
            if image is None or image.ndim != 3 or image.shape[2] != 3:
                raise BackendError(f"native RIFE failed to read RGB8 input: {paths[index]}")
            cache[index] = image
            cache.move_to_end(index)
            while len(cache) > CACHE_CAPACITY:
                cache.popitem(last=False)
            self._stats["png_read_count"] += 1
            return cache[index]

        # Build the per-output mapping once, then split outputs into:
        #   - pass-through (left == right, or fraction ~ 0): copy source frame
        #   - interpolated: grouped into ONE native batch call per process_directory
        samples = [
            map_native_directory_sample(output_index, input_count, output_count)
            for output_index in range(output_count)
        ]

        # First pass: write pass-through outputs and collect interpolated ones.
        interpolated: list[tuple[int, int, float, int]] = []  # (left, right, fraction, output_index)
        for output_index, (left, right, fraction) in enumerate(samples):
            if right == left or fraction <= 1e-12:
                image0 = read_frame(left)
                destination = os.path.join(output_path, f"{output_index + 1:08d}.png")
                if not cv2.imwrite(destination, image0):
                    raise BackendError(f"native RIFE failed to write output: {destination}")
                self._stats["png_write_count"] += 1
            else:
                interpolated.append((left, right, fraction, output_index))

        if not interpolated:
            self._stats["total_time"] = time.perf_counter() - started_at
            return

        # Read the distinct input pairs for interpolated outputs (each input
        # frame read at most once thanks to the bounded cache).
        pair_cache: dict[tuple[int, int], tuple[np.ndarray, np.ndarray]] = {}
        for (left, right, _fraction, _output_index) in interpolated:
            key = (left, right)
            if key not in pair_cache:
                image0 = read_frame(left)
                image1 = read_frame(right)
                if image0.shape != image1.shape:
                    raise BackendError("native RIFE input frame dimensions changed within a scene")
                pair_cache[key] = (image0, image1)

        # Single native batch call for ALL interpolated outputs in this directory
        # (same scene dimensions; each output keeps its own timestep).
        height, width = next(iter(pair_cache.values()))[0].shape[:2]
        frames0: list[Frame] = []
        frames1: list[Frame] = []
        timestamps: list[float] = []
        for (left, right, fraction, _output_index) in interpolated:
            image0, image1 = pair_cache[(left, right)]
            frames0.append(Frame(image0, width, height, "bgr24", left, float(left)))
            frames1.append(Frame(image1, width, height, "bgr24", right, float(right)))
            timestamps.append(fraction)

        batch_started = time.perf_counter()
        result_code, outputs = self._library.process_batch(frames0, frames1, timestamps)
        self._stats["native_inference_time"] += time.perf_counter() - batch_started
        self._stats["python_to_native_call_count"] += 1
        if result_code is not NativeResult.SUCCESS:
            raise BackendError(f"native RIFE batch forward failed: {result_code.name}")
        self._stats["native_batch_count"] += 1
        self._stats["native_frame_count"] += len(interpolated)

        for (entry_index, (_left, _right, _fraction, output_index)) in enumerate(interpolated):
            output_frame = outputs[entry_index]
            if output_frame is None:
                raise BackendError("native RIFE batch returned a null frame")
            output_image = np.frombuffer(output_frame.frame_data, dtype=np.uint8).reshape(output_frame.height, output_frame.width, 3)
            destination = os.path.join(output_path, f"{output_index + 1:08d}.png")
            if not cv2.imwrite(destination, output_image):
                raise BackendError(f"native RIFE failed to write output: {destination}")
            self._stats["png_write_count"] += 1

        self._stats["total_time"] = time.perf_counter() - started_at

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
