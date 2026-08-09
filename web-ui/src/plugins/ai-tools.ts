/**
 * GVFI — AI tool plugin interface (P0 stub; expand in P2).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { aiGateway } from "@/services/ai-gateway";

export interface AiToolContext {
  prompt?: string;
  file?: File | null;
  inputPath?: string;
  maxFrames?: number;
}

export interface AiToolPlugin {
  id: string;
  label: string;
  description?: string;
  execute: (ctx: AiToolContext) => Promise<{ taskId?: string; message?: string }>;
}

export const videoLlmAnalyzeTool: AiToolPlugin = {
  id: "video-llm-analyze",
  label: "视频视觉分析",
  description: "经 AI Gateway 提交本地 gvfi_api LLM 作业",
  async execute(ctx) {
    const result = await aiGateway.enqueueLlmJob({
      file: ctx.file,
      inputPath: ctx.inputPath,
      prompt: ctx.prompt,
      maxFrames: ctx.maxFrames,
    });
    return { taskId: result.taskId, message: "已提交" };
  },
};

const registry = new Map<string, AiToolPlugin>([
  [videoLlmAnalyzeTool.id, videoLlmAnalyzeTool],
]);

export function registerAiTool(tool: AiToolPlugin) {
  registry.set(tool.id, tool);
}

export function getAiTool(id: string): AiToolPlugin | undefined {
  return registry.get(id);
}

export function listAiTools(): AiToolPlugin[] {
  return [...registry.values()];
}
