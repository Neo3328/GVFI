/**
 * GVFI — App chrome shell (unified primary nav).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { CopyrightFooter } from "@/components/brand/copyright-footer";
import { APP_NAME } from "@/lib/brand";
import { AppShell } from "@/components/workspace/app-shell";
import { Sidebar } from "@/components/workspace/sidebar";
import { TopBar } from "@/components/workspace/top-bar";
import {
  WORKSPACE_NAV,
  pageSurfaceForPath,
} from "@/components/workspace/workspace-nav";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { cn } from "@/lib/utils";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";

interface WorkspaceShellProps {
  children: React.ReactNode;
}

function MobileNav() {
  const pathname = usePathname();
  const items = WORKSPACE_NAV;

  return (
    <nav
      aria-label="移动端导航"
      className={cn(
        "fixed inset-x-2 bottom-2 z-50 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--glass-border)] lg:hidden",
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
                  "flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-0.5 text-[10px] font-semibold",
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
  const surface = pageSurfaceForPath(pathname);
  const { title, breadcrumbs, status, statusLabel } = useWorkspaceChrome();
  const isDashboard = surface === "dashboard";

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            className="flex"
            items={WORKSPACE_NAV}
            tone="rail"
            iconOnly
            brand={
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-9 items-center justify-center rounded-[11px] border border-[color-mix(in_srgb,#fff_22%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md">
                  <Zap className="size-4 text-[var(--accent)]" aria-hidden />
                </div>
                <span className="hidden text-[10px] font-semibold tracking-wide text-[var(--text-muted)] lg:block">
                  {APP_NAME}
                </span>
              </div>
            }
            footer={
              <div className="hidden px-1 lg:block">
                <CopyrightFooter
                  variant="compact"
                  align="center"
                  className="opacity-70"
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
                    title: "GVFI",
                    subtitle: "专业 AI 视频工作站",
                  }
                : undefined
            }
            status={status}
            statusLabel={statusLabel}
          />
        }
        mainClassName="pb-20 lg:pb-[var(--space-5)]"
      >
        <div
          className={cn(
            "mx-auto w-full",
            surface === "dashboard" && "max-w-[1680px] px-0 py-0",
            surface === "tasks" && "max-w-[1400px]",
            surface === "video" && "max-w-[1600px]",
            surface === "ai" && "max-w-3xl",
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
