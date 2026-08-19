"""Scheduling helpers for the file-based rife-ncnn-vulkan CLI pipeline."""

from __future__ import annotations

import os
import shutil
import subprocess
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Sequence, Tuple


@dataclass
class RifePipelineStats:
    process_count: int = 0
    total_frames: int = 0
    startup_time: float = 0.0
    inference_time: float = 0.0
    io_time: float = 0.0
    gpu_sample_total: float = 0.0
    gpu_sample_count: int = 0
    # Native batch call-boundary stats (Phase D3)
    native_batch_count: int = 0
    native_frame_count: int = 0
    python_to_native_call_count: int = 0
    png_read_count: int = 0
    png_write_count: int = 0
    native_inference_time: float = 0.0
    native_total_time: float = 0.0

    @property
    def average_frames_per_process(self) -> float:
        return self.total_frames / self.process_count if self.process_count else 0.0

    @property
    def gpu_usage(self) -> float:
        return self.gpu_sample_total / self.gpu_sample_count if self.gpu_sample_count else 0.0

    def accumulate_native_stats(self, stats: dict) -> None:
        """Merge one native backend stats snapshot (per scene) into totals."""
        self.native_batch_count += int(stats.get("native_batch_count", 0))
        self.native_frame_count += int(stats.get("native_frame_count", 0))
        self.python_to_native_call_count += int(stats.get("python_to_native_call_count", 0))
        self.png_read_count += int(stats.get("png_read_count", 0))
        self.png_write_count += int(stats.get("png_write_count", 0))
        self.native_inference_time += float(stats.get("native_inference_time", 0.0))
        self.native_total_time += float(stats.get("total_time", 0.0))

    def format_log(self) -> str:
        return (
            "RIFE PIPELINE:\n"
            f"process_count={self.process_count}\n"
            f"model_load_count={self.process_count}\n"
            f"total_frames={self.total_frames}\n"
            f"average_frames_per_process={self.average_frames_per_process:.2f}\n"
            f"startup_time={self.startup_time:.3f}s\n"
            f"inference_time={self.inference_time:.3f}s\n"
            f"io_time={self.io_time:.3f}s\n"
            f"gpu_usage={self.gpu_usage:.1f}%\n"
            f"native_batch_count={self.native_batch_count}\n"
            f"native_frame_count={self.native_frame_count}\n"
            f"python_to_native_call_count={self.python_to_native_call_count}\n"
            f"png_read_count={self.png_read_count}\n"
            f"png_write_count={self.png_write_count}\n"
            f"native_inference_time={self.native_inference_time:.3f}s\n"
            f"native_total_time={self.native_total_time:.3f}s"
        )


class RifeProcessMonitor:
    """Observe first output and GPU utilization without changing the CLI process."""

    def __init__(self, output_dir: str, gpu_index: int = 0) -> None:
        self.output_dir = output_dir
        try:
            self.gpu_index = max(0, int(gpu_index))
        except (TypeError, ValueError):
            self.gpu_index = 0
        self.started_at = 0.0
        self.first_output_at = 0.0
        self.gpu_samples: List[float] = []
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        self.started_at = time.perf_counter()
        self._thread = threading.Thread(target=self._sample, name="rife-cli-monitor", daemon=True)
        self._thread.start()

    def stop(self) -> Tuple[float, float, float, int]:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=1.0)
        ended_at = time.perf_counter()
        startup = (self.first_output_at or ended_at) - self.started_at
        inference = max(0.0, ended_at - self.started_at - startup)
        return startup, inference, sum(self.gpu_samples), len(self.gpu_samples)

    def _sample(self) -> None:
        while not self._stop.wait(0.2):
            if not self.first_output_at and next(Path(self.output_dir).glob("*.png"), None):
                self.first_output_at = time.perf_counter()
            try:
                result = subprocess.run(
                    [
                        "nvidia-smi",
                        f"--id={self.gpu_index}",
                        "--query-gpu=utilization.gpu",
                        "--format=csv,noheader,nounits",
                    ],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.DEVNULL,
                    stdin=subprocess.DEVNULL,
                    timeout=1.0,
                    check=False,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                )
                value = (result.stdout or b"").decode("ascii", "ignore").strip().splitlines()
                if value:
                    self.gpu_samples.append(float(value[0]))
            except (OSError, ValueError, subprocess.SubprocessError):
                pass


def stage_frame_range(
    source_paths: Sequence[str],
    destination: str,
    start: int,
    end: int,
) -> Tuple[int, float, int]:
    """Stage a scene with hard links; copy only when links are unavailable."""
    started_at = time.perf_counter()
    os.makedirs(destination, exist_ok=True)
    written = 0
    copied = 0
    for source in source_paths[start:end]:
        written += 1
        target = os.path.join(destination, f"{written:08d}.png")
        try:
            os.link(source, target)
        except OSError:
            shutil.copy2(source, target)
            copied += 1
    return written, time.perf_counter() - started_at, copied


def collect_frames(source: str, destination: str, start_index: int = 1) -> Tuple[int, float, int]:
    """Move RIFE outputs into the final sequence; copy only across filesystems."""
    started_at = time.perf_counter()
    os.makedirs(destination, exist_ok=True)
    paths = sorted(Path(source).glob("*.png"))
    copied = 0
    for offset, path in enumerate(paths):
        target = os.path.join(destination, f"{start_index + offset:08d}.png")
        try:
            os.replace(str(path), target)
        except OSError:
            shutil.copy2(str(path), target)
            os.remove(path)
            copied += 1
    return len(paths), time.perf_counter() - started_at, copied
