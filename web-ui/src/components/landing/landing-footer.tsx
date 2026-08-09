/**
 * GVFI — Marketing landing footer.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { CopyrightFooter } from "@/components/brand/copyright-footer";
import { useT } from "@/hooks/use-t";
import type { MessageKey } from "@/lib/i18n/types";

const footerLinks: {
  href: string;
  labelKey: MessageKey;
  internal?: boolean;
}[] = [
  { href: "#features", labelKey: "landing.nav.features" },
  { href: "#workflow", labelKey: "landing.nav.workflow" },
  { href: "#pricing", labelKey: "landing.nav.pricing" },
  { href: "/app", labelKey: "landing.nav.console", internal: true },
  {
    href: "/app/settings/about",
    labelKey: "landing.nav.about",
    internal: true,
  },
];

export function LandingFooter() {
  const t = useT();

  return (
    <footer className="mt-auto border-t border-[var(--separator)] bg-transparent">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-heading text-[17px] font-semibold text-[var(--text-strong)]">
            GVFI
          </span>
          <nav
            aria-label={t("landing.nav.footerAria")}
            className="flex flex-wrap gap-4"
          >
            {footerLinks.map((link) =>
              link.internal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="cursor-pointer text-[15px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                >
                  {t(link.labelKey)}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="cursor-pointer text-[15px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                >
                  {t(link.labelKey)}
                </a>
              )
            )}
          </nav>
        </div>
        <CopyrightFooter variant="stacked" align="left" className="opacity-90" />
      </div>
    </footer>
  );
}
