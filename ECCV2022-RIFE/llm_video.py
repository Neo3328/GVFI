#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GVFI — LLM vision video analysis (frame extract + multimodal API).
Developed by Mr. Gong
Copyright © 2026 Mr. Gong. All Rights Reserved.
"""

from __future__ import annotations

import base64
import json
import os
import subprocess
import tempfile
import urllib.error
import urllib.request
from typing import Any, Callable, Dict, List, Optional, Tuple

LogFn = Callable[[str], None]
ProgressFn = Callable[[float], None]

PROVIDER_PRESETS: Dict[str, Dict[str, str]] = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o",
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "default_model": "deepseek-chat",
    },
    "moonshot": {
        "base_url": "https://api.moonshot.cn/v1",
        "default_model": "moonshot-v1-8k-vision-preview",
    },
    "custom": {
        "base_url": "",
        "default_model": "gpt-4o",
    },
}


def _normalize_base_url(base_url: str) -> str:
    url = (base_url or "").strip().rstrip("/")
    if not url:
        return ""
    if url.endswith("/v1"):
        return url
    if url.endswith("/v1/chat/completions"):
        return url[: -len("/chat/completions")]
    return url


def resolve_llm_endpoint(provider: str, base_url: str) -> Tuple[str, str]:
    preset = PROVIDER_PRESETS.get(provider, PROVIDER_PRESETS["custom"])
    root = _normalize_base_url(base_url) or preset["base_url"]
    if not root:
        raise ValueError("请填写 API Base URL")
    return f"{root}/chat/completions", preset["default_model"]


def _http_post_json(url: str, payload: dict, headers: dict, timeout: int = 120) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def test_llm_connection(
    provider: str,
    api_key: str,
    *,
    base_url: str = "",
    model: str = "",
) -> dict:
    if not (api_key or "").strip():
        return {"ok": False, "message": "API Key 不能为空"}

    try:
        endpoint, default_model = resolve_llm_endpoint(provider, base_url)
        use_model = (model or default_model).strip()
        payload = {
            "model": use_model,
            "messages": [{"role": "user", "content": "Reply with OK only."}],
            "max_tokens": 8,
        }
        _http_post_json(
            endpoint,
            payload,
            {"Authorization": f"Bearer {api_key.strip()}"},
            timeout=30,
        )
        return {"ok": True, "message": f"连接成功 · {use_model}"}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:300].strip()
        reason = getattr(exc, "reason", "") or ""
        text = detail or str(reason) or "无响应正文"
        return {"ok": False, "message": f"HTTP {exc.code}: {text}"}
    except urllib.error.URLError as exc:
        reason = getattr(exc, "reason", None) or exc
        return {
            "ok": False,
            "message": f"无法访问大模型服务：{reason}（检查网络/代理，或改用国内服务商）",
        }
    except Exception as exc:  # noqa: BLE001
        text = str(exc).strip() or type(exc).__name__
        return {"ok": False, "message": text}


def _run_ffmpeg_frames(
    ffmpeg: str,
    video_path: str,
    out_dir: str,
    max_frames: int,
    log: LogFn,
) -> List[str]:
    os.makedirs(out_dir, exist_ok=True)
    pattern = os.path.join(out_dir, "frame_%04d.jpg")
    probe_cmd = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        video_path,
        "-vf",
        f"fps=1/3,scale='min(1280,iw)':-2",
        "-frames:v",
        str(max(1, min(max_frames, 24))),
        "-q:v",
        "3",
        pattern,
    ]
    log(f"抽帧：最多 {max_frames} 帧")
    proc = subprocess.run(probe_cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "ffmpeg 抽帧失败")

    frames = sorted(
        os.path.join(out_dir, name)
        for name in os.listdir(out_dir)
        if name.lower().endswith((".jpg", ".jpeg", ".png"))
    )
    if not frames:
        raise RuntimeError("未能从视频中抽取有效帧")
    log(f"已抽取 {len(frames)} 帧")
    return frames


def _encode_image(path: str) -> str:
    with open(path, "rb") as handle:
        return base64.b64encode(handle.read()).decode("ascii")


def _build_vision_messages(prompt: str, frame_paths: List[str]) -> List[dict]:
    content: List[dict] = [{"type": "text", "text": prompt}]
    for idx, frame_path in enumerate(frame_paths, start=1):
        b64 = _encode_image(frame_path)
        content.append({"type": "text", "text": f"Frame {idx}:"})
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
            }
        )
    return [{"role": "user", "content": content}]


def _extract_assistant_text(response: dict) -> str:
    choices = response.get("choices") or []
    if not choices:
        return json.dumps(response, ensure_ascii=False, indent=2)
    message = choices[0].get("message") or {}
    content = message.get("content", "")
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(str(block.get("text", "")))
        return "\n".join(parts).strip()
    return str(content).strip()


def run_llm_video_job(
    video_path: str,
    settings: dict,
    tools: dict,
    *,
    log: LogFn,
    progress: ProgressFn,
    cancelled: Callable[[], bool],
) -> str:
    provider = settings.get("llmProvider") or settings.get("provider") or "openai"
    api_key = (settings.get("apiKey") or settings.get("api_key") or "").strip()
    base_url = settings.get("baseUrl") or settings.get("base_url") or ""
    model = (settings.get("llmModel") or settings.get("model") or "").strip()
    prompt = (
        settings.get("prompt")
        or "请分析这段视频的画面内容、场景变化与可执行的后期处理建议。"
    ).strip()
    max_frames = int(settings.get("maxFrames") or settings.get("max_frames") or 8)

    if not api_key:
        raise ValueError("缺少 API Key，请先在设置中配置")

    ffmpeg = tools.get("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("未找到 ffmpeg，无法抽帧")

    endpoint, default_model = resolve_llm_endpoint(provider, base_url)
    use_model = model or default_model

    progress(0.05)
    if cancelled():
        raise RuntimeError("任务已取消")

    with tempfile.TemporaryDirectory(prefix="gvfi_llm_") as tmp:
        frames = _run_ffmpeg_frames(ffmpeg, video_path, tmp, max_frames, log)
        progress(0.35)
        if cancelled():
            raise RuntimeError("任务已取消")

        log(f"调用大模型：{use_model}")
        payload = {
            "model": use_model,
            "messages": _build_vision_messages(prompt, frames),
            "max_tokens": 4096,
        }
        response = _http_post_json(
            endpoint,
            payload,
            {"Authorization": f"Bearer {api_key}"},
            timeout=180,
        )
        progress(0.85)
        if cancelled():
            raise RuntimeError("任务已取消")

        report = _extract_assistant_text(response)
        if not report:
            report = json.dumps(response, ensure_ascii=False, indent=2)

        out_dir = settings.get("outputDir") or os.path.join(
            os.path.dirname(video_path), "llm_output"
        )
        os.makedirs(out_dir, exist_ok=True)
        base = os.path.splitext(os.path.basename(video_path))[0]
        out_path = os.path.join(out_dir, f"{base}_llm_analysis.md")
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(f"# GVFI LLM 视频分析\n\n")
            handle.write(f"- 模型：{use_model}\n")
            handle.write(f"- 抽帧数：{len(frames)}\n\n")
            handle.write("## 分析结果\n\n")
            handle.write(report)
            handle.write("\n")

        progress(1.0)
        log(f"分析完成，报告已保存：{out_path}")
        return out_path
