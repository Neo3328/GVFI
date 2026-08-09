/**
 * GVFI — Adaptive motion quality for desktop hardware tiers.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export type MotionQuality = "low" | "medium" | "high";

/** Detect a sensible default from device signals (client only). */
export function detectMotionQuality(): MotionQuality {
  if (typeof window === "undefined") return "medium";

  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return "low";
    }

    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };

    if (nav.connection?.saveData) return "low";
    if (
      nav.connection?.effectiveType === "2g" ||
      nav.connection?.effectiveType === "slow-2g"
    ) {
      return "low";
    }

    const cores = navigator.hardwareConcurrency || 4;
    const memory = nav.deviceMemory ?? 4;
    const dpr = window.devicePixelRatio || 1;

    // High DPI + weak CPU → prefer medium to avoid compositor jank
    if (cores <= 4 || memory <= 4) {
      return dpr >= 2 ? "low" : "medium";
    }
    if (cores >= 8 && memory >= 8) return "high";
    return "medium";
  } catch {
    return "medium";
  }
}

export function applyMotionQuality(quality: MotionQuality) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.motionQuality = quality;
}
