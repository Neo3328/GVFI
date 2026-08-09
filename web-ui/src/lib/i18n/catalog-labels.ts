/**
 * GVFI — Display-label helpers for catalog/data IDs.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { TranslateFn } from "@/lib/i18n/t";
import type { MessageKey } from "@/lib/i18n/types";
import type { LlmProviderId, LlmTaskPresetId } from "@/lib/llm-types";
import { LLM_PROVIDER_PRESETS, LLM_TASK_PRESETS } from "@/lib/llm-types";

const BUILTIN_PRESET_LABELS: Record<string, MessageKey> = {
  "anime-interp": "video.preset.name.anime",
  "cinema-hd": "video.preset.name.cinema",
  "svfi-style": "video.preset.name.svfi",
  /* Legacy Chinese IDs (persisted user presets / older installs) */
  动漫补帧: "video.preset.name.anime",
  电影高清: "video.preset.name.cinema",
  SVFI风格: "video.preset.name.svfi",
};

const LLM_TASK_LABELS: Record<LlmTaskPresetId, MessageKey> = {
  analyze: "llm.task.analyze",
  summary: "llm.task.summary",
  enhance: "llm.task.enhance",
};

const LLM_PROVIDER_LABELS: Record<LlmProviderId, MessageKey> = {
  openai: "llm.provider.openai",
  deepseek: "llm.provider.deepseek",
  moonshot: "llm.provider.moonshot",
  custom: "llm.provider.custom",
};

export function builtinPresetLabel(t: TranslateFn, name: string): string {
  const key = BUILTIN_PRESET_LABELS[name];
  return key ? t(key) : name;
}

export function llmTaskLabel(t: TranslateFn, id: LlmTaskPresetId): string {
  return t(LLM_TASK_LABELS[id]);
}

export function llmTaskPrompt(t: TranslateFn, id: LlmTaskPresetId): string {
  const preset = LLM_TASK_PRESETS.find((p) => p.id === id);
  return preset ? t(preset.promptKey) : "";
}

export function llmProviderLabel(
  t: TranslateFn,
  id: LlmProviderId,
  fallback?: string
): string {
  const key = LLM_PROVIDER_LABELS[id];
  if (key) return t(key);
  const preset = LLM_PROVIDER_PRESETS.find((p) => p.id === id);
  return preset ? t(preset.labelKey) : (fallback ?? id);
}

export function llmProviderHint(
  t: TranslateFn,
  id: LlmProviderId
): string | undefined {
  const preset = LLM_PROVIDER_PRESETS.find((p) => p.id === id);
  return preset?.hintKey ? t(preset.hintKey) : undefined;
}

/** Builtin API profile display names (ids stay stable; persisted names may be stale). */
export function apiProfileDisplayName(
  t: TranslateFn,
  id: string,
  fallbackName: string
): string {
  if (id === "local-default") return t("api.profile.localProxy");
  if (id === "local-direct") return t("api.profile.localDirect");
  return fallbackName;
}
