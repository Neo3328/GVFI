# GVFI — C7.2 CLI vs Native final production A/B validation (test-only)
"""
Phase C7.2 — final production A/B validation.

Constraints:
  - Do NOT modify production logic
  - Do NOT change default backend_mode (must remain cli)
  - Do NOT modify CLI backend / ncnn / RIFE / Warp / GUI / FFmpeg encode path
"""

from __future__ import annotations

import gc
import hashlib
import inspect
import json
import math
import os
import re
import shutil
import statistics
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Optional

ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
REPO_ROOT = r"D:\BaiduNetdiskDownload\GVFI"
sys.path.insert(0, ENGINE_ROOT)
sys.path.insert(0, os.path.join(ENGINE_ROOT, "tests"))

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
TEST_VIDEO_SHA256 = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001".upper()
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c72_ab"
DOCS_REPORT = os.path.join(REPO_ROOT, "docs", "native", "c72-cli-native-ab.md")

EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
INTERP_FPS = 48
EXPECTED_OUT_FRAMES = 48
RUNS = 10
# Same conditions for both backends except backend_mode.
THREAD_CONFIG = "2:4:4"
GPU = 0

os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

import cv2
import numpy as np

import test_c54_final_validation as c54
import test_c71_final_regression as c71


def parse_pipeline_metrics(logs_text: str) -> dict[str, Optional[float]]:
    """Extract RIFE PIPELINE / process timing from VideoWorker logs."""
    out: dict[str, Optional[float]] = {
        "startup_time_s": None,
        "inference_time_s": None,
        "io_time_s": None,
        "gpu_usage_pct": None,
        "total_frames": None,
    }
    for line in logs_text.splitlines():
        s = line.strip()
        if s.startswith("startup_time="):
            try:
                out["startup_time_s"] = float(s.split("=", 1)[1].rstrip("s"))
            except ValueError:
                pass
        elif s.startswith("inference_time="):
            try:
                out["inference_time_s"] = float(s.split("=", 1)[1].rstrip("s"))
            except ValueError:
                pass
        elif s.startswith("io_time="):
            try:
                out["io_time_s"] = float(s.split("=", 1)[1].rstrip("s"))
            except ValueError:
                pass
        elif s.startswith("gpu_usage="):
            try:
                out["gpu_usage_pct"] = float(s.split("=", 1)[1].rstrip("%"))
            except ValueError:
                pass
        elif s.startswith("total_frames="):
            try:
                out["total_frames"] = float(s.split("=", 1)[1])
            except ValueError:
                pass
        elif "startup_time=" in s and "inference_time=" in s:
            m2 = re.search(
                r"startup_time=(?P<startup>[0-9.]+)s\s*\|\s*inference_time=(?P<inf>[0-9.]+)s",
                s,
            )
            if m2:
                if out["startup_time_s"] is None:
                    out["startup_time_s"] = float(m2.group("startup"))
                if out["inference_time_s"] is None:
                    out["inference_time_s"] = float(m2.group("inf"))
    return out


def query_peak_vram_mb() -> Optional[float]:
    """Best-effort NVIDIA peak/used VRAM via nvidia-smi (may be N/A)."""
    try:
        r = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=memory.used",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        if r.returncode != 0:
            return None
        vals = [float(x.strip()) for x in r.stdout.splitlines() if x.strip()]
        return max(vals) if vals else None
    except Exception:
        return None


def ssim_image(a: np.ndarray, b: np.ndarray) -> float:
    a_f = a.astype(np.float64)
    b_f = b.astype(np.float64)
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    mu1 = float(a_f.mean())
    mu2 = float(b_f.mean())
    sigma1 = float(((a_f - mu1) ** 2).mean())
    sigma2 = float(((b_f - mu2) ** 2).mean())
    sigma12 = float(((a_f - mu1) * (b_f - mu2)).mean())
    return float(
        (2 * mu1 * mu2 + c1)
        * (2 * sigma12 + c2)
        / ((mu1**2 + mu2**2 + c1) * (sigma1 + sigma2 + c2))
    )


