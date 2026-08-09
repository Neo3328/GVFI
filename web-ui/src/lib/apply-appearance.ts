import type { AppearanceTheme, PyQtAppearanceHints } from "@/lib/gvfi-types";

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
    type: "preset" as "preset" | "image" | "gradient" | "video",
    preset: "nebula" as "studio" | "aurora" | "nebula",
    customUrl: null as string | null,
    serverPath: null as string | null,
    opacity: 100,
    blur: 0,
  },
};

export function mapPyQtThemeToWeb(pyqtTheme: string): AppearanceTheme {
  switch (pyqtTheme) {
    case "liquid":
    case "aurora":
      return "ai";
    case "midnight":
    case "graphite":
    case "kawaii":
    case "blush":
    case "cream":
      return "dark";
    default:
      return "dark";
  }
}

export function mergePyQtAppearanceHints(
  hints: PyQtAppearanceHints
): Partial<typeof DEFAULT_APPEARANCE> {
  const merged: Partial<typeof DEFAULT_APPEARANCE> = {};
  if (hints.web_theme) {
    merged.theme = hints.web_theme;
  } else if (hints.theme) {
    merged.theme = mapPyQtThemeToWeb(hints.theme);
  }
  if (typeof hints.glass_opacity === "number") {
    merged.glass = {
      ...DEFAULT_APPEARANCE.glass,
      opacity: Math.min(90, Math.max(10, hints.glass_opacity)),
    };
  }
  if (hints.background_path) {
    merged.background = {
      ...DEFAULT_APPEARANCE.background,
      type: "preset",
      serverPath: hints.background_path,
    };
  }
  return merged;
}

export function applyAppearanceToDocument(config: {
  theme: AppearanceTheme;
  glass: typeof DEFAULT_APPEARANCE.glass;
  background: typeof DEFAULT_APPEARANCE.background;
}) {
  const root = document.documentElement;
  root.dataset.theme = config.theme;
  root.classList.toggle("dark", config.theme !== "studio");

  const opacity = config.glass.opacity / 100;
  const borderOpacity = config.glass.borderBrightness / 100;
  const shadowOpacity = config.glass.shadowStrength / 100;

  const hasCustomBg = Boolean(
    config.background.customUrl || config.background.serverPath
  );
  /* Custom wallpaper: slightly clearer glass so the image reads through */
  const effectiveOpacity = hasCustomBg
    ? Math.min(opacity, Math.max(0.22, opacity * 0.78))
    : opacity;

  /* Canonical glass tokens */
  root.style.setProperty("--glass-opacity", String(effectiveOpacity));
  root.style.setProperty("--glass-blur", `${config.glass.blur}px`);
  root.style.setProperty("--glass-border-opacity", String(borderOpacity));
  root.style.setProperty("--glass-shadow-opacity", String(shadowOpacity));
  root.dataset.customBg = hasCustomBg ? "true" : "false";

  /* Legacy aliases (derived in CSS, but runtime overrides need explicit sync) */
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
  root.style.setProperty("--lg-bg-opacity", String(config.background.opacity));
  root.style.setProperty("--lg-bg-blur", `${config.background.blur}px`);

  if (config.theme === "studio") {
    root.style.setProperty(
      "--lg-glass-border",
      `rgba(255, 255, 255, ${borderOpacity})`
    );
  } else if (config.theme === "dark") {
    root.style.setProperty(
      "--lg-glass-border",
      `rgba(255, 255, 255, ${borderOpacity * 0.12})`
    );
  } else {
    root.style.setProperty(
      "--lg-glass-border",
      `rgba(0, 212, 255, ${borderOpacity * 0.15})`
    );
  }
}

/** Abstract graphite/soft-light atmospheres — no weather imagery */
export function backgroundPresetStyle(
  preset: "studio" | "aurora" | "nebula"
): string {
  switch (preset) {
    case "aurora":
      /* Soft light sheets — cool slate, not sky/aurora motifs */
      return [
        "radial-gradient(ellipse 70% 50% at 12% 18%, rgba(10,132,255,0.14), transparent 55%)",
        "radial-gradient(ellipse 60% 45% at 88% 72%, rgba(100,210,255,0.1), transparent 50%)",
        "linear-gradient(160deg, var(--bg-0) 0%, #12161f 46%, var(--bg-2) 100%)",
      ].join(", ");
    case "nebula":
      /* Layered graphite depth — no celestial / landscape forms */
      return [
        "radial-gradient(ellipse 55% 40% at 30% 0%, rgba(255,255,255,0.07), transparent 50%)",
        "radial-gradient(ellipse 50% 45% at 78% 100%, rgba(10,132,255,0.1), transparent 48%)",
        "linear-gradient(145deg, #0a0c10 0%, var(--bg-1) 50%, #1a2030 100%)",
      ].join(", ");
    default:
      return "linear-gradient(160deg, var(--bg-0), var(--bg-1) 50%, var(--bg-2))";
  }
}
