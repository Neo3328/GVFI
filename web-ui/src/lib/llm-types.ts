/**
 * GVFI — LLM video processing types.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { MessageKey } from "@/lib/i18n/types";

export type LlmProviderId = "openai" | "deepseek" | "moonshot" | "custom";

export interface LlmProviderPreset {
  id: LlmProviderId;
  labelKey: MessageKey;
  baseUrl: string;
  defaultModel: string;
  hintKey?: MessageKey;
}

export const LLM_PROVIDER_PRESETS: LlmProviderPreset[] = [
  {
    id: "openai",
    labelKey: "llm.provider.openai",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    hintKey: "llm.provider.openai.hint",
  },
  {
    id: "deepseek",
    labelKey: "llm.provider.deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
  {
    id: "moonshot",
    labelKey: "llm.provider.moonshot",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k-vision-preview",
  },
  {
    id: "custom",
    labelKey: "llm.provider.custom",
    baseUrl: "",
    defaultModel: "gpt-4o",
    hintKey: "llm.provider.custom.hint",
  },
];

export type LlmTaskPresetId = "analyze" | "summary" | "enhance";

export const LLM_TASK_PRESETS: {
  id: LlmTaskPresetId;
  labelKey: MessageKey;
  promptKey: MessageKey;
}[] = [
  {
    id: "analyze",
    labelKey: "llm.task.analyze",
    promptKey: "llm.task.analyze.prompt",
  },
  {
    id: "summary",
    labelKey: "llm.task.summary",
    promptKey: "llm.task.summary.prompt",
  },
  {
    id: "enhance",
    labelKey: "llm.task.enhance",
    promptKey: "llm.task.enhance.prompt",
  },
];

export interface LlmJobSettings {
  engine: "llm";
  llmProvider: LlmProviderId;
  llmModel: string;
  apiKey: string;
  baseUrl?: string;
  prompt: string;
  maxFrames: number;
  inputPath?: string;
}

export interface LlmTestResponse {
  ok: boolean;
  message: string;
}

export interface LlmConfigState {
  provider: LlmProviderId;
  model: string;
  apiKey: string;
  baseUrl: string;
  taskPreset: LlmTaskPresetId;
  customPrompt: string;
  maxFrames: number;
}
