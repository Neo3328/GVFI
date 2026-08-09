"""ctypes bridge to gvfi_native.dll — preferred hot path when DLL is present."""

from __future__ import annotations

import ctypes
import os
from collections import deque
from ctypes import CFUNCTYPE, POINTER, c_char_p, c_int, c_ulonglong, c_uint, c_void_p
from typing import Callable, Optional

_VoidFn = CFUNCTYPE(None, c_void_p)


class _MemorySnapshot(ctypes.Structure):
    _fields_ = [
        ("total_phys_bytes", c_ulonglong),
        ("avail_phys_bytes", c_ulonglong),
        ("memory_load_percent", c_uint),
        ("level", c_int),
    ]


def _candidate_paths() -> list[str]:
    here = os.path.dirname(os.path.abspath(__file__))
    names = ("gvfi_native.dll", "libgvfi_native.dll", "libgvfi_native.so")
    roots = [
        os.path.join(here, "native_bin"),
        os.path.join(here, "..", "..", "native", "build"),
        os.path.join(here, "..", "..", "native", "build", "Release"),
        os.path.join(here, "..", "..", "native", "build", "Debug"),
    ]
    out: list[str] = []
    for root in roots:
        for name in names:
            out.append(os.path.normpath(os.path.join(root, name)))
    return out


def load_native() -> Optional[ctypes.CDLL]:
    for path in _candidate_paths():
        if os.path.isfile(path):
            dll = ctypes.CDLL(path)
            _bind(dll)
            return dll
    return None


def _bind(dll: ctypes.CDLL) -> None:
    dll.gvfi_version.restype = c_char_p
    dll.gvfi_version.argtypes = []

    dll.gvfi_workloop_create.restype = c_void_p
    dll.gvfi_workloop_create.argtypes = []
    dll.gvfi_workloop_destroy.argtypes = [c_void_p]
    dll.gvfi_workloop_start.restype = c_int
    dll.gvfi_workloop_start.argtypes = [c_void_p]
    dll.gvfi_workloop_stop.argtypes = [c_void_p]
    dll.gvfi_workloop_is_running.restype = c_int
    dll.gvfi_workloop_is_running.argtypes = [c_void_p]
    dll.gvfi_workloop_signal.argtypes = [c_void_p]
    dll.gvfi_workloop_run.restype = c_int
    dll.gvfi_workloop_run.argtypes = [c_void_p, _VoidFn, c_void_p]

    dll.gvfi_gate_create.restype = c_void_p
    dll.gvfi_gate_create.argtypes = [c_void_p, c_char_p]
    dll.gvfi_gate_destroy.argtypes = [c_void_p]
    dll.gvfi_gate_submit.restype = c_int
    dll.gvfi_gate_submit.argtypes = [c_void_p, _VoidFn, c_void_p]

    dll.gvfi_zone_create.restype = c_void_p
    dll.gvfi_zone_create.argtypes = [c_uint, c_uint]
    dll.gvfi_zone_destroy.argtypes = [c_void_p]
    dll.gvfi_zone_alloc.restype = c_void_p
    dll.gvfi_zone_alloc.argtypes = [c_void_p]
    dll.gvfi_zone_free.argtypes = [c_void_p, c_void_p]
    dll.gvfi_zone_allocated.restype = c_uint
    dll.gvfi_zone_allocated.argtypes = [c_void_p]
    dll.gvfi_zone_free_count.restype = c_uint
    dll.gvfi_zone_free_count.argtypes = [c_void_p]

    dll.gvfi_memory_sample.restype = c_int
    dll.gvfi_memory_sample.argtypes = [POINTER(_MemorySnapshot), c_uint, c_uint]


_DLL: Optional[ctypes.CDLL] = None
_TRIED = False


def get_dll() -> Optional[ctypes.CDLL]:
    global _DLL, _TRIED
    if not _TRIED:
        _TRIED = True
        _DLL = load_native()
    return _DLL


def native_available() -> bool:
    return get_dll() is not None


def native_version() -> Optional[str]:
    dll = get_dll()
    if not dll:
        return None
    raw = dll.gvfi_version()
    return raw.decode("utf-8", errors="replace") if raw else None


