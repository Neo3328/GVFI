/**
 * GVFI — Desktop (Electron) bridge helpers.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export interface WriteTextCopyPayload {
  sourcePath?: string;
  suggestedName: string;
  content: string;
}

export interface WriteTextCopyResult {
  ok: boolean;
  path?: string;
  error?: string;
}

export interface GvfiDesktopBridge {
  isDesktop: boolean;
  platform: string;
  windowMinimize: () => Promise<void>;
  windowMaximizeToggle: () => Promise<boolean>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;
  setLocale?: (locale: string) => Promise<string>;
  getLocale?: () => Promise<string>;
  restartApi?: () => Promise<boolean>;
  writeTextCopy?: (payload: WriteTextCopyPayload) => Promise<WriteTextCopyResult>;
  revealInFolder?: (targetPath: string) => Promise<boolean>;
  onMaximizedChange: (callback: (maximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    gvfiDesktop?: GvfiDesktopBridge;
  }
}

export function getDesktopBridge(): GvfiDesktopBridge | null {
  if (typeof window === "undefined") return null;
  return window.gvfiDesktop ?? null;
}

export function isDesktopShell(): boolean {
  return Boolean(getDesktopBridge()?.isDesktop);
}
