/**
 * GVFI — Root layout (global font / theme / i18n shell).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { DisplayProvider } from "@/components/display/display-provider";
import { PersistHydration } from "@/components/persist-hydration";
import { GlassToaster } from "@/components/glass/glass-toast";
import { CRITICAL_THEME_CSS } from "@/lib/critical-theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "GVFI",
  description: "GVFI AI Video Workstation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-theme="dark"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_THEME_CSS }} />
      </head>
      <body className="glass-main-shell flex min-h-full min-h-dvh flex-col overflow-x-hidden font-sans text-[var(--text-normal)]">
        <PersistHydration>
          <ThemeProvider>
            <DisplayProvider>
              {children}
              <GlassToaster />
            </DisplayProvider>
          </ThemeProvider>
        </PersistHydration>
      </body>
    </html>
  );
}
