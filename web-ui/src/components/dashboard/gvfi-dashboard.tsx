"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  DashboardFilterMode,
  DashboardTimeRange,
} from "@/components/dashboard/dashboard-filter-bar";
import { DashboardDonutChart } from "@/components/dashboard/dashboard-donut-chart";
import { DashboardLineChart } from "@/components/dashboard/dashboard-line-chart";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { useHealth } from "@/hooks/use-health";
import { useRenderService } from "@/hooks/use-render-service";
import { isTerminalStatus } from "@/lib/gvfi-api";
import type { JobTask } from "@/lib/gvfi-types";
import { useJobStore } from "@/stores/job-store";

function withinRange(iso: string, range: DashboardTimeRange): boolean {
  const ts = new Date(iso).getTime();
  const now = Date.now();
  const ms =
    range === "24h"
      ? 24 * 60 * 60 * 1000
      : range === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  return ts >= now - ms;
}

function bucketTasksByHour(tasks: JobTask[]): { label: string; actual: number; max: number }[] {
  const buckets = Array.from({ length: 8 }, (_, i) => ({
    label: `${String(i * 3).padStart(2, "0")}:00`,
    actual: 0,
    max: 0,
  }));

  for (const task of tasks) {
    const hour = new Date(task.updated_at).getHours();
    const index = Math.min(Math.floor(hour / 3), buckets.length - 1);
    buckets[index].actual += 1;
    buckets[index].max = Math.max(buckets[index].max, buckets[index].actual + 1);
  }

  const peak = Math.max(...buckets.map((b) => b.actual), 1);
  return buckets.map((b) => ({
    ...b,
    max: Math.max(b.max, peak),
  }));
}

