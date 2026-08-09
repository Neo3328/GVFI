/**
 * GVFI — AI tool plugin interface (P0 stub; expand in P2).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { tr } from "@/lib/i18n/runtime";
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
  get label() {
    return tr("ai.tool.videoAnalyze.label");
  },
  get description() {
    return tr("ai.tool.videoAnalyze.desc");
  },
  async execute(ctx) {
    const result = await aiGateway.enqueueLlmJob({
      file: ctx.file,
      inputPath: ctx.inputPath,
      prompt: ctx.prompt,
      maxFrames: ctx.maxFrames,
    });
    return { taskId: result.taskId, message: tr("ai.tool.submitted") };
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
