/**
 * GVFI — Locale-aware number / date formatting helpers.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { Locale } from "@/lib/i18n/types";

function toBcp47(locale: Locale): string {
  return locale === "en" ? "en" : "zh-CN";
}

export function formatDateTime(locale: Locale, date: Date | number): string {
  return new Intl.DateTimeFormat(toBcp47(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(toBcp47(locale), options).format(value);
}

/**
 * Format a ratio as a percentage.
 * @param value Fraction in the range 0–1 (e.g. `0.42` → `"42%"`). Pass `value / 100` if you have 0–100.
 */
export function formatPercent(locale: Locale, value: number): string {
  return new Intl.NumberFormat(toBcp47(locale), {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}
