import { Activity, Cpu, Layers, Wifi, WifiOff } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
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
  const serviceLabel =
    serviceReady === null ? "连接中" : serviceReady ? "在线" : "离线";

  const items = [
    {
      label: "API",
      value: serviceLabel,
      icon: serviceReady ? Wifi : WifiOff,
      tone:
        serviceReady === null
          ? "text-muted-foreground"
          : serviceReady
            ? "text-[#34C759]"
            : "text-destructive",
    },
    {
      label: "进度",
      value: isRendering ? `${progress}%` : "空闲",
      icon: Activity,
      tone: "text-foreground",
    },
    {
      label: "GPU",
      value: gpuLabel,
      icon: Cpu,
      tone: "text-foreground",
    },
    {
      label: "队列",
      value: String(queueCount),
      icon: Layers,
      tone: "text-foreground",
    },
  ];

  return (
    <GlassCard className="grid grid-cols-2 divide-x divide-y divide-[var(--separator)] p-0 sm:grid-cols-4 sm:divide-y-0" aria-label="状态概览">
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
