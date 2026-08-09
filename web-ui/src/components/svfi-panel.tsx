"use client";

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
  const percent = Math.round(quality * 100);

  return (
    <SectionCard title="超分与画质">
      <label className="flex items-center justify-between gap-3 text-sm text-[var(--text-normal)]">
        <span>启用超分</span>
        <GlassSwitch
          checked={superResolution}
          onCheckedChange={(checked) => onSuperResolutionChange(checked === true)}
          aria-label="启用超分"
        />
      </label>

      <div className="flex flex-col gap-2">
        <label htmlFor="sr-model" className="glass-field-label">
          超分模型
        </label>
        <GlassSelect
          value={srModel}
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
            画质等级
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
          aria-label="画质等级"
        />
      </div>
    </SectionCard>
  );
}
