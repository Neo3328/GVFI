/**
 * GVFI — Locale types.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export type Locale = "zh-CN" | "en";

export const LOCALES: Locale[] = ["zh-CN", "en"];

export const DEFAULT_LOCALE: Locale = "zh-CN";

export function isLocale(value: unknown): value is Locale {
  return value === "zh-CN" || value === "en";
}

export function localeToHtmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "zh-CN";
}

export type MessageKey = keyof typeof import("./messages/zh-CN").zhCN;

export type MessageDict = Record<MessageKey, string>;
