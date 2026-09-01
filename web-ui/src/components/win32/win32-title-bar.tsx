/**
 * GVFI — Win32-style title bar + menu bar.
 * Standard Windows chrome: app title, min/max/close, menu strip.
 */
"use client";

import { Minus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = ["首页", "批量", "变体", "实体", "工具"];

export function WinTitleBar() {
  return (
    <div className="flex flex-col border-b border-[#c0c0c0] bg-[#f0f0f0] select-none">
      {/* Title row */}
      <div className="flex h-[32px] items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px] bg-[linear-gradient(135deg,#0067c0,#0078d4)]">
            <span className="text-[10px] font-bold text-white">AI</span>
          </div>
          <span className="text-[12px] font-medium text-[#1a1a1a]">
            AI视频补帧超分工具
          </span>
        </div>
        <div className="flex items-center">
          <WinTitleButton label="最小化">
            <Minus className="h-[14px] w-[14px]" strokeWidth={2} />
          </WinTitleButton>
          <WinTitleButton label="最大化">
            <Square className="h-[12px] w-[12px]" strokeWidth={2} />
          </WinTitleButton>
          <WinTitleButton label="关闭" close>
            <X className="h-[14px] w-[14px]" strokeWidth={2} />
          </WinTitleButton>
        </div>
      </div>
      {/* Menu bar */}
      <div className="flex h-[24px] items-center border-t border-[#e0e0e0] bg-[#f5f5f5] px-1">
        {MENU_ITEMS.map((item) => (
          <button
            key={item}
            className="h-[20px] rounded-[3px] px-2 text-[12px] text-[#1a1a1a] transition-colors duration-180 ease-out hover:bg-[#e0e0e0] active:bg-[#d0d0d0]"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function WinTitleButton({
  children,
  label,
  close,
}: {
  children: React.ReactNode;
  label: string;
  close?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-[28px] w-[46px] items-center justify-center transition-colors duration-180 ease-out",
        close
          ? "text-[#1a1a1a] hover:bg-[#e81123] hover:text-white active:bg-[#c00d1a]"
          : "text-[#1a1a1a] hover:bg-[#e0e0e0] active:bg-[#d0d0d0]"
      )}
    >
      {children}
    </button>
  );
}
