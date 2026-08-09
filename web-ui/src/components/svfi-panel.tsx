"use client";

/**
 * GVFI — Super-resolution / quality panel.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { SectionCard } from "@/components/section-card";
import { GlassSlider } from "@/components/glass/glass-slider";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/glass/glass-select";
import { GlassSwitch } from "@/components/glass/glass-switch";
import { useT } from "@/hooks/use-t";
import { SR_MODEL_OPTIONS } from "@/lib/presets";
import type { SrModelOption } from "@/lib/gvfi-types";
import { readSliderValue } from "@/lib/slider-value";

interface SvfiPanelProps {
  superResolution: boolean;
  srModel: SrModelOption;
  quality: number;
  onSuperResolutionChange: (value: boolean) => void;
  onSrModelChange: (value: SrModelOption) => void;
  onQualityChange: (value: number) => void;
}

export function SvfiPanel({
  superResolution,
  srModel,
  quality,
  onSuperResolutionChange,
  onSrModelChange,
  onQualityChange,
}: SvfiPanelProps) {
  const t = useT();
  const percent = Math.round(quality * 100);

  return (
    <SectionCard title={t("svfi.title")}>
      <label className="flex items-center justify-between gap-3 text-sm text-[var(--text-normal)]">
        <span>{t("svfi.enable")}</span>
        <GlassSwitch
          checked={superResolution}
          onCheckedChange={(checked) => onSuperResolutionChange(checked === true)}
          aria-label={t("svfi.enable")}
        />
      </label>

      <div className="flex flex-col gap-2">
        <label htmlFor="sr-model" className="glass-field-label">
          {t("svfi.model")}
        </label>
        <GlassSelect
          value={srModel}
          items={Object.fromEntries(
            SR_MODEL_OPTIONS.map((item) => [item.value, item.label])
          )}
          onValueChange={(value) => {
            if (typeof value === "string") onSrModelChange(value as SrModelOption);
          }}
          disabled={!superResolution}
        >
          <GlassSelectTrigger id="sr-model" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {SR_MODEL_OPTIONS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {item.label}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="quality" className="glass-field-label">
            {t("svfi.quality")}
          </label>
          <span className="text-sm text-[var(--text-muted)]" aria-live="polite">
            {percent}%
          </span>
        </div>
        <GlassSlider
          id="quality"
          min={0}
          max={100}
          step={5}
          value={percent}
          onValueChange={(value) => {
            onQualityChange(readSliderValue(value, percent) / 100);
          }}
          aria-label={t("svfi.quality")}
        />
      </div>
    </SectionCard>
  );
}
