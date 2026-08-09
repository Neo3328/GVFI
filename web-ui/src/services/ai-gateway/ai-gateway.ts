/**
 * GVFI — Unified AI Gateway (sole entry for LLM + AI jobs).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * RULE: Feature modules must not call provider APIs or llm-api directly.
 */

import { tr } from "@/lib/i18n/runtime";
import type { LlmJobSettings } from "@/lib/llm-types";
import {
  openAiCompatibleChat,
  openAiCompatibleTest,
} from "@/services/ai-gateway/providers/openai-compatible";
import {
  createLlmJobViaGateway,
  fetchAnalysisMarkdownViaGateway,
  testLlmViaLocalApi,
} from "@/services/ai-gateway/providers/gvfi-job";
import type {
  GatewayChatRequest,
  GatewayChatResult,
  GatewayLlmJobRequest,
  GatewayLlmJobResult,
  GatewayTestResult,
} from "@/services/ai-gateway/types";
import { useAiModelConfigStore } from "@/stores/ai-model-config-store";

class AiGatewayImpl {
  private activeAbort: AbortController | null = null;

  private snapshotConfig() {
    const s = useAiModelConfigStore.getState();
    return {
      provider: s.provider,
      model: s.model,
      apiKey: s.apiKey,
      baseUrl: s.baseUrl,
      url: s.chatCompletionsUrl(),
      temperature: s.temperature,
      topP: s.topP,
      maxTokens: s.maxTokens,
      timeoutMs: s.timeoutMs,
      systemHint: s.getActivePrompt(),
    };
  }

  cancel() {
    this.activeAbort?.abort();
    this.activeAbort = null;
  }

  async chat(request: GatewayChatRequest): Promise<GatewayChatResult> {
    const cfg = this.snapshotConfig();
    this.cancel();
    const controller = new AbortController();
    this.activeAbort = controller;
    if (request.signal) {
      request.signal.addEventListener("abort", () => controller.abort());
    }

    const messages = [...request.messages];
    if (!messages.some((m) => m.role === "system") && cfg.systemHint) {
      // Light system bias for workspace chats (P0); full prompt center is P3.
      messages.unshift({
        role: "system",
        content: tr("ai.systemHint"),
      });
    }

    try {
      return await openAiCompatibleChat(
        {
          provider: cfg.provider,
          model: request.model ?? cfg.model,
          apiKey: cfg.apiKey,
          url: cfg.url,
          temperature: request.temperature ?? cfg.temperature,
          topP: request.topP ?? cfg.topP,
          maxTokens: request.maxTokens ?? cfg.maxTokens,
          timeoutMs: cfg.timeoutMs,
        },
        messages,
        {
          signal: controller.signal,
          onToken: request.onToken,
          retries: 2,
        }
      );
    } finally {
      if (this.activeAbort === controller) this.activeAbort = null;
    }
  }

  async testConnection(): Promise<GatewayTestResult> {
    const cfg = this.snapshotConfig();
    // Prefer direct OpenAI-compatible ping; fall back to local API proxy test.
    const direct = await openAiCompatibleTest({
      provider: cfg.provider,
      model: cfg.model,
      apiKey: cfg.apiKey,
      url: cfg.url,
      temperature: 0,
      topP: 1,
      maxTokens: 32,
      timeoutMs: Math.min(cfg.timeoutMs, 30_000),
    });
    if (direct.ok) return direct;

    try {
      const viaLocal = await testLlmViaLocalApi({
        provider: cfg.provider,
        apiKey: cfg.apiKey,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
      });
      return viaLocal;
    } catch {
      return direct;
    }
  }

  async enqueueLlmJob(
    request: GatewayLlmJobRequest
  ): Promise<GatewayLlmJobResult> {
    const cfg = this.snapshotConfig();
    if (!cfg.apiKey.trim()) {
      throw new Error(tr("err.missingApiKey"));
    }
    const settings: LlmJobSettings = {
      engine: "llm",
      llmProvider: cfg.provider,
      llmModel: cfg.model,
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      prompt: request.prompt ?? useAiModelConfigStore.getState().getActivePrompt(),
      maxFrames:
        request.maxFrames ?? useAiModelConfigStore.getState().maxFrames,
      inputPath: request.inputPath,
    };
    return createLlmJobViaGateway(settings, request);
  }

  async fetchReport(absPath: string): Promise<string> {
    return fetchAnalysisMarkdownViaGateway(absPath);
  }
}

/** Singleton gateway — import this from UI / services only. */
export const aiGateway = new AiGatewayImpl();
