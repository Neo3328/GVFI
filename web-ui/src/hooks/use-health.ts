/**
 * GVFI — Health polling hook for render service status.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect } from "react";
import { isTerminalStatus } from "@/lib/gvfi-api";
import { t } from "@/lib/i18n/t";
import type { MessageKey } from "@/lib/i18n/types";
import type { GvfiGpu, GvfiModel } from "@/lib/gvfi-types";
import type { IRenderService } from "@/services/render-service";
import { useJobStore } from "@/stores/job-store";
import { useLocaleStore } from "@/stores/locale-store";

export interface UseHealthOptions {
  renderService: IRenderService;
  intervalMs?: number;
  onHealthLoaded?: (data: {
    models: GvfiModel[];
    gpus: GvfiGpu[];
    outputDir: string;
  }) => void;
}

function tr(
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  return t(useLocaleStore.getState().locale, key, params);
}

function stageDetail(detailKey: MessageKey): string {
  return tr("process.stage.wrap", { detail: tr(detailKey) });
}

/** Health poll — updates service / model / GPU state in job-store */
export function useHealth({
  renderService,
  intervalMs = 10000,
  onHealthLoaded,
}: UseHealthOptions) {
  const appendTaskLog = useJobStore((s) => s.appendTaskLog);
  const appendErrorLog = useJobStore((s) => s.appendErrorLog);

  const refreshHealth = async (options?: { announce?: boolean }) => {
    const announce = options?.announce ?? false;
    const {
      serviceReady: prevReady,
      setServiceReady,
      setStageLabel,
      setHealthData,
      setQueueCount,
      stageLabel,
    } = useJobStore.getState();

    try {
      const health = await renderService.checkHealth();
      const ready = health.ok && health.rife_ready;
      setServiceReady(ready);
      if (announce || prevReady !== ready) {
        if (ready) {
          const keep =
            /提交|抽帧|插帧|Submit|Extract|Interpolat|RIFE/i.test(stageLabel);
          if (!keep) setStageLabel(stageDetail("process.stage.ready"));
        } else {
          setStageLabel(stageDetail("process.stage.notReady"));
        }
      }
      setHealthData({
        models: health.models ?? [],
        gpus: health.gpus ?? [],
        outputDir: health.output_dir ?? "",
      });
      onHealthLoaded?.({
        models: health.models ?? [],
        gpus: health.gpus ?? [],
        outputDir: health.output_dir ?? "",
      });
      if (announce && health.warnings?.length) {
        appendTaskLog(
          tr("process.health.warning", {
            warnings: health.warnings.join("；"),
          })
        );
      }
      if (announce && ready) {
        appendTaskLog(
          tr("process.health.connected", {
            models: health.models.length,
            gpus: health.gpus.length,
          })
        );
      }
      try {
        const tasks = await renderService.listJobs();
        const active = tasks.filter(
          (task) => !isTerminalStatus(task.status)
        ).length;
        setQueueCount(active);
      } catch {
        setQueueCount(0);
      }
      return health;
    } catch (error) {
      setServiceReady(false);
      if (prevReady !== false || announce) {
        setStageLabel(stageDetail("process.stage.connectFail"));
        appendErrorLog(
          error instanceof Error
            ? error.message
            : tr("process.health.connectFailDetail")
        );
      }
      return null;
    }
  };

  useEffect(() => {
    void refreshHealth({ announce: true });
    const timer = window.setInterval(() => {
      void refreshHealth({ announce: false });
    }, intervalMs);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderService, intervalMs]);

  return { refreshHealth };
}
