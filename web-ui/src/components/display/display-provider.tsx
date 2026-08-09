/**
 * GVFI — Applies display store + wallpaper auto-contrast globally.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useRef } from "react";
import { useDisplayStore } from "@/stores/display-store";
import { useAppearanceStore } from "@/stores/appearance-store";
import {
  decideContrast,
  sampleBackgroundLuminance,
  type ContrastTone,
} from "@/lib/text-contrast";

export function DisplayProvider({ children }: { children: React.ReactNode }) {
  const apply = useDisplayStore((s) => s.apply);
  const autoContrast = useDisplayStore((s) => s.autoContrast);
  const fontColorMode = useDisplayStore((s) => s.fontColorMode);
  const customFontColor = useDisplayStore((s) => s.customFontColor);
  const setContrastRuntime = useDisplayStore((s) => s.setContrastRuntime);
  const background = useAppearanceStore((s) => s.background);
  const prevTone = useRef<ContrastTone | null>(null);
  const lastSampleAt = useRef(0);

  useEffect(() => {
    apply();
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      const now = Date.now();
      /* Debounce dynamic wallpaper churn */
      if (now - lastSampleAt.current < 400) {
        timer = setTimeout(run, 420);
        return;
      }
      lastSampleAt.current = now;

      const layer = document.getElementById("lg-background-layer");
      const lum = await sampleBackgroundLuminance(layer);

      if (cancelled) return;

      if (fontColorMode === "white") {
        setContrastRuntime({
          tone: "light",
          scrim: 0.1,
          textColor: "#ffffff",
          lowContrastWarning: false,
        });
        prevTone.current = "light";
        return;
      }
      if (fontColorMode === "dark") {
        setContrastRuntime({
          tone: "dark",
          scrim: 0.08,
          textColor: "#1d1d1f",
          lowContrastWarning: false,
        });
        prevTone.current = "dark";
        return;
      }
      if (fontColorMode === "custom") {
        const decision = decideContrast(lum, prevTone.current, {
          manualColor: customFontColor,
        });
        setContrastRuntime({
          tone: decision.tone,
          scrim: decision.scrim,
          textColor: decision.textColor,
          lowContrastWarning: decision.lowContrastWarning,
        });
        prevTone.current = decision.tone;
        return;
      }

      /* auto mode */
      if (!autoContrast) {
        setContrastRuntime({
          tone: "light",
          scrim: 0.22,
          textColor: "#ffffff",
          lowContrastWarning: false,
        });
        prevTone.current = "light";
        return;
      }

      const decision = decideContrast(lum, prevTone.current);
      setContrastRuntime({
        tone: decision.tone,
        scrim: decision.scrim,
        textColor: decision.textColor,
        lowContrastWarning: decision.lowContrastWarning,
      });
      prevTone.current = decision.tone;
    };

    void run();
    timer = setInterval(() => {
      void run();
    }, 2500);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [
    autoContrast,
    fontColorMode,
    customFontColor,
    background.customUrl,
    background.opacity,
    background.blur,
    setContrastRuntime,
  ]);

  return <>{children}</>;
}
