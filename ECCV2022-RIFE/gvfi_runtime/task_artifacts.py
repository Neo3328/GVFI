"""Output protection, capacity checks, validation, and task reports."""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


class InsufficientDiskSpaceError(OSError):
    """Raised before decoding when the temporary workspace is too small."""


@dataclass(frozen=True)
class DiskEstimate:
    required_bytes: int
    available_bytes: int
    frame_count: int
    frame_bytes: int
    workspace_copies: int

    @property
    def sufficient(self) -> bool:
        return self.available_bytes >= self.required_bytes

    def as_dict(self) -> dict:
        return {**asdict(self), "sufficient": self.sufficient}


@dataclass(frozen=True)
class OutputValidation:
    path: str
    size_bytes: int
    width: int
    height: int
    fps: float
    frame_count: int
    video_codec: str
    audio_stream_count: int
    decodable: bool

    def as_dict(self) -> dict:
        return asdict(self)


def reserve_output_path(directory: str, filename: str) -> str:
    """Return a non-existing output path without overwriting prior renders."""
    os.makedirs(directory, exist_ok=True)
    candidate = os.path.join(directory, filename)
    if not os.path.exists(candidate):
        return candidate
    stem, suffix = os.path.splitext(filename)
    index = 1
    while True:
        candidate = os.path.join(directory, f"{stem}_{index:03d}{suffix}")
        if not os.path.exists(candidate):
            return candidate
        index += 1


def estimate_disk_space(
    path: str,
    width: int,
    height: int,
    source_frames: int,
    target_frames: int,
    scale_factor: int = 1,
) -> DiskEstimate:
    """Estimate PNG workspace capacity using uncompressed RGB as a lower bound."""
    width = max(1, int(width))
    height = max(1, int(height))
    scale_factor = max(1, int(scale_factor))
    source_frames = max(1, int(source_frames))
    target_frames = max(source_frames, int(target_frames))
    frame_bytes = width * height * 3
    # Raw and RIFE stay at source size. Only the optional SR output is scaled.
    copies = 3 if scale_factor > 1 else 2
    source_workspace = source_frames * frame_bytes
    rife_workspace = target_frames * frame_bytes
    sr_workspace = (
        target_frames * frame_bytes * scale_factor * scale_factor
        if scale_factor > 1
        else 0
    )
    required = math.ceil((source_workspace + rife_workspace + sr_workspace) * 1.25)
    probe = Path(path)
    while not probe.exists() and probe.parent != probe:
        probe = probe.parent
    available = shutil.disk_usage(str(probe)).free
    return DiskEstimate(required, available, target_frames, frame_bytes, copies)


def require_disk_space(estimate: DiskEstimate) -> None:
    if not estimate.sufficient:
        raise InsufficientDiskSpaceError(
            "insufficient temporary disk space: "
            f"required={estimate.required_bytes}, available={estimate.available_bytes}"
        )


def _rate(value: str) -> float:
    if not value:
        return 0.0
    if "/" in value:
        numerator, denominator = value.split("/", 1)
        return float(numerator) / float(denominator) if float(denominator) else 0.0
    return float(value)


def validate_output_video(ffprobe: str, path: str) -> OutputValidation:
    if not os.path.isfile(path) or os.path.getsize(path) <= 0:
        raise RuntimeError("output video is missing or empty")
    result = subprocess.run(
        [ffprobe, "-v", "error", "-count_frames", "-show_streams", "-of", "json", path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.DEVNULL,
        check=False,
        timeout=60,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if result.returncode != 0:
        detail = (result.stderr or b"").decode("utf-8", "replace")[-1000:]
        raise RuntimeError(f"output video validation failed: {detail}")
    payload = json.loads((result.stdout or b"{}").decode("utf-8", "replace"))
    streams = payload.get("streams") or []
    video = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
    if video is None:
        raise RuntimeError("output has no decodable video stream")
    frames = int(video.get("nb_read_frames") or video.get("nb_frames") or 0)
    if frames <= 0:
        raise RuntimeError("output video decoded zero frames")
    return OutputValidation(
        path=os.path.abspath(path),
        size_bytes=os.path.getsize(path),
        width=int(video.get("width") or 0),
        height=int(video.get("height") or 0),
        fps=_rate(str(video.get("avg_frame_rate") or video.get("r_frame_rate") or "0/1")),
        frame_count=frames,
        video_codec=str(video.get("codec_name") or "unknown"),
        audio_stream_count=sum(1 for stream in streams if stream.get("codec_type") == "audio"),
        decodable=True,
    )


def write_task_report(directory: str, task_id: str, payload: dict[str, Any]) -> str:
    os.makedirs(directory, exist_ok=True)
    final_path = os.path.join(directory, f"gvfi-task-{task_id}.json")
    fd, temporary = tempfile.mkstemp(prefix=".gvfi-report-", suffix=".tmp", dir=directory)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
        os.replace(temporary, final_path)
    except BaseException:
        try:
            os.remove(temporary)
        except OSError:
            pass
        raise
    return final_path
