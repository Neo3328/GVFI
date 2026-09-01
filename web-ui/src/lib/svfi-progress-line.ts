/**
 * GVFI — SVFI/tqdm-style progress line for task logs.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

/** Prefix used by job-store upsert to replace the live progress line. */
export const SVFI_PROGRESS_PREFIX = "Process at ";

const BAR_WIDTH = 12;
const BLOCKS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"] as const;

export function formatProgressBar(pct: number, width = BAR_WIDTH): string {
  const clamped = Math.min(100, Math.max(0, pct));
  const filled = (clamped / 100) * width;
  const full = Math.floor(filled);
  const frac = filled - full;
  const partial = BLOCKS[Math.min(8, Math.round(frac * 8))] ?? "";
  const bar = "█".repeat(full) + partial;
  return bar.padEnd(width, " ");
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "??:??";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseFrameFromMessage(message: string): number | null {
  const patterns = [
    /\b(?:frame|Frame)\s*[:=]?\s*(\d+)/,
    /帧\s*[:=]?\s*(\d+)/,
    /Process at Frame\s+(\d+)/i,
  ];
  for (const re of patterns) {
    const m = message.match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  return null;
}

export interface SvfiProgressLineInput {
  progress: number;
  stage: string;
  message?: string;
  elapsedMs: number;
  /** Percent points per second; null/undefined/<=0 → unknown rate. */
  ratePctPerSec?: number | null;
}

export function formatSvfiProgressLine(input: SvfiProgressLineInput): string {
  const pct = Math.round(Math.min(1, Math.max(0, input.progress)) * 100);
  const cur = pct;
  const total = 100;
  const bar = formatProgressBar(pct);
  const elapsed = formatDuration(input.elapsedMs);

  const rate = input.ratePctPerSec;
  const hasRate = typeof rate === "number" && Number.isFinite(rate) && rate > 0;
  const remainingPct = Math.max(0, 100 - pct);
  const etaMs = hasRate ? (remainingPct / rate) * 1000 : NaN;
  const eta = hasRate ? formatDuration(etaMs) : "??:??";
  const rateLabel = hasRate ? `${rate.toFixed(2)}%/s` : "?/s";

  const frame = input.message ? parseFrameFromMessage(input.message) : null;
  const head =
    frame != null
      ? `${SVFI_PROGRESS_PREFIX}Frame ${frame}`
      : `${SVFI_PROGRESS_PREFIX}stage ${input.stage || "running"}`;

  return `${head}: ${pct}%|${bar}| ${cur}/${total} [${elapsed}<${eta}, ${rateLabel}]`;
}
