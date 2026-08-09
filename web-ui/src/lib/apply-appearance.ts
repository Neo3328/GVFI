/**
 * GVFI — Appearance apply helpers (theme / custom background).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { AppearanceTheme, PyQtAppearanceHints } from "@/lib/gvfi-types";

export type BackgroundImageMeta = {
  fileName: string | null;
  width: number | null;
  height: number | null;
};

export const DEFAULT_APPEARANCE = {
  theme: "dark" as AppearanceTheme,
  glass: {
    opacity: 52,
    blur: 24,
    borderBrightness: 16,
    shadowStrength: 36,
    glowStrength: 12,
  },
  background: {
    type: "none" as "none" | "image",
    customUrl: null as string | null,
    fileName: null as string | null,
    width: null as number | null,
    height: null as number | null,
    opacity: 100,
    blur: 0,
  },
};

/** Map legacy persisted / PyQt theme ids → light | dark | image */
export function normalizeAppearanceTheme(value: unknown): AppearanceTheme {
  if (value === "light" || value === "dark" || value === "image") return value;
  if (value === "studio") return "light";
  if (value === "ai" || value === "blush" || value === "kawaii" || value === "cream") {
    return "dark";
  }
  return "dark";
}

export function mapPyQtThemeToWeb(pyqtTheme: string): AppearanceTheme {
  switch (pyqtTheme) {
    case "liquid":
    case "aurora":
    case "midnight":
    case "graphite":
      return "dark";
    case "kawaii":
    case "blush":
    case "cream":
      return "light";
    default:
      return "dark";
  }
}

export function mergePyQtAppearanceHints(
  hints: PyQtAppearanceHints
): Partial<typeof DEFAULT_APPEARANCE> {
  const merged: Partial<typeof DEFAULT_APPEARANCE> = {};
  if (hints.web_theme) {
    merged.theme = normalizeAppearanceTheme(hints.web_theme);
  } else if (hints.theme) {
    merged.theme = mapPyQtThemeToWeb(hints.theme);
  }
  if (typeof hints.glass_opacity === "number") {
    merged.glass = {
      ...DEFAULT_APPEARANCE.glass,
      opacity: Math.min(90, Math.max(10, hints.glass_opacity)),
    };
  }
  /* Ignore server wallpaper paths — UI only uses user-uploaded custom images */
  return merged;
}

/** Theme default atmosphere (no bundled preset wallpapers). */
export function themeDefaultBackgroundStyle(theme: AppearanceTheme): string {
  if (theme === "light") {
    return [
      "radial-gradient(ellipse 70% 50% at 12% 18%, rgba(0,122,255,0.12), transparent 55%)",
      "radial-gradient(ellipse 60% 45% at 88% 72%, rgba(90,200,250,0.1), transparent 50%)",
      "linear-gradient(160deg, #5c6578 0%, #6b7488 46%, #7a8496 100%)",
    ].join(", ");
  }
  /* dark + image fallback wash */
  return [
    "radial-gradient(ellipse 60% 45% at 20% 10%, rgba(255,255,255,0.06), transparent 55%)",
    "radial-gradient(ellipse 50% 40% at 85% 80%, rgba(10,132,255,0.08), transparent 50%)",
    "linear-gradient(160deg, #0b0d12, #141820 50%, #1c222d)",
  ].join(", ");
}

export function applyAppearanceToDocument(config: {
  theme: AppearanceTheme;
  glass: typeof DEFAULT_APPEARANCE.glass;
  background: typeof DEFAULT_APPEARANCE.background;
}) {
  const root = document.documentElement;
  const theme = normalizeAppearanceTheme(config.theme);
  /*
   * Logical themes: light | dark | image.
   * CSS tokens still use studio (light) / dark so we do not retouch global glass CSS.
   */
  root.dataset.theme = theme === "light" ? "studio" : "dark";
  root.dataset.appearanceTheme = theme;
  root.classList.toggle("dark", theme !== "light");

  const opacity = config.glass.opacity / 100;
  const borderOpacity = config.glass.borderBrightness / 100;
  const shadowOpacity = config.glass.shadowStrength / 100;

  const hasImageBg = Boolean(config.background.customUrl);
  const effectiveOpacity =
    theme === "image" || hasImageBg
      ? Math.min(opacity, Math.max(0.22, opacity * 0.78))
      : opacity;

  root.style.setProperty("--glass-opacity", String(effectiveOpacity));
  root.style.setProperty("--glass-blur", `${config.glass.blur}px`);
  root.style.setProperty("--glass-border-opacity", String(borderOpacity));
  root.style.setProperty("--glass-shadow-opacity", String(shadowOpacity));
  root.dataset.customBg = hasImageBg && theme === "image" ? "true" : "false";

  root.style.setProperty("--lg-glass-opacity", String(effectiveOpacity));
  root.style.setProperty("--lg-glass-blur", `${config.glass.blur}px`);
  root.style.setProperty(
    "--lg-border-brightness",
    String(config.glass.borderBrightness)
  );
  root.style.setProperty(
    "--lg-shadow-strength",
    String(config.glass.shadowStrength)
  );
  root.style.setProperty(
    "--lg-glow-strength",
    String(config.glass.glowStrength)
  );
  root.style.setProperty("--lg-bg-opacity", "1");
  root.style.setProperty("--lg-bg-blur", "0px");

  if (theme === "light") {
    root.style.setProperty(
      "--lg-glass-border",
      `rgba(255, 255, 255, ${borderOpacity})`
    );
  } else {
    root.style.setProperty(
      "--lg-glass-border",
      `rgba(255, 255, 255, ${borderOpacity * 0.12})`
    );
  }
}
