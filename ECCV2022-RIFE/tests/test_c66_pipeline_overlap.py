"""
C6.6 — Independent pipeline-overlap PoC (depth 2 first)

Phase: C6.6
Date: 2026-08-12
Objective: Measure whether depth-2 concurrent process_v4 slots reduce
           steady-state frame time by overlapping CPU record + GPU fence wait.

Stop rule: if steady-state gain vs baseline < ~15%, halt C6.6.

Does not modify VideoWorker / CLI / default backend_mode / ncnn / RIFE weights.
"""

from __future__ import annotations

import gc
import json
import math
import os
import shutil
import sys
from pathlib import Path
from typing import Any

ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
sys.path.insert(0, ENGINE_ROOT)

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
MODEL = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c66_pipeline_overlap"
DOCS_REPORT = os.path.join(
    r"D:\BaiduNetdiskDownload\GVFI", "docs", "native", "c66-pipeline-overlap-report.md"
)

EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
NUM_INPUT_PAIRS = 10
WARMUP_ROUNDS = 3
STEADY_ROUNDS = 20
STABILITY_RUNS = 10
PIPELINE_DEPTHS = [2]  # expand to 3/4 only if depth2 >= ~15%
GAIN_STOP_THRESHOLD = 0.15

import cv2
import numpy as np

from gvfi_runtime.frame_pipeline import Frame
from gvfi_runtime.native_library import NativeResult, PipelinePocLoader


def decode_video_to_frames(video_path: str, output_dir: str, max_frames: int) -> list[Path]:
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"failed to open video: {video_path}")
    index = 0
    while index < max_frames:
        ok, frame = cap.read()
        if not ok or frame is None:
            break
        cv2.imwrite(os.path.join(output_dir, f"{index:08d}.png"), frame)
        index += 1
    cap.release()
    return sorted(Path(output_dir).glob("*.png"))


def load_frames(paths: list[Path]) -> list[np.ndarray]:
    frames = []
    for path in paths:
        img = cv2.imread(str(path))
        if img is None:
            raise RuntimeError(f"failed to read {path}")
        frames.append(img)
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
    w = rank - lo
    return float(ordered[lo] * (1.0 - w) + ordered[hi] * w)


def quality(a: np.ndarray, b: np.ndarray) -> dict[str, Any]:
    af = a.astype(np.float64)
    bf = b.astype(np.float64)
    diff = np.abs(af - bf)
    mse = float(np.mean((af - bf) ** 2))
    psnr = 100.0 if mse == 0 else float(20 * math.log10(255.0 / math.sqrt(mse)))
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    mu1 = float(bf.mean())
    mu2 = float(af.mean())
    s1 = float(((bf - mu1) ** 2).mean())
    s2 = float(((af - mu2) ** 2).mean())
    s12 = float(((bf - mu1) * (af - mu2)).mean())
    ssim = float(
        (2 * mu1 * mu2 + c1)
        * (2 * s12 + c2)
        / ((mu1**2 + mu2**2 + c1) * (s1 + s2 + c2))
    )
    return {
        "bit_exact": bool(np.array_equal(a, b)),
        "mae": float(diff.mean()),
        "psnr": psnr,
        "ssim": ssim,
        "max_pixel_diff": int(diff.max()) if diff.size else 0,
        "nan_inf": bool(not (np.isfinite(a).all() and np.isfinite(b).all())),
    }


def make_sequence(
    frames: list[np.ndarray], timestamps: list[float]
) -> tuple[list[Frame], list[Frame], list[float]]:
    f0: list[Frame] = []
    f1: list[Frame] = []
    ts: list[float] = []
    for i in range(len(frames) - 1):
        f0.append(Frame(frames[i].tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i, 0.0))
        f1.append(
            Frame(frames[i + 1].tobytes(), EXPECTED_WIDTH, EXPECTED_HEIGHT, "bgr24", i + 1, 0.0)
        )
        ts.append(float(timestamps[i]))
    return f0, f1, ts


def frames_to_arrays(items: list[Frame | None]) -> list[np.ndarray]:
    out: list[np.ndarray] = []
    for item in items:
        if item is None:
            raise RuntimeError("null output frame")
        out.append(
            np.frombuffer(item.frame_data, dtype=np.uint8)
            .reshape((EXPECTED_HEIGHT, EXPECTED_WIDTH, 3))
            .copy()
        )
    return out


