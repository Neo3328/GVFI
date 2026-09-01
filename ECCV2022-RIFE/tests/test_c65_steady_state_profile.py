"""
C6.5 — Steady-state GPU command coalescing profile

Phase: C6.5
Date: 2026-08-12
Objective: Measure whether C6.4 batch coalescing yields steady-state gains
           after excluding init / model load / first-time Vulkan warmup / I/O.

Constraints:
- Independent profiling only.
- Do not change VideoWorker, CLI, default backend_mode, ncnn core, or video flow.
- Do not tune the algorithm based on expected results; collect real timings only.

Output:
  D:\\GVFI-deps\\native-video-worker-ab\\c65_steady_state\\
  docs/native/c65-steady-state-profile.md
"""

from __future__ import annotations

import gc
import json
import math
import os
import shutil
import sys
import time
from pathlib import Path
from typing import Any

ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
sys.path.insert(0, ENGINE_ROOT)

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
MODEL = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c65_steady_state"
DOCS_REPORT = os.path.join(
    r"D:\BaiduNetdiskDownload\GVFI", "docs", "native", "c65-steady-state-profile.md"
)

EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
NUM_INPUT_PAIRS = 10
BATCH_SIZES = [1, 2, 4, 8]
WARMUP_ROUNDS = 3
STEADY_ROUNDS = 20
STABILITY_RUNS = 10

import cv2
import numpy as np

from gvfi_runtime.frame_pipeline import Frame
from gvfi_runtime.native_library import NativeLibraryLoader, NativeResult


def decode_video_to_frames(video_path: str, output_dir: str, max_frames: int) -> list[Path]:
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"cv2.VideoCapture failed: {video_path}")
    index = 0
    while index < max_frames:
        ret, frame = cap.read()
        if not ret or frame is None:
            break
        cv2.imwrite(os.path.join(output_dir, f"{index:08d}.png"), frame)
        index += 1
    cap.release()
    return sorted(Path(output_dir).glob("*.png"))


def load_frames(frame_paths: list[Path]) -> list[np.ndarray]:
    frames = []
    for path in frame_paths:
        frame = cv2.imread(str(path))
        if frame is None:
            raise RuntimeError(f"failed to load frame: {path}")
        frames.append(frame)
    return frames


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return float(ordered[0])
    rank = (len(ordered) - 1) * (p / 100.0)
    lo = int(math.floor(rank))
    hi = int(math.ceil(rank))
    if lo == hi:
        return float(ordered[lo])
    weight = rank - lo
    return float(ordered[lo] * (1.0 - weight) + ordered[hi] * weight)


def bit_exact(a: np.ndarray, b: np.ndarray) -> dict[str, Any]:
    if a.shape != b.shape:
        return {
            "bit_exact": False,
            "mae": None,
            "psnr": None,
            "ssim": None,
            "max_pixel_diff": None,
            "nan_inf": True,
        }
    a_f = a.astype(np.float64)
    b_f = b.astype(np.float64)
    diff = np.abs(a_f - b_f)
    mae = float(diff.mean())
    mse = float(np.mean((a_f - b_f) ** 2))
    psnr = 100.0 if mse == 0 else float(20 * math.log10(255.0 / math.sqrt(mse)))
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    mu1 = float(b_f.mean())
    mu2 = float(a_f.mean())
    sigma1 = float(((b_f - mu1) ** 2).mean())
    sigma2 = float(((a_f - mu2) ** 2).mean())
    sigma12 = float(((b_f - mu1) * (a_f - mu2)).mean())
    ssim = float(
        (2 * mu1 * mu2 + c1)
        * (2 * sigma12 + c2)
        / ((mu1**2 + mu2**2 + c1) * (sigma1 + sigma2 + c2))
    )
    return {
        "bit_exact": bool(np.array_equal(a, b)),
        "mae": mae,
        "psnr": psnr,
        "ssim": ssim,
        "max_pixel_diff": int(diff.max()) if diff.size else 0,
        "nan_inf": bool(not (np.isfinite(a).all() and np.isfinite(b).all())),
    }


def make_pair_frames(
    frames: list[np.ndarray], start: int, end: int, timestamps: list[float]
) -> tuple[list[Frame], list[Frame], list[float]]:
    frames0: list[Frame] = []
    frames1: list[Frame] = []
    ts: list[float] = []
    for i in range(start, end):
        frames0.append(
            Frame(frames[i].tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i, 0.0)
        )
        frames1.append(
            Frame(
                frames[i + 1].tobytes(),
                EXPECTED_WIDTH,
                EXPECTED_HEIGHT,
                "bgr24",
                i + 1,
                0.0,
            )
        )
        ts.append(float(timestamps[i]))
    return frames0, frames1, ts


