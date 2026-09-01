/**
 * GVFI — Sync desktop / maximized state onto <html> for window radius.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useSyncExternalStore } from"react";
import { getDesktopBridge } from"@/lib/desktop";

function subscribeDesktop(onStoreChange: () => void) {
 const bridge = getDesktopBridge();
 if (!bridge?.isDesktop) return () => {};
 return bridge.onMaximizedChange(() => onStoreChange());
}

function getDesktopSnapshot() {
 return Boolean(getDesktopBridge()?.isDesktop);
}

function getServerDesktopSnapshot() {
 return false;
}

/** Sets data-desktop-shell / data-window-maximized for CSS corner hierarchy. */
export function WindowChromeSync() {
 const desktop = useSyncExternalStore(
 subscribeDesktop,
 getDesktopSnapshot,
 getServerDesktopSnapshot
 );

 useEffect(() => {
 const root = document.documentElement;
 if (desktop) root.dataset.desktopShell ="true";
 else delete root.dataset.desktopShell;

 if (!desktop) {
 delete root.dataset.windowMaximized;
 return;
 }

 const bridge = getDesktopBridge();
 if (!bridge) return;

 let active = true;
 void bridge.windowIsMaximized().then((value) => {
 if (!active) return;
 if (value) root.dataset.windowMaximized ="true";
 else delete root.dataset.windowMaximized;
 });

 const unsub = bridge.onMaximizedChange((value) => {
 if (value) root.dataset.windowMaximized ="true";
 else delete root.dataset.windowMaximized;
 });

 return () => {
 active = false;
 unsub();
 };
 }, [desktop]);

 return null;
}
