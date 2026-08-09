"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassPanel } from "@/components/glass/glass-card";
import { GlassLogViewer } from "@/components/glass/glass-log-viewer";
import { GlassTaskCard } from "@/components/glass/glass-task-card";
import { VideoComparisonViewer } from "@/components/workspace/video-comparison-viewer";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { useRenderService } from "@/hooks/use-render-service";
import { isTerminalStatus, mediaUrlForPath, stageLabelOf } from "@/lib/gvfi-api";
import type { JobTask } from "@/lib/gvfi-types";

function basename(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || path || "未命名任务";
}

function taskTitle(task: JobTask): string {
  return basename(task.input_path || task.id);
}

export function RenderCenter() {
  const renderService = useRenderService();
  const { setChrome } = useWorkspaceChrome();
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<string[]>([]);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedId) ?? null,
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
        if (prev && sorted.some((t) => t.id === prev)) return prev;
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
    const active = tasks.some((t) => !isTerminalStatus(t.status));
    setChrome({
      title: "任务管理",
      breadcrumbs: [
        { label: "GVFI", href: "/app/dashboard" },
        { label: "任务" },
      ],
      status: loadError ? "offline" : active ? "warning" : "online",
      statusLabel: loadError
        ? "无法加载任务"
        : active
          ? `${tasks.filter((t) => !isTerminalStatus(t.status)).length} 个进行中`
          : `${tasks.length} 条记录`,
    });
  }, [tasks, loadError, setChrome]);

  const handleCancel = async (taskId: string) => {
    try {
      await renderService.cancelJob(taskId);
      await refreshTasks();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    }
  };

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
        <GlassPanel title="任务队列" description="本地渲染任务（最新在前）">
          {loadError ? (
            <p className="text-[13px] text-[var(--danger)]">{loadError}</p>
          ) : tasks.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">
              暂无任务 — 请先在「视频处理」提交渲染
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <GlassTaskCard
                    title={taskTitle(task)}
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
              title={taskTitle(selected)}
              description={stageLabelOf(selected).replace(/^●\s*当前工序：\s*/, "")}
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:grid-cols-4">
                <div>
                  <dt className="text-[var(--text-muted)]">状态</dt>
                  <dd className="font-medium text-[var(--text-strong)]">
                    {selected.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">进度</dt>
                  <dd className="font-medium">
                    {Math.round(selected.progress * 100)}%
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[var(--text-muted)]">输出</dt>
                  <dd className="truncate font-mono text-[11px]">
                    {selected.output_path || "—"}
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
              <GlassPanel title="运行日志" padding="md">
                <GlassLogViewer lines={taskLogs} variant="task" maxHeight={280} />
              </GlassPanel>
              <GlassPanel title="错误日志" padding="md">
                <GlassLogViewer
                  lines={errorLogs}
                  variant="error"
                  maxHeight={280}
                />
              </GlassPanel>
            </div>
          </>
        ) : (
          <GlassPanel title="选择任务" description="从左侧列表选择任务查看详情与预览">
            <p className="text-[13px] text-[var(--text-muted)]">
              云端渲染接口尚未接入；当前仅显示本地 GVFI 任务。
            </p>
          </GlassPanel>
        )}
      </main>
    </div>
  );
}
