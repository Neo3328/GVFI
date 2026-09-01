"""
Phase D3 — Native batch call-boundary validation.

Verifies the batch path of NativeInterpolatorBackend.process_directory:
  - consecutive outputs sharing one input pair are grouped into ONE native call
  - output count / order / frame_index / timestamp invariants hold
  - stats counters (batch/frame/call/png IO/time) are populated
  - real DLL batch ABI (gvfi_process_batch) produces frames equal to the
    per-frame gvfi_process path (pixel-identical on this pipeline)

Run:  python tests/test_c6_batch_boundary.py
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import numpy as np

_ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
for _p in (_ENGINE_ROOT,):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import cv2
from gvfi_runtime.frame_pipeline import Frame
from gvfi_runtime.interpolator_backend import (
    NativeInterpolatorBackend,
    map_native_directory_sample,
)
from gvfi_runtime.native_library import NativeLibraryLoader, NativeResult


def make_scene_frames(count: int, width: int = 320, height: int = 180) -> list[np.ndarray]:
    """Synthetic gradient frames with distinct per-frame content."""
    frames = []
    for i in range(count):
        base = np.zeros((height, width, 3), dtype=np.uint8)
        base[..., 0] = (i * 17) % 256
        base[..., 1] = (i * 31) % 256
        base[..., 2] = (i * 47) % 256
        yy, xx = np.mgrid[0:height, 0:width]
        base[..., 0] = (base[..., 0].astype(np.int32) + (xx // 4) + (yy // 4)) % 256
        frames.append(base)
    return frames


def write_pngs(directory: str, frames: list[np.ndarray]) -> None:
    os.makedirs(directory, exist_ok=True)
    for i, frame in enumerate(frames):
        cv2.imwrite(os.path.join(directory, f"{i + 1:08d}.png"), frame)


def count_pngs(directory: str) -> int:
    return len(list(Path(directory).glob("*.png")))


def check_mapping_invariants() -> None:
    """Mapping math must be order-preserving and endpoint-exact."""
    for input_count in (1, 2, 3, 7, 24):
        for output_count in (1, 2, 3, 47, 97):
            samples = [
                map_native_directory_sample(i, input_count, output_count)
                for i in range(output_count)
            ]
            # First output samples frame 0; last samples last frame (when >1 output).
            assert samples[0][0] == 0, (input_count, output_count, samples[0])
            if output_count == 1:
                assert samples[0] == (0, 0, 0.0), (input_count, output_count, samples[0])
            else:
                assert samples[-1] == (input_count - 1, input_count - 1, 0.0), (
                    input_count, output_count, samples[-1])
            # Monotonic left index.
            lefts = [s[0] for s in samples]
            assert lefts == sorted(lefts), (input_count, output_count, lefts)
            # fractions in [0, 1)
            for _, _, frac in samples:
                assert 0.0 <= frac < 1.0, frac
    print("  mapping invariants OK")


def test_batch_grouping_and_stats() -> None:
    """Batch path must group same-pair outputs, keep order, and count stats."""
    width, height = 320, 180
    frames = make_scene_frames(8, width, height)
    with tempfile.TemporaryDirectory() as tmp:
        inp = os.path.join(tmp, "in")
        out = os.path.join(tmp, "out")
        write_pngs(inp, frames)

        backend = NativeInterpolatorBackend()
        backend.initialize()
        model_dir = r"D:\BaiduNetdiskDownload\GVFI\AI_Tools\rife-ncnn-vulkan-20221029-windows\rife-v4.6"
        if not os.path.isdir(model_dir):
            # fall back to any dir containing flownet.param/flownet.bin
            candidates = [
                r"D:\BaiduNetdiskDownload\GVFI\AI_Tools\rife-ncnn-vulkan-20221029-windows\rife",
                r"D:\GVFI-deps\model",
            ]
            model_dir = next((c for c in candidates if os.path.isdir(c)), "")
        if not model_dir:
            print("  SKIP: no RIFE v4.6 model dir found (stats-only check)")
            backend.release()
            return
        backend.load_model(model_dir)
        try:
            backend.process_directory(
                inp, out, target_frames=47, gpu=None, thread_config="1:2:2"
            )
        finally:
            backend.release()

        produced = count_pngs(out)
        assert produced == 47, f"expected 47 output frames, got {produced}"
        s = backend.stats()
        print(f"  stats: {s}")
        # One native batch call for all interpolated outputs (45 of 47; the
        # other 2 are pass-through copies that need no inference).
        assert s["native_batch_count"] == 1, (
            f"expected 1 batch call, got {s['native_batch_count']}")
        assert s["native_frame_count"] == 45, (
            f"native_frame_count {s['native_frame_count']} != 45 (47 outputs, 2 pass-through)")
        assert s["python_to_native_call_count"] == 1, s
        assert s["png_write_count"] == 47, s
        assert s["png_read_count"] <= 16, s  # distinct input pairs * 2, bounded cache
        assert s["total_time"] > 0.0
        print("  batch grouping + stats OK")


def test_batch_vs_single_pixel_identity() -> None:
    """Batch and per-frame paths must produce pixel-identical output."""
    width, height = 320, 180
    frames = make_scene_frames(4, width, height)
    with tempfile.TemporaryDirectory() as tmp:
        inp = os.path.join(tmp, "in")
        write_pngs(inp, frames)
        model_dir = r"D:\BaiduNetdiskDownload\GVFI\AI_Tools\rife-ncnn-vulkan-20221029-windows\rife-v4.6"
        if not os.path.isdir(model_dir):
            print("  SKIP: no model dir")
            return

        # --- batch path ---
        out_b = os.path.join(tmp, "out_batch")
        backend = NativeInterpolatorBackend()
        backend.initialize()
        backend.load_model(model_dir)
        try:
            backend.process_directory(inp, out_b, target_frames=31, gpu=None, thread_config="1:2:2")
        finally:
            backend.release()

        # --- per-frame path (monkeypatch to force single calls) ---
        out_s = os.path.join(tmp, "out_single")
        backend_s = NativeInterpolatorBackend()
        backend_s.initialize()
        backend_s.load_model(model_dir)
        original = backend_s.process_frames
        try:
            # Force every interpolated output through the per-frame path by
            # calling it directly with the same mapping.
            paths = sorted(Path(inp).glob("*.png"))
            os.makedirs(out_s, exist_ok=True)
            cache = {}
            def read(i):
                if i not in cache:
                    cache[i] = cv2.imread(str(paths[i]), cv2.IMREAD_COLOR)
                return cache[i]
            input_count = len(paths)
            output_count = 31
            for oi in range(output_count):
                left, right, frac = map_native_directory_sample(oi, input_count, output_count)
                img0 = read(left)
                if right == left or frac <= 1e-12:
                    out_img = img0
                else:
                    img1 = read(right)
                    h, w = img0.shape[:2]
                    result = original(
                        Frame(img0, w, h, "bgr24", left, float(left)),
                        Frame(img1, w, h, "bgr24", right, float(right)),
                        timestamp=frac,
                    )
                    out_img = np.frombuffer(result.frame_data, dtype=np.uint8).reshape(h, w, 3)
                cv2.imwrite(os.path.join(out_s, f"{oi + 1:08d}.png"), out_img)
        finally:
            backend_s.release()

        batch_files = sorted(Path(out_b).glob("*.png"))
        single_files = sorted(Path(out_s).glob("*.png"))
        assert len(batch_files) == len(single_files), (
            len(batch_files), len(single_files))
        mismatches = 0
        for bf, sf in zip(batch_files, single_files):
            a = cv2.imread(str(bf))
            b = cv2.imread(str(sf))
            if a is None or b is None or not np.array_equal(a, b):
                mismatches += 1
        assert mismatches == 0, f"{mismatches} frames differ between batch and single paths"
        print(f"  batch vs single pixel identity OK ({len(batch_files)} frames)")


if __name__ == "__main__":
    print("== Phase D3 batch boundary checks ==")
    check_mapping_invariants()
    test_batch_grouping_and_stats()
    test_batch_vs_single_pixel_identity()
    print("ALL PASS")
