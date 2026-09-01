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
    <nav className="flex w-[150px] shrink-0 flex-col border-r border-[#e0e7ef] bg-white p-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex h-[38px] items-center gap-2.5 rounded-[6px] px-3 text-[13px] transition-colors duration-180 ease-out",
              isActive
                ? "bg-[#e3f2fd] text-[#1565c0] font-semibold"
                : "text-[#555] hover:bg-[#f0f7ff] hover:text-[#1976d2] active:bg-[#e3f2fd]"
            )}
          >
            <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#1565c0]" : "text-[#777]")} strokeWidth={1.8} />
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
