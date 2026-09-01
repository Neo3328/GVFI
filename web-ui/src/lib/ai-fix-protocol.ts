/**
 * GVFI — Structured AI fix payload (gvfi-fix fenced block).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export interface GvfiFileEdit {
  path: string;
  content: string;
  /** Optional display name when path is unknown */
  name?: string;
}

export interface GvfiSettingsPatch {
  model?: string;
  fps?: number;
  superResolution?: boolean;
  srModel?: string;
  resolution?: string;
  gpu?: number;
  precision?: string;
  quality?: number;
  inputPath?: string;
  [key: string]: unknown;
}

export interface GvfiFixPayload {
  diagnosis?: string;
  settings_patch?: GvfiSettingsPatch | null;
  file_edits?: GvfiFileEdit[] | null;
}

export interface ParsedGvfiFix {
  prose: string;
  fix: GvfiFixPayload | null;
  rawBlock: string | null;
}

const FENCE_RE =
  /```\s*gvfi-fix\s*\r?\n([\s\S]*?)\r?\n```/i;

export function parseGvfiFixPayload(markdown: string): ParsedGvfiFix {
  const text = String(markdown ?? "");
  const match = text.match(FENCE_RE);
  if (!match) {
    return { prose: text, fix: null, rawBlock: null };
  }
  const rawBlock = match[1]?.trim() ?? "";
  const prose = (text.slice(0, match.index) + text.slice(match.index! + match[0].length))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  try {
    const parsed = JSON.parse(rawBlock) as GvfiFixPayload;
    if (!parsed || typeof parsed !== "object") {
      return { prose: text, fix: null, rawBlock };
    }
    const fileEdits = Array.isArray(parsed.file_edits)
      ? parsed.file_edits
          .filter(
            (e): e is GvfiFileEdit =>
              Boolean(e) &&
              typeof e === "object" &&
              typeof (e as GvfiFileEdit).content === "string"
          )
          .map((e) => ({
            path: String(e.path ?? ""),
            content: e.content,
            name: e.name ? String(e.name) : undefined,
          }))
      : null;
    const patch =
      parsed.settings_patch && typeof parsed.settings_patch === "object"
        ? parsed.settings_patch
        : null;
    return {
      prose,
      fix: {
        diagnosis:
          typeof parsed.diagnosis === "string" ? parsed.diagnosis : undefined,
        settings_patch: patch,
        file_edits: fileEdits && fileEdits.length ? fileEdits : null,
      },
      rawBlock,
    };
  } catch {
    return { prose: text, fix: null, rawBlock };
  }
}

export function hasActionableFix(fix: GvfiFixPayload | null | undefined): boolean {
  if (!fix) return false;
  const hasPatch =
    Boolean(fix.settings_patch) &&
    Object.keys(fix.settings_patch ?? {}).length > 0;
  const hasEdits = Boolean(fix.file_edits?.length);
  return hasPatch || hasEdits || Boolean(fix.diagnosis?.trim());
}
