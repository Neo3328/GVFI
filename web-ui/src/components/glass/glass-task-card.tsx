"use client";

import type { JobStatus } from "@/lib/gvfi-types";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/glass/glass-card";
import { GlassProgress } from "@/components/glass/glass-progress";
import { GlassStatusIndicator } from "@/components/glass/glass-status-indicator";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  queued: "排队",
  extract: "抽帧",
  rife: "插帧",
  upsample: "超分",
  encode: "合成",
  done: "完成",
};

export type GlassTaskCardProps = {
  title: string;
  status: JobStatus | "idle";
  stage?: string;
  progress?: number;
  message?: string;
  variant?: "compact" | "expanded";
  ai?: boolean;
  onCancel?: () => void;
  onOpen?: () => void;
  className?: string;
};

export function GlassTaskCard({
  title,
  status,
  stage,
  progress = 0,
  message,
  variant = "compact",
  ai,
  onCancel,
  onOpen,
  className,
}: GlassTaskCardProps) {
  const running = status === "running" || status === "pending";
  const stageLabel = stage ? (STAGE_LABELS[stage] ?? stage) : undefined;

  return (
    <GlassCard
      interactive={Boolean(onOpen)}
      aiActive={ai && running}
      className={cn("p-3", className)}
      onClick={onOpen}
    >
      <GlassCardHeader className="mb-2 flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex min-w-0 items-center gap-2">
          <GlassStatusIndicator status={status} pulse={running} ai={ai && running} />
          <GlassCardTitle className="truncate text-[13px] font-medium">
            {title}
          </GlassCardTitle>
        </div>
        {stageLabel ? (
          <span className="shrink-0 text-[11px] text-muted-foreground">{stageLabel}</span>
        ) : null}
      </GlassCardHeader>

      {variant === "expanded" || running ? (
        <GlassCardContent className="space-y-2">
          <GlassProgress value={progress} ai={ai} />
          {message ? (
            <p className="truncate text-[11px] text-muted-foreground">{message}</p>
          ) : null}
          {running && onCancel ? (
            <div className="flex justify-end pt-1">
              <GlassButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
                取消
              </GlassButton>
            </div>
          ) : null}
        </GlassCardContent>
      ) : null}
    </GlassCard>
  );
}
