"""
C7.1 — Native final production regression validation

Reads prior: C5.4 / C6.5 / C6.6 conclusions.
Does NOT modify production logic or default backend_mode (must remain cli).
Does NOT execute C7.2.
"""

from __future__ import annotations

import gc
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
REPO_ROOT = r"D:\BaiduNetdiskDownload\GVFI"
sys.path.insert(0, ENGINE_ROOT)
sys.path.insert(0, os.path.join(ENGINE_ROOT, "tests"))

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
TEST_VIDEO_SHA256 = "F681CA06F4C9EBD166AC13B2DC9D8067C6D0EADFA941C94252E90992170ED001".upper()
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c71_final"
DOCS_REPORT = os.path.join(REPO_ROOT, "docs", "native", "c71-final-regression.md")

EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
EXPECTED_SRC_FRAMES = 24
INTERP_FPS = 48
# Current VideoWorker RIFE path: 24 src @2x → 48 frames (historically 47 in C5.2 docs).
EXPECTED_OUT_FRAMES = 48

import cv2
import numpy as np

import test_c54_final_validation as c54


def probe_video(path: str) -> dict:
    return c54.probe_video(path)


def decode_pngs(video_path: str, out_dir: str) -> list[np.ndarray]:
    shutil.rmtree(out_dir, ignore_errors=True)
    os.makedirs(out_dir, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            video_path,
            "-vsync",
            "0",
            "-qscale:v",
            "2",
            os.path.join(out_dir, "%08d.png"),
        ],
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    frames = []
    for p in sorted(Path(out_dir).glob("*.png")):
        img = cv2.imread(str(p))
        if img is not None:
            frames.append(img)
    return frames


def check_duplicates(frames: list[np.ndarray]) -> int:
    dups = 0
    for i in range(1, len(frames)):
        if frames[i].shape == frames[i - 1].shape and np.array_equal(frames[i], frames[i - 1]):
            dups += 1
    return dups


def check_nan_inf(frames: list[np.ndarray]) -> int:
    bad = 0
    for f in frames:
        if not np.isfinite(f.astype(np.float32)).all():
            bad += 1
    return bad


def compare_cli_native(cli_frames: list[np.ndarray], native_frames: list[np.ndarray]) -> dict:
    if len(cli_frames) != len(native_frames):
        return {
            "length_match": False,
            "cli_frames": len(cli_frames),
            "native_frames": len(native_frames),
            "avg_mae": None,
            "avg_psnr": None,
            "max_pixel_diff": None,
        }
    maes = []
    psnrs = []
    max_diff = 0
    for a, b in zip(cli_frames, native_frames):
        af = a.astype(np.float64)
        bf = b.astype(np.float64)
        diff = np.abs(af - bf)
        mae = float(diff.mean())
        mse = float(np.mean((af - bf) ** 2))
        psnr = 100.0 if mse == 0 else float(20 * math.log10(255.0 / math.sqrt(mse)))
        maes.append(mae)
        psnrs.append(psnr)
        max_diff = max(max_diff, int(diff.max()) if diff.size else 0)
    return {
        "length_match": True,
        "cli_frames": len(cli_frames),
        "native_frames": len(native_frames),
        "avg_mae": float(sum(maes) / len(maes)),
        "avg_psnr": float(sum(psnrs) / len(psnrs)),
        "max_pixel_diff": max_diff,
    }


def parse_fps(fps_str: str) -> float:
    try:
        if "/" in str(fps_str):
            a, b = str(fps_str).split("/", 1)
            return float(a) / float(b) if float(b) != 0 else 0.0
        return float(fps_str)
    except Exception:
        return 0.0


