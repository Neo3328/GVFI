/**
 * GVFI — Appearance store (theme / glass / wallpaper).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyAppearanceToDocument,
  DEFAULT_APPEARANCE,
  mergePyQtAppearanceHints,
} from "@/lib/apply-appearance";
import { fetchAppearanceSettings } from "@/lib/gvfi-api";
import type { AppearanceTheme } from "@/lib/gvfi-types";

const BG_IMAGE_KEY = "gvfi-appearance-bg-image";

export interface AppearanceState {
  theme: AppearanceTheme;
  glass: typeof DEFAULT_APPEARANCE.glass;
  background: typeof DEFAULT_APPEARANCE.background;
  hydratedFromServer: boolean;
  setTheme: (theme: AppearanceTheme) => void;
  setGlass: (patch: Partial<typeof DEFAULT_APPEARANCE.glass>) => void;
  setBackground: (patch: Partial<typeof DEFAULT_APPEARANCE.background>) => void;
  setCustomBackgroundUrl: (url: string | null, label?: string) => void;
  resetBackground: () => void;
  hydrateFromPyQt: () => Promise<void>;
  apply: () => void;
}

function normalizeTheme(value: unknown): AppearanceTheme {
  if (value === "dark" || value === "ai" || value === "studio") return value;
  if (value === "blush" || value === "kawaii" || value === "cream") return "dark";
  return "dark";
}

function readStoredBackgroundImage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(BG_IMAGE_KEY);
    return value && value.startsWith("data:") ? value : null;
  } catch {
    return null;
  }
}

function writeStoredBackgroundImage(url: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (url) window.localStorage.setItem(BG_IMAGE_KEY, url);
    else window.localStorage.removeItem(BG_IMAGE_KEY);
  } catch {
    /* quota / private mode — ignore */
  }
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_APPEARANCE.theme,
      glass: { ...DEFAULT_APPEARANCE.glass },
      background: { ...DEFAULT_APPEARANCE.background },
      hydratedFromServer: false,

      setTheme: (theme) => {
        set({ theme });
        get().apply();
      },

      setGlass: (patch) => {
        set((state) => ({ glass: { ...state.glass, ...patch } }));
        get().apply();
      },

      setBackground: (patch) => {
        set((state) => ({ background: { ...state.background, ...patch } }));
        get().apply();
      },

      setCustomBackgroundUrl: (url) => {
        writeStoredBackgroundImage(url);
        set((state) => ({
          background: {
            ...state.background,
            type: url ? "image" : "preset",
            customUrl: url,
            serverPath: null,
            preset: state.background.preset,
          },
        }));
        get().apply();
      },

      resetBackground: () => {
        writeStoredBackgroundImage(null);
        set((state) => ({
          background: {
            ...DEFAULT_APPEARANCE.background,
            preset: state.background.preset,
          },
        }));
        get().apply();
      },

      hydrateFromPyQt: async () => {
        if (get().hydratedFromServer) return;
        try {
          const hints = await fetchAppearanceSettings();
          const merged = mergePyQtAppearanceHints(hints);
          set((state) => ({
            theme: merged.theme ?? state.theme,
            glass: merged.glass ? { ...state.glass, ...merged.glass } : state.glass,
            background: merged.background
              ? { ...state.background, ...merged.background }
              : state.background,
            hydratedFromServer: true,
          }));
          get().apply();
        } catch {
          set({ hydratedFromServer: true });
        }
      },

      apply: () => {
        const { theme, glass, background } = get();
        applyAppearanceToDocument({ theme, glass, background });
      },
    }),
    {
      name: "gvfi-appearance-v2",
      /* Keep wallpaper out of this JSON — writing a data URL on every slider tick freezes UI */
      partialize: (state) => ({
        theme: state.theme,
        glass: state.glass,
        background: {
          type: state.background.customUrl ? "image" : state.background.type,
          preset: state.background.preset,
          customUrl: null as string | null,
          serverPath: state.background.serverPath,
          opacity: state.background.opacity,
          blur: state.background.blur,
        },
        hydratedFromServer: state.hydratedFromServer,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppearanceState> | undefined;
        if (!saved) return current;
        const legacyUrl =
          typeof saved.background?.customUrl === "string" &&
          saved.background.customUrl.startsWith("data:")
            ? saved.background.customUrl
            : null;
        if (legacyUrl && !readStoredBackgroundImage()) {
          writeStoredBackgroundImage(legacyUrl);
        }
        const image = readStoredBackgroundImage() ?? legacyUrl;
        const background = {
          ...current.background,
          ...saved.background,
          customUrl: image,
          type: image ? ("image" as const) : (saved.background?.type ?? current.background.type),
        };
        return {
          ...current,
          ...saved,
          theme: normalizeTheme(saved.theme),
          glass: { ...current.glass, ...saved.glass },
          background,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const image = readStoredBackgroundImage();
        if (image) {
          state.background = {
            ...state.background,
            type: "image",
            customUrl: image,
          };
        }
        state.apply();
      },
    }
  )
);
