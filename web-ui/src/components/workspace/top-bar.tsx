"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";
import { StatusIndicator } from "@/components/workspace/status-indicator";

export interface TopBarBreadcrumb {
  label: string;
  href?: string;
}

export interface TopBarProps {
  title?: string;
  breadcrumbs?: TopBarBreadcrumb[];
  greeting?: {
    title: string;
    subtitle?: string;
  };
  status?: "online" | "offline" | "warning" | "idle";
  statusLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export function TopBar({
  title,
  breadcrumbs,
  greeting,
  status = "idle",
  statusLabel,
  actions,
  className,
}: TopBarProps) {
  return (
    <header
      data-slot="top-bar"
      className={cn(
        "sticky top-0 z-40 flex min-h-12 items-center gap-[var(--space-4)] border-b border-[color-mix(in_srgb,var(--glass-border)_70%,transparent)] px-[var(--space-4)] py-[var(--space-2)] sm:px-[var(--space-6)]",
        "bg-[color-mix(in_srgb,var(--bg-1)_calc(var(--glass-opacity)*55%),transparent)]",
        "backdrop-blur-[calc(var(--glass-blur)*0.85)] backdrop-saturate-[180%]",
        glassMotion,
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {greeting ? (
          <>
            <h1 className="text-large-title truncate tracking-tight text-[var(--glass-label)] sm:text-[var(--text-large-title)]">
              {greeting.title}
            </h1>
            {greeting.subtitle ? (
              <p className="text-subheadline text-[var(--glass-label-secondary)]">
                {greeting.subtitle}
              </p>
            ) : null}
          </>
        ) : (
          <>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav aria-label="面包屑" className="flex flex-wrap items-center gap-1 text-[11px] text-[var(--text-muted)]">
                {breadcrumbs.map((crumb, index) => (
                  <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                    {index > 0 ? (
                      <ChevronRight className="size-3 opacity-50" aria-hidden />
                    ) : null}
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className={cn(glassFocusRing, "rounded px-0.5 hover:text-[var(--text-strong)]")}
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            ) : null}
            {title ? (
              <h1 className="truncate text-[15px] font-semibold text-[var(--text-strong)]">
                {title}
              </h1>
            ) : null}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-[var(--space-3)]">
        {status !== "idle" ? (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 text-[12px] font-medium",
              status === "online" &&
                "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-[var(--success)]",
              status === "warning" &&
                "bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-[var(--warning)]",
              status === "offline" &&
                "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]"
            )}
          >
            <StatusIndicator
              status={status === "online" ? "success" : status === "warning" ? "running" : "error"}
              label={statusLabel ?? status}
              size="sm"
            />
            {statusLabel ?? status}
          </span>
        ) : null}
        {actions}
      </div>
    </header>
  );
}
