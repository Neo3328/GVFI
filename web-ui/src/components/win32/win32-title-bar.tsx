/**
 * GVFI — Title bar (dark glass, Figma-inspired).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Minus, Square, Copy, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDesktopBridge } from "@/lib/desktop";

export function WinTitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    bridge.windowIsMaximized?.().then(setMaximized);
    const off = bridge.onMaximizedChange(setMaximized);
    return off;
  }, []);

  const handleMinimize = () => void getDesktopBridge()?.windowMinimize();
  const handleToggleMaximize = () =>
    void getDesktopBridge()?.windowMaximizeToggle();
  const handleClose = () => void getDesktopBridge()?.windowClose();

  return (
    <div
      className="relative flex h-10 shrink-0 select-none items-center justify-between border-b border-white/10 px-3"
      style={{
        background:
          "linear-gradient(180deg, rgba(15,18,28,0.85) 0%, rgba(10,13,22,0.92) 100%)",
        backdropFilter: "blur(24px) saturate(160%)",
      }}
    >
      {/* Aurora glow accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-12 -top-6 size-32 rounded-full bg-[var(--accent)]/20 blur-3xl" />
        <div className="absolute right-1/3 -top-6 size-24 rounded-full bg-[var(--accent-cyan)]/15 blur-3xl" />
      </div>

      <div className="relative z-[1] flex items-center gap-2.5">
        <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-[var(--accent)] to-[#7c3aed] shadow-[0_0_12px_rgba(10,132,255,0.45)]">
          <Sparkles className="size-3.5 text-white" strokeWidth={2.2} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold tracking-tight text-white">
            GVFI Workbench
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
            Frame · Upscale · Analyze
          </span>
        </div>
      </div>

      <div className="relative z-[1] flex items-center gap-1">
        <WinTitleButton label="最小化" onClick={handleMinimize}>
          <Minus className="size-3.5" strokeWidth={2} />
        </WinTitleButton>
        <WinTitleButton label="最大化/还原" onClick={handleToggleMaximize}>
          {maximized ? (
            <Copy className="size-3" strokeWidth={2} />
          ) : (
            <Square className="size-3" strokeWidth={2} />
          )}
        </WinTitleButton>
        <WinTitleButton label="关闭" close onClick={handleClose}>
          <X className="size-3.5" strokeWidth={2} />
        </WinTitleButton>
      </div>
    </div>
  );
}

function WinTitleButton({
  children,
  label,
  close,
  onClick,
}: {
  children: ReactNode;
  label: string;
  close?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg text-white/70 transition-all duration-150 ease-out",
        "hover:bg-white/10 hover:text-white",
        close && "hover:bg-[var(--danger)] hover:text-white"
      )}
    >
      {children}
    </button>
  );
}