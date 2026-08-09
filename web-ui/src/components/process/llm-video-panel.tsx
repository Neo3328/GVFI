/**
 * GVFI — LLM video analysis panel.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassInput } from "@/components/glass/glass-input";
import { GlassPanel } from "@/components/glass/glass-card";
import { GlassProgress, GlassProgressLabel } from "@/components/glass/glass-progress";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/glass/glass-select";
import { GlassTextarea } from "@/components/glass/glass-input";
import { useT } from "@/hooks/use-t";
import {
  llmProviderLabel,
  llmTaskLabel,
  llmTaskPrompt,
} from "@/lib/i18n/catalog-labels";
import { LLM_TASK_PRESETS } from "@/lib/llm-types";
import { useLlmConfigStore } from "@/stores/llm-config-store";

interface LlmVideoPanelProps {
  progress: number;
  isRunning: boolean;
  canStart: boolean;
  lastReportPath: string;
  onStart: () => void;
  onStop: () => void;
}

export function LlmVideoPanel({
  progress,
  isRunning,
  canStart,
  lastReportPath,
  onStart,
  onStop,
}: LlmVideoPanelProps) {
  const t = useT();
  const {
    provider,
    model,
    maxFrames,
    taskPreset,
    customPrompt,
    setMaxFrames,
    setTaskPreset,
    setCustomPrompt,
    hasApiKey,
  } = useLlmConfigStore();

  const providerLabel = llmProviderLabel(t, provider, provider);
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      {!hasApiKey() ? (
        <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {t("llm.panel.needKeyBefore")}{" "}
            <Link href="/app/settings" className="underline hover:text-amber-100">
              {t("llm.panel.settingsLink")}
            </Link>{" "}
            {t("llm.panel.needKeyAfter")}
          </span>
        </div>
      ) : null}

      <GlassPanel
        title={t("llm.panel.title")}
        description={t("llm.panel.desc")}
        headerAction={
          <span className="text-[11px] text-[var(--text-muted)]">
            {providerLabel} · {model}
          </span>
        }
      >
        <div className="grid gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              {t("llm.panel.taskType")}
            </span>
            <GlassSelect
              value={taskPreset}
              items={Object.fromEntries(
                LLM_TASK_PRESETS.map((item) => [item.id, llmTaskLabel(t, item.id)])
              )}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setTaskPreset(value as typeof taskPreset);
                }
              }}
            >
              <GlassSelectTrigger className="glass-select">
                <GlassSelectValue />
              </GlassSelectTrigger>
              <GlassSelectContent>
                {LLM_TASK_PRESETS.map((item) => (
                  <GlassSelectItem key={item.id} value={item.id}>
                    {llmTaskLabel(t, item.id)}
                  </GlassSelectItem>
                ))}
              </GlassSelectContent>
            </GlassSelect>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              {t("llm.panel.customPrompt")}
            </span>
            <GlassTextarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={llmTaskPrompt(t, taskPreset)}
              rows={4}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              {t("llm.panel.maxFrames")}
            </span>
            <GlassInput
              type="number"
              min={1}
              max={24}
              value={maxFrames}
              onChange={(e) =>
                setMaxFrames(Math.min(24, Math.max(1, Number(e.target.value) || 8)))
              }
            />
          </label>
        </div>
      </GlassPanel>

      <GlassPanel title={t("llm.panel.runTitle")}>
        <div className="flex flex-col gap-3">
          <GlassProgressLabel>
            <span className="text-[13px] text-[var(--text-muted)]">{t("llm.panel.progress")}</span>
            <span className="text-[13px] tabular-nums">{clamped}%</span>
          </GlassProgressLabel>
          <GlassProgress
            value={clamped}
            ai={isRunning}
            aria-label={t("llm.panel.progressAria")}
          />

          <div className="flex flex-wrap gap-2">
            <GlassButton
              type="button"
              variant="ai"
              disabled={!canStart || isRunning || !hasApiKey()}
              onClick={onStart}
            >
              <Sparkles className="size-4" aria-hidden />
              {t("llm.panel.start")}
            </GlassButton>
            <GlassButton
              type="button"
              variant="ghost"
              disabled={!isRunning}
              onClick={onStop}
            >
              {t("llm.panel.stop")}
            </GlassButton>
          </div>

          {lastReportPath ? (
            <p className="text-[12px] text-[var(--text-muted)]">
              {t("llm.panel.reportReady")}
            </p>
          ) : null}
        </div>
      </GlassPanel>
    </div>
  );
}
