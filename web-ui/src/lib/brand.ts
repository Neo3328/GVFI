/**
 * GVFI — Brand & copyright constants (single source of truth).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export const APP_NAME = "GVFI";
/** Canonical English tagline; UI must use t("brand.tagline") for locale-aware copy. */
export const APP_TAGLINE = "AI Video Workstation";
export const DEVELOPER_NAME = "Mr. Gong";
export const COPYRIGHT_LINE = "Copyright © 2026 Mr. Gong. All Rights Reserved.";
export const DEVELOPER_LINE = `Developed by ${DEVELOPER_NAME}`;
export const APP_VERSION = "1.0.0";

/**
 * Public feedback channels — set real values before distributing builds.
 * Empty string hides the corresponding About-page action.
 */
export const FEEDBACK_EMAIL = "";
export const FEEDBACK_URL = "";

/** Compact footer lines for UI */
export const COPYRIGHT_FOOTER_LINES = [DEVELOPER_LINE, COPYRIGHT_LINE] as const;

/** New source file header template (TS/TSX/JS/CSS) */
export const SOURCE_FILE_HEADER = `/**
 * GVFI — \${moduleName}
 * ${DEVELOPER_LINE}
 * ${COPYRIGHT_LINE}
 */`;
