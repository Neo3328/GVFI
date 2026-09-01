/**
 * GVFI — Workflow preset selector panel.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { GlassButton } from"@/components/glass/glass-button";
import { SectionCard } from"@/components/section-card";
import {
 GlassSelect,
 GlassSelectContent,
 GlassSelectItem,
 GlassSelectTrigger,
 GlassSelectValue,
} from"@/components/glass/glass-select";
import { useT } from"@/hooks/use-t";
import { builtinPresetLabel } from"@/lib/i18n/catalog-labels";
import type { WorkflowPreset } from"@/lib/gvfi-types";

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
 const t = useT();
 return (
 <SectionCard
 title={t("video.preset.title")}
 description={t("video.preset.desc")}
 >
 <div className="flex flex-col gap-2">
 <label htmlFor="preset-select" className="glass-field-label">
 {t("video.preset.current")}
 </label>
 <GlassSelect
 value={selectedName}
 items={Object.fromEntries(
 presets.map((preset) => [
 preset.name,
 `${builtinPresetLabel(t, preset.name)}${preset.builtin ? t("video.preset.builtin") :""}`,
 ])
 )}
 onValueChange={(value) => {
 if (typeof value ==="string") onSelectedNameChange(value);
 }}
 >
 <GlassSelectTrigger id="preset-select" className="glass-select">
 <GlassSelectValue placeholder={t("video.preset.placeholder")} />
 </GlassSelectTrigger>
 <GlassSelectContent>
 {presets.map((preset) => (
 <GlassSelectItem key={preset.name} value={preset.name}>
 {builtinPresetLabel(t, preset.name)}
 {preset.builtin ? t("video.preset.builtin") :""}
 </GlassSelectItem>
 ))}
 </GlassSelectContent>
 </GlassSelect>
 </div>
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
 <GlassButton type="button" variant="primary" className="w-full" onClick={onApply}>
 {t("video.preset.apply")}
 </GlassButton>
 <GlassButton type="button" variant="glass" className="w-full" onClick={onCreate}>
 {t("video.preset.create")}
 </GlassButton>
 <GlassButton type="button" variant="glass" className="w-full" onClick={onSave}>
 {t("video.preset.save")}
 </GlassButton>
 <GlassButton type="button" variant="ghost" className="w-full" onClick={onDelete}>
 {t("video.preset.delete")}
 </GlassButton>
 </div>
 </SectionCard>
 );
}
