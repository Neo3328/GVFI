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
import { LLM_PROVIDER_PRESETS, LLM_TASK_PRESETS } from "@/lib/llm-types";
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

  const preset = LLM_PROVIDER_PRESETS.find((p) => p.id === provider);
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      {!hasApiKey() ? (
        <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            请先在{" "}
            <Link href="/app/settings" className="underline hover:text-amber-100">
              参数设置
            </Link>{" "}
            中配置大模型 API Key。
          </span>
        </div>
      ) : null}

      <GlassPanel
        title="AI 大模型视频处理"
        description="抽取关键帧并调用视觉大模型，生成场景分析、摘要或增强建议报告。"
        headerAction={
          <span className="text-[11px] text-[var(--text-muted)]">
            {preset?.label} · {model}
          </span>
        }
      >
        <div className="grid gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              分析类型
            </span>
            <GlassSelect
              value={taskPreset}
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
                    {item.label}
                  </GlassSelectItem>
                ))}
              </GlassSelectContent>
            </GlassSelect>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              自定义提示词（可选，留空则使用预设）
            </span>
            <GlassTextarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={LLM_TASK_PRESETS.find((p) => p.id === taskPreset)?.prompt}
              rows={4}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              抽帧数量（1–24）
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

      <GlassPanel title="运行控制">
        <div className="flex flex-col gap-3">
          <GlassProgressLabel>
            <span className="text-[13px] text-[var(--text-muted)]">分析进度</span>
            <span className="text-[13px] tabular-nums">{clamped}%</span>
          </GlassProgressLabel>
          <GlassProgress value={clamped} ai={isRunning} aria-label="LLM 分析进度" />

          <div className="flex flex-wrap gap-2">
            <GlassButton
              type="button"
              variant="ai"
              disabled={!canStart || isRunning || !hasApiKey()}
              onClick={onStart}
            >
              <Sparkles className="size-4" aria-hidden />
              开始 AI 分析
            </GlassButton>
            <GlassButton
              type="button"
              variant="ghost"
              disabled={!isRunning}
              onClick={onStop}
            >
              停止
            </GlassButton>
          </div>

          {lastReportPath ? (
            <p className="text-[12px] text-[var(--text-muted)]">
              报告已生成，见下方可视化栏目
            </p>
          ) : null}
        </div>
      </GlassPanel>
    </div>
  );
}
