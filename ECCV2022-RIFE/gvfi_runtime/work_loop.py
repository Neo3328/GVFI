from __future__ import annotations

import enum
import threading
from typing import Callable, List, Optional

from .event_source import CommandGate, EventSource


class WorkStatus(enum.Enum):
    Ok = 0
    Busy = 1
    Aborted = 2
    Error = 3


class WorkLoop:
    """Single-threaded event marshaller (IOKit WorkLoop design, user-space)."""

    def __init__(self) -> None:
        self._sources: List[EventSource] = []
        self._gate = threading.RLock()
        self._wake = threading.Condition()
        self._work_pending = False
        self._running = False
        self._terminate = False
        self._thread: Optional[threading.Thread] = None
        self._worker_ident: Optional[int] = None

    def start(self) -> bool:
        with self._gate:
            if self._running:
                return True
            self._terminate = False
            self._work_pending = True
            self._running = True
            self._thread = threading.Thread(
                target=self._thread_main, name="gvfi-workloop", daemon=True
            )
            self._thread.start()
            return True

    def stop(self) -> None:
        with self._gate:
            if not self._running:
                return
            self._terminate = True
        self.signal_work()
        t = self._thread
        if t is not None and t.is_alive():
            t.join(timeout=5.0)
        with self._gate:
            self._running = False
            self._thread = None
            self._worker_ident = None

    @property
    def is_running(self) -> bool:
        return self._running

    def add_event_source(self, source: EventSource) -> WorkStatus:
        if source is None:
            return WorkStatus.Error
        with self._gate:
            source.set_work_loop(self)
            self._sources.append(source)
        self.signal_work()
        return WorkStatus.Ok

    def remove_event_source(self, source: EventSource) -> WorkStatus:
        if source is None:
            return WorkStatus.Error
        with self._gate:
            self._sources = [s for s in self._sources if s is not source]
            source.set_work_loop(None)
        self.signal_work()
        return WorkStatus.Ok

    def signal_work(self) -> None:
        with self._wake:
            self._work_pending = True
            self._wake.notify()

    def on_loop_thread(self) -> bool:
        return threading.get_ident() == self._worker_ident

    def run_on_loop(self, fn: Callable[[], None]) -> WorkStatus:
        if fn is None:
            return WorkStatus.Error
        if self.on_loop_thread():
            with self._gate:
                fn()
            return WorkStatus.Ok

        gate = CommandGate("run-on-loop")
        done = threading.Event()
        status = {"value": WorkStatus.Ok}

        def _wrap() -> None:
            try:
                fn()
            except Exception:
                status["value"] = WorkStatus.Error
            finally:
                done.set()

        gate.submit(_wrap)
        self.add_event_source(gate)
        done.wait(timeout=30.0)
        self.remove_event_source(gate)
        if self._terminate:
            return WorkStatus.Aborted
        return status["value"]

    def close_gate(self) -> None:
        self._gate.acquire()

    def open_gate(self) -> None:
        self._gate.release()

    def _run_event_sources(self) -> bool:
        with self._gate:
            if self._terminate:
                return False
            more = True
            while more:
                more = False
                self._work_pending = False
                for src in list(self._sources):
                    if self._terminate:
                        return False
                    if src.enabled and src.check_for_work():
                        more = True
            return True

    def _thread_main(self) -> None:
        self._worker_ident = threading.get_ident()
        while True:
            if not self._run_event_sources():
                break
            with self._wake:
                while not self._work_pending and not self._terminate:
                    self._wake.wait(timeout=0.05)
            if self._terminate and not self._work_pending:
                if not self._run_event_sources():
                    break
                if self._terminate:
                    break
        self._running = False
