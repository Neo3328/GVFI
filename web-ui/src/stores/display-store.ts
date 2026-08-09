/**
 * GVFI — Global font & display preferences (single source of truth).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyDisplayToDocument,
  clampFontSize,
  clampTextShadow,
  clampUiScale,
  DEFAULT_DISPLAY,
  normalizeFontWeight,
  type FontColorMode,
  type FontFamilyPreset,
  type FontWeightOption,
} from "@/lib/display";
import { createBrowserPersistStorage } from "@/lib/persist-storage";
import type { ContrastTone } from "@/lib/text-contrast";

export interface DisplayState {
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
  /** Runtime contrast (not persisted) */
  contrastTone: ContrastTone | null;
  contrastScrim: number;
  resolvedTextColor: string | null;
  lowContrastWarning: boolean;
  setFontFamily: (preset: FontFamilyPreset) => void;
  setCustomFontName: (name: string) => void;
  setFontSizePx: (px: number) => void;
  setFontColorMode: (mode: FontColorMode) => void;
  setCustomFontColor: (color: string) => void;
  setFontWeight: (weight: FontWeightOption) => void;
  setAutoContrast: (enabled: boolean) => void;
  setTextShadowStrength: (value: number) => void;
  setUiScale: (value: number) => void;
  setReduceMotion: (enabled: boolean) => void;
  setContrastRuntime: (patch: {
    tone: ContrastTone;
    scrim: number;
    textColor: string;
    lowContrastWarning: boolean;
  }) => void;
  resetDisplay: () => void;
  apply: () => void;
}

function applyFromState(state: DisplayState) {
  applyDisplayToDocument({
    fontFamily: state.fontFamily,
    customFontName: state.customFontName,
    fontSizePx: state.fontSizePx,
    fontColorMode: state.fontColorMode,
    customFontColor: state.customFontColor,
    fontWeight: state.fontWeight,
    autoContrast: state.autoContrast,
    textShadowStrength: state.textShadowStrength,
    uiScale: state.uiScale,
    reduceMotion: state.reduceMotion,
    resolvedTextColor: state.resolvedTextColor,
    contrastScrim: state.contrastScrim,
  });
}

export const useDisplayStore = create<DisplayState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_DISPLAY,
      contrastTone: null,
      contrastScrim: 0.12,
      resolvedTextColor: null,
      lowContrastWarning: false,

      setFontFamily: (fontFamily) => {
        set({ fontFamily });
        get().apply();
      },

      setCustomFontName: (customFontName) => {
        set({ customFontName, fontFamily: "custom" });
        get().apply();
      },

      setFontSizePx: (px) => {
        set({ fontSizePx: clampFontSize(px) });
        get().apply();
      },

      setFontColorMode: (fontColorMode) => {
        set({
          fontColorMode,
          resolvedTextColor:
            fontColorMode === "auto" ? get().resolvedTextColor : null,
        });
        get().apply();
      },

      setCustomFontColor: (customFontColor) => {
        set({ customFontColor, fontColorMode: "custom" });
        get().apply();
      },

      setFontWeight: (fontWeight) => {
        set({ fontWeight: normalizeFontWeight(fontWeight) });
        get().apply();
      },

      setAutoContrast: (autoContrast) => {
        set({ autoContrast });
        get().apply();
      },

      setTextShadowStrength: (value) => {
        set({ textShadowStrength: clampTextShadow(value) });
        get().apply();
      },

      setUiScale: (value) => {
        set({ uiScale: clampUiScale(value) });
        get().apply();
      },

      setReduceMotion: (reduceMotion) => {
        set({ reduceMotion });
        get().apply();
      },

      setContrastRuntime: ({ tone, scrim, textColor, lowContrastWarning }) => {
        set({
          contrastTone: tone,
          contrastScrim: scrim,
          resolvedTextColor: textColor,
          lowContrastWarning,
        });
        get().apply();
      },

      resetDisplay: () => {
        set({
          ...DEFAULT_DISPLAY,
          contrastTone: null,
          contrastScrim: 0.12,
          resolvedTextColor: null,
          lowContrastWarning: false,
        });
        get().apply();
      },

      apply: () => {
        applyFromState(get());
      },
    }),
    {
      name: "gvfi-display-v1",
      storage: createBrowserPersistStorage(),
      skipHydration: true,
      partialize: (state) => ({
        fontFamily: state.fontFamily,
        customFontName: state.customFontName,
        fontSizePx: state.fontSizePx,
        fontColorMode: state.fontColorMode,
        customFontColor: state.customFontColor,
        fontWeight: state.fontWeight,
        autoContrast: state.autoContrast,
        textShadowStrength: state.textShadowStrength,
        uiScale: state.uiScale,
        reduceMotion: state.reduceMotion,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DisplayState>;
        return {
          ...current,
          ...p,
          fontSizePx: clampFontSize(p.fontSizePx ?? current.fontSizePx),
          uiScale: clampUiScale(p.uiScale ?? current.uiScale),
          textShadowStrength: clampTextShadow(
            p.textShadowStrength ?? current.textShadowStrength
          ),
          fontWeight: normalizeFontWeight(p.fontWeight ?? current.fontWeight),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.apply();
      },
    }
  )
);
