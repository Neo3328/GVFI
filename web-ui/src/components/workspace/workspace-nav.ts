/**
 * GVFI — Primary workspace navigation (information architecture).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import {
  Clapperboard,
  LayoutDashboard,
  ListTodo,
  Settings2,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import type { SidebarNavItem } from "@/components/workspace/sidebar";

/** Top-level app sections — one responsibility each */
export const WORKSPACE_NAV: SidebarNavItem[] = [
  {
    href: "/app/dashboard",
    label: "首页",
    icon: LayoutDashboard,
    ariaLabel: "首页仪表盘",
  },
  {
    href: "/app/tasks",
    label: "任务",
    icon: ListTodo,
    ariaLabel: "任务管理",
  },
  {
    href: "/app/video",
    label: "视频",
    icon: Clapperboard,
    ariaLabel: "视频处理",
  },
  {
    href: "/app/ai",
    label: "AI 工作台",
    icon: Sparkles,
    ariaLabel: "AI 工作台",
  },
  {
    href: "/app/settings",
    label: "连接",
    icon: SlidersHorizontal,
    ariaLabel: "连接设置",
  },
  {
    href: "/app/system",
    label: "系统",
    icon: Settings2,
    ariaLabel: "系统设置",
  },
];

/** @deprecated kept for redirect helpers */
export const PROCESS_SECTION_NAV: SidebarNavItem[] = [];

export function navItemByHref(href: string): SidebarNavItem | undefined {
  return WORKSPACE_NAV.find((item) => item.href === href);
}

export function pageTitleForPath(pathname: string): string {
  const item = WORKSPACE_NAV.find(
    (nav) => pathname === nav.href || pathname.startsWith(`${nav.href}/`)
  );
  if (item) return item.label;

  if (pathname.startsWith("/app/settings/")) return "连接";
  if (pathname.startsWith("/app/process")) return "视频";
  if (pathname.startsWith("/app/render")) return "任务";
  if (pathname.startsWith("/app/models")) return "连接";

  return "GVFI";
}

/** Surface chrome variant for WorkspaceShell */
export type PageSurface =
  | "dashboard"
  | "tasks"
  | "video"
  | "ai"
  | "settings"
  | "system"
  | "default";

export function pageSurfaceForPath(pathname: string): PageSurface {
  if (pathname.startsWith("/app/dashboard")) return "dashboard";
  if (pathname.startsWith("/app/tasks") || pathname.startsWith("/app/render"))
    return "tasks";
  if (pathname.startsWith("/app/video") || pathname.startsWith("/app/process"))
    return "video";
  if (pathname.startsWith("/app/ai")) return "ai";
  if (
    pathname.startsWith("/app/settings") ||
    pathname.startsWith("/app/models")
  )
    return "settings";
  if (pathname.startsWith("/app/system")) return "system";
  return "default";
}
