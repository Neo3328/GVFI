/**
 * GVFI — Workbench home page (dark three-pane video workstation).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * 根路由 /app 的默认主页：左侧功能导航 / 中间预览与播放控制 / 右侧参数分组 / 底部日志与状态栏。
 * 所有数据与动作均来自 ProcessWorkspaceContext + job-store + desktop bridge（真实业务），
 * 不使用 setTimeout 伪造结果，不保留无后端支撑的假控件。业务变量名 / 函数名保持不变。
 *
 * 图标专项：全部使用 @/icons 本地内联 SVG（静态 import + 别名），点击事件只绑定在外层
 * button 上，SVG 仅作展示且带固定占位尺寸；renderGlyph 内置 onError 兜底，失败隐藏不抛错。
 */
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
    ChevronDownIcon,
  ChevronUpIcon,
  CopyWindowIcon,
  FileInputIcon,
  FilmIcon,
  FolderOpenIcon,
  ForwardIcon,
  ListTodoIcon,
  LogInfoIcon,
  MinusWindowIcon,
  ModelChipIcon,
  OutFolderIcon,
  ParamsTuneIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
  SquareWindowIcon,
  StepBackIcon,
  StepForwardIcon,
  UploadIcon,
  XWindowIcon,
} from "@/icons";
import { useProcessWorkspace } from "@/components/process/process-workspace-context";
import { useJobStore } from "@/stores/job-store";
import { getDesktopBridge } from "@/lib/desktop";
import { fetchHealth } from "@/lib/gvfi-api";
import {
  FPS_OPTIONS,
  PRECISION_OPTIONS,
  RESOLUTION_OPTIONS,
  SR_MODEL_OPTIONS,
} from "@/lib/presets";
import { APP_NAME, APP_VERSION } from "@/lib/brand";
import type {
  FpsOption,
  GvfiGpu,
  GvfiModel,
  PrecisionOption,
  ResolutionOption,
  SrModelOption,
} from "@/lib/gvfi-types";
import "./workbench.css";

/* ------------------------------------------------------------------ */
/* 本地小组件：纯展示 / 受控控件，事件均落在原生可交互元素上             */
/* ------------------------------------------------------------------ */

