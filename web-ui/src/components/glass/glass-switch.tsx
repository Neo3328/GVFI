"use client";

/**
 * GVFI — Glass switch control.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { ComponentProps } from "react";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";
import { cn } from "@/lib/utils";

type GlassSwitchProps = Omit<ComponentProps<"button">, "onChange"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function GlassSwitch({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: GlassSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-slot="glass-switch"
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150",
        glassFocusRing,
        glassMotion,
        "backdrop-blur-[var(--glass-blur)]",
        "shadow-[inset_1px_1px_0_rgba(255,255,255,0.28),0_1px_6px_rgba(0,0,0,0.2)]",
        checked
          ? "border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[linear-gradient(135deg,var(--accent),var(--accent-cyan))]"
          : "border-white/16 bg-[color-mix(in_srgb,#3a4158_72%,rgba(255,255,255)_10%)]",
        disabled && "opacity-40 saturate-50",
        className
      )}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-150",
          "ring-1 ring-white/50",
          checked ? "translate-x-[1.35rem]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
