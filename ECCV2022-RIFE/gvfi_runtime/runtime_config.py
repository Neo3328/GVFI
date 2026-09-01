"""Validated, immutable configuration for one VideoWorker run."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Mapping

from .errors import ConfigError


class ConfigurationError(ConfigError, ValueError):
    """Raised when worker settings cannot form a valid runtime configuration."""


def _as_bool(value: Any) -> bool:
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "on"}:
            return True
        if normalized in {"0", "false", "no", "off", ""}:
            return False
        raise ConfigurationError(f"invalid boolean value: {value!r}")
    return bool(value)


@dataclass(frozen=True)
class RuntimeConfig:
    """Backend-neutral settings normalized once at the task boundary."""

    backend_mode: str = "cli"
    pipeline_mode: str = "disk"
    fps: float = 60.0
    scale: str = "原始"
    codec: str = "H.265 (HEVC)"
    crf: int = 18
    encode_preset: str = "medium"
    encoder_mode: str = "auto"
    rife_model: str = ""
    rife_thread_config: str = "2:4:4"
    gpu: int = 0
    enable_dedup: bool = True
    enable_scdet: bool = True
    dedup_threshold: float = 1.5
    scdet_threshold: float = 12.0
    keep_audio: bool = True
    queue_size: int = 32
    worker_count: int = 1

    @classmethod
    def from_mapping(cls, values: Mapping[str, Any] | None) -> "RuntimeConfig":
        source = dict(values or {})
        try:
            config = cls(
                backend_mode=str(source.get("backend_mode", "cli")).strip().lower(),
                pipeline_mode=str(source.get("pipeline_mode", "disk")).strip().lower(),
                fps=float(source.get("fps", 60.0)),
                scale=str(source.get("scale", "原始")),
                codec=str(source.get("codec", "H.265 (HEVC)")),
                crf=int(source.get("crf", 18)),
                encode_preset=str(source.get("encode_preset", "medium")).strip().lower(),
                encoder_mode=str(source.get("encoder_mode", "auto")).strip().lower(),
                rife_model=str(source.get("rife_model", "") or "").strip(),
                rife_thread_config=str(source.get("rife_thread_config", "2:4:4")),
                gpu=int(source.get("gpu", 0) if source.get("gpu", 0) is not None else 0),
                enable_dedup=_as_bool(source.get("enable_dedup", True)),
                enable_scdet=_as_bool(source.get("enable_scdet", True)),
                dedup_threshold=float(source.get("dedup_threshold", 1.5)),
                scdet_threshold=float(source.get("scdet_threshold", 12.0)),
                keep_audio=_as_bool(source.get("keep_audio", True)),
                queue_size=int(source.get("queue_size", 32)),
                worker_count=int(source.get("worker_count", 1)),
            )
        except (TypeError, ValueError) as exc:
            if isinstance(exc, ConfigurationError):
                raise
            raise ConfigurationError(f"invalid runtime configuration: {exc}") from exc
        config.validate()
        return config

    def validate(self) -> None:
        if self.backend_mode not in {"cli", "native"}:
            raise ConfigurationError(f"unsupported backend_mode: {self.backend_mode}")
        if self.pipeline_mode not in {"disk", "memory"}:
            raise ConfigurationError(f"unsupported pipeline_mode: {self.pipeline_mode}")
        if self.fps <= 0:
            raise ConfigurationError("fps must be positive")
        if not 0 <= self.crf <= 51:
            raise ConfigurationError("crf must be between 0 and 51")
        if self.gpu < 0:
            raise ConfigurationError("gpu must be non-negative")
        if self.queue_size <= 0 or self.worker_count <= 0:
            raise ConfigurationError("queue_size and worker_count must be positive")
        if self.dedup_threshold < 0 or self.scdet_threshold < 0:
            raise ConfigurationError("scene thresholds must be non-negative")

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)

    def apply_to(self, original: Mapping[str, Any] | None) -> dict[str, Any]:
        """Preserve extension keys while replacing core values with normalized ones."""
        merged = dict(original or {})
        merged.update(self.as_dict())
        return merged
