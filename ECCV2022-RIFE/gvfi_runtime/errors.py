"""Stable error taxonomy shared by worker and interpolation backends."""

from __future__ import annotations

from enum import Enum
from typing import Any, Mapping


class ErrorCode(str, Enum):
    CONFIG_ERROR = "CONFIG_ERROR"
    INPUT_ERROR = "INPUT_ERROR"
    DECODE_ERROR = "DECODE_ERROR"
    MODEL_ERROR = "MODEL_ERROR"
    VULKAN_ERROR = "VULKAN_ERROR"
    BACKEND_ERROR = "BACKEND_ERROR"
    ENCODE_ERROR = "ENCODE_ERROR"
    CANCELLED = "CANCELLED"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


class GvfiError(RuntimeError):
    """Base error carrying a stable code, stage, and serializable details."""

    default_code = ErrorCode.UNKNOWN_ERROR

    def __init__(
        self,
        message: str,
        *,
        code: ErrorCode | None = None,
        stage: str = "unknown",
        details: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code or self.default_code
        self.stage = stage
        self.details = dict(details or {})

    def to_dict(self) -> dict[str, Any]:
        return {
            "code": self.code.value,
            "stage": self.stage,
            "message": str(self),
            "details": dict(self.details),
        }


class ConfigError(GvfiError):
    default_code = ErrorCode.CONFIG_ERROR


class InputError(GvfiError):
    default_code = ErrorCode.INPUT_ERROR


class BackendRuntimeError(GvfiError):
    default_code = ErrorCode.BACKEND_ERROR


class CancelledError(GvfiError):
    default_code = ErrorCode.CANCELLED
