/**
 * GVFI — About page.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CopyrightFooter } from "@/components/brand/copyright-footer";
import { GlassPanel } from "@/components/glass/glass-card";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import {
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
  DEVELOPER_NAME,
  COPYRIGHT_LINE,
  DEVELOPER_LINE,
} from "@/lib/brand";

export function AboutPage() {
  const { setChrome } = useWorkspaceChrome();

  useEffect(() => {
    setChrome({
      title: "关于",
      breadcrumbs: [
        { label: "GVFI", href: "/app/dashboard" },
        { label: "系统", href: "/app/system" },
        { label: "关于" },
      ],
      status: "idle",
    });
  }, [setChrome]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-4">
      <GlassPanel title="关于 GVFI" padding="lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex size-20 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-3xl font-bold text-[var(--text-strong)]"
            aria-hidden
          >
            G
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-strong)]">{APP_NAME}</h2>
            <p className="mt-1 text-[14px] text-[var(--text-muted)]">{APP_TAGLINE}</p>
            <p className="mt-2 text-[12px] tabular-nums text-[var(--text-muted)]">
              版本 {APP_VERSION}
            </p>
          </div>
          <dl className="w-full space-y-3 text-left text-[13px]">
            <div>
              <dt className="glass-field-label">开发者</dt>
              <dd className="mt-0.5 text-[var(--text-strong)]">{DEVELOPER_NAME}</dd>
            </div>
            <div>
              <dt className="glass-field-label">版权</dt>
              <dd className="mt-0.5 text-[var(--text-normal)]">{COPYRIGHT_LINE}</dd>
            </div>
            <div>
              <dt className="glass-field-label">署名</dt>
              <dd className="mt-0.5 text-[var(--text-normal)]">{DEVELOPER_LINE}</dd>
            </div>
          </dl>
          <CopyrightFooter showAppName={false} variant="stacked" align="center" className="pt-2" />
          <Link
            href="/app/dashboard"
            className="glass-button inline-flex min-h-9 items-center px-4 text-[13px] no-underline"
          >
            返回首页
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}
