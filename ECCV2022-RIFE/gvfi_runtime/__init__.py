# GVFI runtime — Python isomorphic port of native/ WorkLoop design.
# Clean-room reimplementation of IOKit WorkLoop ideas for Windows user-space.
# Does not modify VideoWorker; safe to import from gvfi_api.

from __future__ import annotations

from .work_loop import WorkLoop, WorkStatus
from .event_source import CommandGate, EventSource, TimerEventSource
from .memory_pressure import MemoryPressureMonitor, MemorySnapshot, PressureLevel
from .zone_pool import ZonePool
from .job_orchestrator import JobStageOrchestrator, get_orchestrator
from .frame_pipeline import Frame, FramePipeline, FrameQueue, FrameQueueClosed, decode_and_consume
from .rife_cli_pipeline import RifePipelineStats
from .rife_scene_scheduler import RifeWorkerManager, RifeWorkerStats, SceneTask, SceneTaskQueue
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
    "FrameQueue",
    "FrameQueueClosed",
    "decode_and_consume",
    "RifePipelineStats",
    "SceneTask",
    "SceneTaskQueue",
    "RifeWorkerManager",
    "RifeWorkerStats",
    "NativeGate",
    "NativeWorkLoop",
    "NativeZonePool",
    "native_available",
    "native_memory_sample",
    "native_version",
]