def compare_frames(cli_frames: list[np.ndarray], native_frames: list[np.ndarray]) -> dict:
    if len(cli_frames) != len(native_frames) or not cli_frames:
        return {
            "length_match": False,
            "cli_frames": len(cli_frames),
            "native_frames": len(native_frames),
            "avg_mae": None,
            "avg_psnr": None,
            "avg_ssim": None,
            "max_pixel_diff": None,
            "last2_mae": None,
            "last2_psnr": None,
            "last2_ssim": None,
            "per_frame": [],
        }
    per = []
    for i, (a, b) in enumerate(zip(cli_frames, native_frames)):
        af = a.astype(np.float64)
        bf = b.astype(np.float64)
        diff = np.abs(af - bf)
        mae = float(diff.mean())
        mse = float(np.mean((af - bf) ** 2))
        psnr = 100.0 if mse == 0 else float(20 * math.log10(255.0 / math.sqrt(mse)))
        ssim = ssim_image(a, b)
        per.append(
            {
                "i": i,
                "mae": mae,
                "psnr": psnr,
                "ssim": ssim,
                "max_diff": int(diff.max()) if diff.size else 0,
            }
        )
    last2 = per[-2:]
    return {
        "length_match": True,
        "cli_frames": len(cli_frames),
        "native_frames": len(native_frames),
        "avg_mae": float(sum(x["mae"] for x in per) / len(per)),
        "avg_psnr": float(sum(x["psnr"] for x in per) / len(per)),
        "avg_ssim": float(sum(x["ssim"] for x in per) / len(per)),
        "max_pixel_diff": max(x["max_diff"] for x in per),
        "last2_mae": float(sum(x["mae"] for x in last2) / len(last2)),
        "last2_psnr": float(sum(x["psnr"] for x in last2) / len(last2)),
        "last2_ssim": float(sum(x["ssim"] for x in last2) / len(last2)),
        "last2_detail": last2,
        "per_frame": per,
    }


def mean_std(vals: list[float]) -> dict[str, Optional[float]]:
    clean = [v for v in vals if v is not None and math.isfinite(v)]
    if not clean:
        return {"mean": None, "stdev": None, "n": 0}
    return {
        "mean": float(statistics.mean(clean)),
        "stdev": float(statistics.stdev(clean)) if len(clean) > 1 else 0.0,
        "n": len(clean),
    }


