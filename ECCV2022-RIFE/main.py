import sys
import os
import time
import shutil
import subprocess
import ctypes
import json
import re
import tempfile
import threading
import traceback
import uuid
from pathlib import Path

try:
    import winsound
except ImportError:
    winsound = None

from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout,
                             QHBoxLayout, QLabel, QPushButton, QProgressBar,
                             QTextEdit, QComboBox, QFileDialog, QMessageBox,
                             QAction, QLineEdit, QCheckBox, QFrame, QScroller,
                             QGraphicsDropShadowEffect, QScrollerProperties,
                             QDoubleSpinBox, QScrollArea, QInputDialog,
                             QFontComboBox, QSpinBox, QSizePolicy, QSplitter,
                             QSlider)
from PyQt5.QtCore import (Qt, QThread, pyqtSignal, QPoint, QTimer,
                          QEasingCurve, QPropertyAnimation)
from PyQt5.QtGui import (QDragEnterEvent, QDropEvent, QFont, QColor, QPainter,
                         QRadialGradient, QPixmap, QBrush, QFontDatabase,
                         QTextCursor, QTextCharFormat)

from svfi_pipeline import (
    allocate_output_counts,
    build_segments,
    compute_target_frame_count,
    detect_scene_cuts,
    frame_paths,
    remove_duplicate_frames,
)
from gvfi_runtime.frame_pipeline import decode_and_consume
from gvfi_runtime.rife_cli_pipeline import (
    RifePipelineStats,
    RifeProcessMonitor,
    collect_frames,
    stage_frame_range,
)
from gvfi_runtime.rife_scene_scheduler import (
    RifeWorkerManager,
    RifeWorkerStats,
    SceneProcessResult,
    SceneTask,
)
from gvfi_runtime.interpolator_backend import (
    BackendError,
    BackendNotImplementedError,
    create_interpolator_backend,
)
from gvfi_runtime.errors import CancelledError, ErrorCode, GvfiError
from gvfi_runtime.runtime_config import RuntimeConfig
from gvfi_runtime.task_lifecycle import TaskLifecycle, TaskState
from gvfi_runtime.media_contract import build_output_video_filter, probe_media_contract
from gvfi_runtime.task_artifacts import (
    estimate_disk_space,
    require_disk_space,
    reserve_output_path,
    validate_output_video,
    write_task_report,
)
from tool_resolver import (
    RIFE_MODEL_CANDIDATES,
    RIFE_NCNN_DIRNAME,
    find_dir,
    find_file,
    get_app_base_dir,
    hevc_encoder_quality_args,
    resolve_rife_thread_config,
    resolve_runtime_tools,
    resolve_sr_model_name,
    select_hevc_encoder,
)
from ui_prefs import (
    BUILTIN_PRESETS,
    THEMES,
    all_preset_names,
    get_preset,
    is_builtin_preset,
    load_settings,
    load_user_presets,
    save_settings,
    save_user_presets,
)

# Sentinel error raised when Native backend fails and CLI fallback is needed.
class NativeFallback(RuntimeError):
    """Raised when the requested native RIFE backend fails and CLI fallback is required."""


CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
CREATE_NEW_PROCESS_GROUP = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)


def clamp_int(value, lo, hi):
    try:
        return max(lo, min(hi, int(value)))
    except (TypeError, ValueError):
        return lo


def glass_palette(theme, opacity_pct):
    """根据主题色与不透明度生成全局玻璃面板配色。"""
    opacity = clamp_int(opacity_pct, 10, 90)
    # 10%→约 28 alpha，90%→约 210 alpha
    alpha = int(28 + (opacity - 10) * (182 / 80.0))
    alpha2 = max(14, int(alpha * 0.48))
    card_alpha = min(230, int(alpha * 1.18))
    input_alpha = min(200, int(alpha * 0.95))
    log_alpha = min(210, int(alpha * 1.05))

    rgb = theme.get("glass_rgb", (255, 255, 255))
    rgb2 = theme.get("glass_rgb2", rgb)
    r, g, b = rgb
    r2, g2, b2 = rgb2
    return {
        "opacity": opacity,
        "panel": f"rgba({r},{g},{b},{alpha})",
        "panel2": f"rgba({r2},{g2},{b2},{alpha2})",
        "card": f"rgba({r},{g},{b},{card_alpha})",
        "input": f"rgba({max(0, r - 8)},{max(0, g - 8)},{max(0, b - 8)},{input_alpha})",
        "log": f"rgba({max(0, r - 10)},{max(0, g - 10)},{max(0, b - 10)},{log_alpha})",
        "border": f"rgba(255,255,255,{max(20, min(70, int(alpha * 0.35)))})",
        "card_border": f"rgba(255,255,255,{max(16, min(55, int(alpha * 0.28)))})",
    }


class TaskCancelled(CancelledError):
    """用户主动停止任务。"""


class ProcessExecutionError(GvfiError):
    """外部视频工具执行失败，并保留可读的错误尾部。"""

    def __init__(self, stage, return_code, detail, command=None):
        detail = (detail or "外部程序未返回错误详情").strip()
        # Keep a long stderr tail for diagnosis (UI error panel / API error_logs).
        self.stage = stage
        self.return_code = return_code
        self.detail = detail[-8000:]
        self.command = command
        cmd_txt = ""
        if command:
            try:
                cmd_txt = " ".join(str(x) for x in command)
            except TypeError:
                cmd_txt = str(command)
            if len(cmd_txt) > 500:
                cmd_txt = cmd_txt[:500] + "…"
            cmd_txt = f"\n命令: {cmd_txt}"
        code = ErrorCode.ENCODE_ERROR if "编码" in str(stage) or "合成" in str(stage) else ErrorCode.DECODE_ERROR
        super().__init__(
            f"{stage}失败，退出码 {return_code}：{self.detail[-2000:]}{cmd_txt}",
            code=code,
            stage=str(stage),
            details={"return_code": return_code, "command": cmd_txt.strip()},
        )


class AnimatedButton(QPushButton):
    """通过阴影参数补间提供轻量的 iOS 悬浮和按压反馈。"""

    def __init__(self, text="", parent=None):
        super().__init__(text, parent)
        self.setCursor(Qt.PointingHandCursor)

        self._shadow = QGraphicsDropShadowEffect(self)
        self._shadow.setBlurRadius(18)
        self._shadow.setOffset(0, 6)
        self._shadow.setColor(QColor(0, 0, 0, 95))
        self.setGraphicsEffect(self._shadow)

        self._blur_animation = QPropertyAnimation(self._shadow, b"blurRadius", self)
        self._blur_animation.setDuration(180)
        self._blur_animation.setEasingCurve(QEasingCurve.OutCubic)

        self._offset_animation = QPropertyAnimation(self._shadow, b"yOffset", self)
        self._offset_animation.setDuration(180)
        self._offset_animation.setEasingCurve(QEasingCurve.OutCubic)

    def _animate_shadow(self, blur_radius, y_offset, duration=180):
        self._blur_animation.stop()
        self._offset_animation.stop()

        self._blur_animation.setDuration(duration)
        self._blur_animation.setStartValue(self._shadow.blurRadius())
        self._blur_animation.setEndValue(blur_radius)

        self._offset_animation.setDuration(duration)
        self._offset_animation.setStartValue(self._shadow.yOffset())
        self._offset_animation.setEndValue(y_offset)

        self._blur_animation.start()
        self._offset_animation.start()

    def enterEvent(self, event):
        if self.isEnabled():
            self._animate_shadow(30, 10)
        super().enterEvent(event)

    def leaveEvent(self, event):
        self._animate_shadow(18, 6)
        super().leaveEvent(event)

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton and self.isEnabled():
            self._animate_shadow(9, 2, 90)
        super().mousePressEvent(event)

    def mouseReleaseEvent(self, event):
        if self.rect().contains(event.pos()) and self.isEnabled():
            self._animate_shadow(30, 10, 140)
        else:
            self._animate_shadow(18, 6, 140)
        super().mouseReleaseEvent(event)


def enable_windows_acrylic(hwnd):
    """在支持的 Windows 版本上启用 Acrylic；失败时静默回退到半透明背景。"""
    if os.name != "nt":
        return False

    try:
        class AccentPolicy(ctypes.Structure):
            _fields_ = [
                ("AccentState", ctypes.c_int),
                ("AccentFlags", ctypes.c_int),
                ("GradientColor", ctypes.c_uint),
                ("AnimationId", ctypes.c_int),
            ]

        class WindowCompositionAttributeData(ctypes.Structure):
            _fields_ = [
                ("Attribute", ctypes.c_int),
                ("Data", ctypes.c_void_p),
                ("SizeOfData", ctypes.c_size_t),
            ]

        accent = AccentPolicy()
        accent.AccentState = 4  # ACCENT_ENABLE_ACRYLICBLURBEHIND
        accent.AccentFlags = 2
        accent.GradientColor = 0xD0181210  # ABGR：深色半透明底

        data = WindowCompositionAttributeData()
        data.Attribute = 19  # WCA_ACCENT_POLICY
        data.Data = ctypes.cast(ctypes.pointer(accent), ctypes.c_void_p)
        data.SizeOfData = ctypes.sizeof(accent)

        set_attribute = ctypes.windll.user32.SetWindowCompositionAttribute
        return bool(set_attribute(int(hwnd), ctypes.byref(data)))
    except (AttributeError, OSError, ValueError):
        return False


# ==========================================
# 1. 动态生成绝美背景图 (无需外部图片文件)
# ==========================================
def generate_liquid_bg(width, height, base_rgb=(10, 12, 20), theme_key="liquid"):
    """使用 QPainter 动态绘制带光斑的深色背景图"""
    br, bg, bb = base_rgb
    pixmap = QPixmap(width, height)
    pixmap.fill(QColor(br, bg, bb, 230))

    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing)

    theme = THEMES.get(theme_key, THEMES["liquid"])
    accents = [
        QColor(theme["accent2"]),
        QColor(theme["accent"]),
        QColor(theme["accent3"]),
        QColor(48, 209, 88),
    ]
    for color in accents:
        color.setAlpha(42)

    spots = [
        (QPoint(int(width * 0.2), int(height * 0.3)), 400, accents[0]),
        (QPoint(int(width * 0.8), int(height * 0.7)), 500, accents[1]),
        (QPoint(int(width * 0.5), int(height * 0.9)), 350, accents[2]),
        (QPoint(int(width * 0.9), int(height * 0.1)), 300, accents[3]),
    ]

    for pos, radius, color in spots:
        gradient = QRadialGradient(pos, radius)
        gradient.setColorAt(0, color)
        gradient.setColorAt(1, QColor(0, 0, 0, 0))
        painter.setBrush(QBrush(gradient))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(pos, radius, radius)

    painter.end()
    return pixmap


