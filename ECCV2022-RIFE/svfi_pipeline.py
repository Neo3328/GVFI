"""
SVFI-inspired preprocessing helpers for the local RIFE Pro GUI.

Implements open, reproducible approximations of:
- duplicate-frame removal (anime held frames)
- scene-cut detection (avoid interpolating across hard cuts)
- per-scene target-frame allocation for rife-ncnn-vulkan

Does not copy proprietary SVFI binaries or models.
Uses PyQt5 for image IO so the GUI runtime does not require OpenCV.
"""

from __future__ import annotations

import os
import shutil
from typing import Callable, List, Optional, Sequence, Tuple

import numpy as np
from PyQt5.QtGui import QImage

LogFn = Optional[Callable[[str], None]]


def list_png_frames(directory: str) -> List[str]:
    if not os.path.isdir(directory):
        return []
    frames = [
        name for name in os.listdir(directory)
        if name.lower().endswith(".png")
    ]
    frames.sort()
    return frames


def frame_paths(directory: str) -> List[str]:
    return [os.path.join(directory, name) for name in list_png_frames(directory)]


def _load_gray(path: str) -> Optional[np.ndarray]:
    image = QImage(path)
    if image.isNull():
        return None
    image = image.convertToFormat(QImage.Format_Grayscale8)
    width = image.width()
    height = image.height()
    bytes_per_line = image.bytesPerLine()
    ptr = image.bits()
    size = bytes_per_line * height
    try:
        ptr.setsize(size)
    except Exception:
        pass
    arr = np.frombuffer(ptr, dtype=np.uint8, count=size).reshape((height, bytes_per_line))
    return arr[:, :width].copy()


def _mad_score(prev_gray: np.ndarray, curr_gray: np.ndarray) -> float:
    if prev_gray.shape != curr_gray.shape:
        # Rare size mismatch: treat as different.
        return 255.0
    return float(np.mean(np.abs(prev_gray.astype(np.int16) - curr_gray.astype(np.int16))))


def _hist_score(prev_gray: np.ndarray, curr_gray: np.ndarray) -> float:
    prev_hist, _ = np.histogram(prev_gray, bins=64, range=(0, 256), density=True)
    curr_hist, _ = np.histogram(curr_gray, bins=64, range=(0, 256), density=True)
    prev_hist = prev_hist.astype(np.float64)
    curr_hist = curr_hist.astype(np.float64)
    prev_norm = np.linalg.norm(prev_hist)
    curr_norm = np.linalg.norm(curr_hist)
    if prev_norm < 1e-12 or curr_norm < 1e-12:
        return 100.0
    corr = float(np.dot(prev_hist, curr_hist) / (prev_norm * curr_norm))
    return float(max(0.0, 1.0 - corr) * 100.0)


def _downscale_gray(gray: np.ndarray, max_width: int = 320) -> np.ndarray:
    height, width = gray.shape[:2]
    if width <= max_width:
        return gray
    scale = max_width / float(width)
    new_w = max(1, int(width * scale))
    new_h = max(1, int(height * scale))
    # Nearest-neighbor via index mapping (no OpenCV dependency)
    ys = (np.linspace(0, height - 1, new_h)).astype(np.int32)
    xs = (np.linspace(0, width - 1, new_w)).astype(np.int32)
    return gray[ys][:, xs]


def remove_duplicate_frames(
    src_dir: str,
    dst_dir: str,
    threshold: float = 1.5,
    log: LogFn = None,
) -> Tuple[int, int]:
    """
    Keep the first frame of near-identical runs (SVFI-like remove_dup).

    threshold: mean absolute difference on 8-bit grayscale (0-255).
    Typical anime-friendly values: 1.0 ~ 3.0
    """
    os.makedirs(dst_dir, exist_ok=True)
    paths = frame_paths(src_dir)
    if not paths:
        return 0, 0

    kept = 0
    prev_gray = None
    for path in paths:
        gray = _load_gray(path)
        if gray is None:
            continue
        if prev_gray is None or _mad_score(prev_gray, gray) > threshold:
            kept += 1
            out_path = os.path.join(dst_dir, f"{kept:08d}.png")
            try:
                os.link(path, out_path)
            except OSError:
                shutil.copy2(path, out_path)
            prev_gray = gray

    removed = len(paths) - kept
    if log:
        log(f"  ↳ 去重帧: {len(paths)} -> {kept} (移除 {removed}, 阈值 {threshold})")
    return kept, removed


