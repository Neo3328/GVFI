/**
 * GVFI — App chrome shell (unified primary nav).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CopyrightFooter } from "@/components/brand/copyright-footer";
import { APP_NAME } from "@/lib/brand";
import { AppShell } from "@/components/workspace/app-shell";
import { Sidebar } from "@/components/workspace/sidebar";
import { TopBar } from "@/components/workspace/top-bar";
import {
  getWorkspaceNav,
  pageSurfaceForPath,
} from "@/components/workspace/workspace-nav";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";
import { ZapIcon } from "@/icons";

interface WorkspaceShellProps {
  children: React.ReactNode;
}

function MobileNav() {
  const pathname = usePathname();
  const t = useT();
  const items = getWorkspaceNav(t);

  return (
    <nav
      aria-label={t("nav.mobile")}
      className={cn(
        "fixed inset-x-2 bottom-2 z-50 overflow-hidden rounded-[var(--panel-radius)] border border-[var(--glass-border)] bg-clip-padding lg:hidden",
        "bg-[color-mix(in_srgb,var(--bg-1)_calc(var(--glass-opacity)*88%),transparent)]",
        "shadow-[var(--lg-shadow-glass)]",
        "backdrop-blur-[var(--glass-blur)] backdrop-saturate-[180%]"
      )}
    >
      <ul className="mx-auto flex max-w-lg justify-around gap-0.5 px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-[var(--control-radius)] px-0.5 text-[10px] font-semibold",
                  glassFocusRing,
                  glassMotion,
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-muted)]"
                )}
              >
                {Icon ? <Icon className="size-[18px]" strokeWidth={2.25} aria-hidden /> : null}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const t = useT();
  const nav = getWorkspaceNav(t);
  const surface = pageSurfaceForPath(pathname);
  const chrome = useWorkspaceChrome();
  /* 根路由 /app 是全屏深色工作台（自带竖导航/标题栏/三栏/底栏），
     不再叠加全局 Sidebar / TopBar，避免双导航与右侧挤压。旧主页 /app/dashboard 保持原壳。
     注意：所有 Hook 必须在本 early-return 之前调用，遵守 rules-of-hooks。 */
  const isFullScreenWorkbench = pathname === "/app" || pathname === "/app/";
  if (isFullScreenWorkbench) {
    return <>{children}</>;
  }
  const { title, breadcrumbs, status, statusLabel } = chrome;
  const isDashboard = surface === "dashboard";

  return (
    <>
      <AppShell
              sidebar={
                /* Bug#1 修复：之前 iconOnly=true 会让侧边栏只渲染图标列（截图中 5/7 项无图标无文字）。
                   此处恢复为展开式（图标 + 文字标签），保留原设计系统的间距与样式变量不变。*/
                <Sidebar
                  className="flex"
                  items={nav}
                  tone="rail"
                  iconOnly={false}
                  brand={
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-9 items-center justify-center rounded-[var(--control-radius)] border border-[color-mix(in_srgb,#fff_22%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] bg-clip-padding shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md">
                  <ZapIcon size={16} className="text-[var(--accent)]" aria-hidden />
                </div>
                <span className="hidden text-[10px] font-semibold tracking-wide text-[var(--text-muted)] lg:block">
                  {APP_NAME}
                </span>
              </div>
            }
            footer={
              <div className="hidden w-full px-2 pb-1 lg:block">
                <CopyrightFooter
                  variant="compact"
                  align="center"
                  className="opacity-70 [text-wrap:balance]"
                />
              </div>
            }
          />
        }
        topBar={
          <TopBar
            title={isDashboard ? undefined : title}
            breadcrumbs={isDashboard ? undefined : breadcrumbs}
            greeting={
              isDashboard
                ? {
                    title: t("common.app"),
                    subtitle: t("dashboard.greetingSubtitle"),
                  }
                : undefined
            }
            status={status}
            statusLabel={statusLabel}
          />
        }
        mainClassName={cn(
          "pb-20 lg:pb-[var(--space-5)]",
          surface === "ai" &&
            "flex min-h-0 flex-col overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-[var(--space-4)]"
        )}
      >
        <div
          className={cn(
            "mx-auto w-full",
            surface === "dashboard" && "max-w-[1680px] px-0 py-0",
            surface === "tasks" && "max-w-[1400px]",
            surface === "video" && "max-w-[1600px]",
            surface === "ai" && "flex h-full min-h-0 max-w-[1680px] flex-col",
            surface === "settings" && "max-w-2xl",
            surface === "system" && "max-w-xl",
            surface === "default" && "max-w-4xl"
          )}
        >
          {children}
        </div>
      </AppShell>
      <MobileNav />
    </>
  );
}
