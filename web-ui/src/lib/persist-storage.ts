/**
 * GVFI — Lazy localStorage adapter for Zustand persist (SSR-safe).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { PersistStorage, StorageValue } from "zustand/middleware";

/** Avoid createJSONStorage() at module init — it can return undefined under SSR. */
export function createBrowserPersistStorage<S>(): PersistStorage<S> {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(name);
        if (!raw) return null;
        return JSON.parse(raw) as StorageValue<S>;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(name, JSON.stringify(value));
      } catch {
        /* quota / private mode */
      }
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}
