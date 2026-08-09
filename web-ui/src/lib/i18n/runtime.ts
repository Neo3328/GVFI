/**
 * GVFI — Non-React i18n lookup (services / stores / plugins).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { t } from "@/lib/i18n/t";
import type { MessageKey } from "@/lib/i18n/types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/types";
import { useLocaleStore } from "@/stores/locale-store";

function readLocale(): Locale {
  try {
    return useLocaleStore.getState().locale ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function tr(
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  return t(readLocale(), key, params);
}

export function currentUiLocale(): Locale {
  return readLocale();
}
