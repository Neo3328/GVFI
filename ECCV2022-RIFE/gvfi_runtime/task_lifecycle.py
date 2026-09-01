"""Thread-safe lifecycle state for one VideoWorker task."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .errors import ErrorCode, GvfiError


class TaskState(str, Enum):
    CREATED = "created"
    VALIDATING = "validating"
    INITIALIZING = "initializing"
    RUNNING = "running"
    CANCELLING = "cancelling"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


TERMINAL_STATES = {TaskState.SUCCEEDED, TaskState.FAILED, TaskState.CANCELLED}


@dataclass(frozen=True)
class FailureRecord:
    code: str
    stage: str
    message: str
    exception_type: str
    details: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_exception(cls, exc: BaseException, stage: str) -> "FailureRecord":
        if isinstance(exc, GvfiError):
            return cls(
                code=exc.code.value,
                stage=exc.stage if exc.stage != "unknown" else stage,
                message=str(exc),
                exception_type=type(exc).__name__,
                details=dict(exc.details),
            )
        return cls(
            code=ErrorCode.UNKNOWN_ERROR.value,
            stage=stage,
            message=str(exc),
            exception_type=type(exc).__name__,
        )


class TaskLifecycle:
    """Records observable state without owning worker execution or resources."""

    def __init__(self, task_id: str, requested_backend: str) -> None:
        self.task_id = task_id
        self.requested_backend = requested_backend
        self.active_backend = requested_backend
        self.state = TaskState.CREATED
        self.fallback_occurred = False
        self.fallback_failure: FailureRecord | None = None
        self.last_failure: FailureRecord | None = None
        self.release_failures: list[FailureRecord] = []
        self.started_at = time.time()
        self.finished_at: float | None = None
        self.released_backends: list[str] = []
        self._lock = threading.RLock()

    def transition(self, state: TaskState) -> None:
        with self._lock:
            if self.state in TERMINAL_STATES:
                return
            self.state = state
            if state in TERMINAL_STATES:
                self.finished_at = time.time()

    def record_failure(self, exc: BaseException, stage: str) -> FailureRecord:
        record = FailureRecord.from_exception(exc, stage)
        with self._lock:
            self.last_failure = record
        return record

    def record_fallback(self, exc: BaseException, stage: str) -> FailureRecord:
        record = self.record_failure(exc, stage)
        with self._lock:
            self.fallback_occurred = True
            self.fallback_failure = record
            self.active_backend = "cli"
        return record

    def mark_released(self, backend: str) -> None:
        with self._lock:
            self.released_backends.append(backend)

    def record_release_failure(self, exc: BaseException, backend: str) -> FailureRecord:
        record = FailureRecord.from_exception(exc, "backend_release")
        details = dict(record.details)
        details["backend"] = backend
        record = FailureRecord(
            code=record.code,
            stage=record.stage,
            message=record.message,
            exception_type=record.exception_type,
            details=details,
        )
        with self._lock:
            self.release_failures.append(record)
        return record

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            fallback = self.fallback_failure
            failure = self.last_failure
            return {
                "task_id": self.task_id,
                "state": self.state.value,
                "requested_backend": self.requested_backend,
                "active_backend": self.active_backend,
                "fallback_occurred": self.fallback_occurred,
                "fallback": None if fallback is None else fallback.__dict__.copy(),
                "last_failure": None if failure is None else failure.__dict__.copy(),
                "release_failures": [item.__dict__.copy() for item in self.release_failures],
                "released_backends": list(self.released_backends),
                "started_at": self.started_at,
                "finished_at": self.finished_at,
            }
