/**
 * GVFI — Compact vertical icon rail (Figma-style dark glass).
 * Compact monoline icons; selected state uses gradient pill + glow.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import {
  FileInput,
  Sliders,
  Brain,
  FolderOutput,
  ListTodo,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "input", label: "输入文件", icon: FileInput, hint: "导入本地视频" },
  { id: "params", label: "处理参数", icon: Sliders, hint: "AI 模型与参数" },
  { id: "model", label: "AI 模型", icon: Brain, hint: "推理引擎" },
  { id: "output", label: "输出设置", icon: FolderOutput, hint: "编码与封装" },
  { id: "queue", label: "任务队列", icon: ListTodo, hint: "实时任务状态" },
  { id: "log", label: "日志信息", icon: ScrollText, hint: "运行日志" },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"];

export function WinNavBar({
  active,
  onChange,
  onPickInput,
  hasInput,
}: {
  active: NavId;
  onChange: (id: NavId) => void;
  onPickInput: () => void;
  hasInput: boolean;
}) {
  return (
    <nav
      className="relative flex h-full w-[88px] shrink-0 flex-col items-center gap-1.5 border-r border-white/10 px-2 py-3"
      style={{
        background:
          "linear-gradient(180deg, rgba(15,18,28,0.72) 0%, rgba(10,13,22,0.85) 100%)",
        backdropFilter: "blur(20px) saturate(160%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "input") onPickInput();
              onChange(item.id);
            }}
            title={`${item.label} · ${item.hint}`}
            aria-label={item.label}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "group relative flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all duration-150 ease-out",
              isActive
                ? "bg-gradient-to-b from-[var(--accent)]/30 to-[#7c3aed]/20 text-white shadow-[0_0_0_1px_rgba(10,132,255,0.4),0_4px_12px_rgba(10,132,255,0.25)]"
                : "text-white/50 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            {isActive ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10"
              />
            ) : null}
            <Icon
              className={cn(
                "size-[18px] transition-transform duration-150",
                isActive && "scale-110"
              )}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span className="truncate text-[10px] font-medium leading-none">
              {item.label}
            </span>
            {item.id === "input" && hasInput ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_6px_rgba(100,210,255,0.8)]" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}