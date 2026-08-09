/**
 * GVFI — Bridge error logs → AI chat draft (preserve raw text).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { tr } from "@/lib/i18n/runtime";

const STORAGE_KEY = "gvfi-ai-error-log-draft-v1";

/** Wrap raw logs so the model gets explicit analysis instructions + original text. */
export function formatErrorLogForAi(rawLog: string): string {
  const body = rawLog.replace(/\r\n/g, "\n").trimEnd();
  return [
    tr("ai.errorLog.intro"),
    tr("ai.errorLog.keepRaw"),
    "",
    tr("ai.errorLog.begin"),
    body,
    tr("ai.errorLog.end"),
  ].join("\n");
}

export function stashErrorLogForAi(rawLog: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, formatErrorLogForAi(rawLog));
  } catch {
    /* quota / private mode */
  }
}

export function consumeErrorLogForAi(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value) sessionStorage.removeItem(STORAGE_KEY);
    return value;
  } catch {
    return null;
  }
}

export function joinLogLines(lines: string[]): string {
  return lines.join("\n");
}
