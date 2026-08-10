/**
 * GVFI — Video processing parameters panel.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { SectionCard } from "@/components/section-card";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/glass/glass-select";
import { useLocale, useT } from "@/hooks/use-t";
import { formatDeviceLabel } from "@/lib/i18n/device-label";
import {
  FPS_OPTIONS,
  PRECISION_OPTIONS,
  RESOLUTION_OPTIONS,
} from "@/lib/presets";
import type {
  FpsOption,
  GvfiGpu,
  GvfiModel,
  PrecisionOption,
  ResolutionOption,
} from "@/lib/gvfi-types";

interface ParamsPanelProps {
  model: string;
  fps: FpsOption;
  resolution: ResolutionOption;
  gpu: number;
  precision: PrecisionOption;
  models: GvfiModel[];
  gpus: GvfiGpu[];
  onModelChange: (value: string) => void;
  onFpsChange: (value: FpsOption) => void;
  onResolutionChange: (value: ResolutionOption) => void;
  onGpuChange: (value: number) => void;
  onPrecisionChange: (value: PrecisionOption) => void;
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor={id} className="glass-field-label min-w-20 sm:shrink-0">
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ParamsPanel({
  model,
  fps,
  resolution,
  gpu,
  precision,
  models,
  gpus,
  onModelChange,
  onFpsChange,
  onResolutionChange,
  onGpuChange,
  onPrecisionChange,
}: ParamsPanelProps) {
  const t = useT();
  const locale = useLocale();
  const modelItems =
    models.length > 0
      ? models
      : [{ id: model || "gvfi:rife-v4.6", name: model || "rife-v4.6", path: "" }];
  /* Stable code only — display strings come from formatDeviceLabel at render */
  const gpuItems: GvfiGpu[] =
    gpus.length > 0
      ? gpus
      : [{ index: 0, name: "local-vulkan", vram_mb: 0 }];

  return (
    <SectionCard title={t("video.params.title")}>
      <Field id="model" label={t("video.params.model")}>
        <GlassSelect
          value={model}
          items={Object.fromEntries(modelItems.map((item) => [item.id, item.name]))}
          onValueChange={(v) => { if (typeof v === "string") onModelChange(v); }}
        >
          <GlassSelectTrigger id="model" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {modelItems.map((item) => (
              <GlassSelectItem key={item.id} value={item.id}>
                {item.name}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </Field>

      <Field id="fps" label={t("video.params.fps")}>
        <GlassSelect
          value={fps}
          items={Object.fromEntries(FPS_OPTIONS.map((item) => [item.value, item.label]))}
          onValueChange={(v) => { if (typeof v === "string") onFpsChange(v as FpsOption); }}
        >
          <GlassSelectTrigger id="fps" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {FPS_OPTIONS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {item.label}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </Field>

      <Field id="resolution" label={t("video.params.resolution")}>
        <GlassSelect
          value={resolution}
          items={Object.fromEntries(
            RESOLUTION_OPTIONS.map((item) => [
              item.value,
              item.value === "source"
                ? t("video.params.resolutionSource")
                : item.label,
            ])
          )}
          onValueChange={(v) => { if (typeof v === "string") onResolutionChange(v as ResolutionOption); }}
        >
          <GlassSelectTrigger id="resolution" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {RESOLUTION_OPTIONS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {item.value === "source"
                  ? t("video.params.resolutionSource")
                  : item.label}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </Field>

      <Field id="gpu" label={t("video.params.gpu")}>
        <GlassSelect
          value={String(gpu)}
          items={Object.fromEntries(
            gpuItems.map((item) => [
              String(item.index),
              formatDeviceLabel(locale, item, { withVram: true }),
            ])
          )}
          onValueChange={(v) => { if (typeof v === "string") onGpuChange(Number(v)); }}
        >
          <GlassSelectTrigger id="gpu" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {gpuItems.map((item) => (
              <GlassSelectItem key={item.index} value={String(item.index)}>
                {formatDeviceLabel(locale, item, { withVram: true })}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </Field>

      <Field id="precision" label={t("video.params.precision")}>
        <GlassSelect
          value={precision}
          items={Object.fromEntries(
            PRECISION_OPTIONS.map((item) => [item.value, item.label])
          )}
          onValueChange={(v) => { if (typeof v === "string") onPrecisionChange(v as PrecisionOption); }}
        >
          <GlassSelectTrigger id="precision" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {PRECISION_OPTIONS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {item.label}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </Field>
    </SectionCard>
  );
}
