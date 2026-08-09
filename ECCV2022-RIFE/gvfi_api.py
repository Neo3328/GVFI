#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GVFI 本地 HTTP API — 驱动 main.VideoWorker 渲染管线。
端点与 web-ui gvfi-api.ts 契约一致，不修改 VideoWorker / svfi_pipeline 核心逻辑。
"""

from __future__ import annotations

import cgi
import json
import os
import sys
import threading
import time
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, unquote, urlparse

# Force UTF-8 stdio on Windows so Electron logs / consoles don't garble Chinese.
os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# PyQt 事件循环（VideoWorker 为 QThread）
from PyQt5.QtCore import QCoreApplication, QTimer

from main import VideoWorker
from tool_resolver import resolve_runtime_tools
from svfi_pipeline import discover_rife_models
from llm_video import run_llm_video_job, test_llm_connection

from ui_prefs import load_settings

try:
    from gvfi_runtime import (
        MemoryPressureMonitor,
        PressureLevel,
        get_orchestrator,
        native_available,
        native_memory_sample,
        native_version,
    )
except ImportError:  # pragma: no cover - optional runtime module
    MemoryPressureMonitor = None  # type: ignore
    PressureLevel = None  # type: ignore
    get_orchestrator = None  # type: ignore

    def native_available() -> bool:  # type: ignore
        return False

    def native_memory_sample(*_a, **_k):  # type: ignore
        return None

    def native_version():  # type: ignore
        return None

API_HOST = os.environ.get("GVFI_API_HOST", "127.0.0.1")
API_PORT = int(os.environ.get("GVFI_API_PORT", "8765"))

_jobs_lock = threading.Lock()
_jobs: Dict[str, Dict[str, Any]] = {}
_active_worker: Optional[VideoWorker] = None
_active_job_id: Optional[str] = None
_active_llm_cancelled: Dict[str, bool] = {}
_upload_dir: Optional[str] = None
_output_dir: Optional[str] = None
_mem_monitor = MemoryPressureMonitor() if MemoryPressureMonitor else None
if _mem_monitor is not None:
    _mem_monitor.set_thresholds(75, 90)
    _mem_monitor.start(1000)


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _ensure_dirs(base_dir: str) -> None:
    global _upload_dir, _output_dir
    user_data = os.path.join(base_dir, "user_data")
    _upload_dir = os.path.join(user_data, "uploads")
    _output_dir = os.path.join(user_data, "output")
    os.makedirs(_upload_dir, exist_ok=True)
    os.makedirs(_output_dir, exist_ok=True)
    _sweep_stale_uploads(max_age_hours=72)


_SENSITIVE_SETTING_KEYS = {
    "apiKey",
    "api_key",
    "token",
    "authorization",
    "Authorization",
    "password",
    "secret",
}

_MEDIA_EXTS = {
    ".mp4",
    ".mkv",
    ".mov",
    ".avi",
    ".m4v",
    ".webm",
    ".md",
    ".markdown",
    ".txt",
    ".json",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
}


def _scrub_settings(settings: dict) -> dict:
    """Persist-safe copy — never keep API keys/tokens in job records."""
    scrubbed = dict(settings or {})
    for key in list(scrubbed.keys()):
        if key in _SENSITIVE_SETTING_KEYS or str(key).lower() in {
            "apikey",
            "api_key",
            "token",
            "authorization",
            "password",
            "secret",
        }:
            if scrubbed.get(key):
                scrubbed[key] = "***"
    return scrubbed


def _is_local_client(handler: "GvfiApiHandler") -> bool:
    host = (handler.headers.get("Host") or "").split(":")[0].strip().lower()
    if host in ("127.0.0.1", "localhost", "::1"):
        return True
    origin = (handler.headers.get("Origin") or "").lower()
    return origin.startswith("http://127.0.0.1") or origin.startswith(
        "http://localhost"
    )


def _cors_allow_origin(handler: "GvfiApiHandler") -> str:
    origin = handler.headers.get("Origin") or ""
    if origin.startswith("http://127.0.0.1") or origin.startswith("http://localhost"):
        return origin
    return "http://127.0.0.1"


def _cleanup_upload_if_owned(path: str) -> None:
    if not path or not _upload_dir:
        return
    try:
        abs_path = os.path.normpath(os.path.abspath(path))
        root = os.path.normpath(os.path.abspath(_upload_dir))
        if abs_path.startswith(root + os.sep) and os.path.isfile(abs_path):
            os.remove(abs_path)
    except OSError:
        pass


def _sweep_stale_uploads(max_age_hours: int = 72) -> None:
    if not _upload_dir or not os.path.isdir(_upload_dir):
        return
    cutoff = datetime.now(timezone.utc).timestamp() - max_age_hours * 3600
    try:
        for name in os.listdir(_upload_dir):
            path = os.path.join(_upload_dir, name)
            try:
                if os.path.isfile(path) and os.path.getmtime(path) < cutoff:
                    os.remove(path)
            except OSError:
                continue
    except OSError:
        pass


def _model_catalog(tools: dict) -> List[dict]:
    models = []
    for path in tools.get("rife_models") or discover_rife_models(tools.get("rife_dir")):
        name = os.path.basename(path)
        models.append({"id": f"gvfi:{name}", "name": name, "path": path})
    return models


def _health_payload() -> dict:
    tools = resolve_runtime_tools()
    warnings = []
    ok = bool(tools.get("ffmpeg") and tools.get("rife_exe") and tools.get("rife_model"))
    if not tools.get("ffmpeg"):
        warnings.append("未找到 ffmpeg.exe")
    if not tools.get("rife_exe"):
        warnings.append("未找到 rife-ncnn-vulkan.exe")
    if not tools.get("rife_model"):
        warnings.append("未找到 RIFE 模型目录")
    memory = None
    native_snap = native_memory_sample(75, 90) if native_available() else None
    if native_snap is not None:
        memory = dict(native_snap)
        if memory.get("level") == "critical":
            warnings.append("系统内存压力临界，建议暂停大型任务")
        elif memory.get("level") == "warning":
            warnings.append("系统内存压力偏高")
    elif _mem_monitor is not None:
        snap = _mem_monitor.sample()
        memory = {
            "load_percent": snap.memory_load_percent,
            "total_phys_mb": int(snap.total_phys_bytes // (1024 * 1024)),
            "avail_phys_mb": int(snap.avail_phys_bytes // (1024 * 1024)),
            "level": snap.level.name.lower() if hasattr(snap.level, "name") else str(snap.level),
            "backpressure": _mem_monitor.should_backpressure(),
            "runtime": "gvfi_runtime",
        }
        if snap.level == PressureLevel.Critical:  # type: ignore[union-attr]
            warnings.append("系统内存压力临界，建议暂停大型任务")
        elif snap.level == PressureLevel.Warning:  # type: ignore[union-attr]
            warnings.append("系统内存压力偏高")
    if memory is not None and native_available():
        memory.setdefault("native_dll", True)
        memory.setdefault("version", native_version())
    orch_info = None
    if get_orchestrator is not None:
        try:
            orch = get_orchestrator()
            orch_info = {"backend": orch.backend, "running": True}
        except Exception:
            orch_info = {"backend": "unavailable", "running": False}
    return {
        "ok": ok,
        "ffmpeg": bool(tools.get("ffmpeg")),
        "ffprobe": bool(tools.get("ffprobe")),
        "rife_ready": ok,
        "models": _model_catalog(tools),
        "gpus": [{"index": 0, "name": "本地 Vulkan", "vram_mb": 0}],
        "output_dir": _output_dir or "",
        "rife_ncnn_dir": tools.get("rife_dir") or "",
        "warnings": warnings,
        "engine": "gvfi",
        "memory": memory,
        "orchestrator": orch_info,
    }


def _resolve_rife_model(model_id: str, tools: dict) -> str:
    catalog = _model_catalog(tools)
    if model_id:
        for item in catalog:
            if item["id"] == model_id or item["name"] in model_id:
                return item["path"]
        if os.path.isdir(model_id):
            return model_id
        basename = model_id.split(":")[-1]
        for item in catalog:
            if item["name"] == basename:
                return item["path"]
    return tools.get("rife_model") or ""


def _settings_to_worker_params(settings: dict, tools: dict) -> dict:
    fps = int(settings.get("fps") or 120)
    super_sr = bool(settings.get("superResolution", True))
    resolution = settings.get("resolution") or "source"
    if not super_sr or resolution == "source":
        scale = "原始"
    elif resolution in ("4k", "1440p"):
        scale = "4x"
    else:
        scale = "2x"

    return {
        "fps": str(fps),
        "scale": scale,
        "codec": "H.265 (HEVC)",
        "crf": 18,
        "encode_preset": "medium",
        "rife_model": _resolve_rife_model(settings.get("model", ""), tools),
        "enable_dedup": bool(settings.get("enableDedup", True)),
        "enable_scdet": bool(settings.get("enableScdet", True)),
        "dedup_threshold": float(settings.get("dedupThreshold", 1.5)),
        "scdet_threshold": float(settings.get("scdetThreshold", 12.0)),
        "keep_audio": bool(settings.get("keepAudio", True)),
    }


def _task_snapshot(job_id: str) -> dict:
    with _jobs_lock:
        job = _jobs.get(job_id)
        if not job:
            return {}
        return dict(job["task"])


def _update_task(job_id: str, **fields) -> None:
    with _jobs_lock:
        job = _jobs.get(job_id)
        if not job:
            return
        job["task"].update(fields)
        job["task"]["updated_at"] = _utc_now()


def _append_log(job_id: str, line: str, *, error: bool = False) -> None:
    with _jobs_lock:
        job = _jobs.get(job_id)
        if not job:
            return
        bucket = job["error_logs"] if error else job["logs"]
        bucket.append(line)
        if not error:
            job["task"]["message"] = line[:500]


def _finish_job(job_id: str, success: bool, message: str) -> None:
    global _active_worker, _active_job_id
    status = "succeeded" if success else "failed"
    if "取消" in message or "终止" in message or "停止" in message:
        status = "cancelled"
    input_path = ""
    with _jobs_lock:
        job = _jobs.get(job_id) or {}
        input_path = (job.get("task") or {}).get("input_path") or ""
    _update_task(
        job_id,
        status=status,
        stage="done" if success else ("cancelled" if status == "cancelled" else "failed"),
        progress=1.0 if success else _task_snapshot(job_id).get("progress", 0),
        message=message,
        error="" if success or status == "cancelled" else message,
    )
    # Drop temporary upload copies after the job ends (success or failure).
    _cleanup_upload_if_owned(input_path)
    with _jobs_lock:
        job = _jobs.get(job_id)
        if job and isinstance(job.get("settings"), dict):
            job["settings"] = _scrub_settings(job["settings"])
        _active_worker = None
        _active_job_id = None


def _start_worker(job_id: str, file_path: str, settings: dict) -> None:
    global _active_worker, _active_job_id
    tools = resolve_runtime_tools()
    params = _settings_to_worker_params(settings, tools)
    out_path = _output_dir or os.path.join(tools["base_dir"], "user_data", "output")

    worker = VideoWorker(
        [file_path],
        params,
        out_path,
        same_as_src=bool(settings.get("sameDir", False)),
        clean_cache=bool(settings.get("cleanCache", True)),
    )

    orch = None
    if get_orchestrator is not None:
        orch = get_orchestrator()
        orch.set_handlers(
            on_update=lambda jid, **fields: _update_task(jid, **fields),
            on_log=lambda jid, line: _append_log(jid, line),
            on_finish=lambda jid, ok, msg: _finish_job_from_orch(jid, ok, msg, file_path, out_path),
        )
        orch.bind_job(job_id, stage="queued")

    def on_progress(value: int) -> None:
        if orch is not None:
            orch.post_progress(job_id, value / 100.0)
        else:
            _update_task(job_id, progress=max(0.0, min(1.0, value / 100.0)), status="running", stage="rife")

    def on_log(message: str) -> None:
        if orch is not None:
            orch.post_log(job_id, message)
            return
        _append_log(job_id, message)
        lower = message.lower()
        if "[1/4]" in message:
            _update_task(job_id, stage="extract")
        elif "[2/4]" in message or "rife" in lower:
            _update_task(job_id, stage="rife")
        elif "[3/4]" in message or "esrgan" in lower or "超分" in message:
            _update_task(job_id, stage="upsample")
        elif "[4/4]" in message or "encode" in lower or "合成" in message:
            _update_task(job_id, stage="encode")

    def on_finished(success: bool, message: str) -> None:
        if orch is not None:
            orch.post_finished(job_id, success, message)
            return
        if success:
            _update_task(job_id, output_path=_guess_output_path(file_path, out_path))
        _finish_job(job_id, success, message)

    worker.progress_updated.connect(on_progress)
    worker.log_output.connect(on_log)
    worker.task_finished.connect(on_finished)

    with _jobs_lock:
        _active_worker = worker
        _active_job_id = job_id

    if orch is not None:
        orch.post_stage(job_id, "queued", "任务已开始")
    else:
        _update_task(job_id, status="running", stage="queued", message="任务已开始")
    worker.start()


def _finish_job_from_orch(
    job_id: str, success: bool, message: str, file_path: str, out_path: str
) -> None:
    if success:
        _update_task(job_id, output_path=_guess_output_path(file_path, out_path))
    _finish_job(job_id, success, message)


def _guess_output_path(input_path: str, out_dir: str) -> str:
    base = os.path.basename(input_path)
    name, ext = os.path.splitext(base)
    candidate = os.path.join(out_dir, f"{name}_gvfi{ext or '.mp4'}")
    if os.path.isfile(candidate):
        return candidate
    if os.path.isdir(out_dir):
        for entry in os.listdir(out_dir):
            if entry.startswith(name):
                return os.path.join(out_dir, entry)
    return out_dir


def _create_job(input_path: str, settings: dict) -> dict:
    job_id = uuid.uuid4().hex
    now = _utc_now()
    engine = settings.get("engine") or "gvfi"
    task = {
        "id": job_id,
        "input_path": input_path,
        "output_path": "",
        "status": "pending",
        "progress": 0.0,
        "stage": "queued",
        "message": "排队中",
        "error": "",
        "created_at": now,
        "updated_at": now,
        "engine": engine,
    }
    with _jobs_lock:
        _jobs[job_id] = {
            "task": task,
            "logs": [],
            "error_logs": [],
            # Never persist raw API keys in the in-memory job table.
            "settings": _scrub_settings(settings),
        }
        _active_llm_cancelled[job_id] = False

    if engine == "llm":
        threading.Thread(
            target=_start_llm_worker,
            args=(job_id, input_path, settings),
            daemon=True,
        ).start()
    else:
        threading.Thread(
            target=_start_worker,
            args=(job_id, input_path, settings),
            daemon=True,
        ).start()
    return task


def _start_llm_worker(job_id: str, file_path: str, settings: dict) -> None:
    global _active_job_id
    tools = resolve_runtime_tools()
    out_path = _output_dir or os.path.join(tools["base_dir"], "user_data", "output")
    settings = {**settings, "outputDir": out_path}

    with _jobs_lock:
        _active_job_id = job_id

    orch = None
    if get_orchestrator is not None:
        orch = get_orchestrator()
        orch.set_handlers(
            on_update=lambda jid, **fields: _update_task(jid, **fields),
            on_log=lambda jid, line: _append_log(jid, line),
            on_finish=lambda jid, ok, msg: _finish_job(jid, ok, msg),
        )
        orch.bind_job(job_id, stage="extract")

    def on_progress(value: float) -> None:
        if orch is not None:
            orch.post_progress(job_id, value)
            orch.post_stage(job_id, "analyze")
            return
        _update_task(
            job_id,
            progress=max(0.0, min(1.0, value)),
            status="running",
            stage="analyze",
        )

    def on_log(message: str) -> None:
        if orch is not None:
            orch.post_log(job_id, message)
            return
        _append_log(job_id, message)
        lower = message.lower()
        if "抽帧" in message:
            _update_task(job_id, stage="extract")
        elif "大模型" in message or "llm" in lower:
            _update_task(job_id, stage="analyze")
        elif "完成" in message or "保存" in message:
            _update_task(job_id, stage="encode")

    def cancelled() -> bool:
        with _jobs_lock:
            return bool(_active_llm_cancelled.get(job_id))

    if orch is not None:
        orch.post_stage(job_id, "extract", "LLM 分析已开始")
    else:
        _update_task(job_id, status="running", stage="extract", message="LLM 分析已开始")
    try:
        result_path = run_llm_video_job(
            file_path,
            settings,
            tools,
            log=on_log,
            progress=on_progress,
            cancelled=cancelled,
        )
        if orch is not None:
            _update_task(job_id, output_path=result_path)
            orch.post_finished(job_id, True, "LLM 视频分析完成")
        else:
            _update_task(job_id, output_path=result_path)
            _finish_job(job_id, True, "LLM 视频分析完成")
    except Exception as exc:  # noqa: BLE001
        _append_log(job_id, str(exc), error=True)
        if orch is not None:
            orch.post_finished(job_id, False, str(exc))
        else:
            _finish_job(job_id, False, str(exc))


def _cancel_job(job_id: str) -> bool:
    global _active_worker
    worker = None
    with _jobs_lock:
        job = _jobs.get(job_id)
        worker = _active_worker if _active_job_id == job_id else None
        if job and (job.get("settings") or {}).get("engine") == "llm":
            _active_llm_cancelled[job_id] = True
            _update_task(job_id, status="running", message="正在取消…")
            return True
    if worker and worker.isRunning():
        worker.stop()
        _update_task(job_id, status="running", stage="encode", message="正在取消…")
        return True
    _update_task(job_id, status="cancelled", stage="cancelled", message="任务已取消")
    return False


def _appearance_payload() -> dict:
    settings = load_settings()
    pyqt_theme = settings.get("theme", "liquid")
    web_theme = {
        "liquid": "ai",
        "aurora": "ai",
        "midnight": "dark",
        "graphite": "dark",
    }.get(pyqt_theme, "studio")
    bg_path = (settings.get("background_path") or "").strip()
    payload = {
        "pyqt": {
            "theme": pyqt_theme,
            "web_theme": web_theme,
            "glass_opacity": settings.get("glass_opacity"),
            "background_path": bg_path,
            "font_family": settings.get("font_family"),
            "font_size": settings.get("font_size"),
            "last_preset": settings.get("last_preset"),
        },
        "background_url": "/settings/background" if bg_path and os.path.isfile(bg_path) else None,
    }
    return payload


def _job_logs_payload(job_id: str) -> dict:
    with _jobs_lock:
        job = _jobs.get(job_id)
        if not job:
            return {}
        return {
            "logs": list(job.get("logs") or []),
            "error_logs": list(job.get("error_logs") or []),
        }


def _parse_job_path(path: str) -> tuple:
    """Return (job_id, subresource) for /jobs/{id} or /jobs/{id}/{logs|cancel}."""
    parts = [p for p in path.split("/") if p]
    if len(parts) < 2 or parts[0] != "jobs":
        return "", ""
    job_id = parts[1]
    sub = parts[2] if len(parts) > 2 else ""
    return job_id, sub


def _video_mime(ext: str) -> str:
    return {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mkv": "video/x-matroska",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".m4v": "video/x-mp4",
        ".md": "text/markdown; charset=utf-8",
        ".markdown": "text/markdown; charset=utf-8",
        ".txt": "text/plain; charset=utf-8",
        ".json": "application/json; charset=utf-8",
    }.get(ext, "application/octet-stream")


def _serve_media_file(handler: "GvfiApiHandler", file_path: str) -> None:
    """流式返回本地媒体文件（仅本机客户端 + 允许的扩展名）。"""
    if not _is_local_client(handler):
        handler._send_json(403, {"error": "仅允许本机访问"})
        return

    file_path = os.path.normpath(os.path.abspath(file_path))
    if not os.path.isfile(file_path):
        handler._send_json(404, {"error": "文件不存在"})
        return

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in _MEDIA_EXTS:
        handler._send_json(403, {"error": "不允许的媒体类型"})
        return

    mime = _video_mime(ext)
    file_size = os.path.getsize(file_path)
    allow_origin = _cors_allow_origin(handler)

    range_header = handler.headers.get("Range")
    if range_header:
        try:
            units, _, spec = range_header.partition("=")
            if units.strip().lower() != "bytes":
                raise ValueError("unsupported range unit")
            start_str, _, end_str = spec.partition("-")
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else file_size - 1
            if start >= file_size:
                handler.send_response(416)
                handler.send_header("Content-Range", f"bytes */{file_size}")
                handler.end_headers()
                return
            end = min(end, file_size - 1)
            length = end - start + 1
            handler.send_response(206)
            handler.send_header("Content-Type", mime)
            handler.send_header("Access-Control-Allow-Origin", allow_origin)
            handler.send_header("Vary", "Origin")
            handler.send_header("Accept-Ranges", "bytes")
            handler.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            handler.send_header("Content-Length", str(length))
            handler.end_headers()
            with open(file_path, "rb") as handle:
                handle.seek(start)
                handler.wfile.write(handle.read(length))
            return
        except (ValueError, OSError):
            pass

    handler.send_response(200)
    handler.send_header("Content-Type", mime)
    handler.send_header("Access-Control-Allow-Origin", allow_origin)
    handler.send_header("Vary", "Origin")
    handler.send_header("Accept-Ranges", "bytes")
    handler.send_header("Content-Length", str(file_size))
    handler.end_headers()
    try:
        with open(file_path, "rb") as handle:
            while True:
                chunk = handle.read(1024 * 256)
                if not chunk:
                    break
                handler.wfile.write(chunk)
    except OSError as exc:
        sys.stderr.write(f"[GVFI API] media stream error: {exc}\n")


class GvfiApiHandler(BaseHTTPRequestHandler):
    server_version = "GVFI/1.0"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[GVFI API] %s\n" % (fmt % args))

    def _send_json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", _cors_allow_origin(self))
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", _cors_allow_origin(self))
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length) if length else b""

    def _send_bytes(self, code: int, body: bytes, content_type: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", _cors_allow_origin(self))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path == "/health":
            self._send_json(200, _health_payload())
            return

        if path == "/settings/appearance":
            self._send_json(200, _appearance_payload())
            return

        if path == "/settings/background":
            settings = load_settings()
            bg_path = (settings.get("background_path") or "").strip()
            if not bg_path or not os.path.isfile(bg_path):
                self._send_json(404, {"error": "背景图不存在"})
                return
            ext = os.path.splitext(bg_path)[1].lower()
            mime = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".webp": "image/webp",
                ".gif": "image/gif",
            }.get(ext, "application/octet-stream")
            try:
                with open(bg_path, "rb") as handle:
                    data = handle.read()
                self._send_bytes(200, data, mime)
            except OSError as exc:
                self._send_json(500, {"error": str(exc)})
            return

        if path == "/media":
            qs = parse_qs(parsed.query)
            raw = (qs.get("path") or [""])[0]
            if not raw:
                self._send_json(400, {"error": "缺少 path 参数"})
                return
            _serve_media_file(self, unquote(raw))
            return

        if path == "/jobs":
            with _jobs_lock:
                tasks = [dict(j["task"]) for j in _jobs.values()]
            self._send_json(200, {"tasks": tasks})
            return

        if path.startswith("/jobs/"):
            job_id, sub = _parse_job_path(path)
            if not job_id:
                self._send_json(404, {"error": "Not found"})
                return
            if sub == "logs":
                logs = _job_logs_payload(job_id)
                if not logs:
                    self._send_json(404, {"error": "任务不存在"})
                    return
                self._send_json(200, logs)
                return
            if sub and sub != "":
                self._send_json(404, {"error": "Not found"})
                return
            task = _task_snapshot(job_id)
            if not task:
                self._send_json(404, {"error": "任务不存在"})
                return
            self._send_json(200, {"task": task})
            return

        self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path == "/jobs":
            self._handle_create_job()
            return

        if path == "/llm/test":
            self._handle_llm_test()
            return

        if path.startswith("/jobs/") and path.endswith("/cancel"):
            job_id = path.split("/")[-2]
            if _cancel_job(job_id):
                self._send_json(200, {"message": "已请求取消", "task": _task_snapshot(job_id)})
            else:
                self._send_json(404, {"error": "任务不存在或无法取消"})
            return

        self._send_json(404, {"error": "Not found"})

    def _handle_llm_test(self) -> None:
        try:
            payload = json.loads(self._read_body().decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send_json(400, {"error": "无效的 JSON"})
            return
        result = test_llm_connection(
            payload.get("provider") or "openai",
            payload.get("apiKey") or "",
            base_url=payload.get("baseUrl") or "",
            model=payload.get("model") or "",
        )
        code = 200 if result.get("ok") else 400
        self._send_json(code, result)

    def _handle_create_job(self) -> None:
        content_type = self.headers.get("Content-Type", "")
        settings: dict = {}
        input_path = ""

        if "multipart/form-data" in content_type:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    "REQUEST_METHOD": "POST",
                    "CONTENT_TYPE": content_type,
                },
            )
            if "settings" in form:
                settings = json.loads(form.getvalue("settings") or "{}")
            if "file" in form and getattr(form["file"], "file", None):
                file_item = form["file"]
                filename = os.path.basename(file_item.filename or "upload.mp4")
                dest = os.path.join(_upload_dir or ".", f"{uuid.uuid4().hex}_{filename}")
                with open(dest, "wb") as out:
                    out.write(file_item.file.read())
                input_path = dest
        else:
            try:
                payload = json.loads(self._read_body().decode("utf-8") or "{}")
            except json.JSONDecodeError:
                self._send_json(400, {"error": "无效的 JSON"})
                return
            settings = payload
            input_path = (payload.get("inputPath") or "").strip()

        if not input_path or not os.path.isfile(input_path):
            self._send_json(400, {"error": "缺少有效输入视频路径或上传文件"})
            return

        with _jobs_lock:
            active = _active_worker and _active_worker.isRunning()
            llm_active = _active_job_id and _jobs.get(_active_job_id, {}).get("settings", {}).get("engine") == "llm"
            if llm_active:
                task = _jobs.get(_active_job_id, {}).get("task") or {}
                if task.get("status") == "running":
                    active = True
            if active:
                self._send_json(409, {"error": "已有任务正在运行，请稍后再试"})
                return

        task = _create_job(input_path, settings)
        self._send_json(200, {"task": task})


def main() -> None:
    tools = resolve_runtime_tools()
    _ensure_dirs(tools["base_dir"])

    app = QCoreApplication(sys.argv)

    httpd = ThreadingHTTPServer((API_HOST, API_PORT), GvfiApiHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()

    print(f"GVFI API 运行于 http://{API_HOST}:{API_PORT}")
    print("引擎: VideoWorker (PyQt)")

    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
