/**
 * GVFI — Adaptive floating workspace shell (DPI / resize safe).
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

/** 工作站布局壳：约束侧栏/顶栏/主区，避免缩放与高分屏错位 */
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
        "flex w-full min-w-0",
        "gap-0 p-0 lg:gap-[var(--workspace-gap)] lg:p-[var(--workspace-pad)]",
        className
      )}
    >
      {sidebar}
      {/* Clip layer (panel radius) — scroll is only on #main-content */}
      <div
        data-slot="stage-shell"
        className={cn(
          "gvfi-stage-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          "lg:rounded-[var(--panel-radius)]",
          "lg:border lg:border-[var(--glass-border)]",
          "lg:bg-[color-mix(in_srgb,var(--bg-1)_calc(var(--glass-opacity)*72%),transparent)]",
          "lg:bg-clip-padding",
          "lg:shadow-[var(--lg-shadow-glass)]",
          "lg:backdrop-blur-[calc(var(--glass-blur)*0.55)] lg:backdrop-saturate-[170%]"
        )}
      >
        {topBar}
        <main
                  id="main-content"
                  className={cn(
                    /* Bug#2 修复：移除 overflow-x-clip。
                       原值会把右侧参数面板内超出 stage 宽度的内容（如下拉箭头、滑块末端、Select 触发器右缘）整段截断，且无水平滚动条恢复可见性（ui-misalign / ui-clipped）。
                       改为仅保留竖向滚动；横向溢出由各子组件自身的 min-w-0 + w-full 约束自适应。*/
                    "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[var(--workspace-pad)] py-[var(--workspace-pad)]",
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
