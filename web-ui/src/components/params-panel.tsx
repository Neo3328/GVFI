"use client";

import { SectionCard } from "@/components/section-card";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/glass/glass-select";
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
  const modelItems =
    models.length > 0
      ? models
      : [{ id: model || "rife-ncnn:rife-anime", name: model || "rife-anime", path: "" }];
  const gpuItems =
    gpus.length > 0
      ? gpus
      : [{ index: 0, name: "默认 GPU", vram_mb: 0 }];

  return (
    <SectionCard title="处理参数">
      <Field id="model" label="插帧模型">
        <GlassSelect value={model} onValueChange={(v) => { if (typeof v === "string") onModelChange(v); }}>
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

      <Field id="fps" label="目标帧率">
        <GlassSelect value={fps} onValueChange={(v) => { if (typeof v === "string") onFpsChange(v as FpsOption); }}>
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

      <Field id="resolution" label="输出分辨率">
        <GlassSelect
          value={resolution}
          onValueChange={(v) => { if (typeof v === "string") onResolutionChange(v as ResolutionOption); }}
        >
          <GlassSelectTrigger id="resolution" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {RESOLUTION_OPTIONS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {item.label}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </Field>

      <Field id="gpu" label="加速设备">
        <GlassSelect
          value={String(gpu)}
          onValueChange={(v) => { if (typeof v === "string") onGpuChange(Number(v)); }}
        >
          <GlassSelectTrigger id="gpu" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {gpuItems.map((item) => (
              <GlassSelectItem key={item.index} value={String(item.index)}>
                {item.name}
                {item.vram_mb > 0 ? ` (${item.vram_mb} MB)` : ""}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </Field>

      <Field id="precision" label="计算精度">
        <GlassSelect
          value={precision}
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
