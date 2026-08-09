"use client";

import type { ComponentProps } from "react";
import { glassSurface4 } from "@/components/glass/glass-styles";
import { cn } from "@/lib/utils";

type GlassLogViewerProps = ComponentProps<"div"> & {
  lines: string[];
  variant?: "task" | "error";
  follow?: boolean;
  maxHeight?: number;
};

export function GlassLogViewer({
  lines,
  variant = "task",
  follow = true,
  maxHeight = 240,
  className,
  ...props
}: GlassLogViewerProps) {
  const text = lines.join("\n");

  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      <div
        className={cn(
          glassSurface4,
          "overflow-auto p-3 font-mono text-[12px] leading-relaxed",
          variant === "error" && "text-destructive"
        )}
        style={{ maxHeight }}
        aria-live={follow ? "polite" : "off"}
      >
        <pre className="whitespace-pre-wrap break-all">{text || "暂无日志"}</pre>
      </div>
    </div>
  );
}
