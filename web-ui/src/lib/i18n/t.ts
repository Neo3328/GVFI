/**
 * GVFI — Message lookup helper.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { en } from "@/lib/i18n/messages/en";
import { zhCN } from "@/lib/i18n/messages/zh-CN";
import type { Locale, MessageKey } from "@/lib/i18n/types";

const CATALOG: Record<Locale, Record<MessageKey, string>> = {
  "zh-CN": zhCN,
  en,
};

export type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>
) => string;

export function t(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  const localeCatalog = CATALOG[locale];
  const primary = localeCatalog?.[key];

  let text: string;
  if (typeof primary === "string") {
    text = primary;
  } else {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[i18n] Missing message key "${String(key)}" for locale "${locale}"`
      );
    }
    /* Typed keys should always resolve; do not cross-fallback to another language for display. */
    const zhSafety = CATALOG["zh-CN"]?.[key];
    text =
      typeof zhSafety === "string" && localeCatalog === undefined
        ? zhSafety
        : `[missing:${String(key)}]`;
  }

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function createTranslator(locale: Locale): TranslateFn {
  return (key, params) => t(locale, key, params);
}
