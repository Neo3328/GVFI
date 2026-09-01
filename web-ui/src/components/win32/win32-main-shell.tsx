/**
 * GVFI — Main application shell (light blue-white Win32 workspace).
 * Layout: title/menu bar | 3-column (nav / preview / params) | log pane | status bar.
 */
"use client";

import { useState } from "react";
import { WinTitleBar } from "./win32-title-bar";
import { WinNavBar, type NavId } from "./win32-nav-bar";
import { WinPreviewPane } from "./win32-preview-pane";
import { WinParamsPanel } from "./win32-params-panel";
import { WinLogPane, WinStatusBar } from "./win32-bottom-bar";

export function Win32MainShell() {
  const [navActive, setNavActive] = useState<NavId>("params");

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#f4f6f9] font-[var(--app-font-family)] text-[#1a1a1a] [color-scheme:light]">
      {/* Title + integrated menu */}
      <WinTitleBar />

      {/* 3-column work area */}
      <div className="flex min-h-0 flex-1">
        <WinNavBar active={navActive} onChange={setNavActive} />
        <WinPreviewPane />
        <WinParamsPanel />
      </div>

      {/* Bottom: log + status */}
      <WinLogPane />
      <WinStatusBar />
    </div>
  );
}
