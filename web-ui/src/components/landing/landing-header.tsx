/**
 * GVFI — Landing header (glass chrome + desktop drag region).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { cuteButtonClassName } from "@/components/cute-button";
import { WindowControls } from "@/components/workspace/window-controls";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const t = useT();
  const navLinks = [
    { href: "#features", label: t("landing.nav.features") },
    { href: "#workflow", label: t("landing.nav.workflow") },
    { href: "#pricing", label: t("landing.nav.pricing") },
  ];

  return (
    <header
      data-slot="top-bar"
      className="app-titlebar-drag ios-blur-bar sticky top-0 z-50"
    >
      <div className="ios-safe-top mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="app-titlebar-no-drag font-heading text-[17px] font-semibold text-foreground"
        >
          GVFI
        </Link>

        <nav
          aria-label={t("landing.nav.primaryAria")}
          className="app-titlebar-no-drag hidden items-center gap-6 md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="cursor-pointer text-[15px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="app-titlebar-no-drag flex items-center gap-2">
          <Link
            href="/app"
            className={cn(cuteButtonClassName, "px-4 py-2 text-[15px]")}
          >
            {t("landing.header.openApp")}
          </Link>
          <WindowControls />
        </div>
      </div>
    </header>
  );
}
