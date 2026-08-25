# GVFI runtime — Python isomorphic port of native/ WorkLoop design.
# Clean-room reimplementation of IOKit WorkLoop ideas for Windows user-space.
# Does not modify VideoWorker; safe to import from gvfi_api.

from __future__ import annotations

from .work_loop import WorkLoop, WorkStatus
from .event_source import CommandGate, EventSource, TimerEventSource
from .memory_pressure import MemoryPressureMonitor, MemorySnapshot, PressureLevel
from .zone_pool import ZonePool
from .job_orchestrator import JobStageOrchestrator, get_orchestrator
from .frame_pipeline import (
    Frame,
    FramePipeline,
    FramePipelineError,
    FramePipelineResult,
    FrameQueue,
    FrameQueueClosed,
    FrameQueueStats,
    decode_and_consume,
)
from .rife_cli_pipeline import RifePipelineStats
from .rife_scene_scheduler import (
    RifeWorkerManager,
    RifeWorkerStats,
    SceneContractError,
    SceneProcessResult,
    SceneTask,
    SceneTaskQueue,
    validate_scene_tasks,
)
from .interpolator_backend import (
    BackendCapabilityError,
    BackendError,
    BackendNotImplementedError,
    InterpolatorBackend,
    NativeInterpolatorBackend,
    RifeCLIBackend,
    create_interpolator_backend,
)
from .native_library import NativeLibraryError, NativeLibraryLoader, NativeResult
from .runtime_config import ConfigurationError, RuntimeConfig
from .errors import BackendRuntimeError, CancelledError, ConfigError, ErrorCode, GvfiError, InputError
from .task_lifecycle import FailureRecord, TaskLifecycle, TaskState
from .media_contract import (
    MediaContract,
    build_output_video_filter,
    parse_media_contract,
    probe_media_contract,
)
from .resource_monitor import ResourceSnapshot, sample_resources, summarize_resources
from .task_artifacts import (
    DiskEstimate,
    InsufficientDiskSpaceError,
    OutputValidation,
    estimate_disk_space,
    require_disk_space,
    reserve_output_path,
    validate_output_video,
    write_task_report,
)
from .native_bridge import (
    NativeGate,
    NativeWorkLoop,
    NativeZonePool,
    native_available,
    native_memory_sample,
    native_version,
)

__all__ = [
    "WorkLoop",
    "WorkStatus",
    "EventSource",
    "CommandGate",
    "TimerEventSource",
    "MemoryPressureMonitor",
    "MemorySnapshot",
    "PressureLevel",
    "ZonePool",
    "JobStageOrchestrator",
    "get_orchestrator",
    "Frame",
    "FramePipeline",
    "FramePipelineError",
    "FramePipelineResult",
    "FrameQueue",
    "FrameQueueClosed",
    "FrameQueueStats",
    "decode_and_consume",
    "RifePipelineStats",
    "SceneTask",
    "SceneTaskQueue",
    "SceneContractError",
    "SceneProcessResult",
    "validate_scene_tasks",
    "RifeWorkerManager",
    "RifeWorkerStats",
    "BackendError",
    "BackendCapabilityError",
    "BackendNotImplementedError",
    "InterpolatorBackend",
    "RifeCLIBackend",
    "NativeInterpolatorBackend",
    "create_interpolator_backend",
    "NativeLibraryError",
    "NativeLibraryLoader",
    "NativeResult",
    "RuntimeConfig",
    "ConfigurationError",
    "ErrorCode",
    "GvfiError",
    "ConfigError",
    "InputError",
    "BackendRuntimeError",
    "CancelledError",
    "FailureRecord",
    "TaskLifecycle",
    "TaskState",
    "MediaContract",
    "build_output_video_filter",
    "parse_media_contract",
    "probe_media_contract",
    "ResourceSnapshot",
    "sample_resources",
    "summarize_resources",
    "DiskEstimate",
    "InsufficientDiskSpaceError",
    "OutputValidation",
    "estimate_disk_space",
    "require_disk_space",
    "reserve_output_path",
    "validate_output_video",
    "write_task_report",
    "NativeGate",
    "NativeWorkLoop",
    "NativeZonePool",
    "native_available",
    "native_memory_sample",
    "native_version",
]
