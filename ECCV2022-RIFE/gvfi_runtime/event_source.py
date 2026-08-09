from __future__ import annotations

import threading
import time
from typing import Callable, List, Optional

Action = Callable[[], None]


class EventSource:
    def __init__(self, name: str = "") -> None:
        self.name = name
        self._enabled = True
        self._work_to_do = False
        self._action: Optional[Action] = None
        self._loop = None
        self._lock = threading.Lock()

    def set_enabled(self, enabled: bool) -> None:
        self._enabled = enabled

    @property
    def enabled(self) -> bool:
        return self._enabled

    def set_action(self, action: Optional[Action]) -> None:
        self._action = action

    def set_work_loop(self, loop) -> None:
        self._loop = loop

    def signal_work(self) -> None:
        with self._lock:
            self._work_to_do = True
        if self._loop is not None:
            self._loop.signal_work()

    def _invoke_action(self) -> None:
        if self._action:
            self._action()

    def check_for_work(self) -> bool:
        if not self._enabled:
            return False
        with self._lock:
            if not self._work_to_do:
                return False
            self._work_to_do = False
        self._invoke_action()
        with self._lock:
            return self._work_to_do


class CommandGate(EventSource):
    def __init__(self, name: str = "command-gate") -> None:
        super().__init__(name)
        self._queue: List[Action] = []
        self._qlock = threading.Lock()

    def submit(self, action: Action) -> None:
        if action is None:
            return
        with self._qlock:
            self._queue.append(action)
        self.signal_work()

    def check_for_work(self) -> bool:
        if not self._enabled:
            return False
        with self._qlock:
            batch = self._queue
            self._queue = []
        for fn in batch:
            fn()
        with self._qlock:
            return bool(self._queue)


class TimerEventSource(EventSource):
    def __init__(self, name: str = "timer") -> None:
        super().__init__(name)
        self._interval_s = 0.0
        self._repeating = False
        self._armed = False
        self._next_fire = 0.0
        self._tlock = threading.Lock()

    def set_interval_ms(self, interval_ms: float) -> None:
        self._interval_s = max(0.0, float(interval_ms) / 1000.0)

    def arm(self, repeating: bool = True) -> None:
        with self._tlock:
            self._repeating = repeating
            self._next_fire = time.monotonic() + self._interval_s
            self._armed = True
        self.signal_work()

    def cancel(self) -> None:
        with self._tlock:
            self._armed = False

    def check_for_work(self) -> bool:
        if not self._enabled or not self._armed:
            return False
        now = time.monotonic()
        fire = False
        with self._tlock:
            if now >= self._next_fire:
                fire = True
                if self._repeating:
                    self._next_fire = now + self._interval_s
                else:
                    self._armed = False
        if fire:
            self._invoke_action()
        if self._armed and self._loop is not None:
            self._loop.signal_work()
        return False