def run_once(
    poc: PipelinePocLoader,
    frames: list[np.ndarray],
    timestamps: list[float],
    depth: int,
) -> tuple[list[np.ndarray], dict]:
    f0, f1, ts = make_sequence(frames, timestamps)
    result, outs, profile = poc.process_sequence(f0, f1, ts, depth=depth)
    if result != NativeResult.SUCCESS or not outs:
        raise RuntimeError(f"pipeline process_sequence failed: {result}")
    return frames_to_arrays(outs), profile


def aggregate_profiles(profiles: list[dict]) -> dict[str, Any]:
    walls = [float(p["wall_ms"]) for p in profiles]
    avgs = [float(p["avg_frame_ms"]) for p in profiles]
    overlaps = [float(p["overlap_ratio"]) for p in profiles]
    submits = [int(p["submit_count"]) for p in profiles]
    sum_jobs = [float(p["sum_job_ms"]) for p in profiles]
    return {
        "rounds": len(profiles),
        "avg_wall_ms": float(sum(walls) / len(walls)),
        "avg_frame_ms": float(sum(avgs) / len(avgs)),
        "p50_frame_ms": percentile(avgs, 50),
        "p95_frame_ms": percentile(avgs, 95),
        "avg_sum_job_ms": float(sum(sum_jobs) / len(sum_jobs)),
        "avg_overlap_ratio": float(sum(overlaps) / len(overlaps)),
        "avg_submit_count": float(sum(submits) / len(submits)),
        "cpu_wait_proxy_ms_avg": float(sum(sum_jobs) / len(sum_jobs)),
        "fence_wait_proxy_ms_avg": float(sum(sum_jobs) / len(sum_jobs)),
        "total_gpu_job_ms_avg": float(sum(sum_jobs) / len(sum_jobs)),
    }


