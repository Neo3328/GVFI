"use client";

import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";

export type DashboardFilterMode = "all" | "active" | "done";
export type DashboardTimeRange = "24h" | "7d" | "30d";

export interface DashboardFilterBarProps {
  filterMode: DashboardFilterMode;
  onFilterModeChange: (mode: DashboardFilterMode) => void;
  modelFilter: string;
  onModelFilterChange: (model: string) => void;
  models: string[];
  timeRange: DashboardTimeRange;
  onTimeRangeChange: (range: DashboardTimeRange) => void;
  onApply: () => void;
  className?: string;
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-w-[140px] flex-1 flex-col gap-1.5">
      <span className="text-[11px] font-medium text-[var(--text-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "glass-select h-10 w-full rounded-[var(--radius-sm)] px-3 text-[13px] text-[var(--text-strong)]",
          glassFocusRing,
          glassMotion
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DashboardFilterBar({
  filterMode,
  onFilterModeChange,
  modelFilter,
  onModelFilterChange,
  models,
  timeRange,
  onTimeRangeChange,
  onApply,
  className,
}: DashboardFilterBarProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-[var(--space-4)] rounded-[var(--radius-md)] glass-option-menu p-[var(--space-4)] lg:flex-row lg:items-end",
        className
      )}
    >
      <SelectField
        label="任务状态"
        value={filterMode}
        onChange={(v) => onFilterModeChange(v as DashboardFilterMode)}
        options={[
          { value: "all", label: "全部任务" },
          { value: "active", label: "进行中" },
          { value: "done", label: "已完成" },
        ]}
      />
      <SelectField
        label="补帧模型"
        value={modelFilter}
        onChange={onModelFilterChange}
        options={[
          { value: "all", label: "全部模型" },
          ...models.map((m) => ({ value: m, label: m })),
        ]}
      />
      <SelectField
        label="时间范围"
        value={timeRange}
        onChange={(v) => onTimeRangeChange(v as DashboardTimeRange)}
        options={[
          { value: "24h", label: "最近 24 小时" },
          { value: "7d", label: "最近 7 天" },
          { value: "30d", label: "最近 30 天" },
        ]}
      />
      <button
        type="button"
        onClick={onApply}
        className={cn(
          "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold glass-button primary",
          glassFocusRing,
          glassMotion,
          "hover:brightness-110 active:scale-[0.98]"
        )}
      >
        <Filter className="size-4" aria-hidden />
        应用筛选
      </button>
    </section>
  );
}