def run_series(backend: str, model: str) -> dict:
    print("\n" + "=" * 70)
    print(f"C7.2 SERIES: backend_mode={backend} × {RUNS}")
    print("=" * 70)
    base = os.path.join(RESULTS_DIR, f"series_{backend}")
    shutil.rmtree(base, ignore_errors=True)
    os.makedirs(base)

    runs = []
    crashes = 0
    for i in range(1, RUNS + 1):
        print(f"  [{backend.upper()}] Run {i}/{RUNS}...", end=" ", flush=True)
        run_dir = os.path.join(base, f"run_{i:02d}")
        shutil.rmtree(run_dir, ignore_errors=True)
        c54._restore_native()
        vram_before = query_peak_vram_mb()
        try:
            harness = c54.VideoWorkerHarness(
                video_path=TEST_VIDEO,
                output_dir=run_dir,
                backend_mode=backend,
                target_fps=INTERP_FPS,
                model=model,
                gpu=GPU,
                thread_config=THREAD_CONFIG,
                inject_native_failure=False,
            )
            result = harness.run()
            metrics = parse_pipeline_metrics(result.get("logs_text", ""))
            vram_after = query_peak_vram_mb()
            decoded = []
            if result.get("output_video") and os.path.isfile(result["output_video"]):
                decoded = c71.decode_pngs(
                    result["output_video"], os.path.join(run_dir, "decoded")
                )
            probe = (
                c71.probe_video(result["output_video"])
                if result.get("output_video") and os.path.isfile(result["output_video"])
                else {}
            )
            fps = c71.parse_fps(probe.get("fps", "0/1"))
            dups = c71.check_duplicates(decoded) if decoded else -1
            nan_inf = c71.check_nan_inf(decoded) if decoded else -1
            frame_count = len(decoded) if decoded else int(probe.get("frames") or -1)
            checks = {
                "success": bool(result.get("success")),
                "active_backend": result.get("active_backend") == backend,
                "no_fallback": not result.get("fallback_occurred", False),
                "frames_ok": frame_count == EXPECTED_OUT_FRAMES,
                "fps_ok": abs(fps - INTERP_FPS) < 0.1,
                "res_ok": probe.get("width") == EXPECTED_WIDTH
                and probe.get("height") == EXPECTED_HEIGHT,
                "audio_ok": bool(probe.get("audio_codec")),
                "no_dups": dups == 0,
                "no_nan_inf": nan_inf == 0,
                "no_crash": True,
            }
            passed = all(checks.values())
            row = {
                "run": i,
                "warmup": i == 1,
                "passed": passed,
                "checks": checks,
                "wall_elapsed_s": result.get("wall_elapsed_s"),
                "startup_time_s": metrics.get("startup_time_s"),
                "inference_time_s": metrics.get("inference_time_s"),
                "io_time_s": metrics.get("io_time_s"),
                "gpu_usage_pct": metrics.get("gpu_usage_pct"),
                "vram_used_mb_before": vram_before,
                "vram_used_mb_after": vram_after,
                "frame_count": frame_count,
                "fps": fps,
                "dups": dups,
                "nan_inf": nan_inf,
                "output_video": result.get("output_video"),
                "active_backend": result.get("active_backend"),
            }
            runs.append(row)
            print(
                f"{'OK' if passed else 'FAIL'} "
                f"wall={row['wall_elapsed_s']:.2f}s "
                f"inf={row['inference_time_s']} "
                f"frames={frame_count} dups={dups}"
            )
        except Exception as exc:  # noqa: BLE001
            crashes += 1
            runs.append(
                {
                    "run": i,
                    "warmup": i == 1,
                    "passed": False,
                    "crash": True,
                    "error": str(exc),
                }
            )
            print(f"CRASH: {exc}")
        gc.collect()

    steady = [r for r in runs if not r.get("warmup") and r.get("passed")]
    all_ok = [r for r in runs if r.get("passed")]

    def series_stats(key: str, steady_only: bool = True) -> dict:
        src = steady if steady_only else all_ok
        return mean_std([r.get(key) for r in src if key in r])

    return {
        "backend": backend,
        "passed": crashes == 0 and all(r.get("passed") for r in runs),
        "crashes": crashes,
        "passed_count": sum(1 for r in runs if r.get("passed")),
        "runs": runs,
        "steady_state": {
            "wall_elapsed_s": series_stats("wall_elapsed_s"),
            "startup_time_s": series_stats("startup_time_s"),
            "inference_time_s": series_stats("inference_time_s"),
            "io_time_s": series_stats("io_time_s"),
            "gpu_usage_pct": series_stats("gpu_usage_pct"),
            "note": "excludes run 1 (warmup)",
        },
        "including_warmup": {
            "wall_elapsed_s": series_stats("wall_elapsed_s", steady_only=False),
            "inference_time_s": series_stats("inference_time_s", steady_only=False),
        },
    }


def pick_last_good_output(series: dict) -> str:
    for r in reversed(series.get("runs", [])):
        p = r.get("output_video")
        if p and os.path.isfile(p) and r.get("passed"):
            return p
    return ""


