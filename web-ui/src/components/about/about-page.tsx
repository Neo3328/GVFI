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
import { useT } from "@/hooks/use-t";
import {
  APP_NAME,
  APP_VERSION,
  DEVELOPER_NAME,
  COPYRIGHT_LINE,
  DEVELOPER_LINE,
  FEEDBACK_EMAIL,
  FEEDBACK_URL,
} from "@/lib/brand";

export function AboutPage() {
  const t = useT();
  const { setChrome } = useWorkspaceChrome();

  useEffect(() => {
    setChrome({
      title: t("about.chromeTitle"),
      breadcrumbs: [
        { label: t("common.app"), href: "/app" },
        { label: t("system.title"), href: "/app/system" },
        { label: t("about.chromeTitle") },
      ],
      status: "idle",
    });
  }, [setChrome, t]);

  useEffect(() => {
    document.title = t("about.metaTitle");
  }, [t]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-4">
      <GlassPanel title={t("about.panelTitle")} padding="lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex size-20 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-3xl font-bold text-[var(--text-strong)]"
            aria-hidden
          >
            G
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-strong)]">{APP_NAME}</h2>
            <p className="mt-1 text-[14px] text-[var(--text-muted)]">
              {t("brand.tagline")}
            </p>
            <p className="mt-2 text-[12px] tabular-nums text-[var(--text-muted)]">
              {t("about.version", { version: APP_VERSION })}
            </p>
          </div>
          <dl className="w-full space-y-3 text-left text-[13px]">
            <div>
              <dt className="glass-field-label">{t("about.developerLabel")}</dt>
              <dd className="mt-0.5 text-[var(--text-strong)]">{DEVELOPER_NAME}</dd>
            </div>
            <div>
              <dt className="glass-field-label">{t("about.copyrightLabel")}</dt>
              <dd className="mt-0.5 text-[var(--text-normal)]">{COPYRIGHT_LINE}</dd>
            </div>
            <div>
              <dt className="glass-field-label">{t("about.creditLabel")}</dt>
              <dd className="mt-0.5 text-[var(--text-normal)]">{DEVELOPER_LINE}</dd>
            </div>
          </dl>
          <CopyrightFooter showAppName={false} variant="stacked" align="center" className="pt-2" />
          <dl className="w-full space-y-3 text-left text-[13px]">
            <div>
              <dt className="glass-field-label">{t("about.feedbackLabel")}</dt>
              <dd className="mt-0.5 text-[var(--text-normal)]">
                <p>{t("about.feedbackHint")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FEEDBACK_EMAIL ? (
                    <a
                      href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
                        `GVFI ${APP_VERSION} feedback`
                      )}`}
                      className="glass-button inline-flex min-h-8 items-center px-3 text-[12px] no-underline"
                    >
                      {t("about.feedbackEmail")}
                    </a>
                  ) : null}
                  {FEEDBACK_URL ? (
                    <a
                      href={FEEDBACK_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-button inline-flex min-h-8 items-center px-3 text-[12px] no-underline"
                    >
                      {t("about.feedbackWeb")}
                    </a>
                  ) : null}
                  <Link
                    href="/app/system"
                    className="glass-button inline-flex min-h-8 items-center px-3 text-[12px] no-underline"
                  >
                    {t("nav.system")}
                  </Link>
                </div>
              </dd>
            </div>
            <div>
              <dt className="glass-field-label">{t("about.upgradeLabel")}</dt>
              <dd className="mt-0.5 text-[var(--text-normal)]">
                {t("about.upgradeHint")}
              </dd>
            </div>
          </dl>
          <nav
            aria-label={t("legal.chromeTitle")}
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-[var(--text-muted)]"
          >
            <Link
              href="/app/settings/legal?tab=privacy"
              className="underline-offset-2 hover:text-[var(--accent)] hover:underline"
            >
              {t("legal.tab.privacy")}
            </Link>
            <Link
              href="/app/settings/legal?tab=terms"
              className="underline-offset-2 hover:text-[var(--accent)] hover:underline"
            >
              {t("legal.tab.terms")}
            </Link>
            <Link
              href="/app/settings/legal?tab=licenses"
              className="underline-offset-2 hover:text-[var(--accent)] hover:underline"
            >
              {t("legal.tab.licenses")}
            </Link>
          </nav>
          <Link
            href="/app"
            className="glass-button inline-flex min-h-9 items-center px-4 text-[13px] no-underline"
          >
            {t("about.backHome")}
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}
