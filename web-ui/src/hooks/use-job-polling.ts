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
import { formatSvfiProgressLine } from "@/lib/svfi-progress-line";
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

interface ProgressRateState {
  jobId: string | null;
  startedAt: number;
  lastProgressPct: number;
  lastAt: number;
}

function looksLikeErrorLine(line: string): boolean {
  return /❌|处理异常失败|任务启动失败|Traceback|退出码|stderr|Error|Exception/i.test(
    line
  );
}

export function useJobPolling({
  renderService,
  intervalMs = 1000,
}: UseJobPollingOptions) {
  const pollRef = useRef<number | null>(null);
  const rateRef = useRef<ProgressRateState>({
    jobId: null,
    startedAt: 0,
    lastProgressPct: 0,
    lastAt: 0,
  });

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pullFailureLogs = async (task: JobTask) => {
    const { appendErrorLog } = useJobStore.getState();
    const locale = useLocaleStore.getState().locale;
    const fallback =
      task.error ||
      task.message ||
      t(locale, "jobs.taskStatus", { status: task.status });

    try {
      const payload = await renderService.getJobLogs(task.id);
      const fromApi = (payload.error_logs ?? []).filter((l) => l.trim());
      const fromTask = (payload.logs ?? []).filter(looksLikeErrorLine);
      const merged = fromApi.length > 0 ? fromApi : fromTask;
      if (merged.length === 0) {
        appendErrorLog(fallback);
        return;
      }
      for (const line of merged) {
        appendErrorLog(line);
      }
      // Ensure the task.error summary is visible even if already partially mirrored.
      if (task.error && !merged.some((l) => l.includes(task.error.slice(0, 80)))) {
        appendErrorLog(task.error);
      }
    } catch {
      appendErrorLog(fallback);
    }
  };

  const applyTask = async (task: JobTask, warnings?: string[]) => {
    const {
      setActiveTask,
      setProgress,
      setStageLabel,
      setIsRendering,
      setLastOutputPath,
      appendTaskLog,
      upsertProgressLog,
    } = useJobStore.getState();
    const locale = useLocaleStore.getState().locale;
    const now = Date.now();
    const progressPct = Math.round(clamp(task.progress, 0, 1) * 100);

    if (rateRef.current.jobId !== task.id) {
      const createdMs = Date.parse(task.created_at);
      rateRef.current = {
        jobId: task.id,
        startedAt: Number.isFinite(createdMs) ? createdMs : now,
        lastProgressPct: progressPct,
        lastAt: now,
      };
    }

    setActiveTask(task);
    setProgress(progressPct);
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
      await pullFailureLogs(task);
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

    const rateState = rateRef.current;
    const elapsedMs = Math.max(0, now - rateState.startedAt);
    const dtSec = (now - rateState.lastAt) / 1000;
    const dPct = progressPct - rateState.lastProgressPct;
    let ratePctPerSec: number | null = null;
    if (dtSec > 0 && dPct > 0) {
      ratePctPerSec = dPct / dtSec;
    } else if (elapsedMs > 0 && progressPct > 0) {
      ratePctPerSec = progressPct / (elapsedMs / 1000);
    }

    if (dPct !== 0 || rateState.lastAt === 0) {
      rateRef.current = {
        ...rateState,
        lastProgressPct: progressPct,
        lastAt: now,
      };
    }

    upsertProgressLog(
      formatSvfiProgressLine({
        progress: task.progress,
        stage: task.stage,
        message: task.message,
        elapsedMs,
        ratePctPerSec,
      })
    );
  };

  const startPolling = (id: string) => {
    stopPolling();
    rateRef.current = {
      jobId: null,
      startedAt: 0,
      lastProgressPct: 0,
      lastAt: 0,
    };
    pollRef.current = window.setInterval(() => {
      void (async () => {
        try {
          const task = await renderService.getJob(id);
          await applyTask(task);
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