def test_fallback(model: str) -> dict:
    print("\n" + "=" * 70)
    print("C7.2 FALLBACK: inject Native failure → CLI")
    print("=" * 70)
    out_dir = os.path.join(RESULTS_DIR, "fallback")
    shutil.rmtree(out_dir, ignore_errors=True)
    c54._inject_native_failure()
    try:
        harness = c54.VideoWorkerHarness(
            video_path=TEST_VIDEO,
            output_dir=out_dir,
            backend_mode="native",
            target_fps=INTERP_FPS,
            model=model,
            gpu=GPU,
            thread_config=THREAD_CONFIG,
            inject_native_failure=True,
        )
        result = harness.run()
    finally:
        c54._restore_native()

    checks = {
        "task_success": bool(result.get("success")),
        "fallback_occurred": bool(result.get("fallback_occurred")),
        "active_cli": result.get("active_backend") == "cli",
        "requested_native": result.get("requested_backend") == "native"
        or "requested_backend=native" in result.get("logs_text", ""),
        "output_exists": bool(result.get("output_video"))
        and os.path.isfile(result.get("output_video") or ""),
    }
    # requested_backend may be parsed as native from BACKEND CONFIG
    if result.get("requested_backend") == "native":
        checks["requested_native"] = True
    passed = all(checks.values())
    print(f"  Result: {'PASS' if passed else 'FAIL'}")
    for k, v in checks.items():
        print(f"    {k}: {v}")
    return {"passed": passed, "checks": checks, "result": {
        "success": result.get("success"),
        "fallback_occurred": result.get("fallback_occurred"),
        "active_backend": result.get("active_backend"),
        "fallback_reason": result.get("fallback_reason"),
        "wall_elapsed_s": result.get("wall_elapsed_s"),
    }}


def test_default_protected() -> dict:
    from main import VideoWorker

    src = inspect.getsource(VideoWorker.__init__)
    ok = (
        'params.get("backend_mode", "cli")' in src
        or "params.get('backend_mode', 'cli')" in src
    )
    no_native_default = (
        'backend_mode", "native")' not in src
        and "backend_mode', 'native')" not in src
    )
    passed = ok and no_native_default
    print("\nDEFAULT backend_mode protection:", "PASS" if passed else "FAIL")
    return {
        "passed": passed,
        "default": "cli",
        "source_has_cli_default": ok,
        "no_native_default": no_native_default,
    }


def speedup(cli_mean: Optional[float], native_mean: Optional[float]) -> Optional[float]:
    if not cli_mean or not native_mean or native_mean <= 0:
        return None
    return float(cli_mean / native_mean)


