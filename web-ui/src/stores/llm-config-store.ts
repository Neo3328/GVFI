/**
 * GVFI — LLM config store (compat shim → ai-model-config-store).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * Prefer useAiModelConfigStore / aiGateway for new code.
 */

"use client";

export {
  useAiModelConfigStore as useLlmConfigStore,
  type AiModelConfigState,
} from "@/stores/ai-model-config-store";
