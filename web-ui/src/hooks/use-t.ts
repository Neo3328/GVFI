/**
 * GVFI — React hook for UI translations.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useCallback } from "react";
import { t, type TranslateFn } from "@/lib/i18n/t";
import type { MessageKey } from "@/lib/i18n/types";
import { useLocaleStore } from "@/stores/locale-store";

export function useT(): TranslateFn {
  const locale = useLocaleStore((s) => s.locale);
  return useCallback(
    (key: MessageKey, params?: Record<string, string | number>) =>
      t(locale, key, params),
    [locale]
  );
}

export function useLocale() {
  return useLocaleStore((s) => s.locale);
}
