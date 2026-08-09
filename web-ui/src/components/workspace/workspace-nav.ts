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
import type { TranslateFn } from "@/lib/i18n/t";
import { t as translate } from "@/lib/i18n/t";
import { DEFAULT_LOCALE } from "@/lib/i18n/types";

/** Static nav for non-React callers (defaults to zh-CN labels). Prefer getWorkspaceNav(t). */
export const WORKSPACE_NAV: SidebarNavItem[] = getWorkspaceNav((key) =>
  translate(DEFAULT_LOCALE, key)
);

export function getWorkspaceNav(t: TranslateFn): SidebarNavItem[] {
  return [
    {
      href: "/app/dashboard",
      label: t("nav.home"),
      icon: LayoutDashboard,
      ariaLabel: t("nav.homeAria"),
    },
    {
      href: "/app/tasks",
      label: t("nav.tasks"),
      icon: ListTodo,
      ariaLabel: t("nav.tasksAria"),
    },
    {
      href: "/app/video",
      label: t("nav.video"),
      icon: Clapperboard,
      ariaLabel: t("nav.videoAria"),
    },
    {
      href: "/app/ai",
      label: t("nav.ai"),
      icon: Sparkles,
      ariaLabel: t("nav.aiAria"),
    },
    {
      href: "/app/settings",
      label: t("nav.settings"),
      icon: SlidersHorizontal,
      ariaLabel: t("nav.settingsAria"),
    },
    {
      href: "/app/system",
      label: t("nav.system"),
      icon: Settings2,
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