def detect_scene_cuts(
    frames_dir: str,
    threshold: float = 12.0,
    max_threshold: float = 80.0,
    log: LogFn = None,
) -> List[int]:
    """
    Return cut indices i where frame i starts a new scene (i > 0).

    Uses histogram correlation distance scaled to ~0-100, similar spirit to
    SVFI scdet_threshold defaults (12 / 80).
    """
    paths = frame_paths(frames_dir)
    if len(paths) < 2:
        return []

    cuts: List[int] = []
    prev = _load_gray(paths[0])
    if prev is None:
        return []
    prev = _downscale_gray(prev)

    for index in range(1, len(paths)):
        curr = _load_gray(paths[index])
        if curr is None:
            continue
        curr = _downscale_gray(curr)
        score = _hist_score(prev, curr)
        if score >= threshold:
            cuts.append(index)
        prev = curr

    if log:
        log(f"  ↳ 场景切点: {len(cuts)} 处 (阈值 {threshold})")
    return cuts


def build_segments(frame_count: int, cut_indices: Sequence[int]) -> List[Tuple[int, int]]:
    """Build half-open [start, end) segments covering [0, frame_count)."""
    if frame_count <= 0:
        return []
    bounds = [0]
    for cut in sorted(set(int(c) for c in cut_indices if 0 < int(c) < frame_count)):
        bounds.append(cut)
    bounds.append(frame_count)
    return [(bounds[i], bounds[i + 1]) for i in range(len(bounds) - 1)]


def allocate_output_counts(
    segment_lengths: Sequence[int],
    target_total: int,
) -> List[int]:
    """Proportionally allocate output frames; guarantee each multi-frame scene grows."""
    lengths = [max(0, int(length)) for length in segment_lengths]
    total_in = sum(lengths)
    if not lengths:
        return []
    if total_in <= 0:
        return [0] * len(lengths)

    target_total = max(int(target_total), total_in)
    raw = [length * target_total / total_in for length in lengths]
    counts = [max(length if length <= 1 else length + 1, int(round(value))) for length, value in zip(lengths, raw)]

    drift = target_total - sum(counts)
    idx = 0
    guard = 0
    while drift != 0 and guard < target_total * 2:
        guard += 1
        length = lengths[idx % len(lengths)]
        if length > 1:
            if drift > 0:
                counts[idx % len(lengths)] += 1
                drift -= 1
            elif counts[idx % len(lengths)] > length + 1:
                counts[idx % len(lengths)] -= 1
                drift += 1
        idx += 1

    for i, length in enumerate(lengths):
        if length <= 1:
            counts[i] = length
    deficit = target_total - sum(counts)
    multi = [i for i, length in enumerate(lengths) if length > 1]
    j = 0
    while deficit > 0 and multi:
        counts[multi[j % len(multi)]] += 1
        deficit -= 1
        j += 1
    return counts


def copy_frame_range(
    src_dir: str,
    dst_dir: str,
    start: int,
    end: int,
) -> int:
    """Copy PNG frames [start, end) into dst_dir renamed as 00000001.png..."""
    os.makedirs(dst_dir, exist_ok=True)
    paths = frame_paths(src_dir)
    written = 0
    for path in paths[start:end]:
        written += 1
        shutil.copy2(path, os.path.join(dst_dir, f"{written:08d}.png"))
    return written


def append_frames(src_dir: str, dst_dir: str, start_index: int = 1) -> int:
    """Append frames from src_dir into dst_dir continuing numbering from start_index."""
    os.makedirs(dst_dir, exist_ok=True)
    paths = frame_paths(src_dir)
    index = start_index
    for path in paths:
        shutil.copy2(path, os.path.join(dst_dir, f"{index:08d}.png"))
        index += 1
    return index - start_index


def discover_rife_models(rife_dir: Optional[str]) -> List[str]:
    """Return absolute model directory paths under rife-ncnn-vulkan."""
    if not rife_dir or not os.path.isdir(rife_dir):
        return []
    preferred = (
        # General-purpose first — rife-anime remains available but not the silent default.
        "rife-v4.6", "rife-v4", "rife-anime", "rife-v3.1", "rife-v3.0",
        "rife-UHD", "rife-HD", "rife-v2.4", "rife-v2.3", "rife-v2", "rife",
    )
    found = []
    for name in preferred:
        path = os.path.join(rife_dir, name)
        if os.path.isdir(path):
            found.append(path)
    for entry in sorted(os.listdir(rife_dir)):
        path = os.path.join(rife_dir, entry)
        if not os.path.isdir(path):
            continue
        if any(os.path.isfile(os.path.join(path, fname)) for fname in ("flownet.bin", "flownet.param")):
            if path not in found:
                found.append(path)
    return found


def compute_target_frame_count(
    source_frame_count: int,
    source_fps: float,
    target_fps: float,
) -> int:
    """Keep original duration, map to target fps (SVFI-style safe fps)."""
    source_fps = max(float(source_fps), 1e-6)
    duration = max(source_frame_count, 1) / source_fps
    target = int(round(duration * float(target_fps)))
    if target_fps > source_fps:
        return max(target, source_frame_count + 1)
    return max(target, source_frame_count)
