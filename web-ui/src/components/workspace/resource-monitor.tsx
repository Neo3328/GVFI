"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Cpu, Gpu, HardDrive, MemoryStick } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/glass/glass-card";
import { ProgressBar } from "@/components/workspace/progress-bar";
import { StatusIndicator } from "@/components/workspace/status-indicator";

export const resourceMonitorVariants = cva("", {
  variants: {
    layout: {
      grid: "grid gap-[var(--space-3)] sm:grid-cols-2",
      stack: "flex flex-col gap-[var(--space-3)]",
    },
    size: {
      sm: "text-[11px]",
      md: "text-[13px]",
      lg: "text-[13px]",
    },
  },
  defaultVariants: {
    layout: "grid",
    size: "md",
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
  unit = "%",
}: {
  icon: typeof Cpu;
  label: string;
  value?: number;
  unit?: string;
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
          {value !== undefined ? `${Math.round(display)}${unit}` : "—"}
        </span>
      </div>
      <ProgressBar
        value={display}
        size="sm"
        aria-label={`${label} 使用率 ${Math.round(display)}${unit}`}
      />
    </div>
  );
}

/** CPU / GPU / 内存 / 显存监控面板 */
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
  return (
    <GlassPanel
      variant="default"
      title="资源监控"
      description={gpuName ?? "本地推理资源"}
      headerAction={
        <StatusIndicator
          status={online ? "online" : "offline"}
          label={online ? "服务在线" : "服务离线"}
          size="sm"
        />
      }
      className={className}
    >
      <div className={cn(resourceMonitorVariants({ layout, size }), "p-[var(--space-2)]")}>
        <ResourceRow icon={Cpu} label="CPU" value={cpu} />
        <ResourceRow icon={Gpu} label="GPU" value={gpu} />
        <ResourceRow icon={MemoryStick} label="内存" value={memory} />
        <ResourceRow icon={HardDrive} label="显存" value={vram} />
      </div>
    </GlassPanel>
  );
}
