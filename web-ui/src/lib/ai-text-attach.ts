/**
 * GVFI — Text file attachment helpers for AI chat.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export const AI_TEXT_ATTACH_MAX_BYTES = 256 * 1024;

export const AI_TEXT_ATTACH_EXTENSIONS = new Set([
  ".json",
  ".txt",
  ".md",
  ".py",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".cmd",
  ".bat",
  ".yml",
  ".yaml",
  ".toml",
  ".ini",
  ".log",
  ".css",
  ".html",
  ".xml",
  ".env",
  ".example",
]);

export interface AiTextAttachment {
  name: string;
  /** Absolute path when available (Electron file.path). */
  path?: string;
  text: string;
  size: number;
}

export function isAllowedTextAttachName(name: string): boolean {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return false;
  return AI_TEXT_ATTACH_EXTENSIONS.has(lower.slice(dot));
}

export async function readTextAttachment(file: File): Promise<AiTextAttachment> {
  if (!isAllowedTextAttachName(file.name)) {
    throw new Error("UNSUPPORTED_TYPE");
  }
  if (file.size > AI_TEXT_ATTACH_MAX_BYTES) {
    throw new Error("TOO_LARGE");
  }
  const text = await file.text();
  const path =
    typeof (file as File & { path?: string }).path === "string"
      ? (file as File & { path?: string }).path
      : undefined;
  return {
    name: file.name,
    path: path || undefined,
    text,
    size: file.size,
  };
}

/** Format attachments into the user message body sent to the model. */
export function formatAttachmentsForPrompt(
  attachments: AiTextAttachment[]
): string {
  if (!attachments.length) return "";
  return attachments
    .map((a) => {
      const header = a.path
        ? `----- FILE: ${a.name} (path: ${a.path}) -----`
        : `----- FILE: ${a.name} -----`;
      return `${header}\n${a.text}\n----- END FILE -----`;
    })
    .join("\n\n");
}