# ==========================================
# 2. 核心工作线程 (异步处理，防止UI卡死)
# ==========================================
class VideoWorker(QThread):
    progress_updated = pyqtSignal(int)
    log_output = pyqtSignal(str)
    task_finished = pyqtSignal(bool, str)

    def __init__(self, file_list, params, out_path, same_as_src, clean_cache):
        super().__init__()
        self.file_list = list(file_list)
        self.runtime_config = RuntimeConfig.from_mapping(params)
        self.params = self.runtime_config.apply_to(params)
        self.task_id = uuid.uuid4().hex
        self.out_path = out_path
        self.same_as_src = same_as_src
        self.clean_cache = clean_cache
        self.is_running = True
        self.completed_outputs = []
        self.output_validations = []
        self.disk_estimates = []
        self.report_path = ""

        tools = resolve_runtime_tools()
        self.base_dir = tools["base_dir"]
        self.RIFE_EXE = tools["rife_exe"]
        self.RIFE_DIR = tools["rife_dir"]
        requested_model = (self.params.get("rife_model") or "").strip()
        if requested_model and os.path.isdir(requested_model):
            self.RIFE_MODEL = requested_model
        else:
            self.RIFE_MODEL = tools["rife_model"]
        self.ESGAN_EXE = tools["esgan_exe"]
        self.MODELS_DIR = tools["models_dir"]
        self.FFMPEG = tools["ffmpeg"]
        self.FFPROBE = tools["ffprobe"]

        self._stop_event = threading.Event()
        self._process_lock = threading.RLock()
        self._active_process = None
        self._current_temp_dir = None
        self._last_failure_detail = ""
        self._source_width = 0
        self._source_height = 0
        self._rife_pipeline_stats = RifePipelineStats()
        self._pending_native_model_loads = 0
        self._rife_stats_lock = threading.Lock()
        # Native fallback state — task-level, reset for each task.
        self._requested_backend = self.runtime_config.backend_mode
        self._active_backend = self._requested_backend  # updated on fallback
        self.lifecycle = TaskLifecycle(self.task_id, self._requested_backend)
        self._fallback_occurred = False
        self._fallback_reason = ""
        self._interpolator_backend = create_interpolator_backend(
            self._requested_backend,
            executable=self.RIFE_EXE or "",
            working_directory=self.RIFE_DIR or self.base_dir,
            command_runner=self._run_backend_command,
            log_callback=self.log_output.emit,
        )
        # Effective -j; refined per-file after probing resolution.
        self.params["rife_thread_config"] = resolve_rife_thread_config(
            self.params.get("rife_thread_config")
        )

    def _emit_failure_detail(self, context: str, exc: BaseException) -> None:
        """Emit a multi-line diagnostic block for the UI error log panel."""
        tb = "".join(
            traceback.format_exception(type(exc), exc, getattr(exc, "__traceback__", None))
        ).strip()
        lines = [
            f"  ❌ 处理异常失败：{context}",
            f"  异常类型: {type(exc).__name__}",
            f"  异常信息: {exc}",
        ]
        if isinstance(exc, GvfiError):
            lines.append(f"  错误码: {exc.code.value}")
            lines.append(f"  错误阶段: {exc.stage}")
        if isinstance(exc, ProcessExecutionError):
            lines.append(f"  阶段: {exc.stage}")
            lines.append(f"  退出码: {exc.return_code}")
            if exc.detail:
                lines.append("  --- 工具 stderr（尾部）---")
                for row in exc.detail.splitlines()[-80:]:
                    lines.append(f"  {row}")
                lines.append("  --- stderr 结束 ---")
        if tb:
            lines.append("  --- Python traceback ---")
            for row in tb.splitlines()[-60:]:
                lines.append(f"  {row}")
            lines.append("  --- traceback 结束 ---")
        block = "\n".join(lines) + "\n"
        self._last_failure_detail = block
        self.log_output.emit(block)

    def _ensure_running(self):
        if self._stop_event.is_set() or self.isInterruptionRequested():
            raise TaskCancelled("任务已被用户取消")

    def _validate_environment(self):
        missing = []
        required = [("FFmpeg", self.FFMPEG), ("ffprobe", self.FFPROBE)]
        if self.params.get("backend_mode", "cli") == "cli":
            required.append(("RIFE Vulkan", self.RIFE_EXE))
        required.append(("RIFE 模型目录", self.RIFE_MODEL))
        if self.params.get("scale") != "原始":
            required.append(("Real-ESRGAN Vulkan", self.ESGAN_EXE))
            required.append(("Real-ESRGAN models", self.MODELS_DIR))
        if self.params.get("pipeline_mode", "disk") == "memory":
            required = required[:2]

        for tool_name, tool_path in required:
            if not tool_path or not os.path.exists(tool_path):
                missing.append(f"{tool_name}: {tool_path or '未找到'}")

        if missing:
            raise FileNotFoundError("缺少运行组件：\n" + "\n".join(missing))

        for file_path in self.file_list:
            if not os.path.isfile(file_path):
                raise FileNotFoundError(f"输入视频不存在或不可读取：{file_path}")

    def _prepare_temp_root(self):
        preferred = os.path.join(self.base_dir, "temp_cache")
        fallback = os.path.join(tempfile.gettempdir(), "RIFE_Pro_temp_cache")

        for candidate in (preferred, fallback):
            try:
                os.makedirs(candidate, exist_ok=True)
                probe = os.path.join(candidate, f".write_probe_{os.getpid()}")
                with open(probe, "w", encoding="utf-8") as probe_file:
                    probe_file.write("ok")
                os.remove(probe)
                return candidate
            except OSError:
                continue

        raise OSError("无法创建可写的临时缓存目录")

    def _terminate_process_tree(self, process):
        if process is None or process.poll() is not None:
            return

        try:
            if os.name == "nt":
                subprocess.run(
                    ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    stdin=subprocess.DEVNULL,
                    creationflags=CREATE_NO_WINDOW,
                    timeout=6,
                    check=False
                )
            else:
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
        except (OSError, subprocess.SubprocessError):
            try:
                process.kill()
            except OSError:
                pass

    def _run_command(self, command, stage, allow_failure=False):
        self._ensure_running()
        creation_flags = 0
        if os.name == "nt":
            creation_flags = CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP

        try:
            process = subprocess.Popen(
                command,
                cwd=self.base_dir,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                creationflags=creation_flags
            )
        except (OSError, ValueError) as exc:
            raise RuntimeError(f"无法启动{stage}：{exc}") from exc

        with self._process_lock:
            self._active_process = process

        if self._stop_event.is_set():
            self._terminate_process_tree(process)

        try:
            _, stderr_data = process.communicate()
        finally:
            with self._process_lock:
                if self._active_process is process:
                    self._active_process = None

        stderr_text = (stderr_data or b"").decode("utf-8", errors="replace")
        self._ensure_running()

        if process.returncode != 0 and not allow_failure:
            raise ProcessExecutionError(
                stage, process.returncode, stderr_text, command=command
            )

        return process.returncode, stderr_text

    def _run_backend_command(self, command, stage, working_directory=None):
        old_cwd = self.base_dir
        self.base_dir = working_directory or self.base_dir
        try:
            self._run_command(command, stage)
        finally:
            self.base_dir = old_cwd

    def _ensure_interpolator_backend(self):
        """Initialize (or fall back) the interpolator backend once per task.

        If backend_mode=native and initialization/model-load fails, falls back
        to CLI within the same task. The fallback is one-time only; if CLI
        also fails the error propagates normally.
        """
        # Already on CLI after a previous fallback — just ensure it is ready.
        if self._active_backend == "cli":
            if not self._interpolator_backend.initialized:
                self._interpolator_backend.initialize()
            model_path = self.RIFE_MODEL or ""
            if self._interpolator_backend.model_path != model_path:
                self._interpolator_backend.load_model(model_path)
            return

        # Try Native.
        try:
            if not self._interpolator_backend.initialized:
                self._interpolator_backend.initialize()
            model_path = self.RIFE_MODEL or ""
            if self._interpolator_backend.model_path != model_path:
                self._interpolator_backend.load_model(model_path)
                self._pending_native_model_loads += 1
        except (BackendError, NativeFallback, BackendNotImplementedError) as exc:
            self._switch_to_cli(exc, "backend_initialize")

    def _release_backend(self) -> None:
        """Release the active backend without masking the task's primary result."""
        backend = self._interpolator_backend
        backend_name = getattr(backend, "name", self._active_backend)
        try:
            backend.release()
        except Exception as exc:
            self.lifecycle.record_release_failure(exc, backend_name)
            self.log_output.emit(
                f"BACKEND RELEASE FAILED:\nbackend={backend_name}\nreason={exc}"
            )
        else:
            self.lifecycle.mark_released(backend_name)

    def _switch_to_cli(self, reason: str | BaseException, stage: str = "native_backend") -> None:
        """Switch from Native to CLI backend within the current task."""
        if self._active_backend == "cli":
            return  # Already on CLI, nothing to do.
        exc = reason if isinstance(reason, BaseException) else BackendError(str(reason), stage=stage)
        failure = self.lifecycle.record_fallback(exc, stage)
        self.log_output.emit(
            "NATIVE BACKEND FAILED\n"
            "FALLBACK TO CLI\n"
            f"failure_stage={failure.stage}\n"
            f"error_code={failure.code}\n"
            f"reason={failure.message}"
        )
        self._release_backend()
        self._fallback_occurred = True
        self._fallback_reason = failure.message[:200]
        self._active_backend = "cli"
        # Build a fresh CLI backend — it shares the same command runner.
        self._interpolator_backend = create_interpolator_backend(
            "cli",
            executable=self.RIFE_EXE or "",
            working_directory=self.RIFE_DIR or self.base_dir,
            command_runner=self._run_backend_command,
            log_callback=self.log_output.emit,
        )
        # Mark backend as needing init so _ensure_interpolator_backend will set it up.
        self._interpolator_backend.initialized = False
        self._interpolator_backend.model_path = ""
        self.log_output.emit(
            "BACKEND CONFIG:\n"
            f"mode=cli\n"
            f"requested_backend={self._requested_backend}\n"
            f"active_backend=cli\n"
            f"fallback=native_to_cli\n"
            f"reason={self._fallback_reason}"
        )

    @staticmethod
    def _has_png_frames(directory):
        try:
            return next(Path(directory).glob("*.png"), None) is not None
        except OSError:
            return False

    @staticmethod
    def _count_png_frames(directory):
        try:
            return sum(1 for _ in Path(directory).glob("*.png"))
        except OSError:
            return 0

    def _probe_fps(self, video_path):
        if not self.FFPROBE:
            return 30.0
        try:
            process = subprocess.run(
                [
                    self.FFPROBE, "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=avg_frame_rate,r_frame_rate",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    video_path,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.DEVNULL,
                creationflags=CREATE_NO_WINDOW if os.name == "nt" else 0,
                cwd=self.base_dir,
                check=False,
            )
            lines = [
                line.strip()
                for line in (process.stdout or b"").decode("utf-8", "replace").splitlines()
                if line.strip() and line.strip() != "0/0"
            ]
            for rate in lines:
                if "/" in rate:
                    num, den = rate.split("/", 1)
                    den_f = float(den)
                    if den_f > 0:
                        fps = float(num) / den_f
                        if fps > 1:
                            return fps
                else:
                    fps = float(rate)
                    if fps > 1:
                        return fps
        except (OSError, ValueError, subprocess.SubprocessError):
            pass
        return 30.0

    def _probe_video_size(self, video_path):
        """Return (width, height) via ffprobe; (0, 0) on failure."""
        if not self.FFPROBE:
            return 0, 0
        try:
            process = subprocess.run(
                [
                    self.FFPROBE, "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height",
                    "-of", "csv=p=0:s=x",
                    video_path,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.DEVNULL,
                creationflags=CREATE_NO_WINDOW if os.name == "nt" else 0,
                cwd=self.base_dir,
                check=False,
            )
            text = (process.stdout or b"").decode("utf-8", "replace").strip()
            if "x" in text:
                w_s, h_s = text.split("x", 1)
                return int(w_s), int(h_s)
        except (OSError, ValueError, subprocess.SubprocessError):
            pass
        return 0, 0

    def _effective_rife_thread_config(self):
        """Resolution-aware -j; auto-lower for 2160p+."""
        cfg = resolve_rife_thread_config(
            self.params.get("rife_thread_config"),
            width=self._source_width,
            height=self._source_height,
        )
        self.params["rife_thread_config"] = cfg
        return cfg

    def _add_rife_io_time(self, elapsed: float) -> None:
        with self._rife_stats_lock:
            self._rife_pipeline_stats.io_time += float(elapsed)

    def _safe_cleanup(self, temp_dir):
        if not temp_dir or not os.path.exists(temp_dir):
            return

        for attempt in range(4):
            try:
                shutil.rmtree(temp_dir)
                self.log_output.emit("  🧹 本条视频临时缓存文件已自动清理")
                return
            except OSError as exc:
                if attempt == 3:
                    self.log_output.emit(f"  ⚠️ 临时缓存清理失败，可手动删除：{temp_dir}；原因：{exc}")
                else:
                    time.sleep(0.25 * (attempt + 1))

    def _update_progress(self, file_index, completed_steps, step_percent=100):
        total_files = max(len(self.file_list), 1)
        file_weight = 100.0 / total_files
        progress = (
            file_index * file_weight
            + completed_steps * (file_weight / 4.0)
            + (step_percent / 100.0) * (file_weight / 4.0)
        )
        self.progress_updated.emit(max(0, min(int(progress), 100)))

    def _log_effective_config(self):
        """Emit final params so UI settings can be verified against execution."""
        p = self.params
        model_label = (
            p.get("selected_model")
            or os.path.basename(str(self.RIFE_MODEL or "").rstrip("\\/"))
            or str(p.get("model") or "unknown")
        )
        reason = p.get("model_select_reason") or (
            "user_selected" if (p.get("rife_model") or p.get("model")) else "default_general_model"
        )
        self.log_output.emit(
            "MODEL CONFIG:\n"
            f"input_type={p.get('input_type', 'unknown')}\n"
            f"selected_model={model_label}\n"
            f"reason={reason}"
        )
        thread_cfg = self._effective_rife_thread_config()
        self.log_output.emit(
            "RIFE CONFIG:\n"
            f"model={model_label}\n"
            f"gpu={p.get('gpu', 'auto')}\n"
            f"thread_config={thread_cfg}"
        )
        self.log_output.emit(
            "PIPELINE CONFIG:\n"
            f"mode={p.get('pipeline_mode', 'disk')}\n"
            f"queue_size={p.get('queue_size', 32)}\n"
            f"worker_count={p.get('worker_count', 1)}"
        )
        self.log_output.emit(
            "BACKEND CONFIG:\n"
            f"mode={self._interpolator_backend.name}\n"
            f"requested_backend={self._requested_backend}\n"
            f"active_backend={self._active_backend}\n"
            f"fallback={'native_to_cli' if self._fallback_occurred else 'none'}\n"
            f"reason={self._fallback_reason or 'initial'}"
        )
        codec_text = str(p.get("codec") or "")
        if "H.265" in codec_text or "HEVC" in codec_text:
            encoder, enc_reason = select_hevc_encoder(
                self.FFMPEG, p.get("encoder_mode", "auto")
            )
            self.log_output.emit(
                "ENCODER CONFIG:\n"
                f"hardware_encoder={encoder}\n"
                f"reason={enc_reason}"
            )
        sr = p.get("srModel") or "none"
        if not p.get("superResolution", True) or p.get("scale") == "原始":
            sr = "none"
        self.log_output.emit(
            "任务开始：\n"
            f"model={model_label}\n"
            f"gpu={p.get('gpu', 'auto')}\n"
            f"precision={p.get('precision', 'fp16')}\n"
            f"quality={p.get('quality', '')}\n"
            f"srModel={sr}\n"
            f"resolution={p.get('resolution', p.get('scale', ''))}\n"
            f"fps={p.get('fps', '')}\n"
            f"codec={p.get('codec', '')}\n"
            f"crf={p.get('crf', '')}"
        )

    def _run_rife(self, input_dir, output_dir, target_frames):
        """Run RIFE on a PNG folder, with automatic CLI fallback on Native failure."""
        self._ensure_interpolator_backend()
        os.makedirs(output_dir, exist_ok=True)
        input_frames = self._count_png_frames(input_dir)
        thread_cfg = self._effective_rife_thread_config()
        self.log_output.emit(
            f"  ↳ RIFE -j {thread_cfg} | -g {self.params.get('gpu', 'auto')} | "
            f"{self._source_width}x{self._source_height}"
        )
        monitor = RifeProcessMonitor(output_dir, self.params.get("gpu", 0))
        monitor.start()
        try:
            self._interpolator_backend.process_directory(
                input_dir,
                output_dir,
                target_frames=int(target_frames),
                gpu=self.params.get("gpu"),
                thread_config=thread_cfg,
            )
        except (BackendError, BackendNotImplementedError) as exc:
            # Only attempt fallback once per task.
            if self._active_backend == "native":
                monitor.stop()
                self._switch_to_cli(exc, "backend_process")
                # Re-initialize CLI backend now that we've switched.
                if not self._interpolator_backend.initialized:
                    self._interpolator_backend.initialize()
                self._interpolator_backend.load_model(self.RIFE_MODEL or "")
                # Restart monitor for CLI run.
                monitor = RifeProcessMonitor(output_dir, self.params.get("gpu", 0))
                monitor.start()
                self._interpolator_backend.process_directory(
                    input_dir,
                    output_dir,
                    target_frames=int(target_frames),
                    gpu=self.params.get("gpu"),
                    thread_config=thread_cfg,
                )
            else:
                raise
        finally:
            startup, inference, gpu_total, gpu_count = monitor.stop()
            stats = self._rife_pipeline_stats
            stats.process_count += 1
            if stats.model_load_count is None:
                stats.model_load_count = 0
            if self._active_backend == "cli":
                stats.model_load_count += 1
            stats.startup_time += startup
            stats.inference_time += inference
            stats.gpu_sample_total += gpu_total
            stats.gpu_sample_count += gpu_count
            # Phase D3: accumulate native batch call-boundary stats per scene.
            if self._active_backend == "native":
                backend_stats = getattr(self._interpolator_backend, "stats", None)
                if callable(backend_stats):
                    stats.accumulate_native_stats(backend_stats())
                reset = getattr(self._interpolator_backend, "reset_stats", None)
                if callable(reset):
                    reset()
        if not self._has_png_frames(output_dir):
            raise RuntimeError("RIFE produced no PNG frames")
        output_frames = self._count_png_frames(output_dir)
        self._rife_pipeline_stats.total_frames += output_frames
        self.log_output.emit(
            f"  ↳ RIFE process {self._rife_pipeline_stats.process_count}: "
            f"input_frames={input_frames} | target_frames={int(target_frames)} | "
            f"output_frames={output_frames} | startup_time={startup:.3f}s | "
            f"inference_time={inference:.3f}s"
        )

    def _interpolate_with_svfi_opts(self, work_frames, frame_rife, source_fps, target_fps, original_count):
        """
        SVFI-style path:
        1) optional duplicate removal
        2) optional scene-cut aware segmented interpolation
        3) otherwise single-pass RIFE to target frame count
        """
        self._rife_pipeline_stats = RifePipelineStats()
        self._rife_pipeline_stats.model_load_count = self._pending_native_model_loads
        self._pending_native_model_loads = 0
        enable_dedup = bool(self.params.get("enable_dedup", True))
        enable_scdet = bool(self.params.get("enable_scdet", True))
        dedup_threshold = float(self.params.get("dedup_threshold", 1.5))
        scdet_threshold = float(self.params.get("scdet_threshold", 12.0))

        active_frames = work_frames
        if enable_dedup:
            dedup_started_at = time.perf_counter()
            dedup_dir = os.path.join(os.path.dirname(work_frames), "dedup_frames")
            os.makedirs(dedup_dir, exist_ok=True)
            kept, _ = remove_duplicate_frames(
                work_frames,
                dedup_dir,
                threshold=dedup_threshold,
                log=self.log_output.emit,
            )
            if kept <= 0:
                raise RuntimeError("去重后没有剩余帧")
            self._add_rife_io_time(time.perf_counter() - dedup_started_at)
            active_frames = dedup_dir
        else:
            self.log_output.emit("  ↳ 去重帧: 已关闭")

        unique_count = self._count_png_frames(active_frames)
        # Duration follows the original clip, not the deduped count.
        target_frame_count = compute_target_frame_count(original_count, source_fps, target_fps)
        target_frame_count = max(target_frame_count, unique_count + (1 if target_fps > source_fps else 0))

        model_name = os.path.basename(self.RIFE_MODEL) if self.RIFE_MODEL else "rife-v4.6"

        if enable_scdet and unique_count >= 2:
            cuts = detect_scene_cuts(
                active_frames,
                threshold=scdet_threshold,
                log=self.log_output.emit,
            )
            segments = build_segments(unique_count, cuts)
        else:
            if not enable_scdet:
                self.log_output.emit("  ↳ 场景检测: 已关闭")
            segments = [(0, unique_count)]

        lengths = [end - start for start, end in segments]
        out_counts = allocate_output_counts(lengths, target_frame_count)

        self.log_output.emit(
            f"  [2/4] RIFE interpolate -> {target_fps:g}fps "
            f"({original_count}src / {unique_count}unique -> {sum(out_counts)} frames | "
            f"scenes:{len(segments)} | model:{model_name})"
        )

        if len(segments) == 1:
            self._run_rife(active_frames, frame_rife, out_counts[0])
            self.log_output.emit(
                RifeWorkerStats(
                    worker_start=1,
                    scene_count=1,
                    model_reload_count=1 if self._active_backend == "cli" else 0,
                    scene_process_count=1,
                ).format_log()
            )
        else:
            scene_root = os.path.join(os.path.dirname(work_frames), "scenes")
            os.makedirs(scene_root, exist_ok=True)
            active_paths = frame_paths(active_frames)
            next_index = 1
            scene_tasks = []
            for scene_i, ((start, end), out_n) in enumerate(zip(segments, out_counts), start=1):
                scene_in = os.path.join(scene_root, f"in_{scene_i:03d}")
                scene_out = os.path.join(scene_root, f"out_{scene_i:03d}")
                if os.path.isdir(scene_in):
                    shutil.rmtree(scene_in, ignore_errors=True)
                if os.path.isdir(scene_out):
                    shutil.rmtree(scene_out, ignore_errors=True)
                input_paths = tuple(active_paths[start:end])
                try:
                    scene_gpu = int(self.params.get("gpu", 0))
                except (TypeError, ValueError):
                    scene_gpu = 0
                scene_tasks.append(SceneTask(
                    scene_index=scene_i,
                    input_frames=input_paths,
                    input_path=scene_in,
                    output_path=scene_out,
                    final_output_path=frame_rife,
                    output_start_index=next_index,
                    target_frames=out_n,
                    model=self.RIFE_MODEL or "",
                    gpu=scene_gpu,
                    resolution=(self._source_width, self._source_height),
                    requires_inference=len(input_paths) > 1 and out_n > len(input_paths),
                ))
                next_index += out_n if len(input_paths) > 1 and out_n > len(input_paths) else len(input_paths)

            def stage_scene(task):
                copied, stage_time, copy_fallbacks = stage_frame_range(
                    task.input_frames, task.input_path, 0, len(task.input_frames)
                )
                self._add_rife_io_time(stage_time)
                if copied != len(task.input_frames):
                    raise RuntimeError(
                        f"scene {task.scene_index} staged {copied} frames; "
                        f"expected {len(task.input_frames)}"
                    )
                self.log_output.emit(
                    f"    · 场景 {task.scene_index}/{len(scene_tasks)}: "
                    f"{copied} -> {task.target_frames} frames "
                    f"(staging_copy_fallbacks={copy_fallbacks})"
                )

            def process_scene(task):
                self._run_rife(task.input_path, task.output_path, task.target_frames)
                return SceneProcessResult(model_loaded=self._active_backend == "cli")

            def collect_scene(task):
                source = task.output_path if task.requires_inference else task.input_path
                written, collect_time, _ = collect_frames(
                    source, task.final_output_path, start_index=task.output_start_index
                )
                self._add_rife_io_time(collect_time)
                expected = task.target_frames if task.requires_inference else len(task.input_frames)
                if written != expected:
                    raise RuntimeError(
                        f"scene {task.scene_index} produced {written} frames; expected {expected}"
                    )

            manager = RifeWorkerManager(queue_size=2)
            worker_stats = manager.run(
                scene_tasks,
                stage=stage_scene,
                process=process_scene,
                collect=collect_scene,
                ensure_running=self._ensure_running,
            )
            self.log_output.emit(worker_stats.format_log())

        produced = self._count_png_frames(frame_rife)
        self.log_output.emit(f"  rife output frames: {produced}")
        self.log_output.emit(self._rife_pipeline_stats.format_log())
        return produced

    def _process_file(self, index, file_path, temp_root):
        self._ensure_running()

        file_name = os.path.basename(file_path)
        file_dir = os.path.dirname(file_path)
        name_no_ext, ext = os.path.splitext(file_name)
        safe_name = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff_-]+", "_", name_no_ext)[:60] or "video"
        temp_dir = tempfile.mkdtemp(prefix=f"{safe_name}_", dir=temp_root)
        self._current_temp_dir = temp_dir

        frame_raw = os.path.join(temp_dir, "raw_frames")
        frame_rife = os.path.join(temp_dir, "rife_frames")
        frame_sr = os.path.join(temp_dir, "sr_frames")
        audio_path = os.path.join(temp_dir, "audio.m4a")

        try:
            for directory in (frame_raw, frame_rife, frame_sr):
                os.makedirs(directory, exist_ok=False)

            target_dir = file_dir if self.same_as_src else self.out_path
            if not target_dir:
                raise OSError("输出目录为空")
            os.makedirs(target_dir, exist_ok=True)

            out_file_name = f"{name_no_ext}_enhanced{ext}"
            out_file_path = reserve_output_path(target_dir, out_file_name)
            if os.path.basename(out_file_path) != out_file_name:
                self.log_output.emit(
                    f"  ⚠️ 输出文件已存在，使用安全文件名：{os.path.basename(out_file_path)}"
                )
            target_fps = float(self.params["fps"])
            task_type = str(self.params.get("task_type") or "both")
            scale_val = self.params["scale"]
            target_codec = self.params["codec"]
            keep_audio = bool(self.params.get("keep_audio", True))
            crf = int(self.params.get("crf", 18))
            encode_preset = self.params.get("encode_preset", "medium")
            scale_factor = 1
            if scale_val != "原始":
                try:
                    scale_factor = int(scale_val.lower().replace("x", "").strip())
                except (TypeError, ValueError):
                    scale_factor = 2

            source_fps = self._probe_fps(file_path)
            if task_type == "sr":
                target_fps = source_fps
                self.params["fps"] = str(source_fps)
            self._source_width, self._source_height = self._probe_video_size(file_path)
            media_contract = probe_media_contract(self.FFPROBE, file_path)
            self.log_output.emit(
                "MEDIA CONTRACT:\n"
                + json.dumps(media_contract.as_dict(), ensure_ascii=False, sort_keys=True)
            )
            for warning in media_contract.warnings:
                self.log_output.emit(f"  ⚠️ FORMAT POLICY: {warning}")
            if self.runtime_config.pipeline_mode == "disk":
                estimated_source_frames = max(1, media_contract.frame_count)
                estimated_target_count = compute_target_frame_count(
                    estimated_source_frames, source_fps, target_fps
                )
                disk_estimate = estimate_disk_space(
                    temp_root,
                    self._source_width,
                    self._source_height,
                    estimated_source_frames,
                    estimated_target_count,
                    scale_factor=scale_factor,
                )
                self.disk_estimates.append(disk_estimate.as_dict())
                self.log_output.emit(
                    "DISK CAPACITY:\n"
                    + json.dumps(disk_estimate.as_dict(), ensure_ascii=False, sort_keys=True)
                )
                require_disk_space(disk_estimate)
            self.params["rife_thread_config"] = self._effective_rife_thread_config()
            self.log_output.emit(f"▶ [{index + 1}/{len(self.file_list)}] 开始处理: {file_name}")
            self.log_output.emit(
                f"  ↳ 源分辨率: {self._source_width}x{self._source_height} | "
                f"RIFE -j {self.params.get('rife_thread_config')}"
            )

            if self.params.get("pipeline_mode", "disk") == "memory":
                memory_result = []
                consumed = decode_and_consume(
                    self.FFMPEG,
                    file_path,
                    self._source_width,
                    self._source_height,
                    queue_size=self.params.get("queue_size", 32),
                    worker_count=self.params.get("worker_count", 1),
                    fps=source_fps,
                    stop_event=self._stop_event,
                    stats_callback=memory_result.append,
                )
                self._ensure_running()
                self.log_output.emit(f"  memory frame pipeline consumed {consumed} frames (RIFE not connected)")
                if memory_result:
                    self.log_output.emit(
                        "FRAME PIPELINE RESULT:\n"
                        + json.dumps(memory_result[0].__dict__, ensure_ascii=False, sort_keys=True)
                    )
                return out_file_path
            self.log_output.emit(
                f"  ↳ 参数: {target_fps:g}fps | {scale_val}超分 | {target_codec} | CRF {crf} | "
                f"去重={'开' if self.params.get('enable_dedup', True) else '关'} | "
                f"场景={'开' if self.params.get('enable_scdet', True) else '关'}"
            )

            # 1/4：音频提取失败不阻止无声视频继续处理。
            self.log_output.emit("  [1/4] FFmpeg 提取音频、拆分视频原始帧")
            # Early tick so UI is not stuck at 0% during long FFmpeg extract
            self._update_progress(index, 0, step_percent=8)
            has_audio = False
            if keep_audio:
                audio_return_code, _ = self._run_command(
                    [
                        self.FFMPEG, "-y", "-i", file_path,
                        "-vn", "-map", "0:a:0?", "-c:a", "aac", "-b:a", "192k", audio_path
                    ],
                    "FFmpeg 音频提取",
                    allow_failure=True
                )
                has_audio = (
                    audio_return_code == 0
                    and os.path.isfile(audio_path)
                    and os.path.getsize(audio_path) > 0
                )
                if not has_audio:
                    self.log_output.emit("  ⚠️ 未检测到可复制音轨，将按无声视频继续处理")
            else:
                self.log_output.emit("  ↳ 已关闭保留音轨")

            self._run_command(
                [
                    self.FFMPEG, "-y", "-i", file_path,
                    "-vsync", "0", "-qscale:v", "1",
                    os.path.join(frame_raw, "%08d.png")
                ],
                "FFmpeg 视频抽帧"
            )
            if not self._has_png_frames(frame_raw):
                raise RuntimeError("FFmpeg 抽帧完成后未生成任何 PNG 帧")
            original_count = self._count_png_frames(frame_raw)
            self._update_progress(index, 0)

            # 2/4：SVFI 风格去重 + 场景分段 + RIFE
            self.log_output.emit("  [2/4] RIFE 插帧处理中…")
            self._update_progress(index, 1, step_percent=8)
            if task_type == "sr":
                shutil.copytree(frame_raw, frame_rife, dirs_exist_ok=True)
                self.log_output.emit("  [2/4] 仅超分任务，跳过 RIFE 补帧")
            else:
                self._interpolate_with_svfi_opts(
                    frame_raw, frame_rife, source_fps, target_fps, original_count
                )
            self._update_progress(index, 1)

            # 3/4：按原参数选择是否运行 Real-ESRGAN Vulkan。
            if task_type == "interp":
                self.log_output.emit("  [3/4] 仅补帧任务，跳过 Real-ESRGAN 超分")
                use_frame_dir = frame_rife
            elif scale_val != "原始":
                scale_num = scale_val.lower().replace("x", "").strip()
                if scale_num not in ("2", "3", "4"):
                    scale_num = "2"
                sr_ui = self.params.get("srModel") or "realesrgan"
                sr_name = resolve_sr_model_name(sr_ui)
                self.log_output.emit(
                    f"  [3/4] Real-ESRGAN {scale_num}x (srModel={sr_ui} → {sr_name})"
                )
                esgan_cmd = [
                    self.ESGAN_EXE,
                    "-i", frame_rife,
                    "-o", frame_sr,
                    "-s", scale_num,
                    "-n", str(sr_name),
                    "-f", "png",
                ]
                if self.MODELS_DIR:
                    esgan_cmd.extend(["-m", self.MODELS_DIR])
                if "gpu" in self.params and self.params.get("gpu") is not None:
                    esgan_cmd.extend(["-g", str(int(self.params["gpu"]))])
                self._run_command(esgan_cmd, "Real-ESRGAN Vulkan")
                if not self._has_png_frames(frame_sr):
                    raise RuntimeError("图片超分完成后未生成任何 PNG 帧")
                use_frame_dir = frame_sr
            else:
                self.log_output.emit("  [3/4] 原始分辨率，跳过超分步骤")
                use_frame_dir = frame_rife
            self._update_progress(index, 2)

            # 4/4：帧序列与可用音轨合成最终视频。
            self.log_output.emit("  [4/4] FFmpeg 封装合成最终视频文件")
            # 10-bit HEVC may carry HDR; do not force BT.709 tags on that path.
            is_hevc_10bit = (
                ("H.265" in target_codec or "HEVC" in target_codec)
                and ("10bit" in target_codec or "10-bit" in target_codec)
            )
            use_sdr_bt709 = "ProRes" not in target_codec and not is_hevc_10bit
            if "H.265" in target_codec or "HEVC" in target_codec:
                encoder, enc_reason = select_hevc_encoder(
                    self.FFMPEG, self.params.get("encoder_mode", "auto")
                )
                self.log_output.emit(
                    "ENCODER CONFIG:\n"
                    f"hardware_encoder={encoder}\n"
                    f"reason={enc_reason}"
                )
                codec_arg = hevc_encoder_quality_args(
                    encoder, crf, encode_preset, ten_bit=is_hevc_10bit
                )
            elif "AV1" in target_codec:
                codec_arg = [
                    "-c:v", "libsvtav1",
                    "-crf", str(max(crf, 20)),
                    "-preset", "6",
                    "-pix_fmt", "yuv420p",
                ]
            elif "ProRes" in target_codec:
                codec_arg = ["-c:v", "prores_ks", "-profile:v", "2"]
            else:
                raise ValueError(f"不支持的视频编码：{target_codec}")

            ffmpeg_merge = [
                self.FFMPEG, "-y",
                "-framerate", str(target_fps),
                "-i", os.path.join(use_frame_dir, "%08d.png")
            ]
            if has_audio:
                ffmpeg_merge.extend(["-i", audio_path])
            # PNG frames are full-range RGB; convert to limited-range BT.709 YUV
            # and tag the stream so players do not guess colorspace.
            ffmpeg_merge.extend(["-vf", build_output_video_filter(use_sdr_bt709)])
            if use_sdr_bt709:
                ffmpeg_merge.extend([
                    "-colorspace", "bt709",
                    "-color_primaries", "bt709",
                    "-color_trc", "bt709",
                    "-color_range", "tv",
                ])
            ffmpeg_merge.extend(codec_arg)
            if "ProRes" not in target_codec and "-pix_fmt" not in codec_arg:
                ffmpeg_merge.extend(["-pix_fmt", "yuv420p"])
            if has_audio:
                ffmpeg_merge.extend([
                    "-c:a", "aac", "-b:a", "192k",
                    "-map", "0:v:0", "-map", "1:a:0", "-shortest"
                ])
            else:
                ffmpeg_merge.extend(["-an"])
            ffmpeg_merge.append(out_file_path)

            self._run_command(ffmpeg_merge, "FFmpeg 视频合成")
            try:
                validation = validate_output_video(self.FFPROBE, out_file_path)
                expected_width = self._source_width * scale_factor
                expected_height = self._source_height * scale_factor
                expected_width += expected_width % 2
                expected_height += expected_height % 2
                expected_frames = self._count_png_frames(use_frame_dir)
                if (validation.width, validation.height) != (expected_width, expected_height):
                    raise RuntimeError(
                        f"输出尺寸校验失败：{validation.width}x{validation.height}，"
                        f"预期 {expected_width}x{expected_height}"
                    )
                if validation.frame_count != expected_frames:
                    raise RuntimeError(
                        f"输出帧数校验失败：{validation.frame_count}，预期 {expected_frames}"
                    )
                if abs(validation.fps - target_fps) > 0.01:
                    raise RuntimeError(
                        f"输出 FPS 校验失败：{validation.fps}，预期 {target_fps}"
                    )
                if has_audio and validation.audio_stream_count < 1:
                    raise RuntimeError("输出音频校验失败：音轨丢失")
            except Exception:
                if os.path.isfile(out_file_path):
                    invalid_path = reserve_output_path(
                        target_dir, os.path.basename(out_file_path) + ".invalid"
                    )
                    os.replace(out_file_path, invalid_path)
                    self.log_output.emit(f"  ⚠️ 无效输出已隔离：{invalid_path}")
                raise
            self.completed_outputs.append(out_file_path)
            self.output_validations.append(validation.as_dict())
            self.log_output.emit(
                "OUTPUT VALIDATION:\n"
                + json.dumps(validation.as_dict(), ensure_ascii=False, sort_keys=True)
            )

            self._update_progress(index, 3)
            self.log_output.emit(f"  ✅ 渲染完成！输出路径：{out_file_path}\n")
            return out_file_path
        except Exception:
            raise

    def run(self):
        failed_count = 0
        completed_count = 0
        current_temp_dir = None
        early_result = None

        try:
            self.lifecycle.transition(TaskState.VALIDATING)
            self.log_output.emit(f"TASK CONFIG:\ntask_id={self.task_id}")
            self.log_output.emit(
                "runtime_config="
                + json.dumps(self.runtime_config.as_dict(), ensure_ascii=False, sort_keys=True)
            )
            self._validate_environment()
            self.lifecycle.transition(TaskState.INITIALIZING)
            if self.runtime_config.pipeline_mode == "disk":
                self._ensure_interpolator_backend()
            else:
                self.log_output.emit(
                    "BACKEND INIT:\nstatus=skipped\nreason=memory_pipeline_validation_only"
                )
            temp_root = self._prepare_temp_root()
            self.lifecycle.transition(TaskState.RUNNING)
            self.log_output.emit("🚀 [环境自检] FFmpeg: 就绪 | RIFE Vulkan: 就绪 | Real-ESRGAN: 就绪")
            if self.file_list:
                self._source_width, self._source_height = self._probe_video_size(
                    self.file_list[0]
                )
            self._log_effective_config()
            self.log_output.emit(
                f"📂 [输出配置] 目标路径: {'源文件目录' if self.same_as_src else self.out_path}"
            )
            self.log_output.emit(
                f"🧹 [缓存策略] 渲染完成后{'自动清理' if self.clean_cache else '保留'}临时文件\n"
            )

            for index, file_path in enumerate(self.file_list):
                self._ensure_running()
                self._current_temp_dir = None
                try:
                    self._process_file(index, file_path, temp_root)
                    completed_count += 1
                except TaskCancelled:
                    raise
                except Exception as exc:
                    failed_count += 1
                    self.lifecycle.record_failure(exc, "video_process")
                    self._emit_failure_detail(
                        f"文件 [{index + 1}/{len(self.file_list)}] {file_path}",
                        exc,
                    )
                finally:
                    current_temp_dir = self._current_temp_dir
                    if current_temp_dir:
                        if self.clean_cache:
                            self._safe_cleanup(current_temp_dir)
                        else:
                            self.log_output.emit(f"  📦 已保留临时缓存：{current_temp_dir}")
                    self._current_temp_dir = None

            self._ensure_running()
            if failed_count == 0:
                self.progress_updated.emit(100)
                self.lifecycle.transition(TaskState.SUCCEEDED)
            else:
                self.lifecycle.transition(TaskState.FAILED)
        except TaskCancelled as exc:
            self.lifecycle.record_failure(exc, "cancel")
            self.lifecycle.transition(TaskState.CANCELLED)
            early_result = (False, "⏹ 任务已被用户取消，后台子进程已终止")
        except Exception as exc:
            self.lifecycle.record_failure(exc, "task_initialize")
            self.lifecycle.transition(TaskState.FAILED)
            self._emit_failure_detail("任务初始化 / 环境自检", exc)
            summary = f"任务启动失败：{type(exc).__name__}: {exc}"
            early_result = (False, summary)
        finally:
            self._release_backend()
            with self._process_lock:
                process = self._active_process
            self._terminate_process_tree(process)
            self.log_output.emit(
                "TASK RESULT:\n"
                + json.dumps(self.lifecycle.snapshot(), ensure_ascii=False, sort_keys=True)
            )

        if early_result is not None:
            self._write_task_report()
            self.task_finished.emit(*early_result)
            return

        if self.clean_cache:
            self.log_output.emit("\n🧹 [系统] 全部任务缓存清理完毕，磁盘空间已释放")

        if failed_count:
            self._write_task_report()
            summary = f"处理结束：成功 {completed_count} 个，失败 {failed_count} 个"
            if self._last_failure_detail:
                summary = f"{summary}\n{self._last_failure_detail.strip()}"
            self.task_finished.emit(False, summary)
        else:
            self._write_task_report()
            if self.runtime_config.pipeline_mode == "memory":
                self.task_finished.emit(
                    True,
                    "✅ Memory Frame Pipeline 验证完成（实验模式，未生成输出视频）",
                )
            else:
                self.task_finished.emit(True, "✅ 所有任务处理完成！")

    def _write_task_report(self):
        target_dir = self.out_path
        if self.same_as_src and self.file_list:
            target_dir = os.path.dirname(self.file_list[0])
        if not target_dir:
            target_dir = os.path.join(self.base_dir, "user_data", "reports")
        payload = {
            "task_id": self.task_id,
            "lifecycle": self.lifecycle.snapshot(),
            "runtime_config": self.runtime_config.as_dict(),
            "inputs": list(self.file_list),
            "outputs": list(self.completed_outputs),
            "output_validations": list(self.output_validations),
            "disk_estimates": list(self.disk_estimates),
            "failure_detail": self._last_failure_detail,
        }
        try:
            self.report_path = write_task_report(target_dir, self.task_id, payload)
            self.log_output.emit(f"TASK REPORT:\npath={self.report_path}")
        except OSError as exc:
            self.log_output.emit(f"TASK REPORT FAILED:\nreason={exc}")

    def stop(self):
        self.is_running = False
        self.lifecycle.transition(TaskState.CANCELLING)
        self._stop_event.set()
        self.requestInterruption()
        with self._process_lock:
            process = self._active_process
        self._terminate_process_tree(process)


# ==========================================
# 3. 主窗口 UI（分区布局 + 外观/预设）
# ==========================================
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setAttribute(Qt.WA_NoSystemBackground, False)
        self.setWindowTitle("RIFE Pro - SVFI Optimized")
        self.resize(1280, 860)
        self.setMinimumSize(1080, 720)
        self._rife_model_map = {}

        self.file_list = []
        self.worker = None
        self.bg_pixmap = None
        self.custom_bg_pixmap = None
        self._bg_image_path = ""
        self._closing = False
        self._acrylic_applied = False
        self._settings = load_settings()
        self._user_presets = load_user_presets()
        self._theme_key = self._settings.get("theme", "liquid")

        self.init_ui()
        self.init_menu()
        self.init_status_bar()
        self._apply_saved_appearance()
        self.refresh_preset_combo(select_name=self._settings.get("last_preset"))
        self.update_background()
        QTimer.singleShot(300, self._startup_env_check)

    def showEvent(self, event):
        super().showEvent(event)
        if not self._acrylic_applied:
            self._acrylic_applied = True
            QTimer.singleShot(0, lambda: enable_windows_acrylic(int(self.winId())))

    def _make_section(self, title):
        box = QFrame()
        box.setObjectName("SectionCard")
        layout = QVBoxLayout(box)
        layout.setContentsMargins(14, 12, 14, 12)
        layout.setSpacing(8)
        label = QLabel(title)
        label.setObjectName("SubTitle")
        layout.addWidget(label)
        return box, layout

    def _make_mid_section(self, title):
        """中间栏分区：轻透底板，露出背景同时保证控件可读。"""
        box = QFrame()
        box.setObjectName("MidSectionCard")
        box.setAttribute(Qt.WA_TranslucentBackground, True)
        layout = QVBoxLayout(box)
        layout.setContentsMargins(14, 12, 14, 12)
        layout.setSpacing(8)
        label = QLabel(title)
        label.setObjectName("SubTitle")
        layout.addWidget(label)
        return box, layout

    def init_menu(self):
        menubar = self.menuBar()
        menubar.setStyleSheet(
            "QMenuBar { background: transparent; color: #fff; }"
            "QMenuBar::item:selected { background: rgba(255,255,255,0.1); border-radius: 4px;}"
        )

        file_menu = menubar.addMenu("文件")
        open_act = QAction("导入视频", self)
        open_act.triggered.connect(self.selectFiles)
        file_menu.addAction(open_act)
        file_menu.addSeparator()
        quit_act = QAction("退出", self)
        quit_act.triggered.connect(self.close)
        file_menu.addAction(quit_act)

        view_menu = menubar.addMenu("外观")
        bg_act = QAction("更换背景图...", self)
        bg_act.triggered.connect(self.change_background)
        view_menu.addAction(bg_act)
        clear_bg = QAction("恢复主题背景", self)
        clear_bg.triggered.connect(self.clear_background)
        view_menu.addAction(clear_bg)
        view_menu.addSeparator()
        for key, meta in THEMES.items():
            act = QAction(meta["label"], self)
            act.triggered.connect(lambda checked=False, k=key: self.set_theme(k))
            view_menu.addAction(act)

        help_menu = menubar.addMenu("帮助")
        about_act = QAction("关于 RIFE", self)
        about_act.triggered.connect(
            lambda: QMessageBox.about(
                self,
                "关于",
                "RIFE Pro · SVFI Optimized\n"
                "分区布局 · 字体/主题/背景 · 预设新建与保存\n"
                "去重帧 / 场景检测 / 分段补帧 / CRF 编码"
            )
        )
        help_menu.addAction(about_act)

    def init_status_bar(self):
        status_bar = self.statusBar()
        status_bar.setSizeGripEnabled(False)
        self.stage_status_label = QLabel("● 当前工序：就绪")
        self.stage_status_label.setObjectName("StageStatus")
        status_bar.addPermanentWidget(self.stage_status_label)
        status_bar.showMessage("GPU: Vulkan  ·  设置保存在 user_data/")
        self._refresh_stage_style("#64D2FF")

    def update_background(self):
        if self.custom_bg_pixmap is not None:
            self.bg_pixmap = self.custom_bg_pixmap
        else:
            theme = THEMES.get(self._theme_key, THEMES["liquid"])
            base = theme.get("spot") or (10, 12, 20)
            self.bg_pixmap = generate_liquid_bg(
                max(self.width(), 1),
                max(self.height(), 1),
                base_rgb=base,
                theme_key=self._theme_key,
            )
        self.update()

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self.update_background()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)
        if self.bg_pixmap:
            scaled = self.bg_pixmap.scaled(
                self.size(), Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation
            )
            x = (self.width() - scaled.width()) // 2
            y = (self.height() - scaled.height()) // 2
            painter.drawPixmap(x, y, scaled)

    def change_background(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "选择背景图片", "", "Images (*.png *.jpg *.jpeg *.bmp *.webp)"
        )
        if not file_path:
            return
        pixmap = QPixmap(file_path)
        if pixmap.isNull():
            QMessageBox.warning(self, "背景加载失败", "所选图片无法读取或格式不受支持。")
            return
        self.custom_bg_pixmap = pixmap
        self._bg_image_path = file_path
        self.bg_path_label.setText(os.path.basename(file_path))
        self._persist_settings()
        self.update_background()
        self.append_log(f"🎨 [外观] 已切换背景图：{os.path.basename(file_path)}")

    def clear_background(self):
        self.custom_bg_pixmap = None
        self._bg_image_path = ""
        self.bg_path_label.setText("使用主题默认背景")
        self._persist_settings()
        self.update_background()
        self.append_log("🎨 [外观] 已恢复主题背景")

    def set_theme(self, theme_key):
        if theme_key not in THEMES:
            return
        self._theme_key = theme_key
        self.theme_combo.blockSignals(True)
        labels = [THEMES[k]["label"] for k in THEMES]
        keys = list(THEMES.keys())
        self.theme_combo.setCurrentIndex(keys.index(theme_key))
        self.theme_combo.blockSignals(False)
        self.apply_styles()
        if not self._bg_image_path:
            self.update_background()
        self._persist_settings()
        self.append_log(f"🎨 [外观] 主题：{THEMES[theme_key]['label']}")

    def init_ui(self):
        central = QWidget()
        central.setObjectName("centralWidget")
        central.setAttribute(Qt.WA_TranslucentBackground)
        self.setCentralWidget(central)

        root = QHBoxLayout(central)
        root.setContentsMargins(16, 16, 16, 16)
        root.setSpacing(14)

        splitter = QSplitter(Qt.Horizontal)
        splitter.setChildrenCollapsible(False)
        root.addWidget(splitter)

        # ---------- 左：输入 ----------
        left = QFrame()
        left.setObjectName("GlassPanel")
        left.setMinimumWidth(300)
        left_l = QVBoxLayout(left)
        left_l.setContentsMargins(14, 14, 14, 14)
        left_l.setSpacing(12)

        input_card, input_l = self._make_section("输入")
        self.drop_area = QLabel("拖拽视频到此处\n或点击选择")
        self.drop_area.setObjectName("DropArea")
        self.drop_area.setAlignment(Qt.AlignCenter)
        self.drop_area.setMinimumHeight(140)
        self.drop_area.setAcceptDrops(True)
        self.drop_area.dragEnterEvent = self.dragEnterEvent
        self.drop_area.dropEvent = self.dropEvent
        self.drop_area.mousePressEvent = lambda e: self.selectFiles()
        input_l.addWidget(self.drop_area)

        self.file_list_label = QLabel("待处理列表 (0)")
        self.file_list_label.setObjectName("SectionHint")
        self.file_list_widget = QTextEdit()
        self.file_list_widget.setReadOnly(True)
        self.file_list_widget.setPlaceholderText("暂无文件...")
        self.file_list_widget.setMinimumHeight(180)
        input_l.addWidget(self.file_list_label)
        input_l.addWidget(self.file_list_widget, 1)

        preset_card, preset_l = self._make_section("工作流预设")
        self.preset_combo = QComboBox()
        preset_l.addWidget(self.preset_combo)

        preset_btns = QHBoxLayout()
        self.btn_apply_preset = AnimatedButton("应用")
        self.btn_apply_preset.clicked.connect(self.apply_selected_preset)
        self.btn_new_preset = AnimatedButton("新建")
        self.btn_new_preset.clicked.connect(self.create_preset)
        self.btn_save_preset = AnimatedButton("保存")
        self.btn_save_preset.clicked.connect(self.save_current_preset)
        self.btn_delete_preset = AnimatedButton("删除")
        self.btn_delete_preset.clicked.connect(self.delete_preset)
        for btn in (
            self.btn_apply_preset,
            self.btn_new_preset,
            self.btn_save_preset,
            self.btn_delete_preset,
        ):
            preset_btns.addWidget(btn)
        preset_l.addLayout(preset_btns)
        hint = QLabel("内置预设可另存为新名称；自定义预设可覆盖保存或删除。")
        hint.setObjectName("SectionHint")
        hint.setWordWrap(True)
        preset_l.addWidget(hint)

        left_l.addWidget(input_card, 3)
        left_l.addWidget(preset_card, 1)

        # ---------- 中：参数 ----------
        mid_wrap = QWidget()
        mid_wrap.setObjectName("MidWrap")
        mid_wrap.setAttribute(Qt.WA_TranslucentBackground, True)
        mid_wrap.setAutoFillBackground(False)
        mid_wrap.setMinimumWidth(420)
        mid_outer = QVBoxLayout(mid_wrap)
        mid_outer.setContentsMargins(0, 0, 0, 0)
        mid_outer.setSpacing(12)

        mid_panel = QFrame()
        # 中间功能栏：透明底板，直接露出壁纸背景
        mid_panel.setObjectName("MidPanel")
        mid_panel.setAttribute(Qt.WA_TranslucentBackground, True)
        mid_panel_l = QVBoxLayout(mid_panel)
        mid_panel_l.setContentsMargins(10, 10, 10, 10)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.NoFrame)
        scroll.setObjectName("ParamScroll")
        scroll.setAttribute(Qt.WA_TranslucentBackground, True)
        scroll.setStyleSheet("QScrollArea#ParamScroll, QScrollArea#ParamScroll > QWidget { background: transparent; border: none; }")
        if scroll.viewport() is not None:
            scroll.viewport().setAutoFillBackground(False)
            scroll.viewport().setAttribute(Qt.WA_TranslucentBackground, True)
            scroll.viewport().setStyleSheet("background: transparent;")
        scroll_inner = QWidget()
        scroll_inner.setObjectName("MidScrollInner")
        scroll_inner.setAttribute(Qt.WA_TranslucentBackground, True)
        scroll_inner.setAutoFillBackground(False)
        scroll_l = QVBoxLayout(scroll_inner)
        scroll_l.setContentsMargins(4, 4, 4, 4)
        scroll_l.setSpacing(10)

        param_card, param_l = self._make_mid_section("处理参数")
        self.fps_combo = self.create_combo(["60 fps", "120 fps", "240 fps"], "插帧目标")
        self.scale_combo = self.create_combo(["原始", "2x 高清", "4x 超清"], "超分倍数")
        model_items = self._discover_model_labels()
        self.model_combo = self.create_combo(model_items or ["自动"], "RIFE 模型")
        self.codec_combo = self.create_combo(
            ["H.265 (HEVC)", "H.265 10bit", "AV1", "ProRes 422"], "输出编码"
        )
        self.crf_combo = self.create_combo(
            ["CRF 14 (高质量)", "CRF 16", "CRF 18 (推荐)", "CRF 20", "CRF 23 (省空间)"],
            "编码质量",
        )
        self.crf_combo["combo"].setCurrentText("CRF 18 (推荐)")
        for item in (
            self.fps_combo,
            self.scale_combo,
            self.model_combo,
            self.codec_combo,
            self.crf_combo,
        ):
            param_l.addLayout(item["layout"])

        svfi_card, svfi_l = self._make_mid_section("SVFI 优化")
        self.chk_dedup = QCheckBox("去除重复/静止帧")
        self.chk_dedup.setChecked(True)
        self.chk_scdet = QCheckBox("场景切换检测")
        self.chk_scdet.setChecked(True)
        self.chk_keep_audio = QCheckBox("保留原声音轨")
        self.chk_keep_audio.setChecked(True)
        svfi_l.addWidget(self.chk_dedup)
        svfi_l.addWidget(self.chk_scdet)
        svfi_l.addWidget(self.chk_keep_audio)
        threshold_layout = QHBoxLayout()
        threshold_layout.addWidget(QLabel("去重阈值"))
        self.dedup_spin = QDoubleSpinBox()
        self.dedup_spin.setRange(0.5, 8.0)
        self.dedup_spin.setSingleStep(0.5)
        self.dedup_spin.setValue(1.5)
        threshold_layout.addWidget(self.dedup_spin)
        threshold_layout.addSpacing(10)
        threshold_layout.addWidget(QLabel("场景阈值"))
        self.scdet_spin = QDoubleSpinBox()
        self.scdet_spin.setRange(4.0, 40.0)
        self.scdet_spin.setSingleStep(1.0)
        self.scdet_spin.setValue(12.0)
        threshold_layout.addWidget(self.scdet_spin)
        threshold_layout.addStretch()
        svfi_l.addLayout(threshold_layout)

        out_card, out_l = self._make_mid_section("输出")
        out_path_layout = QHBoxLayout()
        self.out_path_input = QLineEdit(os.path.expanduser("~/Desktop/RIFE_Output"))
        self.out_path_input.setReadOnly(True)
        btn_select_out = AnimatedButton("选择")
        btn_select_out.setFixedWidth(64)
        btn_select_out.clicked.connect(self.select_output_path)
        out_path_layout.addWidget(self.out_path_input)
        out_path_layout.addWidget(btn_select_out)
        out_l.addLayout(out_path_layout)
        self.chk_same_dir = QCheckBox("输出到源文件目录")
        self.chk_clean_cache = QCheckBox("完成后清理临时缓存")
        self.chk_clean_cache.setChecked(True)
        out_l.addWidget(self.chk_same_dir)
        out_l.addWidget(self.chk_clean_cache)

        scroll_l.addWidget(param_card)
        scroll_l.addWidget(svfi_card)
        scroll_l.addWidget(out_card)
        scroll_l.addStretch(1)
        scroll.setWidget(scroll_inner)
        mid_panel_l.addWidget(scroll)
        mid_outer.addWidget(mid_panel, 3)

        action_card = QFrame()
        action_card.setObjectName("GlassPanel")
        action_l = QVBoxLayout(action_card)
        action_l.setContentsMargins(14, 12, 14, 12)
        action_l.setSpacing(10)
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        btn_layout = QHBoxLayout()
        self.start_btn = AnimatedButton("开始渲染")
        self.start_btn.setObjectName("PrimaryBtn")
        self.start_btn.clicked.connect(self.start_rendering)
        self.stop_btn = AnimatedButton("停止")
        self.stop_btn.clicked.connect(self.stop_rendering)
        self.stop_btn.setEnabled(False)
        btn_layout.addWidget(self.start_btn)
        btn_layout.addWidget(self.stop_btn)
        action_l.addWidget(self.progress_bar)
        action_l.addLayout(btn_layout)
        mid_outer.addWidget(action_card, 0)

        # ---------- 右：外观 + 日志 ----------
        right = QFrame()
        right.setObjectName("GlassPanel")
        right.setMinimumWidth(320)
        right_l = QVBoxLayout(right)
        right_l.setContentsMargins(14, 14, 14, 14)
        right_l.setSpacing(12)

        appear_card, appear_l = self._make_section("外观")
        font_row = QHBoxLayout()
        font_row.addWidget(QLabel("字体"))
        self.font_combo = QFontComboBox()
        self.font_combo.setMaximumWidth(180)
        font_row.addWidget(self.font_combo, 1)
        appear_l.addLayout(font_row)

        size_row = QHBoxLayout()
        size_row.addWidget(QLabel("字号"))
        self.font_size_spin = QSpinBox()
        self.font_size_spin.setRange(11, 20)
        self.font_size_spin.setValue(13)
        size_row.addWidget(self.font_size_spin)
        size_row.addStretch()
        appear_l.addLayout(size_row)

        theme_row = QHBoxLayout()
        theme_row.addWidget(QLabel("主题"))
        self.theme_combo = QComboBox()
        for key, meta in THEMES.items():
            self.theme_combo.addItem(meta["label"], key)
        theme_row.addWidget(self.theme_combo, 1)
        appear_l.addLayout(theme_row)

        opacity_row = QHBoxLayout()
        opacity_row.addWidget(QLabel("透明度"))
        self.glass_opacity_slider = QSlider(Qt.Horizontal)
        self.glass_opacity_slider.setRange(10, 90)
        self.glass_opacity_slider.setValue(32)
        self.glass_opacity_slider.setToolTip("面板玻璃不透明度：越小越透，越大越实")
        self.glass_opacity_label = QLabel("32%")
        self.glass_opacity_label.setMinimumWidth(40)
        opacity_row.addWidget(self.glass_opacity_slider, 1)
        opacity_row.addWidget(self.glass_opacity_label)
        appear_l.addLayout(opacity_row)

        bg_row = QHBoxLayout()
        btn_bg = AnimatedButton("选择背景")
        btn_bg.clicked.connect(self.change_background)
        btn_bg_clear = AnimatedButton("清除")
        btn_bg_clear.clicked.connect(self.clear_background)
        bg_row.addWidget(btn_bg)
        bg_row.addWidget(btn_bg_clear)
        appear_l.addLayout(bg_row)
        self.bg_path_label = QLabel("使用主题默认背景")
        self.bg_path_label.setObjectName("SectionHint")
        self.bg_path_label.setWordWrap(True)
        appear_l.addWidget(self.bg_path_label)

        self.font_combo.currentFontChanged.connect(self._on_font_changed)
        self.font_size_spin.valueChanged.connect(self._on_font_size_changed)
        self.theme_combo.currentIndexChanged.connect(self._on_theme_combo_changed)
        self.glass_opacity_slider.valueChanged.connect(self._on_glass_opacity_changed)

        logs_card, logs_l = self._make_section("日志")
        self.log_text = QTextEdit()
        self.log_text.setObjectName("NormalLog")
        self.log_text.setReadOnly(True)
        self.log_text.document().setMaximumBlockCount(3000)
        self.error_log_text = QTextEdit()
        self.error_log_text.setObjectName("ErrorLog")
        self.error_log_text.setReadOnly(True)
        self.error_log_text.document().setMaximumBlockCount(1000)
        self.error_log_text.setPlaceholderText("当前没有错误")
        log_tabs = QHBoxLayout()
        # stack vertically for clarity
        task_title = QLabel("任务反馈")
        task_title.setObjectName("LogTitle")
        err_title = QLabel("错误")
        err_title.setObjectName("ErrorLogTitle")
        logs_l.addWidget(task_title)
        logs_l.addWidget(self.log_text, 3)
        logs_l.addWidget(err_title)
        logs_l.addWidget(self.error_log_text, 2)

        for log_widget in (self.log_text, self.error_log_text):
            QScroller.grabGesture(log_widget.viewport(), QScroller.LeftMouseButtonGesture)

        right_l.addWidget(appear_card, 0)
        right_l.addWidget(logs_card, 1)

        splitter.addWidget(left)
        splitter.addWidget(mid_wrap)
        splitter.addWidget(right)
        splitter.setStretchFactor(0, 3)
        splitter.setStretchFactor(1, 5)
        splitter.setStretchFactor(2, 4)
        splitter.setSizes([320, 520, 380])

        self.apply_styles()

    def create_combo(self, items, label_text):
        layout = QHBoxLayout()
        layout.setSpacing(8)
        label = QLabel(label_text)
        label.setMinimumWidth(72)
        layout.addWidget(label)
        combo = QComboBox()
        combo.addItems(items)
        layout.addWidget(combo, 1)
        return {"layout": layout, "combo": combo}

    def _discover_model_labels(self):
        tools = resolve_runtime_tools()
        models = tools.get("rife_models") or []
        self._rife_model_map = {}
        labels = []
        for path in models:
            label = os.path.basename(path)
            labels.append(label)
            self._rife_model_map[label] = path
        return labels

    def _selected_rife_model_path(self):
        label = self.model_combo["combo"].currentText()
        mapped = getattr(self, "_rife_model_map", {}).get(label)
        if mapped and os.path.isdir(mapped):
            return mapped
        tools = resolve_runtime_tools()
        return tools.get("rife_model")

    def _parse_crf(self):
        text = self.crf_combo["combo"].currentText()
        match = re.search(r"(\d+)", text)
        return int(match.group(1)) if match else 18

    def _set_combo_text(self, combo_dict, text):
        combo = combo_dict["combo"]
        idx = combo.findText(text)
        if idx >= 0:
            combo.setCurrentIndex(idx)
        else:
            # try prefix match for model names
            for i in range(combo.count()):
                if combo.itemText(i) == text or text in combo.itemText(i):
                    combo.setCurrentIndex(i)
                    return

    def collect_preset_payload(self):
        return {
            "fps": self.fps_combo["combo"].currentText(),
            "scale": self.scale_combo["combo"].currentText(),
            "codec": self.codec_combo["combo"].currentText(),
            "crf": self.crf_combo["combo"].currentText(),
            "model": self.model_combo["combo"].currentText(),
            "enable_dedup": self.chk_dedup.isChecked(),
            "enable_scdet": self.chk_scdet.isChecked(),
            "keep_audio": self.chk_keep_audio.isChecked(),
            "dedup_threshold": float(self.dedup_spin.value()),
            "scdet_threshold": float(self.scdet_spin.value()),
            "same_dir": self.chk_same_dir.isChecked(),
            "clean_cache": self.chk_clean_cache.isChecked(),
            "out_path": self.out_path_input.text(),
        }

    def apply_preset_payload(self, name, payload):
        if not payload:
            return
        self._set_combo_text(self.fps_combo, payload.get("fps", "120 fps"))
        self._set_combo_text(self.scale_combo, payload.get("scale", "原始"))
        self._set_combo_text(self.codec_combo, payload.get("codec", "H.265 (HEVC)"))
        self._set_combo_text(self.crf_combo, payload.get("crf", "CRF 18 (推荐)"))
        model = payload.get("model", "")
        if model and model in self._rife_model_map:
            self._set_combo_text(self.model_combo, model)
        elif model:
            # fallback: pick closest available
            for label in self._rife_model_map:
                if model in label or label in model:
                    self._set_combo_text(self.model_combo, label)
                    break
        self.chk_dedup.setChecked(bool(payload.get("enable_dedup", True)))
        self.chk_scdet.setChecked(bool(payload.get("enable_scdet", True)))
        self.chk_keep_audio.setChecked(bool(payload.get("keep_audio", True)))
        self.dedup_spin.setValue(float(payload.get("dedup_threshold", 1.5)))
        self.scdet_spin.setValue(float(payload.get("scdet_threshold", 12.0)))
        self.chk_same_dir.setChecked(bool(payload.get("same_dir", False)))
        self.chk_clean_cache.setChecked(bool(payload.get("clean_cache", True)))
        out_path = payload.get("out_path")
        if out_path:
            self.out_path_input.setText(out_path)
        self.append_log(f"✨ [预设] 已应用「{name}」")

    def refresh_preset_combo(self, select_name=None):
        names = all_preset_names(self._user_presets)
        current = select_name or self.preset_combo.currentText()
        self.preset_combo.blockSignals(True)
        self.preset_combo.clear()
        self.preset_combo.addItems(names)
        if current in names:
            self.preset_combo.setCurrentText(current)
        elif names:
            self.preset_combo.setCurrentIndex(0)
        self.preset_combo.blockSignals(False)

    def apply_selected_preset(self):
        name = self.preset_combo.currentText().strip()
        payload = get_preset(name, self._user_presets)
        if not payload:
            QMessageBox.warning(self, "预设", f"找不到预设：{name}")
            return
        self.apply_preset_payload(name, payload)
        self._settings["last_preset"] = name
        self._persist_settings()

    def create_preset(self):
        name, ok = QInputDialog.getText(self, "新建预设", "预设名称：")
        if not ok:
            return
        name = name.strip()
        if not name:
            QMessageBox.warning(self, "新建预设", "名称不能为空。")
            return
        if is_builtin_preset(name):
            QMessageBox.warning(self, "新建预设", "不能覆盖内置预设名称，请换一个名字。")
            return
        if name in self._user_presets:
            reply = QMessageBox.question(
                self, "新建预设", f"「{name}」已存在，是否覆盖？",
                QMessageBox.Yes | QMessageBox.No
            )
            if reply != QMessageBox.Yes:
                return
        self._user_presets[name] = self.collect_preset_payload()
        save_user_presets(self._user_presets)
        self.refresh_preset_combo(select_name=name)
        self._settings["last_preset"] = name
        self._persist_settings()
        self.append_log(f"💾 [预设] 已新建「{name}」")

    def save_current_preset(self):
        name = self.preset_combo.currentText().strip()
        if not name:
            self.create_preset()
            return
        if is_builtin_preset(name):
            name, ok = QInputDialog.getText(
                self, "另存预设", "内置预设请另存为新名称：", text=f"{name}-自定义"
            )
            if not ok or not name.strip():
                return
            name = name.strip()
            if is_builtin_preset(name):
                QMessageBox.warning(self, "保存预设", "不能覆盖内置预设名称。")
                return
        self._user_presets[name] = self.collect_preset_payload()
        save_user_presets(self._user_presets)
        self.refresh_preset_combo(select_name=name)
        self._settings["last_preset"] = name
        self._persist_settings()
        self.append_log(f"💾 [预设] 已保存「{name}」")

    def delete_preset(self):
        name = self.preset_combo.currentText().strip()
        if is_builtin_preset(name):
            QMessageBox.information(self, "删除预设", "内置预设不能删除。")
            return
        if name not in self._user_presets:
            return
        reply = QMessageBox.question(
            self, "删除预设", f"确定删除「{name}」？",
            QMessageBox.Yes | QMessageBox.No
        )
        if reply != QMessageBox.Yes:
            return
        del self._user_presets[name]
        save_user_presets(self._user_presets)
        self.refresh_preset_combo()
        self.append_log(f"🗑️ [预设] 已删除「{name}」")

    def _on_font_changed(self, font):
        self._settings["font_family"] = font.family()
        self._apply_app_font()
        self._persist_settings()

    def _on_font_size_changed(self, value):
        self._settings["font_size"] = int(value)
        self._apply_app_font()
        self._persist_settings()

    def _on_theme_combo_changed(self, index):
        key = self.theme_combo.itemData(index)
        if key:
            self.set_theme(key)

    def _on_glass_opacity_changed(self, value):
        opacity = clamp_int(value, 10, 90)
        self._settings["glass_opacity"] = opacity
        self.glass_opacity_label.setText(f"{opacity}%")
        self.apply_styles()
        self._persist_settings()

    def _apply_app_font(self):
        family = self._settings.get("font_family", "Microsoft YaHei UI")
        size = int(self._settings.get("font_size", 13))
        font = QFont(family, size)
        font.setStyleStrategy(QFont.PreferAntialias | QFont.PreferQuality)
        QApplication.instance().setFont(font)
        self.apply_styles()

    def _apply_saved_appearance(self):
        family = self._settings.get("font_family", "Microsoft YaHei UI")
        size = int(self._settings.get("font_size", 13))
        opacity = clamp_int(self._settings.get("glass_opacity", 32), 10, 90)
        self.font_combo.blockSignals(True)
        self.font_size_spin.blockSignals(True)
        self.theme_combo.blockSignals(True)
        self.glass_opacity_slider.blockSignals(True)
        self.font_combo.setCurrentFont(QFont(family))
        self.font_size_spin.setValue(size)
        self.glass_opacity_slider.setValue(opacity)
        self.glass_opacity_label.setText(f"{opacity}%")
        theme = self._settings.get("theme", "liquid")
        keys = list(THEMES.keys())
        if theme in keys:
            self.theme_combo.setCurrentIndex(keys.index(theme))
            self._theme_key = theme
        bg = self._settings.get("background_path") or ""
        if bg and os.path.isfile(bg):
            pix = QPixmap(bg)
            if not pix.isNull():
                self.custom_bg_pixmap = pix
                self._bg_image_path = bg
                self.bg_path_label.setText(os.path.basename(bg))
        self.font_combo.blockSignals(False)
        self.font_size_spin.blockSignals(False)
        self.theme_combo.blockSignals(False)
        self.glass_opacity_slider.blockSignals(False)
        self._apply_app_font()

    def _persist_settings(self):
        self._settings["font_family"] = self.font_combo.currentFont().family()
        self._settings["font_size"] = int(self.font_size_spin.value())
        self._settings["theme"] = self._theme_key
        self._settings["background_path"] = self._bg_image_path or ""
        self._settings["last_preset"] = self.preset_combo.currentText()
        self._settings["glass_opacity"] = clamp_int(
            self.glass_opacity_slider.value() if hasattr(self, "glass_opacity_slider")
            else self._settings.get("glass_opacity", 32),
            10,
            90,
        )
        save_settings(self._settings)

    def apply_styles(self):
        theme = THEMES.get(self._theme_key, THEMES["liquid"])
        accent = theme["accent"]
        accent2 = theme["accent2"]
        accent3 = theme["accent3"]
        text = theme["text"]
        muted = theme["muted"]
        danger = theme["danger"]
        size = int(self._settings.get("font_size", 13))
        glass = glass_palette(theme, self._settings.get("glass_opacity", 32))
        panel = glass["panel"]
        panel2 = glass["panel2"]
        card = glass["card"]
        input_bg = glass["input"]
        log_bg = glass["log"]
        panel_border = glass["border"]
        card_border = glass["card_border"]

        self.setStyleSheet(f"""
            * {{
                color: {text};
                selection-background-color: {accent};
                selection-color: white;
                font-size: {size}px;
            }}
            QMainWindow, QWidget#centralWidget {{
                background: transparent;
            }}
            QWidget#MidWrap {{
                background: transparent;
            }}
            QFrame#GlassPanel {{
                background: qlineargradient(
                    x1:0, y1:0, x2:1, y2:1,
                    stop:0 {panel}, stop:1 {panel2}
                );
                border: 1px solid {panel_border};
                border-radius: 22px;
            }}
            QFrame#MidPanel {{
                background: transparent;
                border: none;
                border-radius: 0px;
            }}
            QFrame#SectionCard, QFrame#MidSectionCard {{
                background: {card};
                border: 1px solid {card_border};
                border-radius: 16px;
            }}
            QScrollArea#ParamScroll {{
                background: transparent;
                border: none;
            }}
            QScrollArea#ParamScroll > QWidget > QWidget {{
                background: transparent;
            }}
            QWidget#MidScrollInner {{
                background: transparent;
            }}
            QLabel {{
                background: transparent;
            }}
            QLabel#SubTitle {{
                color: white;
                font-size: {size + 1}px;
                font-weight: 600;
                padding: 2px 2px 6px 2px;
            }}
            QLabel#SectionHint, QLabel#LogTitle {{
                color: {muted};
                font-size: {max(11, size - 1)}px;
            }}
            QLabel#ErrorLogTitle {{
                color: {danger};
                font-size: {max(11, size - 1)}px;
                font-weight: 600;
            }}
            QLabel#DropArea {{
                color: {muted};
                font-size: {size + 1}px;
                font-weight: 600;
                background: {panel};
                border: 2px dashed rgba(208,222,255,90);
                border-radius: 18px;
                padding: 16px;
            }}
            QLabel#DropArea:hover {{
                color: white;
                border: 2px dashed {accent};
                background: rgba(80,140,255,40);
            }}
            QPushButton {{
                min-height: 22px;
                padding: 7px 12px;
                color: white;
                font-weight: 600;
                background: rgba(255,255,255,28);
                border: 1px solid rgba(255,255,255,50);
                border-radius: 14px;
            }}
            QPushButton:hover {{
                background: {accent};
                border: 1px solid rgba(255,255,255,160);
            }}
            QPushButton:disabled {{
                color: rgba(255,255,255,90);
                background: rgba(255,255,255,12);
            }}
            QPushButton#PrimaryBtn {{
                min-height: 28px;
                background: qlineargradient(
                    x1:0, y1:0, x2:1, y2:1,
                    stop:0 {accent2}, stop:0.5 {accent}, stop:1 {accent3}
                );
                border: 1px solid rgba(255,255,255,140);
            }}
            QLineEdit, QComboBox, QDoubleSpinBox, QSpinBox, QFontComboBox {{
                min-height: 24px;
                padding: 6px 10px;
                background: {input_bg};
                border: 1px solid {card_border};
                border-radius: 12px;
            }}
            QComboBox::drop-down {{
                width: 28px;
                border: none;
            }}
            QComboBox QAbstractItemView {{
                background: rgba(25,29,45,245);
                border: 1px solid rgba(255,255,255,50);
                selection-background-color: {accent};
            }}
            QTextEdit {{
                background: {log_bg};
                border: 1px solid {card_border};
                border-radius: 12px;
                padding: 8px;
            }}
            QTextEdit#ErrorLog {{
                color: {danger};
                background: rgba(40,8,16,{min(160, glass["opacity"] + 40)});
                border: 1px solid rgba(255,100,122,50);
            }}
            QProgressBar {{
                min-height: 16px;
                max-height: 16px;
                text-align: center;
                background: {input_bg};
                border: 1px solid {card_border};
                border-radius: 8px;
            }}
            QProgressBar::chunk {{
                border-radius: 7px;
                background: qlineargradient(
                    x1:0, y1:0, x2:1, y2:0,
                    stop:0 {accent2}, stop:0.5 {accent}, stop:1 {accent3}
                );
            }}
            QCheckBox {{
                spacing: 8px;
                background: transparent;
            }}
            QCheckBox::indicator {{
                width: 16px; height: 16px;
                background: rgba(255,255,255,20);
                border: 1px solid rgba(255,255,255,55);
                border-radius: 5px;
            }}
            QCheckBox::indicator:checked {{
                background: {accent};
                border: 1px solid rgba(255,255,255,180);
            }}
            QSlider::groove:horizontal {{
                height: 6px;
                background: {input_bg};
                border: 1px solid {card_border};
                border-radius: 3px;
            }}
            QSlider::handle:horizontal {{
                width: 14px;
                height: 14px;
                margin: -5px 0;
                background: {accent};
                border: 1px solid rgba(255,255,255,160);
                border-radius: 7px;
            }}
            QSlider::sub-page:horizontal {{
                background: {accent};
                border-radius: 3px;
            }}
            QScrollBar:vertical {{
                width: 8px;
                background: transparent;
                margin: 4px 1px 4px 0;
            }}
            QScrollBar::handle:vertical {{
                min-height: 30px;
                border-radius: 4px;
                background: rgba(210,224,255,80);
            }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical,
            QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {{
                height: 0; background: transparent; border: none;
            }}
            QMenuBar {{
                color: {text};
                padding: 4px 8px;
                background: {panel};
                border-bottom: 1px solid {card_border};
            }}
            QMenuBar::item {{
                padding: 6px 12px;
                border-radius: 10px;
            }}
            QMenuBar::item:selected {{
                background: rgba(255,255,255,35);
            }}
            QMenu {{
                color: white;
                padding: 6px;
                background: rgba(25,29,45,245);
                border: 1px solid rgba(255,255,255,50);
                border-radius: 12px;
            }}
            QMenu::item {{
                padding: 7px 20px;
                border-radius: 8px;
            }}
            QMenu::item:selected {{
                background: {accent};
            }}
            QStatusBar {{
                color: {muted};
                padding: 4px 12px;
                background: {panel};
                border-top: 1px solid {card_border};
            }}
            QStatusBar::item {{ border: none; }}
            QSplitter::handle {{
                background: rgba(255,255,255,20);
                width: 2px;
                margin: 8px 2px;
                border-radius: 1px;
            }}
            QToolTip {{
                color: white;
                padding: 6px 10px;
                background: rgba(24,29,46,245);
                border: 1px solid rgba(255,255,255,60);
                border-radius: 8px;
            }}
        """)

        for panel_w in self.findChildren(QFrame):
            if panel_w.objectName() not in ("GlassPanel", "SectionCard", "MidSectionCard"):
                continue
            shadow = QGraphicsDropShadowEffect(panel_w)
            shadow.setBlurRadius(22)
            shadow.setOffset(0, 6)
            shadow.setColor(QColor(0, 0, 0, 70))
            panel_w.setGraphicsEffect(shadow)
        # 中间外层不加阴影，避免假底板
        for panel_w in self.findChildren(QFrame):
            if panel_w.objectName() == "MidPanel":
                panel_w.setGraphicsEffect(None)
        self._refresh_stage_style(accent)

    def _refresh_stage_style(self, accent_color):
        if not hasattr(self, "stage_status_label"):
            return
        self.stage_status_label.setStyleSheet(self._stage_status_style(accent_color))

    def _startup_env_check(self):
        tools = resolve_runtime_tools()
        checks = [
            ("FFmpeg", tools["ffmpeg"]),
            ("ffprobe", tools["ffprobe"]),
            ("RIFE Vulkan", tools["rife_exe"]),
            ("RIFE model", tools["rife_model"]),
            ("Real-ESRGAN", tools["esgan_exe"]),
            ("ESRGAN models", tools["models_dir"]),
        ]
        missing = [name for name, path in checks if not path or not os.path.exists(path)]
        if missing:
            msg = "Missing tools:\n- " + "\n- ".join(missing)
            self.append_log("[env] FAIL: " + msg)
            self.statusBar().showMessage("env check failed")
            QMessageBox.warning(self, "Env check failed", msg)
        else:
            model = os.path.basename(tools["rife_model"])
            self.append_log(f"[env] OK: FFmpeg / RIFE({model}) / Real-ESRGAN ready")
            self.statusBar().showMessage(f"Vulkan · RIFE:{model}")
            try:
                os.makedirs(self.out_path_input.text(), exist_ok=True)
            except OSError:
                pass

    def select_output_path(self):
        path = QFileDialog.getExistingDirectory(self, "选择输出文件夹", os.path.expanduser("~"))
        if path:
            self.out_path_input.setText(path)
            self.chk_same_dir.setChecked(False)

    def apply_preset(self, preset_name):
        # compatibility for old call sites
        mapping = {"anime": "动漫补帧", "movie": "电影ProRes", "svfi": "SVFI风格"}
        name = mapping.get(preset_name, preset_name)
        payload = get_preset(name, self._user_presets)
        if payload:
            self.apply_preset_payload(name, payload)
            self.refresh_preset_combo(select_name=name)

    def dragEnterEvent(self, event: QDragEnterEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
            self.drop_area.setText("释放鼠标添加")

    def dropEvent(self, event: QDropEvent):
        self.drop_area.setText("拖拽视频到此处\n或点击选择")
        for url in event.mimeData().urls():
            path = url.toLocalFile()
            if path and path not in self.file_list:
                self.file_list.append(path)
        self.update_file_list_ui()

    def selectFiles(self, event=None):
        files, _ = QFileDialog.getOpenFileNames(
            self, "选择视频", "",
            "Video (*.mp4 *.mov *.mkv *.avi *.flv *.webm *.m4v)"
        )
        for f in files:
            if f not in self.file_list:
                self.file_list.append(f)
        self.update_file_list_ui()

    def update_file_list_ui(self):
        self.file_list_label.setText(f"待处理列表 ({len(self.file_list)})")
        self.file_list_widget.clear()
        for f in self.file_list:
            self.file_list_widget.append(os.path.basename(f))

    def start_rendering(self):
        if self._closing:
            return
        if self.worker and self.worker.isRunning():
            QMessageBox.information(self, "任务运行中", "当前已有渲染任务正在执行。")
            return
        if not self.file_list:
            QMessageBox.warning(self, "提示", "请先添加视频文件！")
            return

        params = {
            "fps": self.fps_combo["combo"].currentText().split()[0],
            "scale": self.scale_combo["combo"].currentText().split()[0],
            "codec": self.codec_combo["combo"].currentText(),
            "crf": self._parse_crf(),
            "encode_preset": "slow" if self._parse_crf() <= 16 else "medium",
            "rife_model": self._selected_rife_model_path(),
            "selected_model": self.model_combo["combo"].currentText(),
            "model_select_reason": "user_selected",
            "input_type": "unknown",
            "rife_thread_config": resolve_rife_thread_config(
                # Prefer any future UI/settings override; default 2:4:4
                None
            ),
            "encoder_mode": "auto",
            "enable_dedup": self.chk_dedup.isChecked(),
            "enable_scdet": self.chk_scdet.isChecked(),
            "dedup_threshold": float(self.dedup_spin.value()),
            "scdet_threshold": float(self.scdet_spin.value()),
            "keep_audio": self.chk_keep_audio.isChecked(),
        }

        out_path = self.out_path_input.text()
        same_as_src = self.chk_same_dir.isChecked()
        clean_cache = self.chk_clean_cache.isChecked()

        self.start_btn.setEnabled(False)
        self.stop_btn.setEnabled(True)
        self.progress_bar.setValue(0)
        self.log_text.clear()
        self.error_log_text.clear()
        self.stage_status_label.setText("● 当前工序：准备任务")
        self._refresh_stage_style("#64D2FF")
        self._persist_settings()

        self.worker = VideoWorker(self.file_list, params, out_path, same_as_src, clean_cache)
        self.worker.progress_updated.connect(self.progress_bar.setValue)
        self.worker.log_output.connect(self.append_log)
        self.worker.task_finished.connect(self.on_task_finished)
        self.worker.finished.connect(self._worker_thread_finished)
        self.worker.start()

    def stop_rendering(self):
        if self.worker and self.worker.isRunning():
            self.stop_btn.setEnabled(False)
            self.worker.stop()
            self.stage_status_label.setText("● 当前工序：正在停止")
            self._refresh_stage_style("#FFD166")
            self.append_log("[系统] 正在终止 FFmpeg / RIFE Vulkan / Real-ESRGAN 子进程...")

    def on_task_finished(self, success, msg):
        self.start_btn.setEnabled(not self._closing)
        self.stop_btn.setEnabled(False)
        self.append_log(f"\n{msg}")
        if success:
            self.stage_status_label.setText("● 当前工序：已完成")
            self._refresh_stage_style("#59D98E")
            self.file_list.clear()
            self.update_file_list_ui()
            self.play_render_done_sound()
        elif "取消" in msg or "终止" in msg:
            self.stage_status_label.setText("● 当前工序：已停止")
            self._refresh_stage_style("#FFD166")
        else:
            self.stage_status_label.setText("● 当前工序：执行失败")
            self._refresh_stage_style("#FF647C")

    def play_render_done_sound(self):
        """渲染成功后播放提示音。"""
        candidates = [
            os.path.join(get_app_base_dir(), "assets", "render_done.wav"),
            os.path.join(get_app_base_dir(), "_internal", "assets", "render_done.wav"),
            r"D:\AIIIYU\qwen-tts-webui\outputs\20260801_004238_s5WYKcuh.wav",
        ]
        sound_path = next((p for p in candidates if os.path.isfile(p)), None)
        if not sound_path:
            self.append_log("[系统] 未找到渲染完成提示音文件")
            return
        try:
            if winsound is not None:
                winsound.PlaySound(
                    sound_path,
                    winsound.SND_FILENAME | winsound.SND_ASYNC,
                )
            else:
                # 非 Windows 回退：用系统默认播放器异步打开
                if sys.platform.startswith("darwin"):
                    subprocess.Popen(["afplay", sound_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    subprocess.Popen(["aplay", sound_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.append_log(f"🔔 [提示音] 已播放：{os.path.basename(sound_path)}")
        except Exception as exc:
            self.append_log(f"[系统] 提示音播放失败：{exc}")

    def _worker_thread_finished(self):
        finished_worker = self.sender()
        if self.worker is finished_worker:
            self.worker = None
        if finished_worker is not None:
            finished_worker.deleteLater()
        if self._closing:
            QTimer.singleShot(0, self.close)

    def closeEvent(self, event):
        try:
            self._persist_settings()
        except Exception:
            pass
        if self.worker and self.worker.isRunning():
            self._closing = True
            self.stop_rendering()
            self.statusBar().showMessage("正在释放资源，请稍候…")
            event.ignore()
            return
        event.accept()

    def append_log(self, text):
        error_keywords = (
            "❌", "异常", "失败", "错误", "error", "exception", "traceback", "failed"
        )
        normalized_text = text.lower()
        is_error = any(keyword.lower() in normalized_text for keyword in error_keywords)
        target_widget = self.error_log_text if is_error else self.log_text
        cursor = target_widget.textCursor()
        cursor.movePosition(QTextCursor.End)
        text_format = QTextCharFormat()
        if is_error:
            text_format.setForeground(QColor(255, 108, 128))
            text_format.setFontWeight(QFont.DemiBold)
        else:
            text_format.setForeground(QColor(220, 229, 245))
        cursor.insertText(text + "\n", text_format)
        target_widget.setTextCursor(cursor)
        target_widget.ensureCursorVisible()

        if "[1/4]" in text:
            self.stage_status_label.setText("● 当前工序：抽帧")
            self._refresh_stage_style("#64D2FF")
        elif "[2/4]" in text:
            self.stage_status_label.setText("● 当前工序：RIFE 插帧")
            self._refresh_stage_style("#5E9CFF")
        elif "[3/4]" in text:
            self.stage_status_label.setText("● 当前工序：图片超分")
            self._refresh_stage_style("#BF7CFF")
        elif "[4/4]" in text:
            self.stage_status_label.setText("● 当前工序：视频合成")
            self._refresh_stage_style("#FF9F5A")
        elif is_error:
            self.stage_status_label.setText("● 当前工序：发生错误")
            self._refresh_stage_style("#FF647C")
        elif "渲染完成" in text or "全部任务" in text:
            self.stage_status_label.setText("● 当前工序：已完成")
            self._refresh_stage_style("#59D98E")

    def _stage_status_style(self, accent_color):
        return f"""
            QLabel#StageStatus {{
                color: {accent_color};
                font-size: 12px;
                font-weight: 600;
                padding: 5px 14px;
                margin: 3px 6px;
                background: rgba(255, 255, 255, 22);
                border: 1px solid {accent_color};
                border-radius: 14px;
            }}
        """


# ==========================================
# 4. 程序入口
# ==========================================
def handle_unhandled_exception(exc_type, exc_value, exc_traceback):
    """记录未捕获异常，避免双击启动时只表现为无提示闪退。"""
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return

    detail = "".join(
        traceback.format_exception(exc_type, exc_value, exc_traceback)
    )
    log_candidates = [
        Path(get_app_base_dir()) / "rife_pro_crash.log",
        Path(tempfile.gettempdir()) / "rife_pro_crash.log",
    ]
    saved_path = None
    for log_path in log_candidates:
        try:
            log_path.write_text(detail, encoding="utf-8")
            saved_path = str(log_path)
            break
        except OSError:
            continue

    message = f"程序发生未捕获异常：\n{exc_value}"
    if saved_path:
        message += f"\n\n崩溃日志：{saved_path}"

    try:
        QMessageBox.critical(None, "RIFE Pro 运行异常", message)
    except Exception:
        pass
    sys.__excepthook__(exc_type, exc_value, exc_traceback)


if __name__ == '__main__':
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)

    app = QApplication(sys.argv)
    app.setApplicationName("RIFE Pro")
    app.setApplicationDisplayName("RIFE Pro - SVFI Optimized")
    sys.excepthook = handle_unhandled_exception

    settings = load_settings()
    font_database = QFontDatabase()
    installed_fonts = set(font_database.families())
    preferred = settings.get("font_family") or "Microsoft YaHei UI"
    font_candidates = (
        preferred,
        "Microsoft YaHei UI",
        "Microsoft YaHei",
        "Segoe UI",
    )
    font_family = next(
        (name for name in font_candidates if name in installed_fonts),
        preferred
    )

    global_font = QFont(font_family, int(settings.get("font_size", 13)))
    global_font.setWeight(QFont.Normal)
    global_font.setStyleStrategy(
        QFont.PreferAntialias |
        QFont.PreferQuality
    )
    global_font.setHintingPreference(QFont.PreferFullHinting)
    global_font.setLetterSpacing(QFont.AbsoluteSpacing, 0.25)
    app.setFont(global_font)

    QApplication.setEffectEnabled(Qt.UI_AnimateMenu, True)
    QApplication.setEffectEnabled(Qt.UI_FadeMenu, True)
    QApplication.setEffectEnabled(Qt.UI_AnimateCombo, True)
    QApplication.setEffectEnabled(Qt.UI_AnimateTooltip, True)
    QApplication.setEffectEnabled(Qt.UI_FadeTooltip, True)

    window = MainWindow()
    window.show()
    sys.exit(app.exec_())
