/**
 * GVFI — Theme / wallpaper provider (Liquid Glass over custom BG).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect } from"react";
import { useAppearanceStore } from"@/stores/appearance-store";
import { useLocaleStore } from"@/stores/locale-store";
import { themeDefaultBackgroundStyle } from"@/lib/apply-appearance";
import { t } from"@/lib/i18n/t";
import { getDesktopBridge } from"@/lib/desktop";
import { WindowChromeSync } from"@/components/workspace/window-chrome-sync";

function LocaleSync() {
 const locale = useLocaleStore((s) => s.locale);
 const syncHtmlLang = useLocaleStore((s) => s.syncHtmlLang);

 useEffect(() => {
 syncHtmlLang();
 document.title = t(locale,"chrome.documentTitle");
 try {
 document.documentElement.dataset.locale = locale;
 } catch {
 /* ignore */
 }
 const desktop = getDesktopBridge();
 if (desktop?.setLocale) {
 void desktop.setLocale(locale);
 }
 }, [locale, syncHtmlLang]);

 return null;
}

function cssBackgroundImage(url: string): string {
 /* JSON.stringify wraps quotes + escapes — safe for data: URLs */
 return `url(${JSON.stringify(url)})`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
 const theme = useAppearanceStore((s) => s.theme);
 const glass = useAppearanceStore((s) => s.glass);
 const background = useAppearanceStore((s) => s.background);
 const setTheme = useAppearanceStore((s) => s.setTheme);
 const apply = useAppearanceStore((s) => s.apply);
 const hydrateFromPyQt = useAppearanceStore((s) => s.hydrateFromPyQt);

 useEffect(() => {
 apply();
 void hydrateFromPyQt();
 }, [apply, hydrateFromPyQt]);

 useEffect(() => {
 apply();
 }, [theme, glass, background, apply]);

 const imageUrl =
 theme ==="image" && background.customUrl ? background.customUrl : null;
 const hasImageBg = Boolean(imageUrl);

 useEffect(() => {
 if (theme ==="image" && !background.customUrl) {
 setTheme("dark");
 }
 }, [theme, background.customUrl, setTheme]);

 useEffect(() => {
 if (!imageUrl) return;
 const probe = new Image();
 probe.onerror = () => {
 useAppearanceStore.getState().resetBackground();
 };
 probe.src = imageUrl;
 }, [imageUrl]);

 const atmosphere = themeDefaultBackgroundStyle(
 theme ==="image" ?"dark" : theme
 );

 return (
 <>
 <WindowChromeSync />
 <div data-slot="window-frame" className="gvfi-window-frame">
 {/* Theme default wash — never blank white */}
 <div
 aria-hidden
 className="gvfi-window-atmosphere"
 style={{
 background: atmosphere,
 backgroundColor: theme ==="light" ?"#6b7488" :"#0b0d12",
 }}
 />
 {hasImageBg && imageUrl ? (
 <div
 id="lg-background-layer"
 aria-hidden
 className="gvfi-window-atmosphere"
 style={{
 backgroundColor:"transparent",
 backgroundImage: cssBackgroundImage(imageUrl),
 backgroundSize:"cover",
 backgroundPosition:"center",
 backgroundRepeat:"no-repeat",
 }}
 />
 ) : (
 <div id="lg-background-layer" aria-hidden className="gvfi-window-atmosphere" />
 )}
 {hasImageBg ? (
 <div
 aria-hidden
 className="gvfi-window-atmosphere"
 style={{
 background:
"linear-gradient(180deg, rgba(11,13,18,0.42) 0%, rgba(11,13,18,0.18) 46%, rgba(11,13,18,0.48) 100%)",
 }}
 />
 ) : null}
 <div className="relative z-[1] flex min-h-dvh flex-1 flex-col bg-transparent">
 <LocaleSync />
 {children}
 </div>
 </div>
 </>
 );
}
