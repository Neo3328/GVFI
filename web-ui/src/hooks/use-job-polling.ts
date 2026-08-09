"use client";

import { useEffect, useRef } from "react";
import { isTerminalStatus, stageLabelOf } from "@/lib/gvfi-api";
import type { JobTask } from "@/lib/gvfi-types";
import type { IRenderService } from "@/services/render-service";
import { useJobStore } from "@/stores/job-store";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface UseJobPollingOptions {
  renderService: IRenderService;
  intervalMs?: number;
}

/** 任务轮询 — 从 UI 组件移出，写入 job-store */
export function useJobPolling({
  renderService,
  intervalMs = 1000,
}: UseJobPollingOptions) {
  const pollRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const applyTask = (task: JobTask, warnings?: string[]) => {
    const {
      setActiveTask,
      setProgress,
      setStageLabel,
      setIsRendering,
      setLastOutputPath,
      appendTaskLog,
      appendErrorLog,
    } = useJobStore.getState();

    setActiveTask(task);
    setProgress(Math.round(clamp(task.progress, 0, 1) * 100));
    setStageLabel(stageLabelOf(task));
    if (task.output_path) setLastOutputPath(task.output_path);
    if (warnings?.length) {
      appendTaskLog(`警告：${warnings.join("；")}`);
    }
    if (task.status === "failed" || task.status === "cancelled") {
      setIsRendering(false);
      stopPolling();
      appendErrorLog(task.error || task.message || `任务${task.status}`);
      return;
    }
    if (task.status === "succeeded") {
      setIsRendering(false);
      stopPolling();
      appendTaskLog(`完成：${task.output_path || task.message}`);
      return;
    }
    setIsRendering(true);
  };

  const startPolling = (id: string) => {
    stopPolling();
    pollRef.current = window.setInterval(() => {
      void (async () => {
        try {
          const task = await renderService.getJob(id);
          applyTask(task);
          if (isTerminalStatus(task.status)) {
            stopPolling();
          }
        } catch (error) {
          useJobStore
            .getState()
            .appendErrorLog(
              error instanceof Error ? error.message : String(error)
            );
        }
      })();
    }, intervalMs);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  return { applyTask, startPolling, stopPolling };
}
