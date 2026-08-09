/**
 * GVFI — Device status label mapping (stable codes → i18n keys).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * Never persist translated display strings; map at render time only.
 */

import { t } from "@/lib/i18n/t";
import type { Locale, MessageKey } from "@/lib/i18n/types";
import type { GvfiGpu } from "@/lib/gvfi-types";

/** Known API / legacy display names → message keys (normalized lowercase). */
const DEVICE_NAME_KEYS: Record<string, MessageKey> = {
  "本地 vulkan": "device.localVulkan",
  "local vulkan": "device.localVulkan",
  "local-vulkan": "device.localVulkan",
  local_vulkan: "device.localVulkan",
};

function normalizeDeviceName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Resolve a message key for a device name, or null if unknown. */
export function deviceDisplayNameKey(
  rawName: string | undefined | null
): MessageKey | null {
  if (!rawName) return null;
  return DEVICE_NAME_KEYS[normalizeDeviceName(rawName)] ?? null;
}

export type DeviceLabelSource = Pick<GvfiGpu, "index" | "name" | "vram_mb">;

/** Locale-aware device label for cards / selects (not stored in state). */
export function formatDeviceLabel(
  locale: Locale,
  gpu: DeviceLabelSource | null | undefined,
  options?: { withVram?: boolean; missingKey?: MessageKey }
): string {
  if (!gpu) {
    return t(locale, options?.missingKey ?? "dashboard.kpi.gpuMissing");
  }

  const key = deviceDisplayNameKey(gpu.name);
  const base = key
    ? t(locale, key)
    : gpu.name?.trim() ||
      t(locale, "process.gpu.indexed", { index: gpu.index });

  if (options?.withVram && gpu.vram_mb > 0) {
    return `${base} (${gpu.vram_mb} MB)`;
  }
  return base;
}
