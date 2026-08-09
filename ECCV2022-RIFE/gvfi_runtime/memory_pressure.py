from __future__ import annotations

import ctypes
import enum
import threading
import time
from dataclasses import dataclass
from typing import Callable, List, Optional


class PressureLevel(enum.IntEnum):
    Normal = 0
    Warning = 1
    Critical = 2


@dataclass
class MemorySnapshot:
    total_phys_bytes: int = 0
    avail_phys_bytes: int = 0
    total_pagefile_bytes: int = 0
    avail_pagefile_bytes: int = 0
    memory_load_percent: int = 0
    level: PressureLevel = PressureLevel.Normal


class _MEMORYSTATUSEX(ctypes.Structure):
    _fields_ = [
        ("dwLength", ctypes.c_ulong),
        ("dwMemoryLoad", ctypes.c_ulong),
        ("ullTotalPhys", ctypes.c_ulonglong),
        ("ullAvailPhys", ctypes.c_ulonglong),
        ("ullTotalPageFile", ctypes.c_ulonglong),
        ("ullAvailPageFile", ctypes.c_ulonglong),
        ("ullTotalVirtual", ctypes.c_ulonglong),
        ("ullAvailVirtual", ctypes.c_ulonglong),
        ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
    ]


Listener = Callable[[MemorySnapshot], None]


class MemoryPressureMonitor:
    """Windows memory load monitor (XNU memorystatus design ideas)."""

    def __init__(self) -> None:
        self._warn_pct = 75
        self._critical_pct = 90
        self._poll_s = 0.5
        self._level = PressureLevel.Normal
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._listeners: List[Listener] = []
        self._lock = threading.Lock()

    def set_thresholds(self, warn_load_percent: int, critical_load_percent: int) -> None:
        self._warn_pct = warn_load_percent
        self._critical_pct = critical_load_percent

    def add_listener(self, listener: Listener) -> None:
        if listener is None:
            return
        with self._lock:
            self._listeners.append(listener)

    def start(self, poll_interval_ms: int = 500) -> bool:
        if self._running:
            return True
        self._poll_s = max(0.05, poll_interval_ms / 1000.0)
        self._running = True
        self._thread = threading.Thread(
            target=self._thread_main, name="gvfi-mempressure", daemon=True
        )
        self._thread.start()
        return True

    def stop(self) -> None:
        self._running = False
        t = self._thread
        if t is not None and t.is_alive():
            t.join(timeout=2.0)
        self._thread = None

    @property
    def level(self) -> PressureLevel:
        return self._level

    def should_backpressure(self) -> bool:
        return self._level >= PressureLevel.Warning

    def sample(self) -> MemorySnapshot:
        # Prefer C++ hot path when gvfi_native.dll is available.
        try:
            from .native_bridge import native_memory_sample

            raw = native_memory_sample(self._warn_pct, self._critical_pct)
            if raw is not None:
                level = {
                    "normal": PressureLevel.Normal,
                    "warning": PressureLevel.Warning,
                    "critical": PressureLevel.Critical,
                }.get(raw.get("level", "normal"), PressureLevel.Normal)
                return MemorySnapshot(
                    total_phys_bytes=int(raw["total_phys_mb"]) * 1024 * 1024,
                    avail_phys_bytes=int(raw["avail_phys_mb"]) * 1024 * 1024,
                    memory_load_percent=int(raw["load_percent"]),
                    level=level,
                )
        except Exception:
            pass

        status = _MEMORYSTATUSEX()
        status.dwLength = ctypes.sizeof(_MEMORYSTATUSEX)
        ok = ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status))
        snap = MemorySnapshot()
        if ok:
            snap.total_phys_bytes = int(status.ullTotalPhys)
            snap.avail_phys_bytes = int(status.ullAvailPhys)
            snap.total_pagefile_bytes = int(status.ullTotalPageFile)
            snap.avail_pagefile_bytes = int(status.ullAvailPageFile)
            snap.memory_load_percent = int(status.dwMemoryLoad)
        snap.level = self._classify(snap)
        return snap

    def _classify(self, snap: MemorySnapshot) -> PressureLevel:
        if snap.memory_load_percent >= self._critical_pct:
            return PressureLevel.Critical
        if snap.memory_load_percent >= self._warn_pct:
            return PressureLevel.Warning
        return PressureLevel.Normal

    def _thread_main(self) -> None:
        last = PressureLevel.Normal
        while self._running:
            snap = self.sample()
            self._level = snap.level
            if snap.level != last:
                last = snap.level
                with self._lock:
                    listeners = list(self._listeners)
                for fn in listeners:
                    fn(snap)
            time.sleep(self._poll_s)
