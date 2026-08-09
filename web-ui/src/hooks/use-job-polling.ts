/**
 * GVFI — Job polling hook (writes into job-store).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useRef } from "react";
import { isTerminalStatus, stageLabelOf } from "@/lib/gvfi-api";
import { t } from "@/lib/i18n/t";
import type { JobTask } from "@/lib/gvfi-types";
import type { IRenderService } from "@/services/render-service";
import { useJobStore } from "@/stores/job-store";
import { useLocaleStore } from "@/stores/locale-store";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface UseJobPollingOptions {
  renderService: IRenderService;
  intervalMs?: number;
}

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
    const locale = useLocaleStore.getState().locale;

    setActiveTask(task);
    setProgress(Math.round(clamp(task.progress, 0, 1) * 100));
    setStageLabel(stageLabelOf(task));
    if (task.output_path) setLastOutputPath(task.output_path);
    if (warnings?.length) {
      appendTaskLog(
        t(locale, "jobs.warnPrefix", { warnings: warnings.join("; ") })
      );
    }
    if (task.status === "failed" || task.status === "cancelled") {
      setIsRendering(false);
      stopPolling();
      appendErrorLog(
        task.error ||
          task.message ||
          t(locale, "jobs.taskStatus", { status: task.status })
      );
      return;
    }
    if (task.status === "succeeded") {
      setIsRendering(false);
      stopPolling();
      appendTaskLog(
        t(locale, "jobs.donePrefix", {
          detail: task.output_path || task.message || "",
        })
      );
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
