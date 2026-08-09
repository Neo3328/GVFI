/**
 * GVFI — Floating macOS workspace shell layout.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motionPage } from "@/components/workspace/motion";

export interface AppShellProps {
  sidebar?: ReactNode;
  topBar?: ReactNode;
  children: ReactNode;
  className?: string;
  mainClassName?: string;
}

/** 工作站布局壳：悬浮侧栏 + 顶栏 + 主内容区（视觉分层，不改路由） */
export function AppShell({
  sidebar,
  topBar,
  children,
  className,
  mainClassName,
}: AppShellProps) {
  return (
    <div
      data-slot="app-shell"
      className={cn(
        "flex min-h-dvh w-full gap-0 p-0 lg:gap-3 lg:p-3",
        className
      )}
    >
      {sidebar}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          "lg:overflow-hidden lg:rounded-[var(--radius-lg)]",
          "lg:border lg:border-[var(--glass-border)]",
          "lg:bg-[color-mix(in_srgb,var(--bg-1)_calc(var(--glass-opacity)*72%),transparent)]",
          "lg:shadow-[var(--lg-shadow-glass)]",
          "lg:backdrop-blur-[calc(var(--glass-blur)*0.55)] lg:backdrop-saturate-[170%]"
        )}
      >
        {topBar}
        <main
          id="main-content"
          className={cn(
            "flex-1 overflow-auto px-[var(--space-4)] py-[var(--space-4)] sm:px-[var(--space-6)]",
            motionPage,
            mainClassName
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
