/**
 * GVFI — Workstation dashboard overview.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from"react";
import Link from"next/link";
import type {
 DashboardFilterMode,
 DashboardTimeRange,
} from"@/components/dashboard/dashboard-filter-bar";
import { DashboardDonutChart } from"@/components/dashboard/dashboard-donut-chart";
import { DashboardLineChart } from"@/components/dashboard/dashboard-line-chart";
import { DashboardStatCard } from"@/components/dashboard/dashboard-stat-card";
import { glassButtonVariants } from"@/components/glass/glass-button";
import { cn } from"@/lib/utils";
import {
 GlassCard,
 GlassCardDescription,
 GlassCardHeader,
 GlassCardTitle,
} from"@/components/glass/glass-card";
import { useWorkspaceChrome } from"@/components/workspace/workspace-chrome-context";
import { useHealth } from"@/hooks/use-health";
import { useRenderService } from"@/hooks/use-render-service";
import { useLocale, useT } from"@/hooks/use-t";
import { formatDeviceLabel } from"@/lib/i18n/device-label";
import { formatPercent } from"@/lib/i18n/format";
import { isTerminalStatus } from"@/lib/gvfi-api";
import type { JobTask } from"@/lib/gvfi-types";
import { useJobStore } from"@/stores/job-store";

function withinRange(iso: string, range: DashboardTimeRange): boolean {
 const ts = new Date(iso).getTime();
 const now = Date.now();
 const ms =
 range ==="24h"
 ? 24 * 60 * 60 * 1000
 : range ==="7d"
 ? 7 * 24 * 60 * 60 * 1000
 : 30 * 24 * 60 * 60 * 1000;
 return ts >= now - ms;
}

function bucketTasksByHour(tasks: JobTask[]): { label: string; actual: number; max: number }[] {
 const buckets = Array.from({ length: 8 }, (_, i) => ({
 label: `${String(i * 3).padStart(2,"0")}:00`,
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
 const t = useT();
 const locale = useLocale();
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
 title: t("dashboard.title"),
 breadcrumbs: [
 { label: t("common.app"), href:"/app/dashboard" },
 { label: t("dashboard.crumb") },
 ],
 status:
 serviceReady === false
 ?"offline"
 : serviceReady
 ? isRendering
 ?"warning"
 :"online"
 :"idle",
 statusLabel:
 serviceReady === false
 ? t("dashboard.statusOffline")
 : serviceReady
 ? t("dashboard.statusLive")
 : t("dashboard.statusConnecting"),
 });
 }, [serviceReady, isRendering, setChrome, t]);

 const filteredTasks = useMemo(() => {
 return tasks.filter((task) => {
 if (!withinRange(task.updated_at, timeRange)) return false;
 if (filterMode ==="active" && isTerminalStatus(task.status)) return false;
 if (filterMode ==="done" && !isTerminalStatus(task.status)) return false;
 if (modelFilter !=="all" && !task.message.includes(modelFilter)) {
 const modelName = models.find((m) => m.id === modelFilter)?.name;
 if (modelName && !task.message.includes(modelName)) return false;
 }
 return true;
 });
 }, [tasks, filterMode, modelFilter, timeRange, models]);

 const activeCount = filteredTasks.filter((task) => !isTerminalStatus(task.status)).length;
 const doneCount = filteredTasks.filter((task) => task.status ==="succeeded").length;
 const failedCount = filteredTasks.filter((task) => task.status ==="failed").length;
 const avgProgress =
 filteredTasks.length > 0
 ? Math.round(
 filteredTasks.reduce((sum, task) => sum + (task.progress ?? 0), 0) /
 filteredTasks.length
 )
 : 0;

 const gpuLabel =
 gpus.length > 0
 ? formatDeviceLabel(locale, gpus[0])
 : t("dashboard.kpi.gpuMissing");

 const chartPoints = useMemo(() => bucketTasksByHour(filteredTasks), [filteredTasks]);
 const peakBucket = chartPoints.reduce(
 (best, cur) => (cur.actual > best.actual ? cur : best),
 chartPoints[0] ?? { label: t("common.emDash"), actual: 0, max: 0 }
 );
 const lowBucket = chartPoints.reduce(
 (best, cur) => (cur.actual < best.actual ? cur : best),
 chartPoints[0] ?? { label: t("common.emDash"), actual: 0, max: 0 }
 );

 return (
 <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-4)] lg:px-[var(--space-6)]">
 <div className="flex flex-wrap items-end justify-between gap-3">
 <p className="max-w-xl text-[14px] text-[var(--text-muted)]">
 {t("dashboard.intro")}
 </p>
 <div className="flex flex-wrap gap-2">
 <Link
 href="/app/video"
 className={cn(glassButtonVariants({ variant:"primary", size:"sm" }))}
 >
 {t("dashboard.processVideo")}
 </Link>
 <Link
 href="/app/ai"
 className={cn(glassButtonVariants({ variant:"ghost", size:"sm" }))}
 >
 {t("dashboard.aiAnalyze")}
 </Link>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 xl:grid-cols-4">
 <DashboardStatCard
 label={t("dashboard.kpi.api")}
 sublabel={t("dashboard.kpi.apiSub")}
 value={
 serviceReady
 ? t("dashboard.kpi.online")
 : serviceReady === false
 ? t("dashboard.kpi.offline")
 : t("common.ellipsis")
 }
 badge={
 serviceReady
 ? t("dashboard.kpi.badge.normal")
 : serviceReady === false
 ? t("dashboard.kpi.badge.offline")
 : t("dashboard.kpi.badge.warning")
 }
 badgeTone={serviceReady ?"optimal" : serviceReady === false ?"offline" :"warning"}
 trend={serviceReady ? t("dashboard.kpi.stable") : undefined}
 trendUp={serviceReady !== false}
 />
 <DashboardStatCard
 label={t("dashboard.kpi.queue")}
 sublabel={t("dashboard.kpi.queueSub")}
 value={String(queueCount || activeCount)}
 badge={
 activeCount > 2
 ? t("dashboard.kpi.badge.high")
 : t("dashboard.kpi.badge.normal")
 }
 badgeTone={activeCount > 2 ?"high" :"normal"}
 trend={t("dashboard.kpi.total", { count: filteredTasks.length })}
 trendUp
 />
 <DashboardStatCard
 label={t("dashboard.kpi.gpu")}
 sublabel={t("dashboard.kpi.gpuSub")}
 value={gpuLabel.length > 12 ? `${gpuLabel.slice(0, 12)}…` : gpuLabel}
 badge={t("dashboard.kpi.badge.optimal")}
 badgeTone="optimal"
 trend={t("dashboard.kpi.devices", { count: gpus.length })}
 trendUp
 />
 <DashboardStatCard
 label={t("dashboard.kpi.prog")}
 sublabel={t("dashboard.kpi.progSub")}
 value={isRendering ? `${progress}%` : `${avgProgress}%`}
 badge={
 isRendering
 ? t("dashboard.kpi.badge.high")
 : t("dashboard.kpi.badge.normal")
 }
 badgeTone={isRendering ?"high" :"normal"}
 trend={isRendering ? t("dashboard.kpi.rendering") : t("dashboard.kpi.idle")}
 trendUp={!isRendering}
 />
 </div>

 <div className="grid grid-cols-1 gap-[var(--space-4)] xl:grid-cols-2">
 <GlassCard className="p-[var(--space-5)]">
 <GlassCardHeader>
 <GlassCardTitle>{t("dashboard.donut.title")}</GlassCardTitle>
 <GlassCardDescription>{t("dashboard.donut.subtitle")}</GlassCardDescription>
 </GlassCardHeader>
 <DashboardDonutChart
 totalValue={String(filteredTasks.length)}
 totalLabel={t("dashboard.donut.totalLabel")}
 segments={[
 {
 label: t("dashboard.donut.active"),
 value: activeCount,
 color:"var(--accent-cyan)",
 },
 {
 label: t("dashboard.donut.done"),
 value: doneCount,
 color:"var(--success)",
 },
 {
 label: t("dashboard.donut.failed"),
 value: failedCount,
 color:"var(--danger)",
 },
 {
 label: t("dashboard.donut.other"),
 value: Math.max(
 filteredTasks.length - activeCount - doneCount - failedCount,
 0
 ),
 color:"var(--accent)",
 },
 ]}
 />
 <div className="mt-[var(--space-4)] flex flex-wrap gap-2">
 <Link
 href="/app/video"
 className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-3 py-2 text-[12px] font-medium text-[var(--accent)]"
 >
 {t("dashboard.newTask")}
 </Link>
 <Link
 href="/app/tasks"
 className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--bg-1)_80%,transparent)] px-3 py-2 text-[12px] text-[var(--text-normal)]"
 >
 {t("dashboard.viewTasks")}
 </Link>
 </div>
 </GlassCard>

 <GlassCard className="p-[var(--space-5)]">
 <DashboardLineChart
 title={t("dashboard.load.title")}
 subtitle={t("dashboard.load.subtitle")}
 points={chartPoints}
 avgLabel={t("dashboard.load.avg")}
 avgValue={t("dashboard.load.avgValue", {
 count: Math.round(filteredTasks.length / Math.max(chartPoints.length, 1)),
 })}
 peakLabel={t("dashboard.load.peak")}
 peakValue={`${peakBucket.label} (${peakBucket.actual})`}
 efficiencyLabel={t("dashboard.load.efficiency")}
 efficiencyValue={
 filteredTasks.length
 ? formatPercent(locale, doneCount / filteredTasks.length)
 : t("common.emDash")
 }
 insights={[
 {
 label: t("dashboard.load.low"),
 value: t("dashboard.load.lowValue", {
 label: lowBucket.label,
 count: lowBucket.actual,
 }),
 },
 {
 label: t("dashboard.load.recentLog"),
 value: taskLogs[taskLogs.length - 1]?.slice(0, 48) ?? t("dashboard.load.noLog"),
 },
 {
 label: t("dashboard.load.models"),
 value: t("dashboard.load.modelsValue", { count: models.length }),
 },
 ]}
 />
 </GlassCard>
 </div>
 </div>
 );
}