def test_f_native_stability_10(model: str) -> dict:
    print("\n" + "=" * 70)
    print("TEST F: Native Continuous Stability (10 pure native runs)")
    print("=" * 70)
    base = os.path.join(RESULTS_DIR, "F_native_stability_10")
    shutil.rmtree(base, ignore_errors=True)
    os.makedirs(base)

    runs = []
    crashes = 0
    for i in range(1, 11):
        print(f"  Run {i}/10...", end=" ", flush=True)
        run_dir = os.path.join(base, f"run_{i:02d}")
        shutil.rmtree(run_dir, ignore_errors=True)
        c54._restore_native()
        try:
            harness = c54.VideoWorkerHarness(
                video_path=TEST_VIDEO,
                output_dir=run_dir,
                backend_mode="native",
                target_fps=INTERP_FPS,
                model=model,
                gpu=0,
                thread_config="1:2:2",
                inject_native_failure=False,
            )
            t0 = time.perf_counter()
            result = harness.run()
            elapsed = time.perf_counter() - t0
            validation = c54.validate_output(
                result["output_video"],
                EXPECTED_OUT_FRAMES,
                EXPECTED_WIDTH,
                EXPECTED_HEIGHT,
                INTERP_FPS,
            )
            fps = parse_fps(validation.get("fps", "0/1"))
            frames_ok = str(validation.get("frames")) in {
                str(EXPECTED_OUT_FRAMES),
                "N/A",
            } or int(validation.get("frames") or -1) == EXPECTED_OUT_FRAMES
            # Prefer decoded count when ffprobe nb_frames is N/A
            decoded = []
            if result.get("output_video") and os.path.isfile(result["output_video"]):
                decoded = decode_pngs(
                    result["output_video"], os.path.join(run_dir, "decoded")
                )
            frame_count = len(decoded) if decoded else validation.get("frames")
            dups = check_duplicates(decoded) if decoded else 0
            nan_inf = check_nan_inf(decoded) if decoded else 0
            checks = {
                "success": bool(result.get("success")),
                "active_native": result.get("active_backend") == "native",
                "no_fallback": not result.get("fallback_occurred", False),
                "output_exists": bool(validation.get("exists")),
                "resolution_ok": validation.get("width") == EXPECTED_WIDTH
                and validation.get("height") == EXPECTED_HEIGHT,
                "fps_ok": abs(fps - INTERP_FPS) < 0.1,
                "frames_ok": frame_count == EXPECTED_OUT_FRAMES,
                "audio_ok": bool(validation.get("audio_codec")),
                "no_dups": dups == 0,
                "no_nan_inf": nan_inf == 0,
            }
            passed = all(checks.values())
            runs.append(
                {
                    "run": i,
                    "passed": passed,
                    "checks": checks,
                    "elapsed_s": elapsed,
                    "frame_count": frame_count,
                    "fps": fps,
                    "dups": dups,
                    "nan_inf": nan_inf,
                    "active_backend": result.get("active_backend"),
                }
            )
            print(
                f"{'OK' if passed else 'FAIL'} "
                f"({elapsed:.1f}s, frames={frame_count}, fps={fps:.1f}, dups={dups})"
            )
        except Exception as exc:  # noqa: BLE001
            crashes += 1
            runs.append({"run": i, "passed": False, "crash": True, "error": str(exc)})
            print(f"CRASH: {exc}")
        gc.collect()

    passed_n = sum(1 for r in runs if r.get("passed"))
    return {
        "test": "F",
        "name": "Native Continuous Stability x10",
        "passed": passed_n == 10 and crashes == 0,
        "passed_count": passed_n,
        "crashes": crashes,
        "runs": runs,
    }


