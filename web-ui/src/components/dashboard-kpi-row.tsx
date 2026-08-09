/**
 * GVFI — Compact process workspace KPI row.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { Activity, Cpu, Layers, Wifi, WifiOff } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

interface DashboardKpiRowProps {
  serviceReady: boolean | null;
  progress: number;
  isRendering: boolean;
  gpuLabel: string;
  queueCount: number;
}

export function DashboardKpiRow({
  serviceReady,
  progress,
  isRendering,
  gpuLabel,
  queueCount,
}: DashboardKpiRowProps) {
  const t = useT();
  const serviceLabel =
    serviceReady === null
      ? t("dashboard.statusConnecting")
      : serviceReady
        ? t("dashboard.kpi.online")
        : t("dashboard.kpi.offline");

  const items = [
    {
      label: t("dashboard.kpi.api"),
      value: serviceLabel,
      icon: serviceReady ? Wifi : WifiOff,
      tone:
        serviceReady === null
          ? "text-muted-foreground"
          : serviceReady
            ? "text-[var(--success)]"
            : "text-destructive",
    },
    {
      label: t("kpi.row.progress"),
      value: isRendering ? `${progress}%` : t("dashboard.kpi.idle"),
      icon: Activity,
      tone: "text-foreground",
    },
    {
      label: t("dashboard.kpi.gpu"),
      value: gpuLabel,
      icon: Cpu,
      tone: "text-foreground",
    },
    {
      label: t("kpi.row.queue"),
      value: String(queueCount),
      icon: Layers,
      tone: "text-foreground",
    },
  ];

  return (
    <GlassCard
      className="grid grid-cols-2 divide-x divide-y divide-[var(--separator)] p-0 sm:grid-cols-4 sm:divide-y-0"
      aria-label={t("kpi.row.aria")}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1 p-4">
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <item.icon aria-hidden="true" className="size-3.5" />
            {item.label}
          </div>
          <p
            className={cn(
              "truncate font-medium text-[17px] leading-tight",
              item.tone
            )}
            title={item.value}
          >
            {item.value}
          </p>
        </div>
      ))}
    </GlassCard>
  );
}
