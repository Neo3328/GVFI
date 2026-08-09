/**
 * GVFI — Theme / wallpaper provider (Liquid Glass over custom BG).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect } from "react";
import { useAppearanceStore } from "@/stores/appearance-store";
import {
  backgroundPresetStyle,
  DEFAULT_APPEARANCE,
} from "@/lib/apply-appearance";

function serverBackgroundUrl(): string | null {
  return `/api/settings/background`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppearanceStore((s) => s.theme);
  const glass = useAppearanceStore((s) => s.glass);
  const background = useAppearanceStore((s) => s.background);
  const apply = useAppearanceStore((s) => s.apply);
  const hydrateFromPyQt = useAppearanceStore((s) => s.hydrateFromPyQt);

  useEffect(() => {
    apply();
    void hydrateFromPyQt();
  }, [apply, hydrateFromPyQt]);

  useEffect(() => {
    apply();
  }, [theme, glass, background, apply]);

  const imageUrl =
    background.customUrl ??
    (background.serverPath ? serverBackgroundUrl() : null);
  const hasCustomBg = Boolean(imageUrl);

  useEffect(() => {
    document.documentElement.dataset.customBg = hasCustomBg ? "true" : "false";
  }, [hasCustomBg]);

  const presetBg = backgroundPresetStyle(
    background.preset ?? DEFAULT_APPEARANCE.background.preset
  );

  return (
    <>
      {/* Base atmosphere — soft graphite wash only (no weather / landscape forms) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 20% 10%, rgba(255,255,255,0.06), transparent 55%), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(10,132,255,0.08), transparent 50%), linear-gradient(160deg, var(--bg-0), var(--bg-1) 50%, var(--bg-2))",
        }}
      />
      {/* Wallpaper / preset layer */}
      <div
        id="lg-background-layer"
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          opacity: background.opacity / 100,
          filter: background.blur > 0 ? `blur(${background.blur}px)` : undefined,
          background: imageUrl ? undefined : presetBg,
          backgroundImage: imageUrl ? `url(${JSON.stringify(imageUrl)})` : undefined,
          backgroundSize: imageUrl ? "cover" : undefined,
          backgroundPosition: imageUrl ? "center" : undefined,
          backgroundRepeat: imageUrl ? "no-repeat" : undefined,
        }}
      />
      {/* Soft scrim so UI text stays readable over busy wallpapers */}
      {hasCustomBg ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,13,18,0.32) 0%, rgba(11,13,18,0.14) 42%, rgba(11,13,18,0.38) 100%)",
          }}
        />
      ) : null}
      <div className="relative z-[1] flex min-h-dvh flex-1 flex-col bg-transparent">
        {children}
      </div>
    </>
  );
}
