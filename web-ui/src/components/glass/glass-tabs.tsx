"use client";

/**
 * GVFI — Glass segmented tabs / option track.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { ComponentProps, ReactNode } from "react";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";
import { cn } from "@/lib/utils";

type GlassTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: string; icon?: React.ReactNode }[];
  className?: string;
  variant?: "underline" | "pill";
};

export function GlassTabs({
  value,
  onValueChange,
  items,
  className,
  variant = "pill",
}: GlassTabsProps) {
  return (
    <div
      data-slot="glass-tabs"
      role="tablist"
      className={cn(
        "flex gap-1",
        variant === "pill" && "glass-option-track w-full max-w-md",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active ? "true" : "false"}
            className={cn(
              "glass-option-chip flex-1",
              glassFocusRing,
              glassMotion
            )}
            onClick={() => onValueChange(item.value)}
          >
            {item.icon}
            <span className="relative z-[1]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function GlassTabPanel({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      role="tabpanel"
      className={cn(
        "mt-3 animate-in fade-in duration-200 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}