function Group({
  sectionRef,
  title,
  badge,
  children,
}: {
  sectionRef?: (el: HTMLDivElement | null) => void;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div ref={sectionRef} className="wb-group" data-slot="wb-group">
      <div className="wb-group-title">
        <span>{title}</span>
        {badge ? <span className="wb-hint">{badge}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wb-field">
      <span className="wb-label">{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      data-on={checked}
      className="wb-switch wb-interactive"
      onClick={() => onChange(!checked)}
    >
      <span className="wb-knob" aria-hidden />
    </button>
  );
}

/* requestAnimationFrame 实测 UI 帧率（真实指标，不写死） */
function useMeasuredFps(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frames += 1;
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

type NavKey = "input" | "params" | "model" | "output" | "queue" | "logs";

export function VideoWorkspacePage() {
  const router = useRouter();
  const ws = useProcessWorkspace();
  const activeTask = useJobStore((s) => s.activeTask);
  const measuredFps = useMeasuredFps();
  // SSR 预渲染阶段没有 window/bridge；用 mounted 门控所有桌面专属 UI，
  // 保证服务端 HTML 与客户端首次渲染一致，消除 React #418 水合不匹配。
  // SSR 安全的“已挂载”标志：服务端快照 false、客户端快照 true，
  // 不在 effect 内 setState（规避 set-state-in-effect 级联渲染）。
  const mounted = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );
  const bridge = getDesktopBridge();
  // 仅在客户端挂载后才暴露 bridge 驱动的 UI（窗口控件 / 打开目录按钮），避免水合不一致
  const desktopBridge = mounted ? bridge : null;

  /* ---- 真实 API 往返延迟（health RTT，失败则为 null，不伪造数值） ---- */
  const [apiRtt, setApiRtt] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const ping = async () => {
      const started = performance.now();
      try {
        await fetchHealth();
        if (alive) setApiRtt(Math.round(performance.now() - started));
      } catch {
        if (alive) setApiRtt(null);
      }
    };
    void ping();
    const id = window.setInterval(ping, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  /* ---- 窗口最大化状态（仅桌面端渲染窗口控件） ---- */
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    if (!bridge?.isDesktop) return;
    let active = true;
    void bridge.windowIsMaximized?.().then((v) => {
      if (active) setMaximized(v);
    });
    const unsub = bridge.onMaximizedChange((v) => {
      if (active) setMaximized(v);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [bridge]);

  /* ---- 真实连接 / 设备事件日志（仅在状态真实变化时记录，不硬编码假日志） ---- */
  const { serviceReady, gpus, gpuLabel, appendTaskLog } = ws;
  const loggedReady = useRef(false);
  useEffect(() => {
    if (serviceReady === true && !loggedReady.current) {
      loggedReady.current = true;
      appendTaskLog("[INFO] 后端服务连接就绪");
    }
  }, [serviceReady, appendTaskLog]);
  const loggedGpu = useRef(false);
  useEffect(() => {
    if (gpus.length > 0 && !loggedGpu.current) {
      loggedGpu.current = true;
      appendTaskLog(`[INFO] 计算设备: ${gpuLabel}`);
    }
  }, [gpus, gpuLabel, appendTaskLog]);

  /* ---- 文件导入：桌面端走原生对话框（绝对路径），浏览器降级原生 input ---- */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openInput = useCallback(async () => {
    const desktop = getDesktopBridge();
    if (desktop?.selectVideoFile) {
      try {
        const picked = await desktop.selectVideoFile();
        if (picked) {
          ws.setFile(null);
          ws.setInputPath(picked);
          ws.appendTaskLog(`已加载输入文件: ${picked}`);
        }
      } catch (error) {
        ws.appendErrorLog(error instanceof Error ? error.message : String(error));
      }
      return;
    }
    fileInputRef.current?.click();
  }, [ws]);

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("video/")) {
      ws.appendErrorLog("请选择有效的视频文件");
      return;
    }
    ws.setInputPath("");
    ws.setFile(picked);
    ws.appendTaskLog(`已加载输入文件: ${picked.name}`);
  };

  /* ---- 打开输出目录 / 成品（真实 shell 调用） ---- */
  const revealOutput = useCallback(async () => {
    const desktop = getDesktopBridge();
    const target = ws.lastOutputPath || ws.outputDir;
    if (!desktop?.revealInFolder) return;
    if (!target) {
      ws.appendErrorLog("暂无可打开的输出路径");
      return;
    }
    const ok = await desktop.revealInFolder(target);
    if (!ok) ws.appendErrorLog(`路径不存在或无法打开: ${target}`);
  }, [ws]);

  /* ---- 左侧导航：输入=动作，其余=右侧分组平滑定位，日志=展开并滚到底 ---- */
  const [activeNav, setActiveNav] = useState<NavKey>("input");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [logsOpen, setLogsOpen] = useState(true);
  const logBodyRef = useRef<HTMLDivElement>(null);

  const goNav = useCallback(
    (key: NavKey) => {
      setActiveNav(key);
      if (key === "input") {
        void openInput();
        return;
      }
      if (key === "logs") {
        setLogsOpen(true);
        window.setTimeout(() => {
          logBodyRef.current?.scrollTo({ top: logBodyRef.current.scrollHeight });
        }, 60);
        return;
      }
      if (key === "queue") {
        setLogsOpen(true);
      }
      sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [openInput]
  );

  const navItems: { key: NavKey; label: string; Icon: typeof FileInputIcon }[] = [
    { key: "input", label: "输入文件", Icon: FileInputIcon },
    { key: "params", label: "处理参数", Icon: ParamsTuneIcon },
    { key: "model", label: "AI模型", Icon: ModelChipIcon },
    { key: "output", label: "输出设置", Icon: OutFolderIcon },
    { key: "queue", label: "任务队列", Icon: ListTodoIcon },
    { key: "logs", label: "日志信息", Icon: LogInfoIcon },
  ];

  /* ---- 预览播放器（真实 HTMLMediaElement API） ---- */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mediaMeta, setMediaMeta] = useState<{ w: number; h: number } | null>(null);
  const previewSrc = ws.srcAfter || ws.srcBefore;

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);
  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0);
  }, []);
  const stepFrame = useCallback(
    (dir: 1 | -1) => {
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      const frameDur = 1 / (Number(ws.fps) || 30);
      v.currentTime = Math.min(Math.max(0, v.currentTime + dir * frameDur), v.duration || 0);
    },
    [ws.fps]
  );
  const onSeekBar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = (Number(event.target.value) / 1000) * v.duration;
  };
  const playPct = duration > 0 ? (current / duration) * 100 : 0;

  /* ---- 合并任务 / 错误日志并自动滚底 ---- */
  const logs = useMemo(() => {
    const merged: { text: string; level: "info" | "warn" | "err" }[] = [];
    ws.taskLogs.forEach((text) =>
      merged.push({
        text,
        level: text.includes("[WARN]") || text.includes("警告") ? "warn" : "info",
      })
    );
    ws.errorLogs.forEach((text) => merged.push({ text, level: "err" }));
    return merged;
  }, [ws.taskLogs, ws.errorLogs]);

  useEffect(() => {
    if (logsOpen && logBodyRef.current) {
      logBodyRef.current.scrollTop = logBodyRef.current.scrollHeight;
    }
  }, [logs.length, logsOpen]);

  /* ---- 下拉选项（真实来源，空数据兜底当前值，不伪造设备） ---- */
  const modelItems: GvfiModel[] =
    ws.models.length > 0
      ? ws.models
      : [{ id: ws.model || "rife", name: ws.model || "RIFE", path: "" }];
  const gpuItems: GvfiGpu[] =
    ws.gpus.length > 0
      ? ws.gpus
      : [{ index: ws.gpu, name: "local-vulkan", vram_mb: 0 }];

  const taskType = ws.superResolution ? "both" : "interp";
  const topMode = ws.superResolution ? "upscale" : "frame";
  const changeTopMode = (mode: "frame" | "upscale" | "analyze") => {
    if (mode === "analyze") {
      router.push("/app/ai");
      return;
    }
    ws.setSuperResolution(mode === "upscale");
  };

  /* ---- 状态栏真实状态 ---- */
  const apiState =
    ws.serviceReady === true
      ? { cls: "wb-dot-ok", text: "API 就绪" }
      : ws.serviceReady === false
        ? { cls: "wb-dot-err", text: "API 未连接" }
        : { cls: "wb-dot-idle", text: "连接中…" };
  const queueSummary = ws.isRendering
    ? `运行中 ${ws.progress}%`
    : `任务 ${ws.queueCount} 运行中`;

  return (
    <div className="wb-root">
      {/* 浏览器环境降级用的隐藏文件选择（桌面端走 IPC，不会用到它） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={onPickFile}
      />

      {/* ============ 顶部标题栏 ============ */}
      <header className="app-titlebar-drag flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[color-mix(in_srgb,#fff_8%,transparent)] px-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[linear-gradient(180deg,var(--accent),color-mix(in_srgb,var(--accent-cyan)_70%,var(--accent)))] text-white">
              <FilmIcon size={14} />
            </span>
            <span className="text-[12.5px] font-semibold tracking-tight text-white">
              {APP_NAME} Workbench
            </span>
          </div>
          <div className="wb-seg app-titlebar-no-drag">
            <button
              type="button"
              className={topMode === "frame" ? "wb-active" : undefined}
              onClick={() => changeTopMode("frame")}
            >
              FRAME
            </button>
            <button
              type="button"
              className={topMode === "upscale" ? "wb-active" : undefined}
              onClick={() => changeTopMode("upscale")}
            >
              UPSCALE
            </button>
            <button type="button" onClick={() => changeTopMode("analyze")}>
              ANALYZE
            </button>
          </div>
        </div>

        <div className="app-titlebar-no-drag flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-[10.5px] tabular-nums text-[color-mix(in_srgb,#fff_55%,transparent)] sm:inline-flex">
            FPS <b className="font-semibold text-white/85">{measuredFps || "N/A"}</b>
          </span>
          <span className="hidden items-center gap-1.5 text-[10.5px] tabular-nums text-[color-mix(in_srgb,#fff_55%,transparent)] md:inline-flex">
            延迟{" "}
            <b className="font-semibold text-white/85">
              {apiRtt === null ? "N/A" : `${apiRtt}ms`}
            </b>
          </span>
          {desktopBridge?.isDesktop ? (
            <div className="flex items-stretch">
              <button
                type="button"
                aria-label="最小化"
                className="inline-flex h-8 w-11 items-center justify-center text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => void desktopBridge?.windowMinimize()}
              >
                <MinusWindowIcon size={14} />
              </button>
              <button
                type="button"
                aria-label={maximized ? "还原" : "最大化"}
                className="inline-flex h-8 w-11 items-center justify-center text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => void desktopBridge?.windowMaximizeToggle()}
              >
                {maximized ? <CopyWindowIcon size={13} /> : <SquareWindowIcon size={13} />}
              </button>
              <button
                type="button"
                aria-label="关闭"
                className="inline-flex h-8 w-12 items-center justify-center text-white/60 hover:bg-[var(--danger)] hover:text-white"
                onClick={() => void desktopBridge?.windowClose()}
              >
                <XWindowIcon size={15} />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* ============ 主体三栏 ============ */}
      <div className="wb-body flex min-h-0 flex-1">
        {/* 左侧功能导航 */}
        <nav className="wb-nav w-[88px] shrink-0" aria-label="工作台导航">
          {navItems.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              aria-current={activeNav === key ? "page" : undefined}
              className={`wb-nav-item wb-interactive ${activeNav === key ? "wb-active" : ""}`}
              onClick={() => goNav(key)}
            >
              <span
                aria-hidden
                className="flex size-[20px] items-center justify-center"
                style={{ width: 20, height: 20 }}
              >
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* 中间：预览 + 播放控制 */}
        <section className="flex min-w-0 flex-1 flex-col gap-2 p-2">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-[color-mix(in_srgb,#fff_10%,transparent)] bg-black">
            <div className="absolute left-3 top-2.5 z-10 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-[10.5px] tabular-nums text-white/75">
              <span className="wb-dot wb-dot-ok" aria-hidden />
              {mediaMeta
                ? `${mediaMeta.w} × ${mediaMeta.h} · ${ws.fps} FPS 目标`
                : `待加载 · ${ws.fps} FPS 目标`}
            </div>
            <div className="absolute right-3 top-2.5 z-10 rounded-full bg-black/55 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
              Preview
            </div>

            {previewSrc ? (
              <video
                ref={videoRef}
                src={previewSrc}
                className="h-full w-full object-contain"
                playsInline
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  setMediaMeta({
                    w: e.currentTarget.videoWidth,
                    h: e.currentTarget.videoHeight,
                  });
                }}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
                onEnded={() => setPlaying(false)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--accent-cyan)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_10%,transparent)] text-[var(--accent-cyan)]">
                  <FilmIcon size={28} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-white">未加载视频文件</p>
                  <p className="mt-1 text-[12px] text-white/50">
                    从左侧「输入文件」选择本地视频以开始处理
                  </p>
                </div>
                <button
                  type="button"
                  className="wb-btn wb-interactive mt-1"
                  onClick={() => void openInput()}
                >
                  <span aria-hidden style={{ width: 16, height: 16 }} className="inline-flex">
                    <UploadIcon size={16} />
                  </span>
                  打开文件
                </button>
              </div>
            )}
          </div>

          {/* 播放控制条 */}
          <div className="flex h-[60px] shrink-0 items-center gap-3 rounded-xl border border-[color-mix(in_srgb,#fff_10%,transparent)] bg-[color-mix(in_srgb,#fff_3%,transparent)] px-3">
            <span className="w-[72px] shrink-0 font-mono text-[10.5px] tabular-nums text-white/70">
              {formatClock(current)}
            </span>
            <div className="wb-progress-track">
              <div className="wb-progress-fill" style={{ width: `${playPct}%` }} />
              <input
                type="range"
                min={0}
                max={1000}
                value={Math.round(playPct * 10)}
                onChange={onSeekBar}
                aria-label="播放进度"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                disabled={!previewSrc}
              />
            </div>
            <span className="w-[72px] shrink-0 text-right font-mono text-[10.5px] tabular-nums text-white/40">
              {formatClock(duration)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="wb-icon-btn wb-round wb-interactive"
                aria-label="上一帧"
                disabled={!previewSrc}
                onClick={() => stepFrame(-1)}
              >
                <StepBackIcon size={15} />
              </button>
              <button
                type="button"
                className="wb-icon-btn wb-round wb-interactive"
                aria-label="后退 10 帧"
                disabled={!previewSrc}
                onClick={() => seekBy(-10 / (Number(ws.fps) || 30))}
              >
                <RewindIcon size={15} />
              </button>
              <button
                type="button"
                className="wb-icon-btn wb-play wb-interactive"
                aria-label={playing ? "暂停" : "播放"}
                disabled={!previewSrc}
                onClick={togglePlay}
              >
                {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              </button>
              <button
                type="button"
                className="wb-icon-btn wb-round wb-interactive"
                aria-label="前进 10 帧"
                disabled={!previewSrc}
                onClick={() => seekBy(10 / (Number(ws.fps) || 30))}
              >
                <ForwardIcon size={15} />
              </button>
              <button
                type="button"
                className="wb-icon-btn wb-round wb-interactive"
                aria-label="下一帧"
                disabled={!previewSrc}
                onClick={() => stepFrame(1)}
              >
                <StepForwardIcon size={15} />
              </button>
            </div>
            <span className="shrink-0 rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10.5px] tabular-nums text-[var(--accent-cyan)]">
              进度 {Math.round(playPct)}%
            </span>
          </div>
        </section>

        {/* 右侧参数面板 */}
        <aside className="wb-right-pane flex w-[320px] shrink-0 flex-col border-l border-[color-mix(in_srgb,#fff_8%,transparent)] p-2">
          <div className="wb-pane-scroll wb-scroll">
          {/* AI 模型 */}
          <Group
            title="AI 模型"
            badge={ws.serviceReady === true ? "已连接" : "检测中"}
            sectionRef={(el) => {
              sectionRefs.current.model = el;
            }}
          >
            <Field label="推理模型">
              <select
                className="wb-select"
                value={ws.model}
                onChange={(e) => ws.setModel(e.target.value)}
                aria-label="推理模型"
              >
                {modelItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="推理后端">
              <span className="wb-input flex flex-1 items-center text-[11.5px] text-white/75">
                本地 ncnn / Vulkan
              </span>
            </Field>
            <Field label="计算设备">
              <select
                className="wb-select"
                value={String(ws.gpu)}
                onChange={(e) => ws.setGpu(Number(e.target.value))}
                aria-label="计算设备"
              >
                {gpuItems.map((item) => (
                  <option key={item.index} value={String(item.index)}>
                    GPU {item.index} · {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="计算精度">
              <select
                className="wb-select"
                value={ws.precision}
                onChange={(e) => ws.setPrecision(e.target.value as PrecisionOption)}
                aria-label="计算精度"
              >
                {PRECISION_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </Group>

          {/* 补帧参数 */}
          <Group
            title="补帧参数"
            sectionRef={(el) => {
              sectionRefs.current.params = el;
            }}
          >
            <Field label="任务类型">
              <select
                className="wb-select"
                value={taskType}
                onChange={(e) => ws.setSuperResolution(e.target.value === "both")}
                aria-label="任务类型"
              >
                <option value="both">补帧 + 超分</option>
                <option value="interp">仅补帧</option>
              </select>
            </Field>
            <Field label="目标帧率">
              <select
                className="wb-select"
                value={ws.fps}
                onChange={(e) => ws.setFps(e.target.value as FpsOption)}
                aria-label="目标帧率"
              >
                {FPS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="工作流预设">
              <select
                className="wb-select"
                value={ws.selectedPreset}
                onChange={(e) => ws.setSelectedPreset(e.target.value)}
                aria-label="工作流预设"
              >
                {ws.presets.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="button"
              className="wb-btn wb-interactive mt-2 w-full"
              onClick={ws.handleApplyPreset}
            >
              应用预设参数
            </button>
          </Group>

          {/* 超分与增强 */}
          <Group title="超分与增强">
            <div className="wb-field">
              <span className="wb-label">启用超分</span>
              <Toggle
                checked={ws.superResolution}
                onChange={ws.setSuperResolution}
                ariaLabel="启用超分"
              />
            </div>
            <Field label="超分模型">
              <select
                className="wb-select"
                value={ws.srModel}
                disabled={!ws.superResolution}
                onChange={(e) => ws.setSrModel(e.target.value as SrModelOption)}
                aria-label="超分模型"
              >
                {SR_MODEL_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="输出分辨率">
              <select
                className="wb-select"
                value={ws.resolution}
                disabled={!ws.superResolution}
                onChange={(e) => ws.setResolution(e.target.value as ResolutionOption)}
                aria-label="输出分辨率"
              >
                <option value="source">跟随源 / 倍数</option>
                {RESOLUTION_OPTIONS.filter((o) => o.value !== "source").map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </Group>

          {/* 输出配置 */}
          <Group
            title="输出配置"
            sectionRef={(el) => {
              sectionRefs.current.output = el;
            }}
          >
            <div className="wb-field-stack">
              <span className="wb-label">输出目录</span>
              <div className="flex items-center gap-2">
                <input
                  className="wb-input min-w-0 flex-1"
                  value={ws.outputDir}
                  readOnly
                  placeholder="后端默认输出目录"
                  aria-label="输出目录"
                />
                <button
                  type="button"
                  className="wb-btn wb-interactive shrink-0"
                  onClick={() => void revealOutput()}
                  disabled={!desktopBridge?.revealInFolder}
                  title="在系统文件管理器中打开"
                >
                  <span aria-hidden style={{ width: 14, height: 14 }} className="inline-flex">
                    <FolderOpenIcon size={14} />
                  </span>
                  打开
                </button>
              </div>
            </div>
            <Field label={`编码质量 ${Math.round(ws.quality * 100)}`}>
              <input
                type="range"
                className="wb-range"
                min={0.5}
                max={1}
                step={0.01}
                value={ws.quality}
                onChange={(e) => ws.setQuality(Number(e.target.value))}
                aria-label="编码质量"
              />
            </Field>
            <Field label="输出格式">
              <span className="wb-input flex flex-1 items-center text-[11.5px] text-white/75">
                MP4 · H.264（后端默认）
              </span>
            </Field>
          </Group>

          </div>
          {/* 任务控制（常驻右侧底部，任何窗口尺寸下开始/停止都可见可点） */}
          <div className="wb-pane-foot">
          <Group
            title="任务控制"
            badge={ws.isRendering ? "运行中" : ws.hasInput ? "就绪" : "等待输入"}
            sectionRef={(el) => {
              sectionRefs.current.queue = el;
            }}
          >
            {ws.isRendering ? (
              <div className="mb-2">
                <div className="mb-1 flex justify-between text-[10.5px] text-white/60">
                  <span className="truncate">{ws.stageLabel}</span>
                  <span className="tabular-nums">{ws.progress}%</span>
                </div>
                <div className="wb-progress-track" style={{ height: 8 }}>
                  <div className="wb-progress-fill" style={{ width: `${ws.progress}%` }} />
                </div>
              </div>
            ) : (
              <p className="mb-2 rounded-lg border border-dashed border-[color-mix(in_srgb,#fff_14%,transparent)] px-2.5 py-2 text-[11px] leading-relaxed text-white/55">
                {ws.hasInput
                  ? activeTask
                    ? `最近任务：${activeTask.status}`
                    : "参数已就绪，点击「开始处理」提交任务。"
                  : "请先点击左侧「输入文件」选择视频后再启动任务。"}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="wb-btn wb-primary wb-interactive flex-1"
                disabled={!ws.hasInput || ws.isRendering}
                onClick={() => void ws.handleStartLocal()}
              >
                {ws.isRendering ? "处理中…" : "开始处理"}
              </button>
              <button
                type="button"
                className="wb-btn wb-danger wb-interactive flex-1"
                disabled={!ws.isRendering}
                onClick={() => void ws.handleStop()}
              >
                停止处理
              </button>
            </div>
            {ws.lastOutputPath ? (
              <button
                type="button"
                className="wb-btn wb-interactive mt-2 w-full"
                onClick={() => void revealOutput()}
                disabled={!desktopBridge?.revealInFolder}
              >
                打开成品所在文件夹
              </button>
            ) : null}
          </Group>
          </div>
        </aside>
      </div>

      {/* ============ 底部日志 ============ */}
      <section className="shrink-0 border-t border-[color-mix(in_srgb,#fff_8%,transparent)]">
        <div className="flex h-8 items-center justify-between px-3">
          <div className="flex items-center gap-2 text-[11px] text-white/70">
            <span className={`wb-dot ${logs.some((l) => l.level === "err") ? "wb-dot-err" : "wb-dot-ok"}`} />
            <span className="font-medium">运行日志</span>
            <span className="rounded-full bg-white/10 px-1.5 text-[10px] tabular-nums">
              {logs.length} 条
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white"
            onClick={() => setLogsOpen((v) => !v)}
          >
            {logsOpen ? "收起" : "展开"}
            {logsOpen ? <ChevronDownIcon size={13} /> : <ChevronUpIcon size={13} />}
          </button>
        </div>
        {logsOpen ? (
          <div
            ref={logBodyRef}
            className="wb-scroll h-[104px] px-3 pb-2 font-mono text-[11px] leading-[1.55]"
          >
            {logs.length === 0 ? (
              <p className="wb-log-info text-white/35">暂无日志 — 任务将在这里实时记录</p>
            ) : (
              logs.map((line, idx) => (
                <div
                  key={idx}
                  className={`wb-log-line ${
                    line.level === "err"
                      ? "wb-log-err"
                      : line.level === "warn"
                        ? "wb-log-warn"
                        : "wb-log-info"
                  }`}
                >
                  {line.text}
                </div>
              ))
            )}
          </div>
        ) : null}
      </section>

      {/* ============ 状态栏 ============ */}
      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-[color-mix(in_srgb,#fff_8%,transparent)] px-3 text-[11px] text-white/60">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className={`wb-dot ${apiState.cls}`} />
            {apiState.text}
          </span>
          <span className="hidden sm:inline">GPU：{ws.gpuLabel}</span>
        </div>
        <div className="flex items-center gap-3 tabular-nums">
          <span>{queueSummary}</span>
          <span className="text-white/35">v{APP_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}

export default VideoWorkspacePage;
