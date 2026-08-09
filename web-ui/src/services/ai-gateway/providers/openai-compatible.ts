/**
 * GVFI — OpenAI-compatible chat provider (only allowed upstream HTTP for LLM).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { tr } from "@/lib/i18n/runtime";
import type { LlmProviderId } from "@/lib/llm-types";
import type { GatewayChatMessage, GatewayChatResult } from "@/services/ai-gateway/types";

export interface OpenAiCompatibleConfig {
  provider: LlmProviderId;
  model: string;
  apiKey: string;
  url: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  timeoutMs: number;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function openAiCompatibleChat(
  config: OpenAiCompatibleConfig,
  messages: GatewayChatMessage[],
  options: {
    signal?: AbortSignal;
    onToken?: (delta: string) => void;
    retries?: number;
  } = {}
): Promise<GatewayChatResult> {
  if (!config.apiKey.trim()) {
    throw new Error(tr("err.missingApiKey"));
  }
  if (!config.url.trim()) {
    throw new Error(tr("err.missingBaseUrl"));
  }

  const retries = options.retries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await chatOnce(config, messages, options);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (options.signal?.aborted) throw lastError;
      if (attempt < retries) await sleep(400 * (attempt + 1));
    }
  }
  throw lastError ?? new Error(tr("err.chatFailed"));
}

async function chatOnce(
  config: OpenAiCompatibleConfig,
  messages: GatewayChatMessage[],
  options: {
    signal?: AbortSignal;
    onToken?: (delta: string) => void;
  }
): Promise<GatewayChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort);

  try {
    const stream = Boolean(options.onToken);
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        top_p: config.topP,
        max_tokens: config.maxTokens,
        stream,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const safe = text
        .replace(/Bearer\s+[A-Za-z0-9._\-+/=]+/gi, "Bearer ***")
        .replace(
          /("?(?:api[_-]?key|apiKey|token|authorization)"?\s*[:=]\s*)(["']?)[^"'\s,}\\]]+/gi,
          "$1$2***"
        )
        .slice(0, 400);
      throw new Error(
        safe || tr("err.upstreamHttp", { status: response.status })
      );
    }

    if (stream && response.body) {
      const content = await readSseStream(response.body, options.onToken!);
      return {
        content,
        model: config.model,
        provider: config.provider,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    if (options.onToken && content) options.onToken(content);
    return {
      content,
      model: config.model,
      provider: config.provider,
    };
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onToken: (delta: string) => void
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = json.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        /* ignore partial */
      }
    }
  }
  return full;
}

export async function openAiCompatibleTest(
  config: OpenAiCompatibleConfig
): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await openAiCompatibleChat(
      { ...config, maxTokens: Math.min(64, config.maxTokens) },
      [{ role: "user", content: "ping" }],
      { retries: 0 }
    );
    return {
      ok: Boolean(result.content),
      message: result.content
        ? tr("err.connectOk", { model: config.model })
        : tr("err.connectEmpty"),
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