def write_report(report: dict) -> None:
    cli = report["cli_series"]
    nat = report["native_series"]
    cmp = report["comparison"]
    fb = report["fallback"]
    dflt = report["default_protection"]
    ss_cli = cli["steady_state"]
    ss_nat = nat["steady_state"]

    lines = [
        "# C7.2 — CLI vs Native Final Production A/B Validation",
        "",
        "Developed by Mr. Gong",
        "Copyright © 2026 Mr. Gong. All Rights Reserved.",
        "",
        "## Constraints",
        "- Validation only — no production logic changes",
        "- Default `backend_mode` remains **cli**",
        "- Same video / model / resolution / GPU / output spec",
        "",
        "## Test input",
        f"- Video: `{TEST_VIDEO}`",
        f"- SHA-256: `{TEST_VIDEO_SHA256}`",
        f"- Target: {EXPECTED_WIDTH}x{EXPECTED_HEIGHT} @ {INTERP_FPS} fps, {EXPECTED_OUT_FRAMES} frames",
        f"- Thread config (both): `{THREAD_CONFIG}`",
        "",
        "## Quality gates (per-run ×10)",
        f"- CLI series: **{'PASS' if cli['passed'] else 'FAIL'}** "
        f"({cli['passed_count']}/{RUNS}, crashes={cli['crashes']})",
        f"- Native series: **{'PASS' if nat['passed'] else 'FAIL'}** "
        f"({nat['passed_count']}/{RUNS}, crashes={nat['crashes']})",
        "",
        "## Steady-state timing (exclude run 1 warmup)",
        "",
        "| Metric | CLI mean±σ | Native mean±σ | CLI/Native |",
        "|---|---|---|---|",
    ]

    def row(label: str, key: str) -> None:
        c = ss_cli.get(key, {})
        n = ss_nat.get(key, {})
        cm, cs = c.get("mean"), c.get("stdev")
        nm, ns = n.get("mean"), n.get("stdev")
        ratio = speedup(cm, nm)
        c_s = f"{cm:.3f}±{cs:.3f}" if cm is not None else "N/A"
        n_s = f"{nm:.3f}±{ns:.3f}" if nm is not None else "N/A"
        r_s = f"{ratio:.3f}x" if ratio is not None else "N/A"
        lines.append(f"| {label} | {c_s} | {n_s} | {r_s} |")

    row("wall_elapsed_s", "wall_elapsed_s")
    row("startup_time_s", "startup_time_s")
    row("inference_time_s (interp/GPU forward)", "inference_time_s")
    row("io_time_s", "io_time_s")
    row("gpu_usage_pct", "gpu_usage_pct")

    lines += [
        "",
        "Peak VRAM: sampled via `nvidia-smi memory.used` before/after each run "
        "(not a true peak watermark; see JSON for per-run values).",
        "",
        "## Frame comparison (last good CLI vs last good Native)",
        f"- avg MAE: {cmp.get('avg_mae')}",
        f"- avg PSNR: {cmp.get('avg_psnr')}",
        f"- avg SSIM: {cmp.get('avg_ssim')}",
        f"- max pixel Δ: {cmp.get('max_pixel_diff')}",
        f"- last-2 MAE/PSNR/SSIM: {cmp.get('last2_mae')} / "
        f"{cmp.get('last2_psnr')} / {cmp.get('last2_ssim')}",
        f"- Native dups / CLI dups (compare decode): "
        f"{report.get('native_dups')} / {report.get('cli_dups')}",
        "",
        "## Fallback",
        f"- **{'PASS' if fb['passed'] else 'FAIL'}** — {fb.get('checks')}",
        "",
        "## Default backend_mode",
        f"- Value: `{dflt.get('default')}`",
        f"- Protected: **{'PASS' if dflt['passed'] else 'FAIL'}**",
        "",
        "## Verdict",
        report["verdict"],
        "",
        f"JSON: `{report['artifacts']['json']}`",
        "",
    ]
    os.makedirs(os.path.dirname(DOCS_REPORT), exist_ok=True)
    with open(DOCS_REPORT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    os.environ["PATH"] = ENGINE_ROOT + os.pathsep + os.environ.get("PATH", "")
    os.chdir(ENGINE_ROOT)
    c54.RESULTS_DIR = RESULTS_DIR
    c71.RESULTS_DIR = RESULTS_DIR

    print("=" * 70)
    print("C7.2 — CLI vs Native Final Production A/B")
    print("=" * 70)

    if not os.path.isfile(TEST_VIDEO):
        print("FATAL: missing test video")
        return 1
    with open(TEST_VIDEO, "rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest().upper()
    if sha != TEST_VIDEO_SHA256:
        print(f"FATAL: sha mismatch {sha}")
        return 1

    shutil.rmtree(RESULTS_DIR, ignore_errors=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)
    model = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")

    default_protection = test_default_protected()
    cli_series = run_series("cli", model)
    native_series = run_series("native", model)

    cli_out = pick_last_good_output(cli_series)
    nat_out = pick_last_good_output(native_series)
    print("\nComparing last good outputs...")
    cli_frames = (
        c71.decode_pngs(cli_out, os.path.join(RESULTS_DIR, "compare_cli"))
        if cli_out
        else []
    )
    nat_frames = (
        c71.decode_pngs(nat_out, os.path.join(RESULTS_DIR, "compare_native"))
        if nat_out
        else []
    )
    comparison = compare_frames(cli_frames, nat_frames)
    cli_dups = c71.check_duplicates(cli_frames) if cli_frames else -1
    native_dups = c71.check_duplicates(nat_frames) if nat_frames else -1
    print(
        f"  MAE={comparison.get('avg_mae')} PSNR={comparison.get('avg_psnr')} "
        f"SSIM={comparison.get('avg_ssim')} last2_mae={comparison.get('last2_mae')}"
    )

    fallback = test_fallback(model)

    # Functional A/B pass criteria (quality + fallback + default).
    quality_ok = (
        cli_series["passed"]
        and native_series["passed"]
        and comparison.get("length_match")
        and cli_dups == 0
        and native_dups == 0
        and comparison.get("avg_mae") is not None
        and comparison.get("last2_mae") is not None
        and comparison["last2_mae"] < 10.0  # end frames must not regress like C7.1
        and fallback["passed"]
        and default_protection["passed"]
    )

    cli_wall = cli_series["steady_state"]["wall_elapsed_s"].get("mean")
    nat_wall = native_series["steady_state"]["wall_elapsed_s"].get("mean")
    cli_inf = cli_series["steady_state"]["inference_time_s"].get("mean")
    nat_inf = native_series["steady_state"]["inference_time_s"].get("mean")
    wall_ratio = speedup(cli_wall, nat_wall)  # >1 means Native faster on wall
    inf_ratio = speedup(cli_inf, nat_inf)

    # Switch recommendation: functional OK is necessary; perf must show clear win.
    # Align with C6.5/C6.6: need meaningful steady-state gain to justify default flip.
    PERF_GATE = 1.15  # Native must be >=15% faster on steady wall or inference
    perf_win = False
    if wall_ratio is not None and wall_ratio >= PERF_GATE:
        perf_win = True
    if inf_ratio is not None and inf_ratio >= PERF_GATE:
        perf_win = True

    if not quality_ok:
        verdict = (
            "NOT READY to switch production default. "
            "Functional A/B or fallback/default protection failed. Keep backend_mode=cli."
        )
        recommend_switch = False
    elif not perf_win:
        verdict = (
            "Functional A/B PASS; default must remain **cli**. "
            f"Steady-state speedup insufficient for default switch "
            f"(wall CLI/Native={wall_ratio}, inference CLI/Native={inf_ratio}, "
            f"gate>={PERF_GATE}). C7.2 does not authorize flipping backend_mode."
        )
        recommend_switch = False
    else:
        verdict = (
            "Functional A/B PASS and steady-state speedup meets gate; "
            "default switch may be considered in a separate explicit change — "
            "NOT applied in this phase. Current default remains cli."
        )
        recommend_switch = True  # "may consider" — still not applied

    report = {
        "phase": "C7.2",
        "quality_ok": quality_ok,
        "recommend_switch_consideration": recommend_switch,
        "default_backend_mode": "cli",
        "default_changed": False,
        "perf_gate": PERF_GATE,
        "wall_cli_over_native": wall_ratio,
        "inference_cli_over_native": inf_ratio,
        "cli_series": cli_series,
        "native_series": native_series,
        "comparison": {k: v for k, v in comparison.items() if k != "per_frame"},
        "comparison_per_frame_path": os.path.join(RESULTS_DIR, "per_frame_metrics.json"),
        "cli_dups": cli_dups,
        "native_dups": native_dups,
        "fallback": fallback,
        "default_protection": default_protection,
        "verdict": verdict,
        "artifacts": {
            "json": os.path.join(RESULTS_DIR, "c72_results.json"),
            "markdown": DOCS_REPORT,
        },
    }

    with open(report["comparison_per_frame_path"], "w", encoding="utf-8") as fh:
        json.dump(comparison.get("per_frame", []), fh, indent=2)
    with open(report["artifacts"]["json"], "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False, default=str)
    write_report(report)

    print("\n" + "=" * 70)
    print("C7.2 SUMMARY")
    print("=" * 70)
    print(f"  CLI series: {'PASS' if cli_series['passed'] else 'FAIL'}")
    print(f"  Native series: {'PASS' if native_series['passed'] else 'FAIL'}")
    print(f"  Fallback: {'PASS' if fallback['passed'] else 'FAIL'}")
    print(f"  Default protected (cli): {'PASS' if default_protection['passed'] else 'FAIL'}")
    print(f"  Quality OK: {quality_ok}")
    print(f"  Steady wall CLI/Native: {wall_ratio}")
    print(f"  Steady inference CLI/Native: {inf_ratio}")
    print(f"  Default changed: False (still cli)")
    print(f"  Verdict: {verdict}")
    print(f"  Report: {DOCS_REPORT}")
    return 0 if quality_ok and default_protection["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
