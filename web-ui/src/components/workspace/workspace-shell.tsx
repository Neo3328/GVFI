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
  getWorkspaceNav,
  pageSurfaceForPath,
} from "@/components/workspace/workspace-nav";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";

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
  const { title, breadcrumbs, status, statusLabel } = useWorkspaceChrome();
  const isDashboard = surface === "dashboard";

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            className="flex"
            items={nav}
            tone="rail"
            iconOnly
            brand={
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="group relative flex size-10 items-center justify-center rounded-[var(--control-radius)] border border-[color-mix(in_srgb,#fff_28%,transparent)] bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04)_55%,rgba(10,132,255,0.12))] bg-clip-padding shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(10,132,255,0.18)] backdrop-blur-md transition-all duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_16px_rgba(10,132,255,0.28)]">
                  <div className="pointer-events-none absolute inset-0 rounded-[var(--control-radius)] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
                  <Zap className="relative z-[1] size-4 text-[var(--accent)] drop-shadow-[0_0_6px_rgba(10,132,255,0.5)] transition-transform duration-300 group-hover:scale-110" aria-hidden />
                </div>
                <span className="hidden text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)] lg:block">
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
