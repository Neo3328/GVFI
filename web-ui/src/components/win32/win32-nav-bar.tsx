/**
 * GVFI — White left navigation bar.
 * Selected item: blue text + left accent bar + light-blue fill + chevron.
 */
"use client";

import {
  FileInput,
  Sliders,
  Brain,
  FolderOutput,
  ListTodo,
  ScrollText,
  ChevronDown,
} from "lucide-react";
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
    <nav className="flex w-[168px] shrink-0 flex-col gap-1 border-r border-[#e4e7eb] bg-white p-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex h-[44px] items-center gap-2.5 rounded-[6px] px-3 text-[13px] transition-colors duration-180 ease-out",
              isActive
                ? "bg-[#eaf2fe] font-semibold text-[#1a73e8]"
                : "text-[#444] hover:bg-[#f2f5f9] hover:text-[#1a73e8] active:bg-[#eaf2fe]"
            )}
          >
            {isActive ? (
              <span className="absolute left-0 top-1/2 h-[20px] w-[3px] -translate-y-1/2 rounded-r-full bg-[#1a73e8]" />
            ) : null}
            <Icon
              className={cn(
                "h-[17px] w-[17px] shrink-0",
                isActive ? "text-[#1a73e8]" : "text-[#777]"
              )}
              strokeWidth={1.8}
            />
            <span className="truncate">{item.label}</span>
            {isActive ? (
              <ChevronDown className="ml-auto h-[14px] w-[14px] shrink-0 text-[#1a73e8]" strokeWidth={2.2} />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
