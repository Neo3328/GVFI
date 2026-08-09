"use client";

import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export type StatBadgeTone = "normal" | "high" | "optimal" | "warning" | "offline";

const badgeToneClass: Record<StatBadgeTone, string> = {
  normal: "bg-[color-mix(in_srgb,var(--success)_22%,transparent)] text-[var(--success)]",
  high: "bg-[color-mix(in_srgb,var(--warning)_22%,transparent)] text-[var(--warning)]",
  optimal: "bg-[color-mix(in_srgb,var(--accent-cyan)_22%,transparent)] text-[var(--accent-cyan)]",
  warning: "bg-[color-mix(in_srgb,var(--warning)_22%,transparent)] text-[var(--warning)]",
  offline: "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-[var(--danger)]",
};

export interface DashboardStatCardProps {
  label: string;
  sublabel: string;
  value: string;
  badge: string;
  badgeTone?: StatBadgeTone;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function DashboardStatCard({
  label,
  sublabel,
  value,
  badge,
  badgeTone = "normal",
  trend,
  trendUp = true,
  className,
}: DashboardStatCardProps) {
  return (
    <article
      className={cn(
        "flex min-h-[132px] flex-col justify-between overflow-hidden rounded-[var(--card-radius)] bg-clip-padding p-[var(--space-4)]",
        "border border-[color-mix(in_srgb,var(--accent)_24%,transparent)]",
        "bg-[linear-gradient(145deg,color-mix(in_srgb,var(--bg-2)_92%,var(--accent)_8%),color-mix(in_srgb,var(--bg-1)_88%,var(--accent-cyan)_12%))]",
        "shadow-[0_12px_40px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </span>
        <span
          className={cn(
            "rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-medium",
            badgeToneClass[badgeTone]
          )}
        >
          {badge}
        </span>
      </div>
      <p className="text-[28px] font-semibold leading-none tracking-tight text-[var(--text-strong)]">
        {value}
      </p>
      <div className="flex items-end justify-between gap-2">
        <span className="text-[12px] text-[var(--text-muted)]">{sublabel}</span>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium",
              trendUp ? "text-[var(--success)]" : "text-[var(--danger)]"
            )}
          >
            {trendUp ? (
              <TrendingUp className="size-3.5" aria-hidden />
            ) : (
              <TrendingDown className="size-3.5" aria-hidden />
            )}
            {trend}
          </span>
        ) : null}
      </div>
    </article>
  );
}
