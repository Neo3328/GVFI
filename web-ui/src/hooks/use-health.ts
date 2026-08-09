"use client";

import { useEffect } from "react";
import { isTerminalStatus } from "@/lib/gvfi-api";
import type { GvfiGpu, GvfiModel } from "@/lib/gvfi-types";
import type { IRenderService } from "@/services/render-service";
import { useJobStore } from "@/stores/job-store";

export interface UseHealthOptions {
  renderService: IRenderService;
  intervalMs?: number;
  onHealthLoaded?: (data: {
    models: GvfiModel[];
    gpus: GvfiGpu[];
    outputDir: string;
  }) => void;
}

/** 健康检查轮询 — 更新 job-store 中的服务/模型/GPU 状态 */
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
            stageLabel.includes("提交") ||
            stageLabel.includes("抽帧") ||
            stageLabel.includes("插帧");
          if (!keep) setStageLabel("● 当前工序：就绪");
        } else {
          setStageLabel("● 当前工序：服务未就绪");
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
        appendTaskLog(`服务警告：${health.warnings.join("；")}`);
      }
      if (announce && ready) {
        appendTaskLog(
          `已连接 GVFI · 模型 ${health.models.length} 个 · GPU ${health.gpus.length} 个`
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
        setStageLabel("● 当前工序：无法连接 GVFI");
        appendErrorLog(
          error instanceof Error
            ? error.message
            : "无法连接 GVFI，请先运行 GVFI_API.cmd"
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
