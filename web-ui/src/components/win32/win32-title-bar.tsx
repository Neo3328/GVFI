/**
 * GVFI — Win32-style title bar + menu bar.
 * Standard Windows chrome: app title, min/max/close, menu strip.
 */
"use client";

import { Minus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = ["文件", "批量处理", "模型管理", "输出设置", "工具", "帮助"];

export function WinTitleBar() {
  return (
    <div className="flex flex-col border-b border-[#3a3a3f] bg-[#242427] select-none">
      {/* Title row */}
      <div className="flex h-[36px] items-center justify-between bg-[#242427] px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-[#7561ff]">
            <span className="text-[10px] font-bold text-white">AI</span>
          </div>
          <span className="text-[13px] font-semibold text-white">
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
      <div className="flex h-[30px] items-center border-b border-[#3a3a3f] bg-[#29292d] px-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item}
            className="h-[24px] rounded-[4px] px-2.5 text-[12px] text-[#c6c6cc] transition-colors duration-180 ease-out hover:bg-[#3a3942] hover:text-white active:bg-[#454354]"
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
        "flex h-[36px] w-[46px] items-center justify-center transition-colors duration-180 ease-out",
        close
          ? "text-white hover:bg-[#e81123] active:bg-[#c00d1a]"
          : "text-white hover:bg-white/20 active:bg-white/30"
      )}
    >
      {children}
    </button>
  );
}
