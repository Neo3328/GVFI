/**
 * GVFI — Normalize Base UI slider onValueChange payloads.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export function readSliderValue(
  value: number | readonly number[] | null | undefined,
  fallback: number
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value) && typeof value[0] === "number" && Number.isFinite(value[0])) {
    return value[0];
  }
  return fallback;
}
