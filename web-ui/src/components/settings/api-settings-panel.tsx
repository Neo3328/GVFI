/**
 * GVFI — LLM settings summary (config lives in AI Workspace).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/glass/glass-card";
import { glassTextCaption, glassTextTitle } from "@/components/glass/glass-styles";
import { LLM_PROVIDER_PRESETS } from "@/lib/llm-types";
import { useAiModelConfigStore } from "@/stores/ai-model-config-store";
import { cn } from "@/lib/utils";

export function ApiSettingsPanel() {
  const provider = useAiModelConfigStore((s) => s.provider);
  const model = useAiModelConfigStore((s) => s.model);
  const baseUrl = useAiModelConfigStore((s) => s.baseUrl);
  const hasKey = useAiModelConfigStore((s) => s.hasApiKey());
  const label =
    LLM_PROVIDER_PRESETS.find((p) => p.id === provider)?.label ?? provider;

  return (
    <GlassPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={cn(glassTextTitle, "flex items-center gap-2")}>
            <Sparkles className="size-4 text-[var(--accent-cyan)]" />
            大模型配置
          </h2>
          <p className={cn(glassTextCaption, "mt-1")}>
            API Key / Base URL / Temperature 等已迁移至 AI 工作台统一管理
          </p>
        </div>
        <Link
          href="/app/ai"
          className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--accent-cyan)_20%,transparent)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-cyan)]"
        >
          在 AI 工作台编辑
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
      <dl className="mt-4 grid gap-2 text-[12px] sm:grid-cols-2">
        <div>
          <dt className="text-[var(--text-muted)]">提供商</dt>
          <dd className="text-[var(--text-strong)]">{label}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">模型</dt>
          <dd className="text-[var(--text-strong)]">{model}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--text-muted)]">Base URL</dt>
          <dd className="truncate text-[var(--text-strong)]">{baseUrl || "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">API Key</dt>
          <dd className="text-[var(--text-strong)]">
            {hasKey ? "已配置" : "未配置"}
          </dd>
        </div>
      </dl>
    </GlassPanel>
  );
}
