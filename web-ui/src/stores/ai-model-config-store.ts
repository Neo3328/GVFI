/**
 * GVFI — AI model / provider config (Workspace + Gateway).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  LLM_PROVIDER_PRESETS,
  LLM_TASK_PRESETS,
  type LlmProviderId,
  type LlmTaskPresetId,
} from "@/lib/llm-types";

export interface AiModelConfigState {
  provider: LlmProviderId;
  model: string;
  apiKey: string;
  baseUrl: string;
  endpoint: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  timeoutMs: number;
  proxy: string;
  maxFrames: number;
  taskPreset: LlmTaskPresetId;
  customPrompt: string;
}

interface AiModelConfigStore extends AiModelConfigState {
  setProvider: (provider: LlmProviderId) => void;
  setModel: (model: string) => void;
  setApiKey: (apiKey: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setEndpoint: (endpoint: string) => void;
  setTemperature: (temperature: number) => void;
  setTopP: (topP: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setTimeoutMs: (timeoutMs: number) => void;
  setProxy: (proxy: string) => void;
  setMaxFrames: (maxFrames: number) => void;
  setTaskPreset: (taskPreset: LlmTaskPresetId) => void;
  setCustomPrompt: (customPrompt: string) => void;
  getActivePrompt: () => string;
  hasApiKey: () => boolean;
  chatCompletionsUrl: () => string;
}

const defaultProvider = LLM_PROVIDER_PRESETS[0];

export const useAiModelConfigStore = create<AiModelConfigStore>()(
  persist(
    (set, get) => ({
      provider: defaultProvider.id,
      model: defaultProvider.defaultModel,
      apiKey: "",
      baseUrl: defaultProvider.baseUrl,
      endpoint: "/chat/completions",
      temperature: 0.7,
      topP: 1,
      maxTokens: 4096,
      timeoutMs: 120_000,
      proxy: "",
      maxFrames: 8,
      taskPreset: "analyze",
      customPrompt: "",

      setProvider: (provider) => {
        const preset = LLM_PROVIDER_PRESETS.find((p) => p.id === provider);
        set({
          provider,
          model: preset?.defaultModel ?? get().model,
          baseUrl: preset?.baseUrl ?? get().baseUrl,
        });
      },
      setModel: (model) => set({ model }),
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setEndpoint: (endpoint) => set({ endpoint }),
      setTemperature: (temperature) => set({ temperature }),
      setTopP: (topP) => set({ topP }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setTimeoutMs: (timeoutMs) => set({ timeoutMs }),
      setProxy: (proxy) => set({ proxy }),
      setMaxFrames: (maxFrames) => set({ maxFrames }),
      setTaskPreset: (taskPreset) => set({ taskPreset }),
      setCustomPrompt: (customPrompt) => set({ customPrompt }),

      getActivePrompt: () => {
        const state = get();
        if (state.customPrompt.trim()) return state.customPrompt.trim();
        return (
          LLM_TASK_PRESETS.find((p) => p.id === state.taskPreset)?.prompt ??
          LLM_TASK_PRESETS[0].prompt
        );
      },

      hasApiKey: () => Boolean(get().apiKey.trim()),

      chatCompletionsUrl: () => {
        const { baseUrl, endpoint } = get();
        const base = baseUrl.replace(/\/+$/, "");
        const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        return `${base}${path}`;
      },
    }),
    {
      name: "gvfi-ai-model-config-v1",
      partialize: (state) => ({
        provider: state.provider,
        model: state.model,
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        endpoint: state.endpoint,
        temperature: state.temperature,
        topP: state.topP,
        maxTokens: state.maxTokens,
        timeoutMs: state.timeoutMs,
        proxy: state.proxy,
        maxFrames: state.maxFrames,
        taskPreset: state.taskPreset,
        customPrompt: state.customPrompt,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AiModelConfigState>;
        // Migrate legacy llm-config-v1 if new store empty
        let legacy: Partial<AiModelConfigState> = {};
        if (typeof window !== "undefined" && !p.apiKey && !p.baseUrl) {
          try {
            const raw = localStorage.getItem("gvfi-llm-config-v1");
            if (raw) {
              const parsed = JSON.parse(raw) as { state?: Partial<AiModelConfigState> };
              legacy = parsed.state ?? {};
            }
          } catch {
            /* ignore */
          }
        }
        return {
          ...current,
          ...legacy,
          ...p,
        };
      },
    }
  )
);
