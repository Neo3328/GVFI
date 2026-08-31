/**
 * GVFI — Local render task center.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassPanel } from "@/components/glass/glass-card";
import { GlassLogViewer } from "@/components/glass/glass-log-viewer";
import { GlassTaskCard } from "@/components/glass/glass-task-card";
import { Badge } from "@/components/ui/badge";
import { VideoComparisonViewer } from "@/components/workspace/video-comparison-viewer";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { useRenderService } from "@/hooks/use-render-service";
import { useT } from "@/hooks/use-t";
import {
  isTerminalStatus,
  mediaUrlForPath,
  stageLabelOf,
  stripStagePrefix,
} from "@/lib/gvfi-api";
import type { JobTask } from "@/lib/gvfi-types";

function basename(path: string, untitled: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || path || untitled;
}

function taskTitle(task: JobTask, untitled: string): string {
  return basename(task.input_path || task.id, untitled);
}

function taskTypeLabel(task: JobTask): string {
  if (task.task_type === "interp") return "补帧";
  if (task.task_type === "sr") return "超分";
  return "组合任务";
}

export function RenderCenter() {
  const t = useT();
  const renderService = useRenderService();
  const { setChrome } = useWorkspaceChrome();
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<string[]>([]);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selected = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [tasks, selectedId]
  );

  const refreshTasks = useCallback(async () => {
    try {
      const list = await renderService.listJobs();
      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setTasks(sorted);
      setLoadError(null);
      setSelectedId((prev) => {
        if (prev && sorted.some((task) => task.id === prev)) return prev;
        return sorted[0]?.id ?? null;
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    }
  }, [renderService]);

  const refreshLogs = useCallback(
    async (taskId: string) => {
      try {
        const payload = await renderService.getJobLogs(taskId);
        setTaskLogs(payload.logs ?? []);
        setErrorLogs(payload.error_logs ?? []);
      } catch {
        setTaskLogs([]);
        setErrorLogs([]);
      }
    },
    [renderService]
  );

  useEffect(() => {
    void refreshTasks();
    const timer = window.setInterval(() => {
      void refreshTasks();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshTasks]);

  useEffect(() => {
    if (!selectedId) {
      setTaskLogs([]);
      setErrorLogs([]);
      return;
    }
    void refreshLogs(selectedId);
    const timer = window.setInterval(() => {
      void refreshLogs(selectedId);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [selectedId, refreshLogs]);

  useEffect(() => {
    const active = tasks.some((task) => !isTerminalStatus(task.status));
    setChrome({
      title: t("tasks.title"),
      breadcrumbs: [
        { label: t("common.app"), href: "/app/dashboard" },
        { label: t("tasks.crumb") },
      ],
      status: loadError ? "offline" : active ? "warning" : "online",
      statusLabel: loadError
        ? t("tasks.loadFail")
        : active
          ? t("tasks.activeCount", {
              count: tasks.filter((task) => !isTerminalStatus(task.status)).length,
            })
          : t("tasks.recordCount", { count: tasks.length }),
    });
  }, [tasks, loadError, setChrome, t]);

  const handleCancel = async (taskId: string) => {
    try {
      await renderService.cancelJob(taskId);
      await refreshTasks();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    }
  };

  const untitled = t("tasks.untitled");
  const srcBefore = selected?.input_path
    ? mediaUrlForPath(selected.input_path)
    : undefined;
  const srcAfter =
    selected?.output_path && selected.status === "succeeded"
      ? mediaUrlForPath(selected.output_path)
      : undefined;

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start">
      <aside className="flex w-full flex-col gap-3 lg:max-w-sm">
        <GlassPanel title={t("tasks.queueTitle")} description={t("tasks.queueDesc")}>
          {loadError ? (
            <p className="text-[13px] text-[var(--danger)]">{loadError}</p>
          ) : tasks.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">
              {t("tasks.empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <GlassTaskCard
                    title={
                      <span className="flex items-center gap-2">
                        {taskTitle(task, untitled)}
                        <Badge variant="outline" className="text-[10px]">
                          {taskTypeLabel(task)}
                        </Badge>
                      </span>
                    }
                    status={task.status}
                    stage={task.stage}
                    progress={Math.round(task.progress * 100)}
                    message={task.message}
                    variant={selectedId === task.id ? "expanded" : "compact"}
                    ai
                    onOpen={() => setSelectedId(task.id)}
                    onCancel={
                      !isTerminalStatus(task.status)
                        ? () => {
                            void handleCancel(task.id);
                          }
                        : undefined
                    }
                    className={
                      selectedId === task.id
                        ? "ring-1 ring-[var(--accent)]"
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-4">
        {selected ? (
          <>
            <GlassPanel
              title={taskTitle(selected, untitled)}
              description={stripStagePrefix(stageLabelOf(selected))}
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:grid-cols-4">
                <div>
                  <dt className="text-[var(--text-muted)]">{t("tasks.status")}</dt>
                  <dd className="font-medium text-[var(--text-strong)]">
                    {selected.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">{t("tasks.progress")}</dt>
                  <dd className="font-medium">
                    {Math.round(selected.progress * 100)}%
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[var(--text-muted)]">{t("tasks.output")}</dt>
                  <dd className="truncate font-mono text-[11px]">
                    {selected.output_path || t("common.emDash")}
                  </dd>
                </div>
              </dl>
            </GlassPanel>

            <VideoComparisonViewer
              srcBefore={srcBefore}
              srcAfter={srcAfter}
              compareMode={srcBefore && srcAfter ? "slider" : "toggle"}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <GlassPanel title={t("tasks.logs")} padding="md">
                <GlassLogViewer lines={taskLogs} variant="task" maxHeight={280} />
              </GlassPanel>
              <GlassPanel title={t("tasks.errors")} padding="md">
                <GlassLogViewer
                  lines={errorLogs}
                  variant="error"
                  maxHeight={280}
                />
              </GlassPanel>
            </div>
          </>
        ) : (
          <GlassPanel title={t("tasks.selectTitle")} description={t("tasks.selectDesc")}>
            <p className="text-[13px] text-[var(--text-muted)]">
              {t("tasks.cloudHint")}
            </p>
          </GlassPanel>
        )}
      </main>
    </div>
  );
}
