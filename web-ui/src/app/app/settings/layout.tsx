/**
 * GVFI — Settings section layout with copyright footer.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { CopyrightFooter } from "@/components/brand/copyright-footer";
import { useT } from "@/hooks/use-t";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT();

  return (
    <div className="flex min-h-[60vh] flex-col gap-6">
      {children}
      <div className="mt-auto border-t border-[var(--glass-border)] pt-4">
        <CopyrightFooter variant="stacked" align="center" className="opacity-90" />
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[10px] text-[var(--text-muted)]">
          <Link
            href="/app/settings/about"
            className="underline-offset-2 hover:text-[var(--accent)] hover:underline"
          >
            {t("settings.aboutLink")}
          </Link>
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
        </p>
      </div>
    </div>
  );
}