export function GvfiDashboard() {
  const renderService = useRenderService();
  const { setChrome } = useWorkspaceChrome();
  const {
    serviceReady,
    progress,
    isRendering,
    queueCount,
    models,
    gpus,
    taskLogs,
  } = useJobStore();

  useHealth({ renderService });

  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [filterMode] = useState<DashboardFilterMode>("all");
  const [modelFilter] = useState("all");
  const [timeRange] = useState<DashboardTimeRange>("24h");

  const refreshTasks = useCallback(async () => {
    try {
      const list = await renderService.listJobs();
      setTasks(list);
    } catch {
      setTasks([]);
    }
  }, [renderService]);

  useEffect(() => {
    void refreshTasks();
    const timer = window.setInterval(() => void refreshTasks(), 12000);
    return () => window.clearInterval(timer);
  }, [refreshTasks]);

  useEffect(() => {
    setChrome({
      title: "工作站仪表盘",
      breadcrumbs: [{ label: "GVFI", href: "/app/dashboard" }, { label: "仪表盘" }],
      status:
        serviceReady === false
          ? "offline"
          : serviceReady
            ? isRendering
              ? "warning"
              : "online"
            : "idle",
      statusLabel:
        serviceReady === false
          ? "服务离线"
          : serviceReady
            ? "实时监控已开启"
            : "连接中",
    });
  }, [serviceReady, isRendering, setChrome]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!withinRange(task.updated_at, timeRange)) return false;
      if (filterMode === "active" && isTerminalStatus(task.status)) return false;
      if (filterMode === "done" && !isTerminalStatus(task.status)) return false;
      if (modelFilter !== "all" && !task.message.includes(modelFilter)) {
        const modelName = models.find((m) => m.id === modelFilter)?.name;
        if (modelName && !task.message.includes(modelName)) return false;
      }
      return true;
    });
  }, [tasks, filterMode, modelFilter, timeRange, models]);

  const activeCount = filteredTasks.filter((t) => !isTerminalStatus(t.status)).length;
  const doneCount = filteredTasks.filter((t) => t.status === "succeeded").length;
  const failedCount = filteredTasks.filter((t) => t.status === "failed").length;
  const avgProgress =
    filteredTasks.length > 0
      ? Math.round(
          filteredTasks.reduce((sum, t) => sum + (t.progress ?? 0), 0) /
            filteredTasks.length
        )
      : 0;

  const gpuLabel =
    gpus[0]?.name ?? (gpus.length > 0 ? `GPU ${gpus[0]?.index ?? 0}` : "未检测到");

  const chartPoints = useMemo(() => bucketTasksByHour(filteredTasks), [filteredTasks]);
  const peakBucket = chartPoints.reduce(
    (best, cur) => (cur.actual > best.actual ? cur : best),
    chartPoints[0] ?? { label: "—", actual: 0, max: 0 }
  );
  const lowBucket = chartPoints.reduce(
    (best, cur) => (cur.actual < best.actual ? cur : best),
    chartPoints[0] ?? { label: "—", actual: 0, max: 0 }
  );

  return (
    <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-4)] lg:px-[var(--space-6)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-[14px] text-[var(--text-muted)]">
          状态总览与快捷入口。复杂参数与任务细节请进入对应页面。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/video"
            className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-cyan))] px-4 py-2 text-[13px] font-semibold text-white"
          >
            处理视频
          </Link>
          <Link
            href="/app/ai"
            className="rounded-full border border-[var(--glass-border)] px-4 py-2 text-[13px] font-semibold text-[var(--text-strong)]"
          >
            AI 分析
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="API"
          sublabel="服务连接"
          value={serviceReady ? "在线" : serviceReady === false ? "离线" : "…"}
          badge={serviceReady ? "normal" : serviceReady === false ? "offline" : "warning"}
          badgeTone={serviceReady ? "optimal" : serviceReady === false ? "offline" : "warning"}
          trend={serviceReady ? "+稳定" : undefined}
          trendUp={serviceReady !== false}
        />
        <DashboardStatCard
          label="QUEUE"
          sublabel="活动任务"
          value={String(queueCount || activeCount)}
          badge={activeCount > 2 ? "high" : "normal"}
          badgeTone={activeCount > 2 ? "high" : "normal"}
          trend={`${filteredTasks.length} 总计`}
          trendUp
        />
        <DashboardStatCard
          label="GPU"
          sublabel="当前设备"
          value={gpuLabel.length > 12 ? `${gpuLabel.slice(0, 12)}…` : gpuLabel}
          badge="optimal"
          badgeTone="optimal"
          trend={`${gpus.length} 设备`}
          trendUp
        />
        <DashboardStatCard
          label="PROG"
          sublabel="平均进度"
          value={isRendering ? `${progress}%` : `${avgProgress}%`}
          badge={isRendering ? "high" : "normal"}
          badgeTone={isRendering ? "high" : "normal"}
          trend={isRendering ? "渲染中" : "空闲"}
          trendUp={!isRendering}
        />
      </div>

      <div className="grid grid-cols-1 gap-[var(--space-4)] xl:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_68%,transparent)] p-[var(--space-5)] backdrop-blur-xl">
          <div className="mb-[var(--space-4)]">
            <h3 className="text-[15px] font-semibold text-[var(--text-strong)]">
              任务状态概览
            </h3>
            <p className="text-[12px] text-[var(--text-muted)]">
              按当前筛选条件统计任务分布
            </p>
          </div>
          <DashboardDonutChart
            totalValue={String(filteredTasks.length)}
            totalLabel="筛选范围内任务总数"
            segments={[
              {
                label: "进行中",
                value: activeCount,
                color: "var(--accent-cyan)",
              },
              {
                label: "已完成",
                value: doneCount,
                color: "var(--success)",
              },
              {
                label: "失败",
                value: failedCount,
                color: "var(--danger)",
              },
              {
                label: "其他",
                value: Math.max(
                  filteredTasks.length - activeCount - doneCount - failedCount,
                  0
                ),
                color: "var(--accent)",
              },
            ]}
          />
          <div className="mt-[var(--space-4)] flex flex-wrap gap-2">
            <Link
              href="/app/video"
              className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-3 py-2 text-[12px] font-medium text-[var(--accent)]"
            >
              新建处理任务
            </Link>
            <Link
              href="/app/tasks"
              className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--bg-1)_80%,transparent)] px-3 py-2 text-[12px] text-[var(--text-normal)]"
            >
              查看任务
            </Link>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_68%,transparent)] p-[var(--space-5)] backdrop-blur-xl">
          <DashboardLineChart
            title="负载与峰值分析"
            subtitle="按时间段统计任务活跃度（基于更新时间）"
            points={chartPoints}
            avgLabel="平均负载"
            avgValue={`${Math.round(filteredTasks.length / Math.max(chartPoints.length, 1))} 任务/段`}
            peakLabel="峰值时段"
            peakValue={`${peakBucket.label} (${peakBucket.actual})`}
            efficiencyLabel="完成率"
            efficiencyValue={
              filteredTasks.length
                ? `${Math.round((doneCount / filteredTasks.length) * 100)}%`
                : "—"
            }
            insights={[
              {
                label: "低负载时段",
                value: `${lowBucket.label} (${lowBucket.actual} 任务)`,
              },
              {
                label: "最近日志",
                value: taskLogs[taskLogs.length - 1]?.slice(0, 48) ?? "暂无",
              },
              {
                label: "可用模型",
                value: `${models.length} 个`,
              },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