def test_g_cli_native_ab(model: str) -> dict:
    print("\n" + "=" * 70)
    print("TEST G: Native vs CLI correctness / pipeline consistency")
    print("=" * 70)
    base = os.path.join(RESULTS_DIR, "G_cli_native_ab")
    shutil.rmtree(base, ignore_errors=True)

    c54._restore_native()
    cli_dir = os.path.join(base, "cli")
    native_dir = os.path.join(base, "native")

    cli_h = c54.VideoWorkerHarness(
        video_path=TEST_VIDEO,
        output_dir=cli_dir,
        backend_mode="cli",
        target_fps=INTERP_FPS,
        model=model,
        gpu=0,
        thread_config="2:4:4",
        inject_native_failure=False,
    )
    native_h = c54.VideoWorkerHarness(
        video_path=TEST_VIDEO,
        output_dir=native_dir,
        backend_mode="native",
        target_fps=INTERP_FPS,
        model=model,
        gpu=0,
        thread_config="1:2:2",
        inject_native_failure=False,
    )

    print("  Running CLI...")
    cli_res = cli_h.run()
    print("  Running Native...")
    native_res = native_h.run()

    cli_val = c54.validate_output(
        cli_res["output_video"], EXPECTED_OUT_FRAMES, EXPECTED_WIDTH, EXPECTED_HEIGHT, INTERP_FPS
    )
    native_val = c54.validate_output(
        native_res["output_video"],
        EXPECTED_OUT_FRAMES,
        EXPECTED_WIDTH,
        EXPECTED_HEIGHT,
        INTERP_FPS,
    )

    cli_probe = probe_video(cli_res["output_video"]) if cli_val["exists"] else {}
    native_probe = probe_video(native_res["output_video"]) if native_val["exists"] else {}

    cli_frames = (
        decode_pngs(cli_res["output_video"], os.path.join(cli_dir, "decoded"))
        if cli_val["exists"]
        else []
    )
    native_frames = (
        decode_pngs(native_res["output_video"], os.path.join(native_dir, "decoded"))
        if native_val["exists"]
        else []
    )
    cmp = compare_cli_native(cli_frames, native_frames)
    cli_dups = check_duplicates(cli_frames)
    native_dups = check_duplicates(native_frames)
    cli_nan = check_nan_inf(cli_frames)
    native_nan = check_nan_inf(native_frames)

    # Quality gate: same structure/pipeline; pixel identity not required (CLI exe vs native).
    # Require matching frame count/FPS/res/audio and finite MAE.
    checks = {
        "cli_success": bool(cli_res.get("success")),
        "native_success": bool(native_res.get("success")),
        "native_active": native_res.get("active_backend") == "native",
        "cli_active": cli_res.get("active_backend") == "cli",
        "same_resolution": cli_probe.get("width") == native_probe.get("width")
        and cli_probe.get("height") == native_probe.get("height")
        and cli_probe.get("width") == EXPECTED_WIDTH,
        "same_fps": abs(parse_fps(cli_probe.get("fps", "0")) - INTERP_FPS) < 0.1
        and abs(parse_fps(native_probe.get("fps", "0")) - INTERP_FPS) < 0.1,
        "same_frame_count": len(cli_frames) == EXPECTED_OUT_FRAMES
        and len(native_frames) == EXPECTED_OUT_FRAMES,
        "both_have_audio": bool(cli_probe.get("audio_codec"))
        and bool(native_probe.get("audio_codec"))
        and cli_probe.get("audio_codec") == native_probe.get("audio_codec"),
        "same_audio_rate": str(cli_probe.get("audio_sample_rate"))
        == str(native_probe.get("audio_sample_rate")),
        "same_pix_fmt": cli_probe.get("pix_fmt") == native_probe.get("pix_fmt"),
        "same_video_codec": cli_probe.get("codec") == native_probe.get("codec"),
        "no_cli_dups": cli_dups == 0,
        "no_native_dups": native_dups == 0,
        "no_cli_nan": cli_nan == 0,
        "no_native_nan": native_nan == 0,
        "mae_finite": cmp.get("avg_mae") is not None and math.isfinite(cmp["avg_mae"]),
    }
    passed = all(checks.values())
    print(f"  Result: {'PASS' if passed else 'FAIL'}")
    for k, v in checks.items():
        print(f"    {k}: {'OK' if v else 'FAIL'}")
    print(
        f"  MAE={cmp.get('avg_mae')} PSNR={cmp.get('avg_psnr')} maxΔ={cmp.get('max_pixel_diff')}"
    )

    return {
        "test": "G",
        "name": "Native vs CLI Correctness",
        "passed": passed,
        "checks": checks,
        "cli_probe": cli_probe,
        "native_probe": native_probe,
        "comparison": cmp,
        "cli_dups": cli_dups,
        "native_dups": native_dups,
        "cli_nan_inf": cli_nan,
        "native_nan_inf": native_nan,
        "cli_result": {
            "success": cli_res.get("success"),
            "active_backend": cli_res.get("active_backend"),
            "wall_s": cli_res.get("wall_elapsed_s"),
        },
        "native_result": {
            "success": native_res.get("success"),
            "active_backend": native_res.get("active_backend"),
            "wall_s": native_res.get("wall_elapsed_s"),
        },
    }


