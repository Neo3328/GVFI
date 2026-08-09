/**
 * GVFI — UI locale store (zh-CN / en).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_LOCALE,
  isLocale,
  localeToHtmlLang,
  type Locale,
} from "@/lib/i18n/types";
import { createBrowserPersistStorage } from "@/lib/persist-storage";

function applyHtmlLang(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = localeToHtmlLang(locale);
}

export interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  syncHtmlLang: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: DEFAULT_LOCALE,

      setLocale: (locale) => {
        if (!isLocale(locale)) return;
        set({ locale });
        applyHtmlLang(locale);
      },

      syncHtmlLang: () => {
        applyHtmlLang(get().locale);
      },
    }),
    {
      name: "gvfi-locale-v1",
      storage: createBrowserPersistStorage<{ locale: Locale }>(),
      skipHydration: true,
      partialize: (state) => ({ locale: state.locale }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LocaleState>;
        const locale = isLocale(p.locale) ? p.locale : current.locale;
        return { ...current, locale };
      },
      onRehydrateStorage: () => (state) => {
        state?.syncHtmlLang();
      },
    }
  )
);
