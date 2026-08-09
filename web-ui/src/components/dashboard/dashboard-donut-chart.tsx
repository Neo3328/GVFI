"use client";

import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DashboardDonutChartProps {
  segments: DonutSegment[];
  totalLabel: string;
  totalValue: string;
  className?: string;
}

export function DashboardDonutChart({
  segments,
  totalLabel,
  totalValue,
  className,
}: DashboardDonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let cursor = 0;
  const gradientStops = segments
    .map((segment) => {
      const start = (cursor / total) * 100;
      cursor += segment.value;
      const end = (cursor / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="relative size-52">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${gradientStops || "var(--accent) 0% 100%"})`,
          }}
          aria-hidden
        />
        <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-[var(--bg-1)] text-center shadow-inner">
          <p className="text-[28px] font-semibold leading-none text-[var(--text-strong)]">
            {totalValue}
          </p>
          <p className="mt-1 max-w-[120px] text-[11px] text-[var(--text-muted)]">
            {totalLabel}
          </p>
        </div>
      </div>
      <ul className="grid w-full gap-2">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--bg-2)_55%,transparent)] px-3 py-2"
          >
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--text-normal)]">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="shrink-0 text-[13px] font-medium text-[var(--text-strong)]">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
