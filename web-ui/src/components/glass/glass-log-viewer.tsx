/**
 * GVFI — Scrollable mono log viewer (preserves raw formatting).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { glassSurface4 } from "@/components/glass/glass-styles";
import { useT } from "@/hooks/use-t";
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
  const t = useT();
  const scrollerRef = useRef<HTMLDivElement>(null);
  /* Preserve newlines — join with \n only, never rewrite encoding */
  const text = lines.join("\n");

  useEffect(() => {
    if (!follow || !scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [text, follow]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)} {...props}>
      <div
        ref={scrollerRef}
        className={cn(
          glassSurface4,
          "overflow-x-auto overflow-y-auto p-3",
          "font-mono text-[12px] leading-[1.55] tracking-[0.01em]",
          "text-[var(--text-normal)]",
          "[tab-size:4]",
          variant === "error" && "text-[var(--danger)]"
        )}
        style={{ maxHeight }}
        aria-live={follow ? "polite" : "off"}
        role="log"
      >
        <pre
          className="m-0 whitespace-pre-wrap break-words font-mono leading-[1.55]"
          style={{
            fontFamily:
              'ui-monospace, "SF Mono", "Cascadia Mono", Consolas, var(--app-font-family), monospace',
            fontSize: "calc(var(--app-font-size, 14px) * 0.86)",
          }}
        >
          {text || t("glass.logs.empty")}
        </pre>
      </div>
    </div>
  );
}
