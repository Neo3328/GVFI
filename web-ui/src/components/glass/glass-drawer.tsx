/**
 * GVFI — Glass slide-over drawer for secondary parameters.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

type GlassDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function GlassDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: GlassDrawerProps) {
  const t = useT();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label={t("glass.closeDrawer")}
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col",
          "border-l border-[var(--glass-border)]",
          "bg-[color-mix(in_srgb,var(--bg-1)_72%,transparent)]",
          "shadow-[-24px_0_48px_rgba(0,0,0,0.35)]",
          "backdrop-blur-[var(--glass-blur)]",
          "animate-in slide-in-from-right duration-200",
          className
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--glass-border)] px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-[var(--text-strong)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <GlassButton
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onOpenChange(false)}
            aria-label={t("glass.close")}
          >
            <X className="size-4" aria-hidden />
          </GlassButton>
        </header>
        <div data-slot="drawer-content" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </aside>
    </div>
  );
}
