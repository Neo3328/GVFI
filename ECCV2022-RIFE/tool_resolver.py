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
import sys

from svfi_pipeline import discover_rife_models

RIFE_NCNN_DIRNAME = "rife-ncnn-vulkan-20221029-windows"
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
    rife_model = None
    if rife_models:
        rife_model = rife_models[0]
    elif rife_dir:
        for name in RIFE_MODEL_CANDIDATES:
            candidate = os.path.join(rife_dir, name)
            if os.path.isdir(candidate):
                rife_model = candidate
                break

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
