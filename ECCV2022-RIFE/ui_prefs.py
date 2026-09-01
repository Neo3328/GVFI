# -*- coding: utf-8 -*-
"""Persist UI preferences and user workflow presets."""

from __future__ import annotations

import json
import os
from copy import deepcopy
from typing import Any, Dict, List, Optional


def _user_data_dir() -> str:
    # Late import-safe path helper duplicated lightly to avoid circular imports.
    import sys

    if getattr(sys, "frozen", False):
        base = os.path.dirname(os.path.abspath(sys.executable))
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base, "user_data")
    os.makedirs(path, exist_ok=True)
    return path


SETTINGS_FILE = "settings.json"
PRESETS_FILE = "presets.json"

DEFAULT_SETTINGS = {
    "font_family": "Microsoft YaHei UI",
    "font_size": 13,
    "theme": "liquid",
    "background_path": "",
    # General-purpose default preset (rife-v4.6). Anime presets remain explicit options.
    "last_preset": "电影ProRes",
    # 玻璃面板不透明度 10~90，数值越大底板越实
    "glass_opacity": 32,
}

BUILTIN_PRESETS: Dict[str, Dict[str, Any]] = {
    "动漫补帧": {
        "fps": "120 fps",
        "scale": "2x 高清",
        "codec": "H.265 (HEVC)",
        "crf": "CRF 18 (推荐)",
        "model": "rife-anime",
        "enable_dedup": True,
        "enable_scdet": True,
        "keep_audio": True,
        "dedup_threshold": 1.5,
        "scdet_threshold": 12.0,
        "same_dir": False,
        "clean_cache": True,
    },
    "电影ProRes": {
        "fps": "60 fps",
        "scale": "原始",
        "codec": "ProRes 422",
        "crf": "CRF 18 (推荐)",
        "model": "rife-v4.6",
        "enable_dedup": False,
        "enable_scdet": True,
        "keep_audio": True,
        "dedup_threshold": 1.5,
        "scdet_threshold": 14.0,
        "same_dir": False,
        "clean_cache": True,
    },
    "SVFI风格": {
        "fps": "120 fps",
        "scale": "2x 高清",
        "codec": "H.265 10bit",
        "crf": "CRF 16",
        "model": "rife-anime",
        "enable_dedup": True,
        "enable_scdet": True,
        "keep_audio": True,
        "dedup_threshold": 1.5,
        "scdet_threshold": 12.0,
        "same_dir": False,
        "clean_cache": True,
    },
}

THEMES = {
    "liquid": {
        "label": "液态玻璃",
        "accent": "#4E70FF",
        "accent2": "#1E97FF",
        "accent3": "#9759FF",
        "panel": "rgba(255,255,255,38)",
        "panel2": "rgba(120,150,255,16)",
        "glass_rgb": (248, 250, 255),
        "glass_rgb2": (140, 170, 255),
        "text": "rgba(247,249,255,235)",
        "muted": "rgba(230,237,250,205)",
        "danger": "#FF647C",
        "spot": None,  # use generated liquid bg
    },
    "midnight": {
        "label": "午夜蓝",
        "accent": "#3D8BFF",
        "accent2": "#1B2A4A",
        "accent3": "#6EA8FF",
        "panel": "rgba(20,28,48,72)",
        "panel2": "rgba(30,45,80,42)",
        "glass_rgb": (22, 32, 56),
        "glass_rgb2": (36, 54, 96),
        "text": "rgba(235,240,255,240)",
        "muted": "rgba(180,195,220,210)",
        "danger": "#FF6B81",
        "spot": (12, 18, 36),
    },
    "graphite": {
        "label": "石墨灰",
        "accent": "#8B9BB4",
        "accent2": "#3A3F4B",
        "accent3": "#C5CEDB",
        "panel": "rgba(40,42,48,72)",
        "panel2": "rgba(55,58,66,42)",
        "glass_rgb": (36, 38, 44),
        "glass_rgb2": (58, 62, 72),
        "text": "rgba(240,242,245,240)",
        "muted": "rgba(190,195,205,210)",
        "danger": "#E57373",
        "spot": (22, 23, 26),
    },
    "aurora": {
        "label": "极光",
        "accent": "#2DD4BF",
        "accent2": "#6366F1",
        "accent3": "#F472B6",
        "panel": "rgba(255,255,255,28)",
        "panel2": "rgba(45,212,191,18)",
        "glass_rgb": (245, 252, 255),
        "glass_rgb2": (60, 200, 190),
        "text": "rgba(245,250,255,240)",
        "muted": "rgba(210,230,235,210)",
        "danger": "#FB7185",
        "spot": (8, 20, 28),
    },
}


def _read_json(path: str, default: Any) -> Any:
    if not os.path.isfile(path):
        return deepcopy(default)
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        return deepcopy(default)


def _write_json(path: str, data: Any) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def load_settings() -> Dict[str, Any]:
    data = _read_json(os.path.join(_user_data_dir(), SETTINGS_FILE), DEFAULT_SETTINGS)
    merged = deepcopy(DEFAULT_SETTINGS)
    if isinstance(data, dict):
        merged.update({k: data[k] for k in DEFAULT_SETTINGS if k in data})
    if merged.get("theme") not in THEMES:
        merged["theme"] = "liquid"
    return merged


def save_settings(settings: Dict[str, Any]) -> None:
    payload = deepcopy(DEFAULT_SETTINGS)
    payload.update(settings or {})
    _write_json(os.path.join(_user_data_dir(), SETTINGS_FILE), payload)


def load_user_presets() -> Dict[str, Dict[str, Any]]:
    data = _read_json(os.path.join(_user_data_dir(), PRESETS_FILE), {})
    if not isinstance(data, dict):
        return {}
    cleaned = {}
    for name, preset in data.items():
        if isinstance(name, str) and isinstance(preset, dict) and name.strip():
            cleaned[name.strip()] = preset
    return cleaned


def save_user_presets(presets: Dict[str, Dict[str, Any]]) -> None:
    _write_json(os.path.join(_user_data_dir(), PRESETS_FILE), presets or {})


def all_preset_names(user_presets: Optional[Dict[str, Dict[str, Any]]] = None) -> List[str]:
    user_presets = user_presets if user_presets is not None else load_user_presets()
    names = list(BUILTIN_PRESETS.keys())
    for name in sorted(user_presets.keys()):
        if name not in BUILTIN_PRESETS:
            names.append(name)
    return names


def get_preset(name: str, user_presets: Optional[Dict[str, Dict[str, Any]]] = None) -> Optional[Dict[str, Any]]:
    user_presets = user_presets if user_presets is not None else load_user_presets()
    if name in BUILTIN_PRESETS:
        return deepcopy(BUILTIN_PRESETS[name])
    if name in user_presets:
        return deepcopy(user_presets[name])
    return None


def is_builtin_preset(name: str) -> bool:
    return name in BUILTIN_PRESETS
