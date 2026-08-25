"""Dependency-free process and GPU resource sampling for stability gates."""

from __future__ import annotations

import ctypes
import os
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from typing import Iterable


@dataclass(frozen=True)
class ResourceSnapshot:
    timestamp: float
    rss_bytes: int
    private_bytes: int
    gpu_memory_mib: int | None = None
    gpu_utilization_percent: float | None = None

    def as_dict(self) -> dict:
        return asdict(self)


def _windows_memory() -> tuple[int, int]:
    class ProcessMemoryCountersEx(ctypes.Structure):
        _fields_ = [
            ("cb", ctypes.c_ulong),
            ("PageFaultCount", ctypes.c_ulong),
            ("PeakWorkingSetSize", ctypes.c_size_t),
            ("WorkingSetSize", ctypes.c_size_t),
            ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
            ("QuotaPagedPoolUsage", ctypes.c_size_t),
            ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
            ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
            ("PagefileUsage", ctypes.c_size_t),
            ("PeakPagefileUsage", ctypes.c_size_t),
            ("PrivateUsage", ctypes.c_size_t),
        ]

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.GetCurrentProcess.argtypes = []
    kernel32.GetCurrentProcess.restype = ctypes.c_void_p
    get_memory_info = kernel32.K32GetProcessMemoryInfo
    get_memory_info.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong]
    get_memory_info.restype = ctypes.c_int

    counters = ProcessMemoryCountersEx()
    counters.cb = ctypes.sizeof(counters)
    process = kernel32.GetCurrentProcess()
    ok = get_memory_info(
        process, ctypes.byref(counters), counters.cb
    )
    if not ok:
        raise OSError(ctypes.get_last_error(), "GetProcessMemoryInfo failed")
    return int(counters.WorkingSetSize), int(counters.PrivateUsage)


def process_memory() -> tuple[int, int]:
    if os.name == "nt":
        return _windows_memory()
    try:
        import resource

        rss = int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
        if sys.platform != "darwin":
            rss *= 1024
        return rss, rss
    except (ImportError, OSError):
        return 0, 0


def gpu_memory_and_utilization(gpu_index: int = 0) -> tuple[int | None, float | None]:
    try:
        result = subprocess.run(
            [
                "nvidia-smi", f"--id={max(0, int(gpu_index))}",
                "--query-gpu=memory.used,utilization.gpu",
                "--format=csv,noheader,nounits",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            timeout=2.0,
            check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        if result.returncode != 0:
            return None, None
        values = (result.stdout or b"").decode("ascii", "ignore").strip().split(",")
        if len(values) < 2:
            return None, None
        return int(values[0].strip()), float(values[1].strip())
    except (OSError, ValueError, subprocess.SubprocessError):
        return None, None


def sample_resources(gpu_index: int = 0) -> ResourceSnapshot:
    rss, private = process_memory()
    gpu_memory, gpu_utilization = gpu_memory_and_utilization(gpu_index)
    return ResourceSnapshot(
        timestamp=time.time(),
        rss_bytes=rss,
        private_bytes=private,
        gpu_memory_mib=gpu_memory,
        gpu_utilization_percent=gpu_utilization,
    )


def summarize_resources(samples: Iterable[ResourceSnapshot]) -> dict:
    values = list(samples)
    if not values:
        return {"sample_count": 0}
    gpu_memory = [item.gpu_memory_mib for item in values if item.gpu_memory_mib is not None]
    gpu_utilization = [
        item.gpu_utilization_percent
        for item in values
        if item.gpu_utilization_percent is not None
    ]
    first, last = values[0], values[-1]
    return {
        "sample_count": len(values),
        "rss_start_bytes": first.rss_bytes,
        "rss_end_bytes": last.rss_bytes,
        "rss_delta_bytes": last.rss_bytes - first.rss_bytes,
        "rss_peak_bytes": max(item.rss_bytes for item in values),
        "private_start_bytes": first.private_bytes,
        "private_end_bytes": last.private_bytes,
        "private_delta_bytes": last.private_bytes - first.private_bytes,
        "private_peak_bytes": max(item.private_bytes for item in values),
        "gpu_memory_start_mib": gpu_memory[0] if gpu_memory else None,
        "gpu_memory_end_mib": gpu_memory[-1] if gpu_memory else None,
        "gpu_memory_delta_mib": (gpu_memory[-1] - gpu_memory[0]) if gpu_memory else None,
        "gpu_memory_peak_mib": max(gpu_memory) if gpu_memory else None,
        "gpu_utilization_average_percent": (
            sum(gpu_utilization) / len(gpu_utilization) if gpu_utilization else None
        ),
        "gpu_utilization_peak_percent": max(gpu_utilization) if gpu_utilization else None,
    }
