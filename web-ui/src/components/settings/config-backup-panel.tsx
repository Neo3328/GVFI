"use client";

import { useRef, useState } from"react";
import { Download, ShieldCheck, Upload } from"lucide-react";
import { GlassButton } from"@/components/glass/glass-button";
import { GlassPanel } from"@/components/glass/glass-card";
import { useT } from"@/hooks/use-t";
import { applyConfigBackup, createConfigBackup, parseConfigBackup } from"@/lib/config-backup";

export function ConfigBackupPanel() {
 const t = useT();
 const inputRef = useRef<HTMLInputElement>(null);
 const [includeSecrets, setIncludeSecrets] = useState(false);
 const [status, setStatus] = useState<string | null>(null);

 function exportConfig() {
 const blob = new Blob([JSON.stringify(createConfigBackup(includeSecrets), null, 2)], { type:"application/json" });
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 anchor.href = url;
 anchor.download = `gvfi-config-${new Date().toISOString().slice(0, 10)}.json`;
 anchor.click();
 URL.revokeObjectURL(url);
 setStatus(t("system.backup.exported"));
 }

 async function importConfig(file: File) {
 try {
 applyConfigBackup(parseConfigBackup(await file.text()));
 setStatus(t("system.backup.imported"));
 } catch {
 setStatus(t("system.backup.invalid"));
 }
 }

 return (
 <GlassPanel title={t("system.backup.title")} description={t("system.backup.desc")}>
 <div className="flex items-start gap-2 rounded-[12px] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-fill)_22%,transparent)] p-3 text-[12px] text-[var(--text-muted)]">
 <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--accent-cyan)]" />
 <span>{t("system.backup.security")}</span>
 </div>
 <label className="mt-4 flex items-center gap-2 text-[12px] text-[var(--text-strong)]">
 <input type="checkbox" checked={includeSecrets} onChange={(event) => setIncludeSecrets(event.target.checked)} />
 {t("system.backup.includeSecrets")}
 </label>
 <div className="mt-4 flex flex-wrap gap-2">
 <GlassButton type="button" size="sm" onClick={exportConfig}><Download className="size-3.5" />{t("system.backup.export")}</GlassButton>
 <GlassButton type="button" size="sm" variant="ghost" onClick={() => inputRef.current?.click()}><Upload className="size-3.5" />{t("system.backup.import")}</GlassButton>
 <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importConfig(file); event.target.value =""; }} />
 </div>
 {status ? <p role="status" className="mt-3 text-[12px] text-[var(--text-muted)]">{status}</p> : null}
 </GlassPanel>
 );
}
