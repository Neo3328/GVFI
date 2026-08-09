"use client";

import { GlassButton } from "@/components/glass/glass-button";
import { SectionCard } from "@/components/section-card";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/glass/glass-select";
import type { WorkflowPreset } from "@/lib/gvfi-types";

interface PresetPanelProps {
  presets: WorkflowPreset[];
  selectedName: string;
  onSelectedNameChange: (name: string) => void;
  onApply: () => void;
  onCreate: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function PresetPanel({
  presets,
  selectedName,
  onSelectedNameChange,
  onApply,
  onCreate,
  onSave,
  onDelete,
}: PresetPanelProps) {
  return (
    <SectionCard
      title="工作流预设"
      description="内置预设可另存为新名称；自定义预设可覆盖保存或删除。"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="preset-select" className="glass-field-label">
          当前预设
        </label>
        <GlassSelect
          value={selectedName}
          onValueChange={(value) => {
            if (typeof value === "string") onSelectedNameChange(value);
          }}
        >
          <GlassSelectTrigger id="preset-select" className="glass-select">
            <GlassSelectValue placeholder="选择预设" />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {presets.map((preset) => (
              <GlassSelectItem key={preset.name} value={preset.name}>
                {preset.name}
                {preset.builtin ? "（内置）" : ""}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <GlassButton type="button" variant="primary" className="w-full" onClick={onApply}>
          应用
        </GlassButton>
        <GlassButton type="button" variant="glass" className="w-full" onClick={onCreate}>
          新建
        </GlassButton>
        <GlassButton type="button" variant="glass" className="w-full" onClick={onSave}>
          保存
        </GlassButton>
        <GlassButton type="button" variant="ghost" className="w-full" onClick={onDelete}>
          删除
        </GlassButton>
      </div>
    </SectionCard>
  );
}