def outputs_to_arrays(batch_outputs: list[Frame | None]) -> list[np.ndarray]:
    arrays: list[np.ndarray] = []
    for item in batch_outputs:
        if item is None:
            raise RuntimeError("batch output contains None")
        arrays.append(
            np.frombuffer(item.frame_data, dtype=np.uint8)
            .reshape((EXPECTED_HEIGHT, EXPECTED_WIDTH, 3))
            .copy()
        )
    return arrays


def run_all_pairs_batch(
    lib: NativeLibraryLoader,
    frames: list[np.ndarray],
    timestamps: list[float],
    batch_size: int,
    collect_profile: bool,
) -> tuple[list[np.ndarray], list[dict[str, Any]], float]:
    """Process all pairs once with fixed batch_size. Returns outputs, profiles, wall_ms."""
    outputs: list[np.ndarray] = []
    profiles: list[dict[str, Any]] = []
    num_pairs = len(frames) - 1
    wall_start = time.perf_counter()
    for start in range(0, num_pairs, batch_size):
        end = min(start + batch_size, num_pairs)
        f0, f1, ts = make_pair_frames(frames, start, end, timestamps)
        result, batch_outputs = lib.process_batch(f0, f1, ts)
        if result != NativeResult.SUCCESS or not batch_outputs:
            raise RuntimeError(f"process_batch failed: {result}")
        outputs.extend(outputs_to_arrays(batch_outputs))
        if collect_profile:
            profiles.append(lib.get_last_batch_profile())
    wall_ms = (time.perf_counter() - wall_start) * 1000.0
    return outputs, profiles, wall_ms


def summarize_profiles(
    all_profiles: list[dict[str, Any]],
    num_pairs: int,
    steady_rounds: int,
) -> dict[str, Any]:
    totals = [float(p["total_ms"]) for p in all_profiles]
    records = [float(p["record_ms"]) for p in all_profiles]
    submits = [float(p["submit_ms"]) for p in all_profiles]
    posts = [float(p["postprocess_ms"]) for p in all_profiles]
    vk_counts = [int(p["vk_submit_count"]) for p in all_profiles]

    total_ms = float(sum(totals))
    record_ms = float(sum(records))
    submit_ms = float(sum(submits))
    post_ms = float(sum(posts))
    vk_submit_count = int(sum(vk_counts))
    frames_processed = num_pairs * steady_rounds
    batch_calls = len(all_profiles)

    return {
        "batch_calls": batch_calls,
        "frames_processed": frames_processed,
        "process_v4_batch_total_ms": total_ms,
        "command_recording_ms": record_ms,
        "submit_and_wait_ms": submit_ms,
        "to_pixels_postprocess_ms": post_ms,
        "vulkan_submit_count": vk_submit_count,
        "avg_batch_ms": total_ms / batch_calls if batch_calls else 0.0,
        "avg_frame_ms": total_ms / frames_processed if frames_processed else 0.0,
        "p50_batch_ms": percentile(totals, 50),
        "p95_batch_ms": percentile(totals, 95),
        "p50_submit_ms": percentile(submits, 50),
        "p95_submit_ms": percentile(submits, 95),
        "phase_share": {
            "record": record_ms / total_ms if total_ms else 0.0,
            "submit": submit_ms / total_ms if total_ms else 0.0,
            "postprocess": post_ms / total_ms if total_ms else 0.0,
        },
    }


