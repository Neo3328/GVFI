import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { GlassToaster } from "@/components/glass/glass-toast";
import { CRITICAL_THEME_CSS } from "@/lib/critical-theme.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  // Prefer system CJK fonts when Google font glyphs are unavailable offline.
  fallback: ["Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans SC", "sans-serif"],
});

export const metadata: Metadata = {
  title: "GVFI · AI 视频工作站",
  description: "Liquid Glass 风格的 AI 视频补帧与超分控制台",
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
      className={`${inter.variable} ${notoSansSc.variable} dark h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_THEME_CSS }} />
      </head>
      <body className="glass-main-shell flex min-h-full min-h-dvh flex-col overflow-x-hidden font-sans text-base text-[var(--text-normal)]">
        <ThemeProvider>
          {children}
          <GlassToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
