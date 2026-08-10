"""Interpolator backend contracts and the current RIFE CLI implementation."""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Callable, Optional

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
    """Lifecycle placeholder for Phase C native inference work."""

    def __init__(self, library_path: Optional[str] = None) -> None:
        super().__init__()
        self._library = NativeLibraryLoader(library_path)

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
        self.model_path = str(model_path or "")

    def process_frames(
        self,
        frame0: Frame,
        frame1: Frame,
        *,
        timestamp: float,
    ) -> Frame:
        if not self.initialized:
            raise BackendError("native backend is not initialized")
        try:
            result = self._library.process(frame0, frame1, timestamp)
        except NativeLibraryError as exc:
            raise BackendError(str(exc)) from exc
        if result is NativeResult.NOT_IMPLEMENTED:
            raise BackendNotImplementedError("native interpolation is not implemented")
        raise BackendError(f"unexpected native process result: {result.name}")

    def release(self) -> None:
        try:
            self._library.destroy()
        finally:
            self.model_path = ""
            self.initialized = False


def create_interpolator_backend(
    mode: str,
    *,
    executable: str = "",
    working_directory: Optional[str] = None,
    command_runner: Optional[CommandRunner] = None,
    native_library_path: Optional[str] = None,
) -> InterpolatorBackend:
    normalized = str(mode or "cli").strip().lower()
    if normalized == "native":
        return NativeInterpolatorBackend(native_library_path)
    if normalized != "cli":
        raise ValueError(f"unsupported interpolator backend: {mode}")
    if command_runner is None:
        raise ValueError("CLI backend requires a command runner")
    return RifeCLIBackend(executable, working_directory, command_runner)
