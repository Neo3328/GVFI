/**
 * GVFI — LLM API client (compat shim → AI Gateway).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * Do not add new direct provider calls here. Use `@/services/ai-gateway`.
 */

import { aiGateway } from "@/services/ai-gateway";
import type { CreateJobResponse } from "@/lib/gvfi-types";
import type { LlmJobSettings, LlmTestResponse } from "@/lib/llm-types";
import { useAiModelConfigStore } from "@/stores/ai-model-config-store";

export async function fetchAnalysisMarkdown(absPath: string): Promise<string> {
  return aiGateway.fetchReport(absPath);
}

export async function testLlmConnection(options: {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}): Promise<LlmTestResponse> {
  const store = useAiModelConfigStore.getState();
  const prev = {
    provider: store.provider,
    apiKey: store.apiKey,
    baseUrl: store.baseUrl,
    model: store.model,
  };
  // Temporarily apply options for gateway test without persisting permanently
  store.setApiKey(options.apiKey);
  if (options.baseUrl !== undefined) store.setBaseUrl(options.baseUrl);
  if (options.model) store.setModel(options.model);
  try {
    return await aiGateway.testConnection();
  } finally {
    store.setApiKey(prev.apiKey);
    store.setBaseUrl(prev.baseUrl);
    store.setModel(prev.model);
  }
}

export async function createLlmJob(options: {
  settings: LlmJobSettings;
  file?: File | null;
}): Promise<CreateJobResponse> {
  const store = useAiModelConfigStore.getState();
  store.setApiKey(options.settings.apiKey);
  if (options.settings.baseUrl) store.setBaseUrl(options.settings.baseUrl);
  store.setModel(options.settings.llmModel);
  if (options.settings.prompt) store.setCustomPrompt(options.settings.prompt);
  if (options.settings.maxFrames) store.setMaxFrames(options.settings.maxFrames);

  const result = await aiGateway.enqueueLlmJob({
    file: options.file,
    inputPath: options.settings.inputPath,
    prompt: options.settings.prompt,
    maxFrames: options.settings.maxFrames,
  });
  return {
    task: {
      id: result.taskId,
      status: "pending",
      progress: 0,
      stage: "queued",
      message: "",
      error: "",
      input_path: options.settings.inputPath ?? "",
      output_path: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}
