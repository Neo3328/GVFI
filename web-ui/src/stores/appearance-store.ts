/**
 * GVFI — Appearance store (theme / glass / custom wallpaper).
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
  normalizeAppearanceTheme,
} from "@/lib/apply-appearance";
import { fetchAppearanceSettings } from "@/lib/gvfi-api";
import type { AppearanceTheme } from "@/lib/gvfi-types";
import { createBrowserPersistStorage } from "@/lib/persist-storage";

const BG_IMAGE_KEY = "gvfi-appearance-bg-image";
const BG_META_KEY = "gvfi-appearance-bg-meta";

export type BackgroundImageMeta = {
  fileName: string | null;
  width: number | null;
  height: number | null;
};

export interface AppearanceState {
  theme: AppearanceTheme;
  glass: typeof DEFAULT_APPEARANCE.glass;
  background: typeof DEFAULT_APPEARANCE.background;
  hydratedFromServer: boolean;
  setTheme: (theme: AppearanceTheme) => { ok: true } | { ok: false; reason: "needImage" };
  setGlass: (patch: Partial<typeof DEFAULT_APPEARANCE.glass>) => void;
  setBackground: (patch: Partial<typeof DEFAULT_APPEARANCE.background>) => void;
  setCustomBackgroundUrl: (
    url: string | null,
    meta?: Partial<BackgroundImageMeta>
  ) => { ok: true } | { ok: false; reason: "persistFail" };
  resetBackground: () => void;
  hydrateFromPyQt: () => Promise<void>;
  apply: () => void;
}

function readStoredBackgroundImage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(BG_IMAGE_KEY);
    return value && value.startsWith("data:image/") ? value : null;
  } catch {
    return null;
  }
}

function readStoredBackgroundMeta(): BackgroundImageMeta {
  if (typeof window === "undefined") {
    return { fileName: null, width: null, height: null };
  }
  try {
    const raw = window.localStorage.getItem(BG_META_KEY);
    if (!raw) return { fileName: null, width: null, height: null };
    const parsed = JSON.parse(raw) as BackgroundImageMeta;
    return {
      fileName: typeof parsed.fileName === "string" ? parsed.fileName : null,
      width: typeof parsed.width === "number" ? parsed.width : null,
      height: typeof parsed.height === "number" ? parsed.height : null,
    };
  } catch {
    return { fileName: null, width: null, height: null };
  }
}

function writeStoredBackgroundImage(url: string | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (url) window.localStorage.setItem(BG_IMAGE_KEY, url);
    else window.localStorage.removeItem(BG_IMAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function writeStoredBackgroundMeta(meta: BackgroundImageMeta | null) {
  if (typeof window === "undefined") return;
  try {
    if (meta && (meta.fileName || meta.width || meta.height)) {
      window.localStorage.setItem(BG_META_KEY, JSON.stringify(meta));
    } else {
      window.localStorage.removeItem(BG_META_KEY);
    }
  } catch {
    /* ignore */
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
        const next = normalizeAppearanceTheme(theme);
        if (next === "image" && !get().background.customUrl) {
          return { ok: false, reason: "needImage" };
        }
        set({ theme: next });
        get().apply();
        return { ok: true };
      },

      setGlass: (patch) => {
        set((state) => ({ glass: { ...state.glass, ...patch } }));
        get().apply();
      },

      setBackground: (patch) => {
        set((state) => ({ background: { ...state.background, ...patch } }));
        get().apply();
      },

      setCustomBackgroundUrl: (url, meta) => {
        if (!url) {
          writeStoredBackgroundImage(null);
          writeStoredBackgroundMeta(null);
          set((state) => ({
            theme: state.theme === "image" ? "dark" : state.theme,
            background: {
              ...DEFAULT_APPEARANCE.background,
            },
          }));
          get().apply();
          return { ok: true };
        }

        const persisted = writeStoredBackgroundImage(url);
        if (!persisted) {
          return { ok: false, reason: "persistFail" };
        }

        const nextMeta: BackgroundImageMeta = {
          fileName: meta?.fileName ?? null,
          width: meta?.width ?? null,
          height: meta?.height ?? null,
        };
        writeStoredBackgroundMeta(nextMeta);

        set({
          theme: "image",
          background: {
            type: "image",
            customUrl: url,
            fileName: nextMeta.fileName,
            width: nextMeta.width,
            height: nextMeta.height,
            opacity: 100,
            blur: 0,
          },
        });
        get().apply();
        return { ok: true };
      },

      resetBackground: () => {
        writeStoredBackgroundImage(null);
        writeStoredBackgroundMeta(null);
        set((state) => ({
          theme: state.theme === "image" ? "dark" : state.theme,
          background: { ...DEFAULT_APPEARANCE.background },
        }));
        get().apply();
      },

      hydrateFromPyQt: async () => {
        if (get().hydratedFromServer) return;
        try {
          const hints = await fetchAppearanceSettings();
          const merged = mergePyQtAppearanceHints(hints);
          set((state) => {
            let theme = merged.theme
              ? normalizeAppearanceTheme(merged.theme)
              : state.theme;
            if (theme === "image" && !state.background.customUrl) {
              theme = "dark";
            }
            return {
              theme,
              glass: merged.glass ? { ...state.glass, ...merged.glass } : state.glass,
              hydratedFromServer: true,
            };
          });
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
      storage: createBrowserPersistStorage(),
      skipHydration: true,
      partialize: (state) => ({
        theme: state.theme,
        glass: state.glass,
        background: {
          type: state.background.customUrl ? ("image" as const) : ("none" as const),
          customUrl: null as string | null,
          fileName: state.background.fileName,
          width: state.background.width,
          height: state.background.height,
          opacity: 100,
          blur: 0,
        },
        hydratedFromServer: state.hydratedFromServer,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppearanceState> | undefined;
        if (!saved) return current;
        const legacyUrl =
          typeof saved.background?.customUrl === "string" &&
          saved.background.customUrl.startsWith("data:image/")
            ? saved.background.customUrl
            : null;
        if (legacyUrl && !readStoredBackgroundImage()) {
          writeStoredBackgroundImage(legacyUrl);
        }
        const image = readStoredBackgroundImage() ?? legacyUrl;
        const meta = readStoredBackgroundMeta();
        let theme = normalizeAppearanceTheme(saved.theme ?? current.theme);
        if (theme === "image" && !image) theme = "dark";

        const background = {
          type: image ? ("image" as const) : ("none" as const),
          customUrl: image,
          fileName:
            meta.fileName ??
            (typeof saved.background?.fileName === "string"
              ? saved.background.fileName
              : null),
          width:
            meta.width ??
            (typeof saved.background?.width === "number"
              ? saved.background.width
              : null),
          height:
            meta.height ??
            (typeof saved.background?.height === "number"
              ? saved.background.height
              : null),
          opacity: 100,
          blur: 0,
        };

        return {
          ...current,
          ...saved,
          theme,
          glass: { ...current.glass, ...saved.glass },
          background,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const image = readStoredBackgroundImage();
        const meta = readStoredBackgroundMeta();
        if (image) {
          state.background = {
            ...state.background,
            type: "image",
            customUrl: image,
            fileName: meta.fileName ?? state.background.fileName,
            width: meta.width ?? state.background.width,
            height: meta.height ?? state.background.height,
          };
        } else if (state.theme === "image") {
          state.theme = "dark";
          state.background = { ...DEFAULT_APPEARANCE.background };
        }
        state.theme = normalizeAppearanceTheme(state.theme);
        state.apply();
      },
    }
  )
);
