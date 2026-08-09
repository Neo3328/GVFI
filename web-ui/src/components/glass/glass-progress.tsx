"use client";

import type { ComponentProps } from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motionProgress } from "@/components/workspace/motion";

export const glassProgressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--bg-2)_calc(var(--glass-opacity)*80%),transparent)]",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export type GlassProgressProps = ProgressPrimitive.Root.Props &
  VariantProps<typeof glassProgressVariants> & {
    ai?: boolean;
    /** 仅用于小型 inline 指示，非主进度条 */
    indeterminate?: boolean;
  };

export function GlassProgress({
  className,
  value,
  size = "md",
  ai,
  indeterminate,
  ...props
}: GlassProgressProps) {
  return (
    <ProgressPrimitive.Root
      value={indeterminate ? null : value}
      data-slot="glass-progress"
      className={cn("w-full", className)}
      {...props}
    >
      <ProgressPrimitive.Track className={cn(glassProgressVariants({ size }))}>
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full rounded-full",
            motionProgress,
            ai
              ? "bg-[linear-gradient(90deg,var(--accent-cyan),var(--accent))]"
              : "bg-[var(--accent)]",
            indeterminate &&
              "w-1/3 motion-safe:animate-[glass-shimmer_1.5s_ease-in-out_infinite] motion-reduce:animate-none"
          )}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export function GlassProgressLabel({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("mb-1 flex items-center justify-between gap-2", className)}
      {...props}
    />
  );
}
