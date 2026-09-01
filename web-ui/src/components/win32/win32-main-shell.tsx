/**
 * GVFI — Main application shell (dark glass workbench, Figma-inspired).
 * Layout: title bar | 3-column (nav / preview / params) | log pane | status bar.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WinTitleBar } from "./win32-title-bar";
import { WinNavBar, type NavId } from "./win32-nav-bar";
import { WinPreviewPane } from "./win32-preview-pane";
import { WinParamsPanel } from "./win32-params-panel";
import { WinLogPane, WinStatusBar, type LogLine } from "./win32-bottom-bar";
import { getDesktopBridge } from "@/lib/desktop";
import {
  cancelJob,
  createJob,
  fetchHealth,
  isTerminalStatus,
  listJobs,
} from "@/lib/gvfi-api";
import type { JobSettings, JobTask } from "@/lib/gvfi-types";

type FullSettings = JobSettings & {
  outputDir: string;
  container: string;
  codec: string;
  audioCopy: boolean;
  sceneDetect: boolean;
  sharpen: number;
  denoiseEnabled: boolean;
  denoiseStrength: number;
  preserveDetail: boolean;
  backend: string;
};

function basename(p: string): string {
  return p.split(/[\\/]/).filter(Boolean).pop() ?? p;
}

export function Win32MainShell() {
  const [navActive, setNavActive] = useState<NavId>("params");
  const [inputPath, setInputPath] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [gpuName, setGpuName] = useState("");
  const [runningTasks, setRunningTasks] = useState<JobTask[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const logId = useRef(0);
  const currentTaskIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentTaskIdRef.current = currentTaskId;
  }, [currentTaskId]);

  const appendLog = useCallback(
    (text: string, level: LogLine["level"] = "INFO") => {
      const now = new Date();
      const stamp = now.toTimeString().slice(0, 8);
      setLogs((prev) => [
        ...prev.slice(-199),
        { id: logId.current++, text: `[${stamp}] [${level}] ${text}`, level },
      ]);
    },
    []
  );

  /* ── Boot: health + initial job list ── */
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const health = await fetchHealth();
        if (cancelled) return;
        setApiOk(Boolean(health.ok));
        const gpu = health.gpus?.[0];
        if (gpu?.name) setGpuName(`GPU: ${gpu.name}`);
        appendLog(
          `后端连接${health.ok ? "成功" : "失败"}`,
          health.ok ? "INFO" : "ERROR"
        );
        if (gpu?.name) appendLog(`计算设备: ${gpu.name}`, "INFO");
      } catch {
        if (!cancelled) {
          setApiOk(false);
          appendLog("后端连接失败，请检查 API 服务", "ERROR");
        }
      }
      try {
        const res = await listJobs();
        if (!cancelled) setRunningTasks(res.tasks ?? []);
      } catch {
        /* non-fatal */
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [appendLog]);

  /* ── Poll task list every 3s ── */
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const res = await listJobs();
        const tasks = res.tasks ?? [];
        setRunningTasks(tasks);
        const active = tasks.find(
          (t) =>
            t.id === currentTaskIdRef.current && !isTerminalStatus(t.status)
        );
        if (currentTaskIdRef.current && !active) {
          const finished = tasks.find(
            (t) => t.id === currentTaskIdRef.current
          );
          if (finished && isTerminalStatus(finished.status)) {
            const ok = finished.status === "succeeded";
            appendLog(
              ok ? `任务完成: ${finished.id}` : `任务结束: ${finished.status}`,
              ok ? "INFO" : "WARN"
            );
            setCurrentTaskId(null);
          }
        }
      } catch {
        /* keep last state */
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [appendLog]);

  /* ── Pick input via native dialog ── */
  const handlePickInput = useCallback(async () => {
    const bridge = getDesktopBridge();
    if (!bridge?.selectVideoFile) {
      appendLog("当前环境不支持文件选择对话框", "WARN");
      return;
    }
    const picked = await bridge.selectVideoFile();
    if (!picked) return;
    setInputPath(picked);
    appendLog(`已加载输入文件: ${basename(picked)}`, "INFO");
  }, [appendLog]);

  /* ── Start ── */
  const handleStart = useCallback(
    async (settings: FullSettings) => {
      if (!inputPath) {
        appendLog("未选择输入文件，无法开始", "WARN");
        return;
      }
      setStarting(true);
      try {
        const res = await createJob({
          settings: {
            task_type: settings.task_type,
            model: settings.model,
            fps: settings.fps,
            superResolution: settings.superResolution,
            srModel: settings.srModel,
            resolution: settings.resolution,
            gpu: settings.gpu,
            precision: settings.precision,
            quality: settings.quality,
            inputPath,
          },
        });
        setCurrentTaskId(res.task.id);
        appendLog(`任务已提交: ${res.task.id}`, "RUN");
        appendLog(
          `配置: ${settings.task_type}, ${settings.fps}fps, CRF=${settings.quality}, 输出 ${settings.outputDir}`,
          "INFO"
        );
      } catch (err) {
        appendLog(
          `提交失败: ${err instanceof Error ? err.message : String(err)}`,
          "ERROR"
        );
      } finally {
        setStarting(false);
      }
    },
    [inputPath, appendLog]
  );

  /* ── Stop ── */
  const handleStop = useCallback(async () => {
    if (!currentTaskId) {
      appendLog("没有正在运行的任务", "WARN");
      return;
    }
    try {
      await cancelJob(currentTaskId);
      appendLog(`已请求停止任务: ${currentTaskId}`, "WARN");
      setCurrentTaskId(null);
    } catch (err) {
      appendLog(
        `停止失败: ${err instanceof Error ? err.message : String(err)}`,
        "ERROR"
      );
    }
  }, [currentTaskId, appendLog]);

  const running = Boolean(currentTaskId);
  const runningCount = runningTasks.filter(
    (t) => !isTerminalStatus(t.status)
  ).length;

  return (
    <div
      className="relative flex h-screen min-h-[640px] w-screen min-w-[920px] flex-col overflow-hidden font-[var(--app-font-family)] text-white [color-scheme:dark]"
      style={{
        background:
          "radial-gradient(120% 80% at 20% 0%, rgba(10,132,255,0.10) 0%, transparent 55%)," +
          "radial-gradient(80% 60% at 100% 100%, rgba(124,58,237,0.10) 0%, transparent 60%)," +
          "linear-gradient(180deg, #07090f 0%, #0c1119 100%)",
      }}
    >
      <WinTitleBar />

      <div className="relative flex min-h-0 min-w-[920px] flex-1 overflow-hidden">
        <WinNavBar
          active={navActive}
          onChange={setNavActive}
          onPickInput={() => void handlePickInput()}
          hasInput={Boolean(inputPath)}
        />
        <WinPreviewPane
          key={inputPath ?? "empty"}
          hasInput={Boolean(inputPath)}
          inputName={inputPath ? basename(inputPath) : null}
          onPickInput={() => void handlePickInput()}
        />
        <WinParamsPanel
          hasInput={Boolean(inputPath)}
          inputName={inputPath ? basename(inputPath) : null}
          running={running}
          starting={starting}
          onStart={(s) => void handleStart(s as FullSettings)}
          onStop={() => void handleStop()}
        />
      </div>

      <WinLogPane logs={logs} />
      <WinStatusBar
        apiOk={apiOk}
        runningCount={runningCount}
        gpuName={gpuName}
      />
    </div>
  );
}