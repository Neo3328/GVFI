/**
 * GVFI — Win32-style left vertical navigation bar.
 * 6 nav items, selected = light-blue highlight background.
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
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "input", label: "输入文件", icon: FileInput },
  { id: "params", label: "处理参数", icon: Sliders },
  { id: "model", label: "AI模型", icon: Brain },
  { id: "output", label: "输出设置", icon: FolderOutput },
  { id: "queue", label: "任务队列", icon: ListTodo },
  { id: "log", label: "日志信息", icon: ScrollText },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"];

export function WinNavBar({
  active,
  onChange,
}: {
  active: NavId;
  onChange: (id: NavId) => void;
}) {
  return (
    <nav className="flex w-[140px] shrink-0 flex-col border-r border-[#c0c0c0] bg-[#f0f0f0] p-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex h-[36px] items-center gap-2 rounded-[4px] px-2 text-[12px] transition-colors duration-180 ease-out",
              isActive
                ? "bg-[#cce4f7] text-[#005a9e] font-medium"
                : "text-[#333] hover:bg-[#e0e0e0] active:bg-[#d0d0d0]"
            )}
          >
            <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.8} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function useNavState(initial: NavId = "params") {
  const [active, setActive] = useState<NavId>(initial);
  return { active, setActive };
}
