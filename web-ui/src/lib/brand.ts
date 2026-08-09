/**
 * GVFI — Brand & copyright constants (single source of truth).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export const APP_NAME = "GVFI";
export const APP_TAGLINE = "AI 视频工作站";
export const DEVELOPER_NAME = "Mr. Gong";
export const COPYRIGHT_LINE = "Copyright © 2026 Mr. Gong. All Rights Reserved.";
export const DEVELOPER_LINE = `Developed by ${DEVELOPER_NAME}`;
export const APP_VERSION = "0.1.0";

/** 用于 UI 底部 — 两行紧凑展示 */
export const COPYRIGHT_FOOTER_LINES = [DEVELOPER_LINE, COPYRIGHT_LINE] as const;

/** 新建源文件头注释模板（TS/TSX/JS/CSS） */
export const SOURCE_FILE_HEADER = `/**
 * GVFI — \${moduleName}
 * ${DEVELOPER_LINE}
 * ${COPYRIGHT_LINE}
 */`;
