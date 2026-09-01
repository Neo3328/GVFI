/**
 * GVFI — Connection settings hub (API profiles + LLM).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect } from"react";
import { ApiSettingsPanel } from"@/components/settings/api-settings-panel";
import { ApiProfilesPanel } from"@/components/settings/api-profiles-panel";
import { ApiQuickConnect } from"@/components/settings/api-quick-connect";
import { useWorkspaceChrome } from"@/components/workspace/workspace-chrome-context";
import { useT } from"@/hooks/use-t";

export function SettingsHubPage() {
 const t = useT();
 const { setChrome } = useWorkspaceChrome();

 useEffect(() => {
 setChrome({
 title: t("settings.title"),
 breadcrumbs: [
 { label: t("common.app"), href:"/app/dashboard" },
 { label: t("settings.crumb") },
 ],
 status:"idle",
 });
 }, [setChrome, t]);

 return (
 <div className="flex flex-col gap-6">
 <header>
 <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-strong)]">
 {t("settings.title")}
 </h1>
 <p className="mt-1 text-[13px] text-[var(--text-muted)]">
 {t("settings.subtitle")}
 </p>
 </header>
 <ApiQuickConnect />
 <ApiProfilesPanel />
 <ApiSettingsPanel />
 </div>
 );
}
