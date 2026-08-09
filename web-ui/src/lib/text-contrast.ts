/**
 * GVFI — Panel-level wallpaper luminance → text contrast (with hysteresis).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export type ContrastTone = "light" | "dark";

/** Relative luminance of sRGB color (0–1). */
export function relativeLuminance(r: number, g: number, b: number): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

export function contrastRatio(l1: number, l2: number): number {
  const a = Math.max(l1, l2);
  const b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}

const WHITE_L = relativeLuminance(255, 255, 255);
const DARK_L = relativeLuminance(29, 29, 31);

/**
 * Sample average luminance from a wallpaper / background element.
 * Falls back to dark (prefer white text) on failure.
 */
export async function sampleBackgroundLuminance(
  element: HTMLElement | null
): Promise<number | null> {
  if (!element || typeof document === "undefined") return null;

  try {
    const style = getComputedStyle(element);
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== "none") {
      const match = /url\((['"]?)(.*?)\1\)/.exec(bgImage);
      if (match?.[2]) {
        const url = match[2].replace(/^["']|["']$/g, "");
        const lum = await sampleImageLuminance(url);
        if (lum != null) return lum;
      }
    }

    const bg = style.backgroundColor;
    const rgb = parseCssRgb(bg);
    if (rgb) return relativeLuminance(rgb.r, rgb.g, rgb.b);
  } catch {
    /* ignore */
  }
  return null;
}

function parseCssRgb(
  value: string
): { r: number; g: number; b: number } | null {
  const m = /rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(value);
  if (!m) return null;
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
  };
}

function sampleImageLuminance(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const done = (value: number | null) => resolve(value);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          done(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 16) {
          sum += relativeLuminance(data[i]!, data[i + 1]!, data[i + 2]!);
          count += 1;
        }
        done(count ? sum / count : null);
      } catch {
        done(null);
      }
    };
    img.onerror = () => done(null);
    img.src = url;
  });
}

export interface ContrastDecision {
  tone: ContrastTone;
  textColor: string;
  scrim: number;
  ratioAgainstWhite: number;
  ratioAgainstDark: number;
  lowContrastWarning: boolean;
}

/**
 * Decide text tone from background luminance with hysteresis to avoid flicker.
 * Thresholds: switch to dark text when bg is bright; keep previous near band.
 */
export function decideContrast(
  bgLuminance: number | null,
  previous: ContrastTone | null,
  options?: { manualColor?: string | null; forceTone?: ContrastTone | null }
): ContrastDecision {
  const fallback: ContrastDecision = {
    tone: "light",
    textColor: "#ffffff",
    scrim: 0.28,
    ratioAgainstWhite: 21,
    ratioAgainstDark: 1.2,
    lowContrastWarning: false,
  };

  if (options?.manualColor) {
    const parsed = parseHex(options.manualColor);
    const textL = parsed
      ? relativeLuminance(parsed.r, parsed.g, parsed.b)
      : WHITE_L;
    const bgL = bgLuminance ?? 0.12;
    const ratio = contrastRatio(textL, bgL);
    return {
      tone: textL > 0.5 ? "light" : "dark",
      textColor: options.manualColor,
      scrim: ratio < 4.5 ? 0.32 : 0.08,
      ratioAgainstWhite: contrastRatio(WHITE_L, bgL),
      ratioAgainstDark: contrastRatio(DARK_L, bgL),
      lowContrastWarning: ratio < 4.5,
    };
  }

  if (bgLuminance == null) {
    return fallback;
  }

  const ratioW = contrastRatio(WHITE_L, bgLuminance);
  const ratioD = contrastRatio(DARK_L, bgLuminance);

  /* Hysteresis band around mid luminance */
  const highCut = 0.52;
  const lowCut = 0.38;
  let tone: ContrastTone;
  if (options?.forceTone) {
    tone = options.forceTone;
  } else if (previous === "dark") {
    tone = bgLuminance < lowCut ? "light" : "dark";
  } else if (previous === "light") {
    tone = bgLuminance > highCut ? "dark" : "light";
  } else {
    tone = bgLuminance > 0.45 ? "dark" : "light";
  }

  const textColor = tone === "light" ? "#ffffff" : "#1d1d1f";
  const ratio = tone === "light" ? ratioW : ratioD;
  const scrim =
    ratio < 3
      ? 0.42
      : ratio < 4.5
        ? 0.28
        : bgLuminance > 0.55
          ? 0.12
          : 0.06;

  return {
    tone,
    textColor,
    scrim,
    ratioAgainstWhite: ratioW,
    ratioAgainstDark: ratioD,
    lowContrastWarning: ratio < 4.5,
  };
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
