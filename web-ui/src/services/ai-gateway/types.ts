/**
 * GVFI — AI Gateway types.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { LlmProviderId } from "@/lib/llm-types";

export interface GatewayChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GatewayChatRequest {
  messages: GatewayChatMessage[];
  /** Override active model config for this call */
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onToken?: (delta: string) => void;
}

export interface GatewayChatResult {
  content: string;
  model: string;
  provider: LlmProviderId;
}

export interface GatewayTestResult {
  ok: boolean;
  message: string;
}

export interface GatewayLlmJobRequest {
  file?: File | null;
  inputPath?: string;
  prompt?: string;
  maxFrames?: number;
}

export interface GatewayLlmJobResult {
  taskId: string;
}
