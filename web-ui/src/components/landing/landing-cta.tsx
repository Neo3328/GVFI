/**
 * GVFI — Marketing landing call-to-action.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { cuteButtonClassName } from "@/components/cute-button";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

export function LandingCta() {
  const t = useT();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="ios-grouped flex flex-col items-center gap-4 px-6 py-10 text-center">
        <h2 className="max-w-md font-heading text-[28px] font-bold tracking-tight">
          {t("landing.cta.title")}
        </h2>
        <p className="max-w-sm text-[17px] leading-relaxed text-muted-foreground">
          {t("landing.cta.desc")}
        </p>
        <Link
          href="/app"
          className={cn(
            cuteButtonClassName,
            "w-full max-w-xs py-3 text-[17px] sm:w-auto sm:px-8"
          )}
        >
          {t("landing.cta.openConsole")}
        </Link>
      </div>
    </section>
  );
}
