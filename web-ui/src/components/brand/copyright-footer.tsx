/**
 * GVFI — Copyright footer component.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { cn } from "@/lib/utils";
import {
  APP_NAME,
  COPYRIGHT_FOOTER_LINES,
} from "@/lib/brand";
import { useT } from "@/hooks/use-t";

export interface CopyrightFooterProps {
  className?: string;
  showAppName?: boolean;
  variant?: "compact" | "stacked";
  align?: "left" | "center" | "right";
}

export function CopyrightFooter({
  className,
  showAppName = false,
  variant = "stacked",
  align = "center",
}: CopyrightFooterProps) {
  const t = useT();
  const alignClass =
    align === "left"
      ? "text-left items-start"
      : align === "right"
        ? "text-right items-end"
        : "text-center items-center";

  return (
    <footer
      className={cn("flex flex-col gap-1 select-none", alignClass, className)}
      aria-label={t("brand.copyrightAria")}
    >
      {showAppName ? (
        <div className="mb-1 flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text-strong)]">
            {APP_NAME}
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            {t("brand.tagline")}
          </span>
        </div>
      ) : null}
      {variant === "compact" ? (
        <p className="text-[10px] leading-snug text-[var(--text-muted)]">
          {COPYRIGHT_FOOTER_LINES[0]} · {COPYRIGHT_FOOTER_LINES[1]}
        </p>
      ) : (
        COPYRIGHT_FOOTER_LINES.map((line) => (
          <p
            key={line}
            className="text-[10px] leading-snug text-[var(--text-muted)] sm:text-[11px]"
          >
            {line}
          </p>
        ))
      )}
    </footer>
  );
}