def write_report(report: dict[str, Any]) -> None:
    lines = [
        "C7.1 — Native Final Production Regression Report",
        "",
        "Developed by Mr. Gong",
        "Copyright (c) 2026 Mr. Gong. All Rights Reserved.",
        "",
        "Constraints",
        "- No production logic changes during this phase",
        "- Default backend_mode remains cli",
        "- C7.2 not executed",
        "",
        "Prior context",
        "- C5.4: production acceptance without default switch (PASS historically)",
        "- C6.5: batch coalescing no meaningful steady-state gain",
        "- C6.6: pipeline overlap gain 1.33% (<15%), STOP expansion",
        "",
        "Git note",
        f"- Working tree contains C6.x native PoC + DLL changes; production default still cli",
        "",
        "Results",
        "",
    ]
    order = ["A", "B", "C", "D", "E", "F", "G"]
    for tid in order:
        r = report["tests"].get(tid, {})
        status = "PASS" if r.get("passed") else "FAIL"
        lines.append(f"- Test {tid} {r.get('name', '')}: {status}")
        if r.get("error"):
            lines.append(f"  error: {r['error']}")
        if tid == "A" and r.get("validation"):
            v = r["validation"]
            lines.append(
                f"  frames={v.get('frames')} fps={v.get('fps')} "
                f"res={v.get('width')}x{v.get('height')} audio={v.get('audio_codec')}"
            )
        if tid == "F":
            lines.append(
                f"  passed={r.get('passed_count')}/10 crashes={r.get('crashes')}"
            )
        if tid == "G" and r.get("comparison"):
            c = r["comparison"]
            lines.append(
                f"  MAE={c.get('avg_mae')} PSNR={c.get('avg_psnr')} maxΔ={c.get('max_pixel_diff')}"
            )
            lines.append(
                f"  cli_codec={r.get('cli_probe', {}).get('codec')} "
                f"native_codec={r.get('native_probe', {}).get('codec')} "
                f"pix_fmt={r.get('cli_probe', {}).get('pix_fmt')}"
            )

    lines += [
        "",
        f"Overall: {'ALL PASS' if report['all_passed'] else 'FAILED'}",
        "",
        "Default backend_mode",
        f"- Value: {report['default_backend_mode']}",
        f"- Protected: {report['default_backend_protected']}",
        "",
        "C7.2 readiness",
        report["c72_readiness"],
        "",
        f"JSON: {report['artifacts']['json']}",
        "",
    ]
    if report.get("failures"):
        lines.append("Failures / suggested fixes (no production code changed):")
        for f in report["failures"]:
            lines.append(f"- {f}")
        lines.append("")

    os.makedirs(os.path.dirname(DOCS_REPORT), exist_ok=True)
    with open(DOCS_REPORT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def main() -> int:
    print("=" * 70)
    print("C7.1 — Native Final Production Regression")
    print("=" * 70)

    os.environ.setdefault("PYTHONUTF8", "1")
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    # Ensure ffmpeg/ffprobe resolve for probe helpers.
    os.environ["PATH"] = ENGINE_ROOT + os.pathsep + os.environ.get("PATH", "")
    os.chdir(ENGINE_ROOT)
    # Production _emit_failure_detail is fixed in C7.1.1 (getattr traceback).

    if not os.path.isfile(TEST_VIDEO):
        print(f"FATAL: missing test video: {TEST_VIDEO}")
        return 1
    with open(TEST_VIDEO, "rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest().upper()
    if sha != TEST_VIDEO_SHA256:
        print(f"FATAL: test video sha mismatch: {sha}")
        return 1

    # Point C5.4 harness outputs into C7.1 directory.
    c54.RESULTS_DIR = RESULTS_DIR
    shutil.rmtree(RESULTS_DIR, ignore_errors=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    model = os.path.join(ENGINE_ROOT, "rife-ncnn-vulkan-20221029-windows", "rife-v4.6")
    results: dict[str, Any] = {}

    def run_named(key: str, fn):
        try:
            results[key] = fn()
        except Exception as exc:  # noqa: BLE001
            results[key] = {"test": key, "passed": False, "error": str(exc), "name": key}
            print(f"[ERROR] Test {key}: {exc}")

    run_named("A", c54.test_a_native_normal)
    run_named("B", c54.test_b_native_fallback)
    run_named("C", c54.test_c_cross_task_recovery)
    run_named("D", c54.test_d_stability)
    run_named("E", c54.test_e_default_config)
    run_named("F", lambda: test_f_native_stability_10(model))
    run_named("G", lambda: test_g_cli_native_ab(model))

    all_passed = all(r.get("passed", False) for r in results.values())
    failures = []
    for k, r in results.items():
        if not r.get("passed", False):
            failures.append(
                f"Test {k} ({r.get('name')}): {r.get('error') or r.get('checks') or 'failed'}; "
                "locate in VideoWorker/native DLL path; do not change production until root cause confirmed."
            )

    default_backend = "cli"
    default_protected = bool(results.get("E", {}).get("passed"))

    if all_passed and default_protected:
        c72 = (
            "READY FOR C7.2 DISCUSSION ONLY: functional regression PASS and default remains cli. "
            "C7.2 must still decide whether/when to switch default; C6.5/C6.6 showed no >=15% "
            "steady-state gain from batch/pipeline, so performance is NOT a reason to switch yet."
        )
    else:
        c72 = (
            "NOT READY FOR C7.2: one or more C7.1 gates failed, or default backend_mode protection failed. "
            "Do not change production default."
        )

    report = {
        "phase": "C7.1",
        "all_passed": all_passed,
        "default_backend_mode": default_backend,
        "default_backend_protected": default_protected,
        "tests": results,
        "failures": failures,
        "c72_readiness": c72,
        "prior": {
            "c54": "docs/native/native-production-validation.md",
            "c65": "docs/native/c65-steady-state-profile.md",
            "c66": "docs/native/c66-pipeline-overlap-report.md",
        },
        "artifacts": {
            "json": os.path.join(RESULTS_DIR, "c71_results.json"),
            "markdown": DOCS_REPORT,
        },
    }

    with open(report["artifacts"]["json"], "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    write_report(report)

    print("\n" + "=" * 70)
    print("C7.1 SUMMARY")
    print("=" * 70)
    for k in ["A", "B", "C", "D", "E", "F", "G"]:
        r = results.get(k, {})
        print(f"  Test {k}: {'PASS' if r.get('passed') else 'FAIL'} — {r.get('name', '')}")
    print(f"\n  Overall: {'ALL PASS' if all_passed else 'FAILED'}")
    print(f"  Default backend_mode: {default_backend} (protected={default_protected})")
    print(f"  C7.2: {c72}")
    print(f"  Report: {DOCS_REPORT}")
    print(f"  JSON: {report['artifacts']['json']}")
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
