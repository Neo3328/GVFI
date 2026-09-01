/**
 * GVFI — Bottom log pane (collapsible) + status bar (dark glass).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogLine {
  id: number;
  text: string;
  level: "INFO" | "RUN" | "WARN" | "ERROR";
}

const DEFAULT_LOGS: LogLine[] = [
  { id: 1, level: "INFO", text: "[INFO] GVFI 引擎初始化完成" },
  { id: 2, level: "INFO", text: "[INFO] 等待输入视频文件" },
];

export function WinLogPane({
  logs = DEFAULT_LOGS,
}: { logs?: LogLine[] } = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div
      className={cn(
        "relative mx-3 mb-2 flex shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-xl transition-[height] duration-200 ease-out",
        expanded ? "h-[160px]" : "h-[60px]"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "折叠日志" : "展开日志"}
        className="flex h-7 shrink-0 w-full items-center justify-between border-b border-white/[0.06] px-4 text-left hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_6px_rgba(100,210,255,0.8)]" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-cyan)]">
            运行日志
          </span>
          <span className="ml-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] tabular-nums text-white/55">
            {logs.length} 条
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/50 transition-colors hover:text-white">
          {expanded ? "收起" : "展开"}
          {expanded ? (
            <ChevronDown className="size-3" strokeWidth={2.2} />
          ) : (
            <ChevronUp className="size-3" strokeWidth={2.2} />
          )}
        </span>
      </button>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-1.5 font-mono text-[11px] leading-[1.5]"
      >
        {logs.length === 0 ? (
          <div className="text-white/35">暂无日志 — 任务将在这里实时记录</div>
        ) : (
          logs.map((line) => (
            <div key={line.id} className={cn("py-0.5", logLineClass(line.level))}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function WinStatusBar({
  apiOk = true,
  runningCount = 0,
  gpuName = "GPU: 未检测",
}: {
  apiOk?: boolean | null;
  runningCount?: number;
  gpuName?: string;
} = {}) {
  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-t border-white/10 bg-black/40 px-4 text-[10.5px] text-white/60 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <Circle
            className={cn(
              "size-2",
              apiOk === null
                ? "fill-white/30 text-white/30"
                : apiOk
                  ? "fill-[var(--success)] text-[var(--success)] shadow-[0_0_6px_rgba(46,204,113,0.6)]"
                  : "fill-[var(--danger)] text-[var(--danger)] shadow-[0_0_6px_rgba(220,38,38,0.6)]"
            )}
          />
          {apiOk === null ? "连接中…" : apiOk ? "API 就绪" : "API 未连接"}
        </span>
        <span className="text-white/15">·</span>
        <span className="truncate">{gpuName || "GPU: 检测中"}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>任务 {runningCount} 运行中</span>
        <span className="text-white/15">·</span>
        <span className="font-mono">v1.1.0</span>
      </div>
    </div>
  );
}

function logLineClass(level: LogLine["level"]): string {
  switch (level) {
    case "ERROR":
      return "text-[var(--danger)]";
    case "WARN":
      return "text-[var(--warning)]";
    case "RUN":
      return "text-[var(--accent-cyan)]";
    default:
      return "text-white/70";
  }
}