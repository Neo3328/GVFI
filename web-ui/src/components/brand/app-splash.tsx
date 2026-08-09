/**
 * GVFI — Application splash overlay.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import { CopyrightFooter } from "@/components/brand/copyright-footer";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SPLASH_MS = 1600;

export function AppSplash() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFade(true), SPLASH_MS - 400);
    const hideTimer = window.setTimeout(() => setVisible(false), SPLASH_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="presentation"
      aria-hidden={fade}
      data-gvfi-splash=""
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-300",
        "bg-[linear-gradient(135deg,#070914,#101526_48%,#171f36)]",
        fade ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <div
        className="glass-panel flex flex-col items-center gap-4 px-10 py-8 text-center"
        style={{ minWidth: "min(90vw, 320px)" }}
      >
        <div
          className="flex size-16 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-2xl font-bold tracking-tight text-[var(--text-strong)]"
          aria-hidden
        >
          G
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-strong)]">{APP_NAME}</h1>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">{APP_TAGLINE}</p>
        </div>
        <CopyrightFooter showAppName={false} variant="stacked" align="center" />
      </div>
    </div>
  );
}
