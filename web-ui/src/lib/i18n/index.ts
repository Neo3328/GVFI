/**
 * GVFI — i18n public exports.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localeToHtmlLang,
  type Locale,
  type MessageKey,
  type MessageDict,
} from "@/lib/i18n/types";
export { t, createTranslator, type TranslateFn } from "@/lib/i18n/t";
export {
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/i18n/format";