def write_markdown(report: dict[str, Any], path: str) -> None:
    lines: list[str] = []
    lines.append("# Phase C6.5 — Steady-state GPU Command Coalescing Profile")
    lines.append("")
    lines.append("**GVFI — Native RIFE Batch Steady-state Profiling**  ")
    lines.append("**Developed by Mr. Gong**  ")
    lines.append("**Copyright © 2026 Mr. Gong. All Rights Reserved.**")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 1. Objective")
    lines.append("")
    lines.append(
        "Validate whether C6.4 GPU command coalescing provides **steady-state** "
        "performance benefit after excluding model load, Vulkan first-init, and I/O."
    )
    lines.append("")
    lines.append("## 2. Method")
    lines.append("")
    lines.append("- Init + model load: once per process")
    lines.append(f"- Warmup rounds per batch size: {report['config']['warmup_rounds']}")
    lines.append(f"- Steady-state rounds per batch size: {report['config']['steady_rounds']}")
    lines.append(f"- Input pairs: {report['config']['num_input_pairs']} @ {report['config']['resolution']}")
    lines.append("- Timing source: in-process `process_v4_batch` phase timers via `gvfi_get_last_batch_profile`")
    lines.append("- Algorithm unchanged; instrumentation only")
    lines.append("")
    lines.append("## 3. Correctness")
    lines.append("")
    lines.append("| Batch | bit-exact | MAE | PSNR | SSIM | maxΔ | NaN/Inf |")
    lines.append("|------:|:---------:|----:|-----:|-----:|-----:|:-------:|")
    for bs in BATCH_SIZES:
        c = report["correctness"][str(bs)]
        lines.append(
            f"| {bs} | {c['bit_exact_count']}/{c['total_frames']} | "
            f"{c['avg_mae']:.6f} | {c['avg_psnr']:.4f} | {c['avg_ssim']:.6f} | "
            f"{c['max_pixel_diff']} | {c['nan_inf']} |"
        )
    lines.append("")
    lines.append("## 4. Steady-state Timings (`process_v4_batch`)")
    lines.append("")
    lines.append(
        "| Batch | total_ms | record_ms | submit_ms | post_ms | vk submits | "
        "avg_batch_ms | avg_frame_ms | P50 | P95 |"
    )
    lines.append(
        "|------:|---------:|----------:|----------:|--------:|-----------:|"
        "-------------:|-------------:|----:|----:|"
    )
    for bs in BATCH_SIZES:
        s = report["steady_state"][str(bs)]
        lines.append(
            f"| {bs} | {s['process_v4_batch_total_ms']:.3f} | "
            f"{s['command_recording_ms']:.3f} | {s['submit_and_wait_ms']:.3f} | "
            f"{s['to_pixels_postprocess_ms']:.3f} | {s['vulkan_submit_count']} | "
            f"{s['avg_batch_ms']:.3f} | {s['avg_frame_ms']:.3f} | "
            f"{s['p50_batch_ms']:.3f} | {s['p95_batch_ms']:.3f} |"
        )
    lines.append("")
    lines.append("### Relative to Batch 1 (avg_frame_ms)")
    lines.append("")
    base = report["steady_state"]["1"]["avg_frame_ms"]
    lines.append("| Batch | avg_frame_ms | vs batch1 |")
    lines.append("|------:|-------------:|----------:|")
    for bs in BATCH_SIZES:
        avg = report["steady_state"][str(bs)]["avg_frame_ms"]
        rel = (base / avg) if avg > 0 else 0.0
        lines.append(f"| {bs} | {avg:.3f} | {rel:.3f}x |")
    lines.append("")
    lines.append("## 5. Stability")
    lines.append("")
    st = report["stability"]
    lines.append(f"- Runs: {st['total_runs']}")
    lines.append(f"- Crashes: {st['crashes']}")
    lines.append(f"- Failed forwards: {st['failed_forwards']}")
    lines.append(f"- NaN/Inf: {st['nan_inf_detected']}")
    lines.append(f"- Frame loss: {st['frame_loss']}")
    lines.append(f"- PASS: {st['pass']}")
    lines.append("")
    lines.append("## 6. Verdict (data-only)")
    lines.append("")
    lines.append(report["verdict"])
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(f"Raw JSON: `{report['artifacts']['json']}`")
    lines.append("")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def build_verdict(report: dict[str, Any]) -> str:
    rows = []
    base = report["steady_state"]["1"]["avg_frame_ms"]
    best_bs = 1
    best_avg = base
    for bs in BATCH_SIZES:
        avg = report["steady_state"][str(bs)]["avg_frame_ms"]
        rows.append((bs, avg, base / avg if avg else 0.0))
        if avg < best_avg:
            best_avg = avg
            best_bs = bs
    all_exact = all(
        report["correctness"][str(bs)]["bit_exact_count"]
        == report["correctness"][str(bs)]["total_frames"]
        for bs in BATCH_SIZES
    )
    stability_pass = report["stability"]["pass"]
    gain = (base / best_avg) if best_avg > 0 else 0.0
    if not all_exact:
        return (
            "INCONCLUSIVE for performance: correctness gate failed "
            "(one or more batch sizes are not bit-exact)."
        )
    if not stability_pass:
        return (
            "INCONCLUSIVE for performance: stability gate failed."
        )
    if best_bs == 1 or gain < 1.05:
        return (
            f"No meaningful steady-state frame-time gain vs Batch 1 "
            f"(best batch={best_bs}, relative={gain:.3f}x). "
            "Command coalescing reduces measured Vk submit count, but "
            "avg_frame_ms does not show a clear benefit under this workload."
        )
    return (
        f"Steady-state frame-time improved vs Batch 1: best batch={best_bs}, "
        f"relative={gain:.3f}x. Vk submit counts also fall with larger batches. "
        "Correctness remained bit-exact and stability passed."
    )


