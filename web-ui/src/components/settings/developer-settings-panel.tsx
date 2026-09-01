/**
 * GVFI — Developer / plugin / diagnostics settings.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useState } from"react";
import { GlassButton } from"@/components/glass/glass-button";
import { GlassPanel } from"@/components/glass/glass-card";
import { useT } from"@/hooks/use-t";
import { getPlugins } from"@/plugins/registry";
import {
 clearClientLogs,
 getClientLogs,
 type ClientLogEntry,
} from"@/lib/client-log";
import { getActiveApiBase, getActiveDirectOrigin } from"@/lib/api-client";
import { useApiConfigStore } from"@/services/api-config-store";

export function DeveloperSettingsPanel() {
 const t = useT();
 const [logs, setLogs] = useState<ClientLogEntry[]>(() => [...getClientLogs()]);
 const plugins = getPlugins();
 const profiles = useApiConfigStore((s) => s.profiles);
 const activeId = useApiConfigStore((s) => s.activeProfileId);

 return (
 <div className="flex flex-col gap-5">
 <GlassPanel
 title={t("settings.developer.runtimeTitle")}
 description={t("settings.developer.runtimeDesc")}
 >
 <ul className="space-y-2 text-[12px] text-[var(--text-muted)]">
 <li>
 {t("settings.developer.activeBase")}
 <code className="ml-1 text-[var(--text-strong)]">{getActiveApiBase()}</code>
 </li>
 <li>
 {t("settings.developer.directOrigin")}
 <code className="ml-1 text-[var(--text-strong)]">
 {getActiveDirectOrigin()}
 </code>
 </li>
 <li>
 {t("settings.developer.profileCount", {
 count: profiles.length,
 id: activeId ?? t("common.emDash"),
 })}
 </li>
 <li>
 {t("settings.developer.desktopLog")}
 <code className="ml-1 text-[var(--text-strong)]">
 %APPDATA%\gvfi-desktop\gvfi-desktop.log
 </code>
 </li>
 </ul>
 <div className="mt-3 flex gap-2">
 <GlassButton
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => setLogs([...getClientLogs()])}
 >
 {t("settings.developer.refreshLogs")}
 </GlassButton>
 <GlassButton
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => {
 clearClientLogs();
 setLogs([]);
 }}
 >
 {t("settings.developer.clear")}
 </GlassButton>
 </div>
 <pre className="mt-3 max-h-48 overflow-auto rounded-[12px] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-fill)_22%,transparent)] p-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
 {logs.length === 0
 ? t("settings.developer.noLogs")
 : logs
 .slice(-80)
 .map(
 (e) =>
 `${e.ts} [${e.level}] [${e.scope}] ${e.message}`
 )
 .join("\n")}
 </pre>
 </GlassPanel>

 <GlassPanel
 title={t("settings.developer.pluginsTitle")}
 description={t("settings.developer.pluginsDesc")}
 >
 {plugins.length === 0 ? (
 <p className="text-[13px] text-[var(--text-muted)]">
 {t("settings.developer.noPlugins")}
 </p>
 ) : (
 <ul className="flex flex-col gap-2">
 {plugins.map((plugin) => (
 <li
 key={plugin.id}
 className="rounded-[12px] border border-[var(--glass-border)] px-3 py-2"
 >
 <p className="text-[13px] font-semibold text-[var(--text-strong)]">
 {plugin.name}{""}
 <span className="text-[11px] font-normal text-[var(--text-muted)]">
 v{plugin.version}
 </span>
 </p>
 <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
 {plugin.id}
 {plugin.description ? ` — ${plugin.description}` :""}
 </p>
 <p className="mt-1 text-[11px] text-[var(--text-muted)]">
 {[
 plugin.renderBackend
 ? t("settings.developer.renderBackend", {
 id: plugin.renderBackend.id,
 })
 : null,
 plugin.models?.length
 ? t("settings.developer.modelPlugins", {
 count: plugin.models.length,
 })
 : null,
 plugin.uiPanels?.length
 ? t("settings.developer.panels", {
 count: plugin.uiPanels.length,
 })
 : null,
 ]
 .filter(Boolean)
 .join(" ·") || t("settings.developer.noExtensions")}
 </p>
 </li>
 ))}
 </ul>
 )}
 </GlassPanel>
 </div>
 );
}
