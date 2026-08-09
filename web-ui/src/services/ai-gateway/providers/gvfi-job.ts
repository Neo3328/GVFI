/**
 * GVFI — Local gvfi_api LLM job adapter (video analysis).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * Business modules must not call llm-api directly — use AiGateway.enqueueLlmJob.
 */

import {
  apiErrorMessage,
  apiFetch,
  apiUrl,
  readJson,
} from "@/lib/api-client";
import type { CreateJobResponse } from "@/lib/gvfi-types";
import type { LlmJobSettings, LlmTestResponse } from "@/lib/llm-types";
import type { GatewayLlmJobRequest, GatewayLlmJobResult } from "@/services/ai-gateway/types";

export async function fetchAnalysisMarkdownViaGateway(
  absPath: string
): Promise<string> {
  const clean = absPath.trim();
  if (!clean) throw new Error("报告路径为空");
  const query = `path=${encodeURIComponent(clean)}`;
  let response: Response;
  try {
    response = await fetch(`${apiUrl("/media", true)}?${query}`, {
      cache: "no-store",
    });
  } catch {
    response = await fetch(`/api/media?${query}`, { cache: "no-store" });
  }
  if (!response.ok) {
    const payload = await readJson<{ error?: string }>(response);
    throw new Error(apiErrorMessage(payload, `读取报告失败 (${response.status})`));
  }
  return response.text();
}

/** Backend proxy test (uses local API /llm/test). Prefer for keys that backend validates. */
export async function testLlmViaLocalApi(options: {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}): Promise<LlmTestResponse> {
  const response = await apiFetch("/llm/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: options.provider,
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      model: options.model,
    }),
  });
  const payload = await readJson<LlmTestResponse & { error?: string }>(response);
  if (payload.message || typeof payload.ok === "boolean") {
    return {
      ok: Boolean(payload.ok),
      message:
        payload.message ||
        apiErrorMessage(payload, `连接测试失败 (${response.status})`),
    };
  }
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, `连接测试失败 (${response.status})`));
  }
  return payload;
}

export async function createLlmJobViaGateway(
  settings: LlmJobSettings,
  request: GatewayLlmJobRequest
): Promise<GatewayLlmJobResult> {
  const payload = {
    engine: "llm" as const,
    llmProvider: settings.llmProvider,
    llmModel: settings.llmModel,
    apiKey: settings.apiKey,
    baseUrl: settings.baseUrl,
    prompt: request.prompt ?? settings.prompt,
    maxFrames: request.maxFrames ?? settings.maxFrames,
    inputPath: request.inputPath ?? settings.inputPath,
  };

  let response: Response;
  if (request.file) {
    const form = new FormData();
    form.append("file", request.file);
    form.append("settings", JSON.stringify(payload));
    response = await apiFetch("/jobs", { method: "POST", body: form });
  } else {
    response = await apiFetch("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  const result = await readJson<CreateJobResponse>(response);
  if (!response.ok || !result.task?.id) {
    throw new Error(
      apiErrorMessage(result, `LLM 任务启动失败 (${response.status})`)
    );
  }
  return { taskId: result.task.id };
}