def native_memory_sample(warn_pct: int = 75, critical_pct: int = 90) -> Optional[dict]:
    dll = get_dll()
    if not dll:
        return None
    snap = _MemorySnapshot()
    if not dll.gvfi_memory_sample(ctypes.byref(snap), warn_pct, critical_pct):
        return None
    level_name = {0: "normal", 1: "warning", 2: "critical"}.get(snap.level, "normal")
    return {
        "load_percent": int(snap.memory_load_percent),
        "total_phys_mb": int(snap.total_phys_bytes // (1024 * 1024)),
        "avail_phys_mb": int(snap.avail_phys_bytes // (1024 * 1024)),
        "level": level_name,
        "backpressure": snap.level >= 1,
        "runtime": "gvfi_native",
        "version": native_version(),
    }


class NativeWorkLoop:
    """Thin ctypes wrapper around C++ WorkLoop."""

    def __init__(self) -> None:
        dll = get_dll()
        if not dll:
            raise RuntimeError("gvfi_native.dll not found")
        self._dll = dll
        self._ptr = dll.gvfi_workloop_create()
        if not self._ptr:
            raise RuntimeError("gvfi_workloop_create failed")
        self._callbacks: deque = deque(maxlen=512)  # keep CB refs alive

    def start(self) -> bool:
        return bool(self._dll.gvfi_workloop_start(self._ptr))

    def stop(self) -> None:
        self._dll.gvfi_workloop_stop(self._ptr)

    @property
    def is_running(self) -> bool:
        return bool(self._dll.gvfi_workloop_is_running(self._ptr))

    def run(self, fn: Callable[[], None]) -> int:
        def _cb(_user: int) -> None:
            fn()

        c_cb = _VoidFn(_cb)
        self._callbacks.append(c_cb)
        return int(self._dll.gvfi_workloop_run(self._ptr, c_cb, None))

    def create_gate(self, name: str = "gate") -> "NativeGate":
        return NativeGate(self, name)

    def close(self) -> None:
        if self._ptr:
            self.stop()
            self._dll.gvfi_workloop_destroy(self._ptr)
            self._ptr = None

    def __del__(self) -> None:
        try:
            self.close()
        except Exception:
            pass


class NativeGate:
    def __init__(self, loop: NativeWorkLoop, name: str = "gate") -> None:
        self._loop = loop
        self._dll = loop._dll
        self._ptr = self._dll.gvfi_gate_create(loop._ptr, name.encode("utf-8"))
        if not self._ptr:
            raise RuntimeError("gvfi_gate_create failed")
        self._callbacks: deque = deque(maxlen=512)

    def submit(self, fn: Callable[[], None]) -> bool:
        def _cb(_user: int) -> None:
            fn()

        c_cb = _VoidFn(_cb)
        self._callbacks.append(c_cb)
        return bool(self._dll.gvfi_gate_submit(self._ptr, c_cb, None))

    def close(self) -> None:
        if self._ptr:
            self._dll.gvfi_gate_destroy(self._ptr)
            self._ptr = None

    def __del__(self) -> None:
        try:
            self.close()
        except Exception:
            pass


class NativeZonePool:
    def __init__(self, object_size: int, objects_per_slab: int = 64) -> None:
        dll = get_dll()
        if not dll:
            raise RuntimeError("gvfi_native.dll not found")
        self._dll = dll
        self._ptr = dll.gvfi_zone_create(object_size, objects_per_slab)
        if not self._ptr:
            raise RuntimeError("gvfi_zone_create failed")

    def alloc(self) -> int:
        return int(self._dll.gvfi_zone_alloc(self._ptr) or 0)

    def free(self, ptr: int) -> None:
        if ptr:
            self._dll.gvfi_zone_free(self._ptr, ptr)

    @property
    def allocated_count(self) -> int:
        return int(self._dll.gvfi_zone_allocated(self._ptr))

    @property
    def free_count(self) -> int:
        return int(self._dll.gvfi_zone_free_count(self._ptr))

    def close(self) -> None:
        if self._ptr:
            self._dll.gvfi_zone_destroy(self._ptr)
            self._ptr = None

    def __del__(self) -> None:
        try:
            self.close()
        except Exception:
            pass