def main() -> int:
    print("=" * 80)
    print("C6.5 — Steady-state GPU Command Coalescing Profile")
    print("=" * 80)

    os.makedirs(RESULTS_DIR, exist_ok=True)
    if not os.path.isfile(TEST_VIDEO):
        print(f"FATAL: missing video: {TEST_VIDEO}")
        return 1
    if not os.path.isdir(MODEL):
        print(f"FATAL: missing model: {MODEL}")
        return 1

    input_dir = os.path.join(RESULTS_DIR, "input_frames")
    if os.path.exists(input_dir):
        shutil.rmtree(input_dir)
    frame_paths = decode_video_to_frames(TEST_VIDEO, input_dir, NUM_INPUT_PAIRS + 1)
    if len(frame_paths) < NUM_INPUT_PAIRS + 1:
        print(f"FATAL: need {NUM_INPUT_PAIRS + 1} frames, got {len(frame_paths)}")
        return 1
    frames = load_frames(frame_paths[: NUM_INPUT_PAIRS + 1])
    timestamps = [(i + 1) / len(frames) for i in range(len(frames) - 1)]
    print(f"Loaded {len(frames)} frames, {len(frames) - 1} pairs")

    lib = NativeLibraryLoader()
    lib.load()
    lib.create()
    lib.initialize()
    info = lib.backend_info()
    print(f"GPU: {info.get('gpu_name')}")
    param = os.path.join(MODEL, "flownet.param")
    bin_path = os.path.join(MODEL, "flownet.bin")
    if lib.load_model(param, bin_path) != NativeResult.SUCCESS:
        print("FATAL: load_model failed")
        return 1

    # One-time Vulkan / pipeline warmup outside measured windows.
    print(f"Global warmup ({WARMUP_ROUNDS} rounds, batch=1)...")
    for _ in range(WARMUP_ROUNDS):
        run_all_pairs_batch(lib, frames, timestamps, 1, collect_profile=False)

    print("Capturing baseline outputs via process()...")
    baseline: list[np.ndarray] = []
    for i in range(len(frames) - 1):
        f0 = Frame(frames[i].tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i, 0.0)
        f1 = Frame(
            frames[i + 1].tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i + 1, 0.0
        )
        result, out = lib.process(f0, f1, float(timestamps[i]))
        if result != NativeResult.SUCCESS or out is None:
            raise RuntimeError(f"baseline process failed at {i}: {result}")
        baseline.append(
            np.frombuffer(out.frame_data, dtype=np.uint8)
            .reshape((EXPECTED_HEIGHT, EXPECTED_WIDTH, 3))
            .copy()
        )

    report: dict[str, Any] = {
        "phase": "C6.5",
        "config": {
            "num_input_pairs": NUM_INPUT_PAIRS,
            "resolution": f"{EXPECTED_WIDTH}x{EXPECTED_HEIGHT}",
            "batch_sizes": BATCH_SIZES,
            "warmup_rounds": WARMUP_ROUNDS,
            "steady_rounds": STEADY_ROUNDS,
            "stability_runs": STABILITY_RUNS,
            "gpu_name": info.get("gpu_name"),
            "ncnn_version": info.get("ncnn_version"),
        },
        "correctness": {},
        "steady_state": {},
        "stability": {},
        "artifacts": {
            "json": os.path.join(RESULTS_DIR, "c65_results.json"),
            "markdown": DOCS_REPORT,
        },
    }

    for batch_size in BATCH_SIZES:
        print("=" * 60)
        print(f"Batch size {batch_size}")
        print("=" * 60)

        # Per-size short warmup to settle any batch-size-specific paths.
        for _ in range(WARMUP_ROUNDS):
            run_all_pairs_batch(lib, frames, timestamps, batch_size, collect_profile=False)

        # Correctness once after warmup.
        corr_outputs, _, _ = run_all_pairs_batch(
            lib, frames, timestamps, batch_size, collect_profile=False
        )
        metrics = [bit_exact(o, r) for o, r in zip(corr_outputs, baseline)]
        correctness = {
            "total_frames": len(metrics),
            "bit_exact_count": sum(1 for m in metrics if m["bit_exact"]),
            "avg_mae": float(sum(m["mae"] or 0.0 for m in metrics) / max(1, len(metrics))),
            "avg_psnr": float(sum(m["psnr"] or 0.0 for m in metrics) / max(1, len(metrics))),
            "avg_ssim": float(sum(m["ssim"] or 0.0 for m in metrics) / max(1, len(metrics))),
            "max_pixel_diff": max((m["max_pixel_diff"] or 0) for m in metrics),
            "nan_inf": any(m["nan_inf"] for m in metrics),
        }
        correctness["is_correct"] = (
            correctness["bit_exact_count"] == correctness["total_frames"]
            and correctness["max_pixel_diff"] == 0
            and not correctness["nan_inf"]
        )
        report["correctness"][str(batch_size)] = correctness
        print(
            f"  Correctness: {correctness['bit_exact_count']}/{correctness['total_frames']} "
            f"bit-exact, maxΔ={correctness['max_pixel_diff']}"
        )
        if not correctness["is_correct"]:
            print("FATAL: bit-exact gate failed; stopping.")
            with open(report["artifacts"]["json"], "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
            return 2

        # Steady-state measured rounds.
        gc.collect()
        all_profiles: list[dict[str, Any]] = []
        round_wall_ms: list[float] = []
        for round_idx in range(STEADY_ROUNDS):
            _, profiles, wall_ms = run_all_pairs_batch(
                lib, frames, timestamps, batch_size, collect_profile=True
            )
            all_profiles.extend(profiles)
            round_wall_ms.append(wall_ms)
            if (round_idx + 1) % 5 == 0:
                print(f"  steady round {round_idx + 1}/{STEADY_ROUNDS}")

        summary = summarize_profiles(all_profiles, len(frames) - 1, STEADY_ROUNDS)
        summary["abi_wall_round_ms_avg"] = float(sum(round_wall_ms) / len(round_wall_ms))
        summary["abi_wall_round_ms_p50"] = percentile(round_wall_ms, 50)
        summary["abi_wall_round_ms_p95"] = percentile(round_wall_ms, 95)
        report["steady_state"][str(batch_size)] = summary
        print(
            f"  process_v4_batch total={summary['process_v4_batch_total_ms']:.2f}ms "
            f"record={summary['command_recording_ms']:.2f} "
            f"submit={summary['submit_and_wait_ms']:.2f} "
            f"post={summary['to_pixels_postprocess_ms']:.2f}"
        )
        print(
            f"  vk_submits={summary['vulkan_submit_count']} "
            f"avg_batch={summary['avg_batch_ms']:.3f}ms "
            f"avg_frame={summary['avg_frame_ms']:.3f}ms "
            f"P50={summary['p50_batch_ms']:.3f} P95={summary['p95_batch_ms']:.3f}"
        )

    print("=" * 60)
    print(f"Stability ({STABILITY_RUNS} runs, batch=4)")
    print("=" * 60)
    stability = {
        "crashes": 0,
        "failed_forwards": 0,
        "nan_inf_detected": 0,
        "frame_loss": 0,
        "total_runs": STABILITY_RUNS,
    }
    for run in range(STABILITY_RUNS):
        try:
            gc.collect()
            outs, _, _ = run_all_pairs_batch(
                lib, frames, timestamps, 4, collect_profile=False
            )
            if len(outs) != NUM_INPUT_PAIRS:
                stability["frame_loss"] += 1
            if any(not np.isfinite(o).all() for o in outs):
                stability["nan_inf_detected"] += 1
            print(f"  Run {run + 1}: OK ({len(outs)} frames)")
        except Exception as exc:  # noqa: BLE001 - stability must count crashes
            stability["crashes"] += 1
            print(f"  Run {run + 1}: CRASH - {exc}")
    stability["pass"] = all(
        stability[k] == 0
        for k in ("crashes", "failed_forwards", "nan_inf_detected", "frame_loss")
    )
    report["stability"] = stability

    report["verdict"] = build_verdict(report)
    with open(report["artifacts"]["json"], "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    write_markdown(report, DOCS_REPORT)

    lib.release()
    lib.destroy()

    print("\n" + report["verdict"])
    print(f"JSON: {report['artifacts']['json']}")
    print(f"Markdown: {DOCS_REPORT}")
    print("C6.5 complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
