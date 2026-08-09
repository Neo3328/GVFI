"use client";

import { GlassButton } from "@/components/glass/glass-button";
import { GlassPanel } from "@/components/glass/glass-card";
import { GlassProgress, GlassProgressLabel } from "@/components/glass/glass-progress";

interface ActionPanelProps {
  progress: number;
  isRendering: boolean;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function ActionPanel({
  progress,
  isRendering,
  canStart,
  onStart,
  onStop,
}: ActionPanelProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <GlassPanel title="渲染控制">
      <div className="flex flex-col gap-3">
        <GlassProgressLabel>
          <span className="text-[13px] text-[var(--text-muted)]">进度</span>
          <span className="text-[13px] tabular-nums" aria-live="polite">
            {clamped}%
          </span>
        </GlassProgressLabel>
        <GlassProgress value={clamped} ai={isRendering} aria-label="渲染进度" />
        <div className="flex flex-wrap gap-2">
          <GlassButton
            type="button"
            variant="primary"
            disabled={!canStart || isRendering}
            onClick={onStart}
          >
            ▶ 开始渲染
          </GlassButton>
          <GlassButton
            type="button"
            variant="ghost"
            disabled={!isRendering}
            onClick={onStop}
          >
            ■ 停止
          </GlassButton>
        </div>
      </div>
    </GlassPanel>
  );
}
