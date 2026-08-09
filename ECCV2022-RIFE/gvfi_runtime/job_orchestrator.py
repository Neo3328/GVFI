"""Job stage orchestrator — IOKit WorkLoop-style event marshalling for GVFI jobs.

Serializes progress / log / stage / finish events onto a single WorkLoop thread.
Prefers native gvfi_native.dll WorkLoop when available; falls back to Python.
Does not modify VideoWorker.
"""

from __future__ import annotations

import re
import threading
import time
from dataclasses import dataclass, field
from typing import Callable, Dict, Optional

from .event_source import CommandGate
from .memory_pressure import MemoryPressureMonitor
from .native_bridge import NativeGate, NativeWorkLoop, native_available
from .work_loop import WorkLoop

UpdateFn = Callable[..., None]
LogFn = Callable[[str, str], None]  # job_id, line
FinishFn = Callable[[str, bool, str], None]  # job_id, success, message

_STAGE_FROM_LOG = (
    (re.compile(r"\[1/4\]"), "extract"),
    (re.compile(r"\[2/4\]", re.I), "rife"),
    (re.compile(r"rife", re.I), "rife"),
    (re.compile(r"\[3/4\]"), "upsample"),
    (re.compile(r"esrgan|超分", re.I), "upsample"),
    (re.compile(r"\[4/4\]"), "encode"),
    (re.compile(r"encode|合成", re.I), "encode"),
    (re.compile(r"抽帧"), "extract"),
    (re.compile(r"大模型|llm", re.I), "analyze"),
)


@dataclass
class JobStageState:
    job_id: str
    stage: str = "queued"
    progress: float = 0.0
    message: str = ""
    updated_at: float = field(default_factory=time.time)


class JobStageOrchestrator:
    """Single work-loop marshals all job UI/state side-effects."""

    def __init__(self) -> None:
        self._use_native = native_available()
        self._native_loop: Optional[NativeWorkLoop] = None
        self._native_gate: Optional[NativeGate] = None
        self._py_loop: Optional[WorkLoop] = None
        self._py_gate: Optional[CommandGate] = None
        self._lock = threading.RLock()
        self._jobs: Dict[str, JobStageState] = {}
        self._on_update: Optional[UpdateFn] = None
        self._on_log: Optional[LogFn] = None
        self._on_finish: Optional[FinishFn] = None
        self._mem = MemoryPressureMonitor()
        self._mem.set_thresholds(75, 90)
        self._started = False

    @property
    def backend(self) -> str:
        return "gvfi_native" if self._use_native else "gvfi_runtime"

    def set_handlers(
        self,
        *,
        on_update: UpdateFn,
        on_log: LogFn,
        on_finish: FinishFn,
    ) -> None:
        self._on_update = on_update
        self._on_log = on_log
        self._on_finish = on_finish

    def start(self) -> bool:
        with self._lock:
            if self._started:
                return True
            if self._use_native:
                try:
                    self._native_loop = NativeWorkLoop()
                    assert self._native_loop.start()
                    self._native_gate = self._native_loop.create_gate("job-stages")
                    self._started = True
                    return True
                except Exception:
                    self._use_native = False
                    self._native_loop = None
                    self._native_gate = None
            self._py_loop = WorkLoop()
            self._py_loop.start()
            self._py_gate = CommandGate("job-stages")
            self._py_loop.add_event_source(self._py_gate)
            self._started = True
            return True

    def stop(self) -> None:
        with self._lock:
            if not self._started:
                return
            if self._native_gate is not None:
                self._native_gate.close()
                self._native_gate = None
            if self._native_loop is not None:
                self._native_loop.close()
                self._native_loop = None
            if self._py_loop is not None:
                if self._py_gate is not None:
                    self._py_loop.remove_event_source(self._py_gate)
                self._py_loop.stop()
                self._py_loop = None
                self._py_gate = None
            self._started = False

    def bind_job(self, job_id: str, *, stage: str = "queued") -> None:
        with self._lock:
            self._jobs[job_id] = JobStageState(job_id=job_id, stage=stage)

    def unbind_job(self, job_id: str) -> None:
        with self._lock:
            self._jobs.pop(job_id, None)

    def get_state(self, job_id: str) -> Optional[JobStageState]:
        with self._lock:
            st = self._jobs.get(job_id)
            return None if st is None else JobStageState(**st.__dict__)

    def post_progress(self, job_id: str, value: float) -> None:
        progress = max(0.0, min(1.0, float(value)))
        self._submit(lambda: self._apply_progress(job_id, progress))

    def post_log(self, job_id: str, message: str) -> None:
        text = str(message)
        self._submit(lambda: self._apply_log(job_id, text))

    def post_stage(self, job_id: str, stage: str, message: str = "") -> None:
        self._submit(lambda: self._apply_stage(job_id, stage, message))

    def post_finished(self, job_id: str, success: bool, message: str) -> None:
        ok = bool(success)
        text = str(message)
        self._submit(lambda: self._apply_finished(job_id, ok, text))

    def infer_stage_from_log(self, message: str) -> Optional[str]:
        for pattern, stage in _STAGE_FROM_LOG:
            if pattern.search(message):
                return stage
        return None

    def _submit(self, fn: Callable[[], None]) -> None:
        if not self._started:
            self.start()
        if self._native_gate is not None:
            self._native_gate.submit(fn)
            return
        if self._py_gate is not None:
            self._py_gate.submit(fn)
            return
        fn()

    def _ensure_job(self, job_id: str) -> JobStageState:
        with self._lock:
            st = self._jobs.get(job_id)
            if st is None:
                st = JobStageState(job_id=job_id)
                self._jobs[job_id] = st
            return st

    def _apply_progress(self, job_id: str, progress: float) -> None:
        st = self._ensure_job(job_id)
        st.progress = progress
        st.updated_at = time.time()
        # Keep stage unless still queued
        stage = st.stage if st.stage not in ("queued", "") else "rife"
        st.stage = stage
        if self._on_update:
            self._on_update(
                job_id,
                progress=progress,
                status="running",
                stage=stage,
            )

    def _apply_log(self, job_id: str, message: str) -> None:
        st = self._ensure_job(job_id)
        st.message = message[:500]
        st.updated_at = time.time()
        inferred = self.infer_stage_from_log(message)
        if inferred:
            st.stage = inferred
            if self._on_update:
                self._on_update(job_id, stage=inferred, status="running")
        if self._on_log:
            self._on_log(job_id, message)

    def _apply_stage(self, job_id: str, stage: str, message: str) -> None:
        st = self._ensure_job(job_id)
        st.stage = stage
        if message:
            st.message = message[:500]
        st.updated_at = time.time()
        fields = {"stage": stage, "status": "running"}
        if message:
            fields["message"] = message[:500]
        if self._on_update:
            self._on_update(job_id, **fields)

    def _apply_finished(self, job_id: str, success: bool, message: str) -> None:
        st = self._ensure_job(job_id)
        if success:
            st.stage = "done"
            st.progress = 1.0
        elif any(k in message for k in ("取消", "终止", "停止")):
            st.stage = "cancelled"
        else:
            st.stage = "failed"
        st.message = message[:500]
        st.updated_at = time.time()
        if self._on_finish:
            self._on_finish(job_id, success, message)
        self.unbind_job(job_id)


_orchestrator: Optional[JobStageOrchestrator] = None
_orch_lock = threading.Lock()


def get_orchestrator() -> JobStageOrchestrator:
    global _orchestrator
    with _orch_lock:
        if _orchestrator is None:
            _orchestrator = JobStageOrchestrator()
            _orchestrator.start()
        return _orchestrator
