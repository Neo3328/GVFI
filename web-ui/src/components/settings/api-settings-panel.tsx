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
import { useT } from "@/hooks/use-t";
import { llmProviderLabel } from "@/lib/i18n/catalog-labels";
import { useAiModelConfigStore } from "@/stores/ai-model-config-store";
import { cn } from "@/lib/utils";

export function ApiSettingsPanel() {
  const t = useT();
  const provider = useAiModelConfigStore((s) => s.provider);
  const model = useAiModelConfigStore((s) => s.model);
  const baseUrl = useAiModelConfigStore((s) => s.baseUrl);
  const hasKey = useAiModelConfigStore((s) => s.hasApiKey());
  const label = llmProviderLabel(t, provider, provider);

  return (
    <GlassPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={cn(glassTextTitle, "flex items-center gap-2")}>
            <Sparkles className="size-4 text-[var(--accent-cyan)]" />
            {t("settings.llm.title")}
          </h2>
          <p className={cn(glassTextCaption, "mt-1")}>
            {t("settings.llm.desc")}
          </p>
        </div>
        <Link
          href="/app/ai"
          className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--accent-cyan)_20%,transparent)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-cyan)]"
        >
          {t("settings.llm.editInAi")}
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
      <dl className="mt-4 grid gap-2 text-[12px] sm:grid-cols-2">
        <div>
          <dt className="text-[var(--text-muted)]">{t("settings.llm.provider")}</dt>
          <dd className="text-[var(--text-strong)]">{label}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">{t("settings.llm.model")}</dt>
          <dd className="text-[var(--text-strong)]">{model}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--text-muted)]">{t("settings.llm.baseUrl")}</dt>
          <dd className="truncate text-[var(--text-strong)]">
            {baseUrl || t("common.emDash")}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">{t("settings.llm.apiKey")}</dt>
          <dd className="text-[var(--text-strong)]">
            {hasKey ? t("settings.llm.configured") : t("settings.llm.notConfigured")}
          </dd>
        </div>
      </dl>
    </GlassPanel>
  );
}
