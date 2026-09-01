/**
 * GVFI — CPU / GPU / memory resource monitor.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { cva, type VariantProps } from"class-variance-authority";
import { Cpu, Gpu, HardDrive, MemoryStick } from"lucide-react";
import { cn } from"@/lib/utils";
import { GlassPanel } from"@/components/glass/glass-card";
import { ProgressBar } from"@/components/workspace/progress-bar";
import { StatusIndicator } from"@/components/workspace/status-indicator";
import { useT } from"@/hooks/use-t";

export const resourceMonitorVariants = cva("", {
 variants: {
 layout: {
 grid:"grid gap-[var(--space-3)] sm:grid-cols-2",
 stack:"flex flex-col gap-[var(--space-3)]",
 },
 size: {
 sm:"text-[11px]",
 md:"text-[13px]",
 lg:"text-[13px]",
 },
 },
 defaultVariants: {
 layout:"grid",
 size:"md",
 },
});

export interface ResourceMonitorProps extends VariantProps<typeof resourceMonitorVariants> {
 cpu?: number;
 gpu?: number;
 memory?: number;
 vram?: number;
 gpuName?: string;
 online?: boolean;
 className?: string;
}

function ResourceRow({
 icon: Icon,
 label,
 value,
 unit ="%",
 usageAria,
}: {
 icon: typeof Cpu;
 label: string;
 value?: number;
 unit?: string;
 usageAria: string;
}) {
 const display = value ?? 0;
 return (
 <div className="flex flex-col gap-[var(--space-2)]">
 <div className="flex items-center justify-between gap-[var(--space-2)]">
 <div className="flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
 <Icon className="size-3.5 shrink-0" aria-hidden />
 <span>{label}</span>
 </div>
 <span className="tabular-nums text-[var(--text-strong)]">
 {value !== undefined ? `${Math.round(display)}${unit}` :"—"}
 </span>
 </div>
 <ProgressBar
 value={display}
 size="sm"
 aria-label={usageAria}
 />
 </div>
 );
}

/** CPU / GPU / memory / VRAM monitor panel */
export function ResourceMonitor({
 cpu,
 gpu,
 memory,
 vram,
 gpuName,
 online = true,
 layout,
 size,
 className,
}: ResourceMonitorProps) {
 const t = useT();
 const cpuLabel = t("video.resource.cpu");
 const gpuLabel = t("video.resource.gpu");
 const memoryLabel = t("video.resource.memory");
 const vramLabel = t("video.resource.vram");

 return (
 <GlassPanel
 variant="default"
 title={t("video.resource.title")}
 description={gpuName ?? t("video.resource.desc")}
 headerAction={
 <StatusIndicator
 status={online ?"online" :"offline"}
 label={online ? t("video.resource.online") : t("video.resource.offline")}
 size="sm"
 />
 }
 className={className}
 >
 <div className={cn(resourceMonitorVariants({ layout, size }),"p-[var(--space-2)]")}>
 <ResourceRow
 icon={Cpu}
 label={cpuLabel}
 value={cpu}
 usageAria={t("video.resource.usageAria", {
 label: cpuLabel,
 value: Math.round(cpu ?? 0),
 unit:"%",
 })}
 />
 <ResourceRow
 icon={Gpu}
 label={gpuLabel}
 value={gpu}
 usageAria={t("video.resource.usageAria", {
 label: gpuLabel,
 value: Math.round(gpu ?? 0),
 unit:"%",
 })}
 />
 <ResourceRow
 icon={MemoryStick}
 label={memoryLabel}
 value={memory}
 usageAria={t("video.resource.usageAria", {
 label: memoryLabel,
 value: Math.round(memory ?? 0),
 unit:"%",
 })}
 />
 <ResourceRow
 icon={HardDrive}
 label={vramLabel}
 value={vram}
 usageAria={t("video.resource.usageAria", {
 label: vramLabel,
 value: Math.round(vram ?? 0),
 unit:"%",
 })}
 />
 </div>
 </GlassPanel>
 );
}