def write_report(report: dict[str, Any], path: str) -> None:
    lines = [
        "# Phase C6.6 — Pipeline Overlap PoC Report",
        "",
        "**GVFI — Native RIFE Depth-2 Pipeline Overlap**  ",
        "**Developed by Mr. Gong**  ",
        "**Copyright © 2026 Mr. Gong. All Rights Reserved.**",
        "",
        "---",
        "",
        "## 1. Method",
        "",
        "- Independent `PipelineRifeWorker` + PoC ABI (not production VideoWorker path)",
        "- Baseline: depth=1 sequential `RIFE::process` / `process_v4`",
        "- Pipeline: depth=2 sliding-window concurrent slots (own VkCompute/allocator/fence per job via ncnn)",
        f"- Warmup={report['config']['warmup_rounds']}, steady={report['config']['steady_rounds']}",
        f"- Input: {report['config']['num_input_pairs']} pairs @ {report['config']['resolution']}",
        "- Stop rule: require ≥ ~15% steady-state frame-ms gain to continue",
        "",
        "## 2. Correctness",
        "",
        "| Mode | bit-exact | MAE | PSNR | SSIM | maxΔ | NaN/Inf |",
        "|------|:---------:|----:|-----:|-----:|-----:|:-------:|",
    ]
    for key, c in report["correctness"].items():
        lines.append(
            f"| {key} | {c['bit_exact_count']}/{c['total_frames']} | "
            f"{c['avg_mae']:.6f} | {c['avg_psnr']:.4f} | {c['avg_ssim']:.6f} | "
            f"{c['max_pixel_diff']} | {c['nan_inf']} |"
        )
    lines += [
        "",
        "## 3. Steady-state",
        "",
        "| Mode | avg_frame_ms | P50 | P95 | submit/round | overlap | vs baseline |",
        "|------|-------------:|----:|----:|-------------:|--------:|------------:|",
    ]
    base = report["steady_state"]["baseline_depth1"]["avg_frame_ms"]
    for key, s in report["steady_state"].items():
        gain = (base - s["avg_frame_ms"]) / base if base > 0 else 0.0
        lines.append(
            f"| {key} | {s['avg_frame_ms']:.3f} | {s['p50_frame_ms']:.3f} | "
            f"{s['p95_frame_ms']:.3f} | {s['avg_submit_count']:.1f} | "
            f"{s['avg_overlap_ratio']:.3f} | {gain*100:.2f}% |"
        )
    st = report["stability"]
    lines += [
        "",
        "## 4. Stability",
        "",
        f"- Runs: {st['total_runs']}",
        f"- Crashes: {st['crashes']}",
        f"- NaN/Inf: {st['nan_inf_detected']}",
        f"- Frame loss: {st['frame_loss']}",
        f"- PASS: {st['pass']}",
        "",
        "## 5. Verdict",
        "",
        report["verdict"],
        "",
        "---",
        "",
        f"Analysis: `docs/native/c66-pipeline-overlap-analysis.md`",
        f"JSON: `{report['artifacts']['json']}`",
        "",
    ]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main() -> int:
    print("=" * 80)
    print("C6.6 — Pipeline Overlap PoC")
    print("=" * 80)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    input_dir = os.path.join(RESULTS_DIR, "input_frames")
    if os.path.exists(input_dir):
        shutil.rmtree(input_dir)
    paths = decode_video_to_frames(TEST_VIDEO, input_dir, NUM_INPUT_PAIRS + 1)
    frames = load_frames(paths[: NUM_INPUT_PAIRS + 1])
    timestamps = [(i + 1) / len(frames) for i in range(len(frames) - 1)]
    print(f"Loaded {len(frames)} frames")

    poc = PipelinePocLoader()
    poc.load()
    poc.create()
    poc.initialize()
    param = os.path.join(MODEL, "flownet.param")
    bin_path = os.path.join(MODEL, "flownet.bin")
    if poc.load_model(param, bin_path) != NativeResult.SUCCESS:
        print("FATAL: model load failed")
        return 1

    print(f"Warmup x{WARMUP_ROUNDS} (depth=1)...")
    for _ in range(WARMUP_ROUNDS):
        run_once(poc, frames, timestamps, depth=1)

    print("Baseline reference outputs (depth=1)...")
    baseline_outs, _ = run_once(poc, frames, timestamps, depth=1)

    report: dict[str, Any] = {
        "phase": "C6.6",
        "config": {
            "num_input_pairs": NUM_INPUT_PAIRS,
            "resolution": f"{EXPECTED_WIDTH}x{EXPECTED_HEIGHT}",
            "warmup_rounds": WARMUP_ROUNDS,
            "steady_rounds": STEADY_ROUNDS,
            "stability_runs": STABILITY_RUNS,
            "pipeline_depths": PIPELINE_DEPTHS,
            "gain_stop_threshold": GAIN_STOP_THRESHOLD,
        },
        "correctness": {},
        "steady_state": {},
        "stability": {},
        "artifacts": {
            "json": os.path.join(RESULTS_DIR, "c66_results.json"),
            "markdown": DOCS_REPORT,
            "analysis": r"docs/native/c66-pipeline-overlap-analysis.md",
        },
    }

    # Correctness + steady-state for baseline
    print("=" * 60)
    print("Baseline depth=1 steady-state")
    print("=" * 60)
    for _ in range(WARMUP_ROUNDS):
        run_once(poc, frames, timestamps, depth=1)
    corr_outs, _ = run_once(poc, frames, timestamps, depth=1)
    metrics = [quality(o, r) for o, r in zip(corr_outs, baseline_outs)]
    report["correctness"]["baseline_depth1"] = {
        "total_frames": len(metrics),
        "bit_exact_count": sum(1 for m in metrics if m["bit_exact"]),
        "avg_mae": float(sum(m["mae"] for m in metrics) / len(metrics)),
        "avg_psnr": float(sum(m["psnr"] for m in metrics) / len(metrics)),
        "avg_ssim": float(sum(m["ssim"] for m in metrics) / len(metrics)),
        "max_pixel_diff": max(m["max_pixel_diff"] for m in metrics),
        "nan_inf": any(m["nan_inf"] for m in metrics),
    }
    print(
        f"  Correctness: {report['correctness']['baseline_depth1']['bit_exact_count']}/"
        f"{report['correctness']['baseline_depth1']['total_frames']}"
    )

    gc.collect()
    base_profiles = []
    for i in range(STEADY_ROUNDS):
        _, prof = run_once(poc, frames, timestamps, depth=1)
        base_profiles.append(prof)
        if (i + 1) % 5 == 0:
            print(f"  steady {i+1}/{STEADY_ROUNDS}")
    report["steady_state"]["baseline_depth1"] = aggregate_profiles(base_profiles)
    print(
        f"  avg_frame_ms={report['steady_state']['baseline_depth1']['avg_frame_ms']:.3f} "
        f"overlap={report['steady_state']['baseline_depth1']['avg_overlap_ratio']:.3f}"
    )

    continue_depths = False
    for depth in PIPELINE_DEPTHS:
        key = f"pipeline_depth{depth}"
        print("=" * 60)
        print(f"Pipeline depth={depth}")
        print("=" * 60)
        for _ in range(WARMUP_ROUNDS):
            run_once(poc, frames, timestamps, depth=depth)

        corr_outs, _ = run_once(poc, frames, timestamps, depth=depth)
        metrics = [quality(o, r) for o, r in zip(corr_outs, baseline_outs)]
        report["correctness"][key] = {
            "total_frames": len(metrics),
            "bit_exact_count": sum(1 for m in metrics if m["bit_exact"]),
            "avg_mae": float(sum(m["mae"] for m in metrics) / len(metrics)),
            "avg_psnr": float(sum(m["psnr"] for m in metrics) / len(metrics)),
            "avg_ssim": float(sum(m["ssim"] for m in metrics) / len(metrics)),
            "max_pixel_diff": max(m["max_pixel_diff"] for m in metrics),
            "nan_inf": any(m["nan_inf"] for m in metrics),
        }
        c = report["correctness"][key]
        print(f"  Correctness: {c['bit_exact_count']}/{c['total_frames']} maxΔ={c['max_pixel_diff']}")
        if c["bit_exact_count"] != c["total_frames"] or c["max_pixel_diff"] != 0:
            print("FATAL: bit-exact failed; stopping C6.6 expansion.")
            report["verdict"] = (
                "STOP C6.6: pipeline outputs are not bit-exact vs baseline."
            )
            with open(report["artifacts"]["json"], "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
            write_report(report, DOCS_REPORT)
            poc.destroy()
            return 2

        gc.collect()
        profiles = []
        for i in range(STEADY_ROUNDS):
            _, prof = run_once(poc, frames, timestamps, depth=depth)
            profiles.append(prof)
            if (i + 1) % 5 == 0:
                print(f"  steady {i+1}/{STEADY_ROUNDS}")
        report["steady_state"][key] = aggregate_profiles(profiles)
        s = report["steady_state"][key]
        base_ms = report["steady_state"]["baseline_depth1"]["avg_frame_ms"]
        gain = (base_ms - s["avg_frame_ms"]) / base_ms if base_ms > 0 else 0.0
        print(
            f"  avg_frame_ms={s['avg_frame_ms']:.3f} overlap={s['avg_overlap_ratio']:.3f} "
            f"gain={gain*100:.2f}%"
        )
        if gain >= GAIN_STOP_THRESHOLD:
            continue_depths = True

    # Stability on depth=2
    print("=" * 60)
    print(f"Stability x{STABILITY_RUNS} (depth=2)")
    print("=" * 60)
    stability = {
        "crashes": 0,
        "nan_inf_detected": 0,
        "frame_loss": 0,
        "total_runs": STABILITY_RUNS,
    }
    for run in range(STABILITY_RUNS):
        try:
            gc.collect()
            outs, _ = run_once(poc, frames, timestamps, depth=2)
            if len(outs) != NUM_INPUT_PAIRS:
                stability["frame_loss"] += 1
            if any(not np.isfinite(o).all() for o in outs):
                stability["nan_inf_detected"] += 1
            print(f"  Run {run+1}: OK")
        except Exception as exc:  # noqa: BLE001
            stability["crashes"] += 1
            print(f"  Run {run+1}: CRASH {exc}")
    stability["pass"] = all(
        stability[k] == 0 for k in ("crashes", "nan_inf_detected", "frame_loss")
    )
    report["stability"] = stability

    base_ms = report["steady_state"]["baseline_depth1"]["avg_frame_ms"]
    d2 = report["steady_state"].get("pipeline_depth2", {})
    d2_ms = float(d2.get("avg_frame_ms", base_ms))
    gain = (base_ms - d2_ms) / base_ms if base_ms > 0 else 0.0
    if not stability["pass"]:
        verdict = "STOP C6.6: stability failed."
    elif gain < GAIN_STOP_THRESHOLD:
        verdict = (
            f"STOP C6.6: depth-2 steady-state gain={gain*100:.2f}% "
            f"(< {GAIN_STOP_THRESHOLD*100:.0f}% threshold). "
            "Do not expand to depth 3/4 or production integration. "
            f"Measured overlap_ratio≈{float(d2.get('avg_overlap_ratio', 0.0)):.3f}; "
            "Vk submit count unchanged (1/frame)."
        )
    else:
        verdict = (
            f"CONTINUE candidate: depth-2 gain={gain*100:.2f}% meets threshold; "
            "consider depth 3/4 measurement next (still PoC-only)."
        )
        if not continue_depths:
            verdict += " (internal flag unset)"
    report["verdict"] = verdict
    report["gain_depth2"] = gain

    with open(report["artifacts"]["json"], "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    write_report(report, DOCS_REPORT)
    poc.destroy()

    print("\n" + verdict)
    print(f"JSON: {report['artifacts']['json']}")
    print(f"Markdown: {DOCS_REPORT}")
    print("C6.6 PoC complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
