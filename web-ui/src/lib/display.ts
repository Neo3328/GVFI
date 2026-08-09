/**
 * GVFI — Global display / typography tokens and document application.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export type FontFamilyPreset =
  | "youyuan"
  | "yahei"
  | "system"
  | "other"
  | "custom";

export type FontColorMode = "auto" | "white" | "dark" | "custom";

export type FontWeightOption = 400 | 500 | 600;

export const FONT_STACKS: Record<Exclude<FontFamilyPreset, "custom">, string> =
  {
    youyuan:
      '"YouYuan", "幼圆", "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif',
    yahei:
      '"Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif',
    system:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei UI", sans-serif',
    other:
      '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei UI", sans-serif',
  };

export const DEFAULT_DISPLAY = {
  fontFamily: "youyuan" as FontFamilyPreset,
  customFontName: "",
  fontSizePx: 13,
  fontColorMode: "auto" as FontColorMode,
  customFontColor: "#ffffff",
  fontWeight: 400 as FontWeightOption,
  autoContrast: true,
  textShadowStrength: 18,
  uiScale: 100,
  reduceMotion: false,
};

export const FONT_SIZE_MIN = 11;
export const FONT_SIZE_MAX = 20;
export const UI_SCALE_MIN = 85;
export const UI_SCALE_MAX = 125;
export const TEXT_SHADOW_MIN = 0;
export const TEXT_SHADOW_MAX = 60;

export function resolveFontStack(
  preset: FontFamilyPreset,
  customFontName: string
): string {
  if (preset === "custom") {
    const name = customFontName.trim();
    if (name) {
      return `"${name.replace(/"/g, "")}", ${FONT_STACKS.youyuan}`;
    }
    return FONT_STACKS.youyuan;
  }
  return FONT_STACKS[preset];
}

export function clampFontSize(value: number): number {
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(value)));
}

export function clampUiScale(value: number): number {
  return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, Math.round(value)));
}

export function clampTextShadow(value: number): number {
  return Math.min(
    TEXT_SHADOW_MAX,
    Math.max(TEXT_SHADOW_MIN, Math.round(value))
  );
}

export function normalizeFontWeight(value: unknown): FontWeightOption {
  if (value === 500 || value === 600) return value;
  return 400;
}

export function applyDisplayToDocument(config: {
  fontFamily: FontFamilyPreset;
  customFontName: string;
  fontSizePx: number;
  fontColorMode: FontColorMode;
  customFontColor: string;
  fontWeight: FontWeightOption;
  autoContrast: boolean;
  textShadowStrength: number;
  uiScale: number;
  reduceMotion: boolean;
  /** Resolved text color after auto-contrast / manual override */
  resolvedTextColor?: string | null;
  /** Panel scrim strength 0–1 when auto contrast darkens glass */
  contrastScrim?: number;
}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const stack = resolveFontStack(config.fontFamily, config.customFontName);
  const size = clampFontSize(config.fontSizePx);
  const scale = clampUiScale(config.uiScale) / 100;
  const shadow = clampTextShadow(config.textShadowStrength);

  root.style.setProperty("--app-font-family", stack);
  root.style.setProperty("--app-font-size", `${size}px`);
  root.style.setProperty("--app-font-weight", String(config.fontWeight));
  root.style.setProperty("--app-ui-scale", String(scale));
  root.style.setProperty(
    "--app-text-shadow",
    shadow <= 0
      ? "none"
      : `0 1px ${Math.max(1, Math.round(shadow / 12))}px rgba(0,0,0,${(
          shadow / 100
        ).toFixed(2)})`
  );

  let color = config.resolvedTextColor ?? null;
  if (!color) {
    switch (config.fontColorMode) {
      case "white":
        color = "#ffffff";
        break;
      case "dark":
        color = "#1d1d1f";
        break;
      case "custom":
        color = config.customFontColor || "#ffffff";
        break;
      default:
        color = "#ffffff";
    }
  }

  root.style.setProperty("--app-text-color", color);
  root.style.setProperty("--text-strong", color);
  root.style.setProperty(
    "--text-normal",
    `color-mix(in srgb, ${color} 88%, transparent)`
  );
  root.style.setProperty(
    "--text-muted",
    `color-mix(in srgb, ${color} 62%, transparent)`
  );
  root.style.setProperty("--glass-label", color);
  root.style.setProperty(
    "--glass-label-secondary",
    `color-mix(in srgb, ${color} 86%, transparent)`
  );

  const scrim = Math.min(0.55, Math.max(0, config.contrastScrim ?? 0));
  root.style.setProperty("--app-contrast-scrim", String(scrim));
  root.dataset.fontColorMode = config.fontColorMode;
  root.dataset.autoContrast = config.autoContrast ? "true" : "false";
  root.dataset.reduceMotion = config.reduceMotion ? "true" : "false";

  if (config.reduceMotion) {
    root.dataset.motionQuality = "low";
  }
}
