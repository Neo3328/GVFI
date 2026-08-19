/**
 * GVFI — Save AI-edited text as a sidecar copy (desktop IPC or browser download).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { getDesktopBridge } from "@/lib/desktop";

export interface SaveTextCopyInput {
  sourcePath?: string;
  suggestedName: string;
  content: string;
}

export interface SaveTextCopyResult {
  ok: boolean;
  path?: string;
  mode: "desktop" | "download";
  error?: string;
}

function toFixedFileName(name: string): string {
  const base = name.trim() || "untitled.txt";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return `${base}.gvfi-fixed.txt`;
  return `${base.slice(0, dot)}.gvfi-fixed${base.slice(dot)}`;
}

function downloadTextCopy(suggestedName: string, content: string): string {
  const fileName = toFixedFileName(suggestedName);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return fileName;
}

export async function saveTextCopy(
  input: SaveTextCopyInput
): Promise<SaveTextCopyResult> {
  const bridge = getDesktopBridge();
  if (bridge?.writeTextCopy) {
    try {
      const result = await bridge.writeTextCopy({
        sourcePath: input.sourcePath,
        suggestedName: input.suggestedName,
        content: input.content,
      });
      if (!result?.ok) {
        return {
          ok: false,
          mode: "desktop",
          error: result?.error || "WRITE_FAILED",
        };
      }
      return { ok: true, mode: "desktop", path: result.path };
    } catch (error) {
      return {
        ok: false,
        mode: "desktop",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  try {
    const name = downloadTextCopy(input.suggestedName, input.content);
    return { ok: true, mode: "download", path: name };
  } catch (error) {
    return {
      ok: false,
      mode: "download",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function revealInFolder(targetPath: string): Promise<boolean> {
  const bridge = getDesktopBridge();
  if (!bridge?.revealInFolder) return false;
  try {
    return Boolean(await bridge.revealInFolder(targetPath));
  } catch {
    return false;
  }
}
