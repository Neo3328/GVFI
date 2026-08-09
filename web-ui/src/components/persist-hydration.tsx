/**
 * GVFI — Client rehydrate for Zustand persist (Next.js App Router).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import { useApiConfigStore } from "@/services/api-config-store";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useAiModelConfigStore } from "@/stores/ai-model-config-store";
import { useAiSessionStore } from "@/stores/ai-session-store";
import { useDisplayStore } from "@/stores/display-store";
import { useLocaleStore } from "@/stores/locale-store";

/**
 * Must mount once under the app shell. Zustand persist uses skipHydration
 * so SSR never locks storage to undefined; we rehydrate on the client.
 */
export function PersistHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void useLocaleStore.persist.rehydrate();
    void useDisplayStore.persist.rehydrate();
    void useAppearanceStore.persist.rehydrate();
    void useApiConfigStore.persist.rehydrate();
    void useAiSessionStore.persist.rehydrate();
    void useAiModelConfigStore.persist.rehydrate();

    try {
      const raw = window.localStorage.getItem("gvfi-locale-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { locale?: string } };
        const loc = parsed.state?.locale;
        if (loc === "en" || loc === "zh-CN") {
          useLocaleStore.getState().setLocale(loc);
        }
      }
    } catch {
      /* ignore */
    }

    useLocaleStore.getState().syncHtmlLang();
    useDisplayStore.getState().apply();
    useAppearanceStore.getState().apply();

    if (!cancelled) setReady(true);

    return () => {
      cancelled = true;
    };
  }, []);

  void ready;
  return <>{children}</>;
}
