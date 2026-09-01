/**
 * GVFI — White title bar with integrated menu strip.
 * Left: app icon + title; center: menus (active = blue underline); right: window controls.
 */
"use client";

import { useEffect, useState } from "react";
import { Minus, Square, Copy, X, Blocks } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDesktopBridge } from "@/lib/desktop";

const MENU_ITEMS = ["文件", "批量处理", "模型管理", "输出设置", "工具", "帮助"];

export function WinTitleBar() {
  const [activeMenu, setActiveMenu] = useState("批量处理");
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    bridge.windowIsMaximized?.().then(setMaximized);
    return bridge.onMaximizedChange(setMaximized);
  }, []);

  return (
    <div className="flex h-[40px] shrink-0 select-none items-center justify-between border-b border-[#e4e7eb] bg-white pl-3">
      {/* Left: icon + title */}
      <div className="flex items-center gap-2 pr-4">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#1a73e8]">
          <Blocks className="h-[13px] w-[13px] text-white" strokeWidth={2.2} />
        </div>
        <span className="whitespace-nowrap text-[14px] font-bold text-[#1a1a1a]">
          AI视频补帧超分工具
        </span>
      </div>

      {/* Center: menu strip */}
      <nav className="flex h-full flex-1 items-stretch">
        {MENU_ITEMS.map((item) => {
          const isActive = activeMenu === item;
          return (
            <button
              key={item}
              onClick={() => setActiveMenu(item)}
              className={cn(
                "relative flex h-full items-center px-4 text-[13px] transition-colors duration-180 ease-out",
                isActive
                  ? "font-medium text-[#1a73e8]"
                  : "text-[#444] hover:bg-[#f0f4fa] hover:text-[#1a73e8]"
              )}
            >
              {item}
              {isActive ? (
                <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[#1a73e8]" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Right: window controls */}
      <div className="flex h-full items-stretch">
        <WinTitleButton label="最小化" onClick={() => void getDesktopBridge()?.windowMinimize()}>
          <Minus className="h-[15px] w-[15px]" strokeWidth={2} />
        </WinTitleButton>
        <WinTitleButton
          label="最大化/还原"
          onClick={() => void getDesktopBridge()?.windowMaximizeToggle()}
        >
          {maximized ? (
            <Copy className="h-[12px] w-[12px]" strokeWidth={2} />
          ) : (
            <Square className="h-[12px] w-[12px]" strokeWidth={2} />
          )}
        </WinTitleButton>
        <WinTitleButton label="关闭" close onClick={() => void getDesktopBridge()?.windowClose()}>
          <X className="h-[15px] w-[15px]" strokeWidth={2} />
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
  children: React.ReactNode;
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
        "flex w-[46px] items-center justify-center text-[#555] transition-colors duration-180 ease-out",
        close
          ? "hover:bg-[#e81123] hover:text-white active:bg-[#c00d1a]"
          : "hover:bg-[#e8eaed] active:bg-[#d8dde3]"
      )}
    >
      {children}
    </button>
  );
}
