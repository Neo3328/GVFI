/**
 * GVFI — LLM video processing types.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export type LlmProviderId = "openai" | "deepseek" | "moonshot" | "custom";

export interface LlmProviderPreset {
  id: LlmProviderId;
  label: string;
  baseUrl: string;
  defaultModel: string;
  hint?: string;
}

export const LLM_PROVIDER_PRESETS: LlmProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    hint: "支持 GPT-4o 视觉分析",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
  {
    id: "moonshot",
    label: "Moonshot (Kimi)",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k-vision-preview",
  },
  {
    id: "custom",
    label: "自定义 (OpenAI 兼容)",
    baseUrl: "",
    defaultModel: "gpt-4o",
    hint: "填写兼容 OpenAI Chat Completions 的 Base URL",
  },
];

export type LlmTaskPresetId = "analyze" | "summary" | "enhance";

export const LLM_TASK_PRESETS: {
  id: LlmTaskPresetId;
  label: string;
  prompt: string;
}[] = [
  {
    id: "analyze",
    label: "场景分析",
    prompt:
      "请分析视频各帧的画面内容、镜头运动、主体对象与场景变化，并给出后期处理建议（补帧/超分/调色）。",
  },
  {
    id: "summary",
    label: "内容摘要",
    prompt: "请用中文概括视频的主要内容、关键事件与时间线，适合作为视频简介。",
  },
  {
    id: "enhance",
    label: "智能增强建议",
    prompt:
      "基于画面质量评估噪点、模糊、曝光问题，给出具体的 AI 增强参数建议（目标帧率、是否超分、推荐模型类型）。",
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
  maxFrames: number;
  taskPreset: LlmTaskPresetId;
  customPrompt: string;
}
