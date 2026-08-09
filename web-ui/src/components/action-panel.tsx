"use client";

import { GlassButton } from "@/components/glass/glass-button";
import { GlassPanel } from "@/components/glass/glass-card";
import { GlassProgress, GlassProgressLabel } from "@/components/glass/glass-progress";
import { useT } from "@/hooks/use-t";

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
  const t = useT();
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <GlassPanel title={t("video.action.title")}>
      <div className="flex flex-col gap-3">
        <GlassProgressLabel>
          <span className="text-[13px] text-[var(--text-muted)]">{t("video.progress")}</span>
          <span className="text-[13px] tabular-nums" aria-live="polite">
            {clamped}%
          </span>
        </GlassProgressLabel>
        <GlassProgress value={clamped} ai={isRendering} aria-label={t("video.progressAria")} />
        <div className="flex flex-wrap gap-2">
          <GlassButton
            type="button"
            variant="primary"
            disabled={!canStart || isRendering}
            onClick={onStart}
          >
            {t("video.action.start")}
          </GlassButton>
          <GlassButton
            type="button"
            variant="ghost"
            disabled={!isRendering}
            onClick={onStop}
          >
            {t("video.action.stop")}
          </GlassButton>
        </div>
      </div>
    </GlassPanel>
  );
}
