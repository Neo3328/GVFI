# -*- coding: utf-8 -*-
"""
GVFI — Runtime tool resolver (ffmpeg / rife / realesrgan).
Developed by Mr. Gong
Copyright © 2026 Mr. Gong. All Rights Reserved.

Extracted from main.py so headless API can resolve tools without UI coupling.
Does not alter VideoWorker / svfi_pipeline contracts.
"""

from __future__ import annotations

import os
import subprocess
import sys

from svfi_pipeline import discover_rife_models

RIFE_NCNN_DIRNAME = "rife-ncnn-vulkan-20221029-windows"
# General-purpose default — do not silently default all jobs to rife-anime.
DEFAULT_RIFE_MODEL_NAME = "rife-v4.6"
RIFE_MODEL_CANDIDATES = (
    "rife-v4.6",
    "rife-v4",
    "rife-anime",
    "rife-v3.1",
    "rife-v3.0",
    "rife-UHD",
    "rife-HD",
    "rife-v2.4",
    "rife-v2.3",
    "rife-v2",
    "rife",
)
ESRGAN_MODEL_DEFAULT = "realesr-animevideov3"

# rife-ncnn-vulkan -j load:proc:save (safe default for ~1080p)
RIFE_THREAD_CONFIG_DEFAULT = "2:4:4"
# Conservative profile for 2160p+ to limit VRAM pressure
RIFE_THREAD_CONFIG_UHD = "1:2:2"

# UI srModel id → realesrgan-ncnn-vulkan -n name (one canonical UI name: srModel)
SR_MODEL_TO_NCNN = {
    "realesrgan": "realesr-animevideov3",
    "realcugan": "realesrgan-x4plus-anime",
    "swinir": "realesrnet-x4plus",
}


def resolve_sr_model_name(sr_model: str) -> str:
    """Map JobSettings.srModel to Real-ESRGAN ncnn model name (-n)."""
    key = str(sr_model or "realesrgan").strip().lower()
    if key in ("", "none", "off"):
        return ESRGAN_MODEL_DEFAULT
    return SR_MODEL_TO_NCNN.get(key, key)


# HEVC hardware encoder priority: NVIDIA → Intel → AMD → CPU fallback.
HEVC_HW_ENCODER_PRIORITY = ("hevc_nvenc", "hevc_qsv", "hevc_amf")
ENCODER_MODES = ("auto", "hardware", "software")

