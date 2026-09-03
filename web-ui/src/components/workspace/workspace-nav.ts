/**
 * GVFI — Primary workspace navigation (information architecture).
 *
 * 图标专项处理：
 *  - 全部使用本地 SVG 图标（@/icons），替代 lucide-react。
 *  - SidebarNavItem.icon 类型改为本地 IconProps 兼容的 React 组件。
 *
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { SidebarNavItem } from "@/components/workspace/sidebar";
import type { TranslateFn } from "@/lib/i18n/t";
import { t as translate } from "@/lib/i18n/t";
import { DEFAULT_LOCALE } from "@/lib/i18n/types";
import {
  HomeIcon,
  ListTodoIcon,
  ClapperboardIcon,
  SparklesIcon,
  SettingsSlidersIcon,
  SystemSettingsIcon,
} from "@/icons";

/** Static nav for non-React callers (defaults to zh-CN labels). Prefer getWorkspaceNav(t). */
export const WORKSPACE_NAV: SidebarNavItem[] = getWorkspaceNav((key) =>
  translate(DEFAULT_LOCALE, key)
);

export function getWorkspaceNav(t: TranslateFn): SidebarNavItem[] {
  return [
    {
      /* 新默认主页入口：侧栏"首页"指向根路由 /app（视频处理工作台） */
      href: "/app",
      label: t("nav.home"),
      icon: HomeIcon,
      ariaLabel: t("nav.homeAria"),
    },
    {
      href: "/app/tasks",
      label: t("nav.tasks"),
      icon: ListTodoIcon,
      ariaLabel: t("nav.tasksAria"),
    },
    {
      href: "/app/video",
      label: t("nav.video"),
      icon: ClapperboardIcon,
      ariaLabel: t("nav.videoAria"),
    },
    {
      href: "/app/ai",
      label: t("nav.ai"),
      icon: SparklesIcon,
      ariaLabel: t("nav.aiAria"),
    },
    {
      href: "/app/settings",
      label: t("nav.settings"),
      icon: SettingsSlidersIcon,
      ariaLabel: t("nav.settingsAria"),
    },
    {
      href: "/app/system",
      label: t("nav.system"),
      icon: SystemSettingsIcon,
      ariaLabel: t("nav.systemAria"),
    },
  ];
}

/** @deprecated kept for redirect helpers */
export const PROCESS_SECTION_NAV: SidebarNavItem[] = [];

export function navItemByHref(
  href: string,
  t?: TranslateFn
): SidebarNavItem | undefined {
  const nav = t ? getWorkspaceNav(t) : WORKSPACE_NAV;
  return nav.find((item) => item.href === href);
}

export function pageTitleForPath(pathname: string, t?: TranslateFn): string {
  const tr = t ?? ((key) => translate(DEFAULT_LOCALE, key));
  const nav = getWorkspaceNav(tr);
  const item = nav.find(
    (navItem) => pathname === navItem.href || pathname.startsWith(`${navItem.href}/`)
  );
  if (item) return item.label;

  if (pathname.startsWith("/app/settings/")) return tr("nav.settings");
  if (pathname.startsWith("/app/process")) return tr("nav.video");
  if (pathname.startsWith("/app/render")) return tr("nav.tasks");
  if (pathname.startsWith("/app/models")) return tr("nav.settings");

  return tr("common.app");
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
  /* 新默认主页路由为 /app：把它视为 video 表面，沿用原 dashboard 的最大宽度 (max-w-4xl) 兼容旧 css */
  if (pathname === "/app" || pathname === "/app/") return "video";
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