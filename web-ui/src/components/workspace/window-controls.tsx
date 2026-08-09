/**
 * GVFI — Custom frameless window controls (min / max / close).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Minus, Square, Copy, X } from "lucide-react";
import { getDesktopBridge } from "@/lib/desktop";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

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

export function WindowControls({ className }: { className?: string }) {
  const t = useT();
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot
  );
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!desktop) return;
    const bridge = getDesktopBridge();
    if (!bridge) return;
    const state = { active: true };
    void bridge.windowIsMaximized().then((value) => {
      if (state.active) setMaximized(value);
    });
    const unsub = bridge.onMaximizedChange((value) => {
      if (state.active) setMaximized(value);
    });
    return () => {
      state.active = false;
      unsub();
    };
  }, [desktop]);

  if (!desktop) return null;

  const bridge = getDesktopBridge();
  if (!bridge) return null;

  return (
    <div
      className={cn(
        "app-titlebar-no-drag flex h-9 shrink-0 items-stretch",
        className
      )}
      data-slot="window-controls"
    >
      <button
        type="button"
        className="inline-flex w-11 items-center justify-center text-[var(--text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--text-strong)_10%,transparent)] hover:text-[var(--text-strong)]"
        aria-label={t("chrome.windowMinimize")}
        onClick={() => void bridge.windowMinimize()}
      >
        <Minus className="size-3.5" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className="inline-flex w-11 items-center justify-center text-[var(--text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--text-strong)_10%,transparent)] hover:text-[var(--text-strong)]"
        aria-label={
          maximized ? t("chrome.windowRestore") : t("chrome.windowMaximize")
        }
        onClick={() => void bridge.windowMaximizeToggle().then(setMaximized)}
      >
        {maximized ? (
          <Copy className="size-3 rotate-180" strokeWidth={2} aria-hidden />
        ) : (
          <Square className="size-3" strokeWidth={2} aria-hidden />
        )}
      </button>
      <button
        type="button"
        className="inline-flex w-12 items-center justify-center text-[var(--text-muted)] transition-colors hover:bg-[var(--danger)] hover:text-white"
        aria-label={t("chrome.windowClose")}
        onClick={() => void bridge.windowClose()}
      >
        <X className="size-3.5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
