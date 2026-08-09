/**
 * GVFI — Settings section layout with copyright footer.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import Link from "next/link";
import { CopyrightFooter } from "@/components/brand/copyright-footer";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col gap-6">
      {children}
      <div className="mt-auto border-t border-[var(--glass-border)] pt-4">
        <CopyrightFooter variant="stacked" align="center" className="opacity-90" />
        <p className="mt-2 text-center text-[10px] text-[var(--text-muted)]">
          <Link
            href="/app/settings/about"
            className="underline-offset-2 hover:text-[var(--accent)] hover:underline"
          >
            关于 GVFI
          </Link>
        </p>
      </div>
    </div>
  );
}