# Cache functional-probe results per ffmpeg path (probing spawns processes).
_hw_encoder_cache: dict = {}
_CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def _probe_encoder_works(ffmpeg: str, encoder: str) -> bool:
    """Actually encode a few frames — '-encoders' listing alone can lie on machines without that GPU."""
    try:
        proc = subprocess.run(
            [
                ffmpeg, "-hide_banner", "-v", "error",
                "-f", "lavfi", "-i", "color=black:s=256x256:d=0.2:r=24",
                "-frames:v", "3", "-c:v", encoder, "-f", "null", "-",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            creationflags=_CREATE_NO_WINDOW if os.name == "nt" else 0,
            timeout=20,
            check=False,
        )
        return proc.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def detect_hevc_hw_encoder(ffmpeg: str):
    """Return (encoder_name or None, reason) for the best working HEVC HW encoder."""
    if not ffmpeg:
        return None, "no_ffmpeg"
    cached = _hw_encoder_cache.get(ffmpeg)
    if cached is not None:
        return cached
    result = (None, "no_supported_gpu")
    for encoder in HEVC_HW_ENCODER_PRIORITY:
        if _probe_encoder_works(ffmpeg, encoder):
            result = (encoder, "hw_probe_ok")
            break
    _hw_encoder_cache[ffmpeg] = result
    return result


def select_hevc_encoder(ffmpeg: str, encoder_mode: str = "auto"):
    """
    Resolve final HEVC encoder by mode:
      auto     — hardware if a probe succeeds, else libx265
      hardware — hardware if available, else libx265 (with reason)
      software — always libx265
    Returns (encoder, reason).
    """
    mode = str(encoder_mode or "auto").strip().lower()
    if mode not in ENCODER_MODES:
        mode = "auto"
    if mode == "software":
        return "libx265", "software_mode"
    hw, reason = detect_hevc_hw_encoder(ffmpeg)
    if hw:
        return hw, "hw_probe_ok" if mode == "auto" else "hardware_mode"
    return "libx265", reason


def hevc_encoder_quality_args(encoder: str, crf: int, encode_preset: str, ten_bit: bool):
    """
    Map the single canonical quality value (CRF scale) onto each encoder.
      libx265    → -crf
      hevc_nvenc → -rc vbr -cq (same 0-51 scale)
      hevc_qsv   → -global_quality (ICQ)
      hevc_amf   → -rc cqp -qp_i/-qp_p
    """
    crf = max(0, min(51, int(crf)))
    if encoder == "hevc_nvenc":
        args = [
            "-c:v", "hevc_nvenc",
            "-rc", "vbr", "-cq", str(crf), "-b:v", "0",
            "-preset", "p5", "-tune", "hq",
        ]
        args.extend(["-pix_fmt", "p010le" if ten_bit else "yuv420p"])
        return args
    if encoder == "hevc_qsv":
        args = ["-c:v", "hevc_qsv", "-global_quality", str(crf), "-preset", "medium"]
        args.extend(["-pix_fmt", "p010le" if ten_bit else "yuv420p"])
        return args
    if encoder == "hevc_amf":
        args = [
            "-c:v", "hevc_amf",
            "-rc", "cqp", "-qp_i", str(crf), "-qp_p", str(crf),
            "-quality", "balanced",
        ]
        args.extend(["-pix_fmt", "p010le" if ten_bit else "yuv420p"])
        return args
    # CPU fallback — unchanged from the original pipeline.
    args = [
        "-c:v", "libx265",
        "-crf", str(crf),
        "-preset", encode_preset,
        "-x265-params", "log-level=error",
    ]
    args.extend(["-pix_fmt", "yuv420p10le" if ten_bit else "yuv420p"])
    return args


def normalize_rife_thread_config(value) -> str:
    """Validate ncnn-style -j load:proc:save (or multi-gpu load:p1,p2:save)."""
    text = str(value or "").strip()
    if not text:
        return ""
    parts = text.split(":")
    if len(parts) != 3:
        return ""
    for part in parts:
        for token in part.split(","):
            token = token.strip()
            if not token.isdigit() or int(token) < 1:
                return ""
    return text


def _thread_config_weight(config: str) -> int:
    """Rough concurrency weight for comparing profiles."""
    total = 0
    for part in config.split(":"):
        for token in part.split(","):
            total += int(token)
    return total


def resolve_rife_thread_config(configured=None, width=0, height=0) -> str:
    """
    Pick rife-ncnn-vulkan -j value.

    - Prefer explicit rife_thread_config when valid.
    - Default to 2:4:4 for typical HD work.
    - Auto-lower to 1:2:2 when source is 2160p+ (VRAM safety).
    """
    base = normalize_rife_thread_config(configured) or RIFE_THREAD_CONFIG_DEFAULT
    try:
        w = int(width or 0)
        h = int(height or 0)
    except (TypeError, ValueError):
        w, h = 0, 0
    is_uhd = h >= 2160 or w >= 3840 or max(w, h) >= 2160
    if is_uhd:
        uhd = RIFE_THREAD_CONFIG_UHD
        if _thread_config_weight(base) > _thread_config_weight(uhd):
            return uhd
    return base


def pick_default_rife_model(rife_models):
    """
    Choose a safe general-purpose default model path.
    Prefers rife-v4.6; never silently prefers rife-anime when alternatives exist.
    """
    if not rife_models:
        return None
    by_name = {os.path.basename(p.rstrip("\\/")): p for p in rife_models}
    if DEFAULT_RIFE_MODEL_NAME in by_name:
        return by_name[DEFAULT_RIFE_MODEL_NAME]
    for name in RIFE_MODEL_CANDIDATES:
        if name == "rife-anime":
            continue
        if name in by_name:
            return by_name[name]
    for path in rife_models:
        if os.path.basename(path.rstrip("\\/")) != "rife-anime":
            return path
    return rife_models[0]


def get_app_base_dir():
    """获取程序根目录（兼容源码运行与 PyInstaller onedir/onefile）。"""
    if getattr(sys, "frozen", False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def _candidate_roots(base_dir=None):
    """按优先级返回可能存放依赖的根目录列表（含 AI_Tools）。"""
    roots = []
    base = base_dir or get_app_base_dir()
    parent = os.path.dirname(base)
    for path in (
        base,
        os.path.join(base, "_internal"),
        parent,
        os.path.join(parent, "AI_Tools"),
        os.path.join(parent, "AI_Tools", "FFmpeg"),
        os.path.join(parent, "AI_Tools", "RIFE_ncnn"),
        os.path.join(parent, "AI_Tools", RIFE_NCNN_DIRNAME),
        os.path.join(parent, "AI_Tools", "RealCUGAN_ncnn"),
        getattr(sys, "_MEIPASS", None),
    ):
        if path and os.path.isdir(path) and path not in roots:
            roots.append(path)
    return roots


def find_file(*relative_parts, base_dir=None):
    """在多个候选根目录中查找文件，找到则返回绝对路径。"""
    rel = os.path.join(*relative_parts)
    for root in _candidate_roots(base_dir):
        full = os.path.join(root, rel)
        if os.path.isfile(full):
            return os.path.abspath(full)
    return None


def find_dir(*relative_parts, base_dir=None):
    """在多个候选根目录中查找目录。"""
    rel = os.path.join(*relative_parts)
    for root in _candidate_roots(base_dir):
        full = os.path.join(root, rel)
        if os.path.isdir(full):
            return os.path.abspath(full)
    return None


def resolve_runtime_tools(base_dir=None):
    """
    解析 ffmpeg / rife-ncnn-vulkan / realesrgan-ncnn-vulkan 及模型路径。
    返回 dict，缺失项为 None。
    """
    base = base_dir or get_app_base_dir()

    ffmpeg = find_file("ffmpeg.exe", base_dir=base)
    ffprobe = find_file("ffprobe.exe", base_dir=base)

    rife_exe = find_file(RIFE_NCNN_DIRNAME, "rife-ncnn-vulkan.exe", base_dir=base)
    if not rife_exe:
        rife_exe = find_file("rife-ncnn-vulkan.exe", base_dir=base)
    rife_dir = (
        os.path.dirname(rife_exe) if rife_exe else find_dir(RIFE_NCNN_DIRNAME, base_dir=base)
    )

    rife_models = discover_rife_models(rife_dir)
    rife_model = pick_default_rife_model(rife_models)
    if not rife_model and rife_dir:
        for name in RIFE_MODEL_CANDIDATES:
            if name == "rife-anime":
                continue
            candidate = os.path.join(rife_dir, name)
            if os.path.isdir(candidate):
                rife_model = candidate
                break
        if not rife_model:
            anime = os.path.join(rife_dir, "rife-anime")
            if os.path.isdir(anime):
                rife_model = anime

    esgan_exe = find_file("realesrgan-ncnn-vulkan.exe", base_dir=base)
    if not esgan_exe:
        esgan_exe = find_file("realesrgan", "realesrgan-ncnn-vulkan.exe", base_dir=base)

    models_dir = find_dir("models", base_dir=base)
    if not models_dir:
        models_dir = find_dir("realesrgan", "models", base_dir=base)

    return {
        "base_dir": base,
        "ffmpeg": ffmpeg,
        "ffprobe": ffprobe,
        "rife_exe": rife_exe,
        "rife_dir": rife_dir,
        "rife_model": rife_model,
        "rife_models": rife_models,
        "esgan_exe": esgan_exe,
        "models_dir": models_dir,
    }
