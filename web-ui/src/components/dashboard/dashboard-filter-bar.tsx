/**
 * GVFI — Dashboard filter controls.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";
import { useT } from "@/hooks/use-t";

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
  const t = useT();
  return (
    <section
      className={cn(
        "flex flex-col gap-[var(--space-4)] rounded-[var(--radius-md)] glass-option-menu p-[var(--space-4)] lg:flex-row lg:items-end",
        className
      )}
    >
      <SelectField
        label={t("dashboard.filter.status")}
        value={filterMode}
        onChange={(v) => onFilterModeChange(v as DashboardFilterMode)}
        options={[
          { value: "all", label: t("dashboard.filter.all") },
          { value: "active", label: t("dashboard.filter.active") },
          { value: "done", label: t("dashboard.filter.done") },
        ]}
      />
      <SelectField
        label={t("dashboard.filter.model")}
        value={modelFilter}
        onChange={onModelFilterChange}
        options={[
          { value: "all", label: t("dashboard.filter.allModels") },
          ...models.map((m) => ({ value: m, label: m })),
        ]}
      />
      <SelectField
        label={t("dashboard.filter.time")}
        value={timeRange}
        onChange={(v) => onTimeRangeChange(v as DashboardTimeRange)}
        options={[
          { value: "24h", label: t("dashboard.filter.24h") },
          { value: "7d", label: t("dashboard.filter.7d") },
          { value: "30d", label: t("dashboard.filter.30d") },
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
        {t("dashboard.filter.apply")}
      </button>
    </section>
  );
}
