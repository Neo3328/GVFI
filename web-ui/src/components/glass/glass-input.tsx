"use client";

/**
 * GVFI — Glass input fields.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { Input as InputPrimitive } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";
import { cn } from "@/lib/utils";

export function GlassInput({
  className,
  ...props
}: ComponentProps<"input">) {
  return (
    <InputPrimitive
      data-slot="glass-input"
      className={cn(
        "glass-input h-9 w-full min-w-0 px-3 text-[13px] font-medium text-[var(--text-strong)] placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-50",
        glassFocusRing,
        glassMotion,
        className
      )}
      {...props}
    />
  );
}

export function GlassTextarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="glass-textarea"
      className={cn(
        "glass-textarea min-h-24 w-full resize-y px-3 py-2 text-[13px] font-medium text-[var(--text-strong)] placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-50",
        glassFocusRing,
        glassMotion,
        className
      )}
      {...props}
    />
  );
}
