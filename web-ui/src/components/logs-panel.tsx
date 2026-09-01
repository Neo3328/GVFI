/**
 * GVFI — Task / error log panel with copy + AI handoff.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useRouter } from"next/navigation";
import { useState } from"react";
import { Check, Copy, Sparkles } from"lucide-react";
import { SectionCard } from"@/components/section-card";
import { GlassLogViewer } from"@/components/glass/glass-log-viewer";
import { GlassButton } from"@/components/glass/glass-button";
import { useT } from"@/hooks/use-t";
import {
 joinLogLines,
 stashErrorLogForAi,
} from"@/lib/error-log-bridge";

interface LogsPanelProps {
 taskLogs: string[];
 errorLogs: string[];
 /** Compact dock for video/tasks pages */
 compact?: boolean;
}

export function LogsPanel({
 taskLogs,
 errorLogs,
 compact = false,
}: LogsPanelProps) {
 const t = useT();
 const router = useRouter();
 const [copied, setCopied] = useState<"error" |"task" | null>(null);

 async function copyText(kind:"error" |"task", lines: string[]) {
 const text = joinLogLines(lines);
 if (!text.trim()) return;
 try {
 await navigator.clipboard.writeText(text);
 setCopied(kind);
 window.setTimeout(() => setCopied(null), 1600);
 } catch {
 /* fallback */
 const ta = document.createElement("textarea");
 ta.value = text;
 ta.setAttribute("readonly","");
 ta.style.position ="fixed";
 ta.style.left ="-9999px";
 document.body.appendChild(ta);
 ta.select();
 document.execCommand("copy");
 document.body.removeChild(ta);
 setCopied(kind);
 window.setTimeout(() => setCopied(null), 1600);
 }
 }

 function sendErrorsToAi() {
 const text = joinLogLines(errorLogs);
 if (!text.trim()) return;
 stashErrorLogForAi(text);
 router.push("/app/ai");
 }

 const body = (
 <div className="flex flex-col gap-3 py-1">
 {!compact ? (
 <div className="min-w-0">
 <div className="mb-1.5 flex items-center justify-between gap-2">
 <h3 className="text-[13px] font-medium text-[var(--text-strong)]">
 {t("tasks.logs.feedback")}
 </h3>
 <GlassButton
 type="button"
 variant="ghost"
 size="xs"
 disabled={taskLogs.length === 0}
 onClick={() => void copyText("task", taskLogs)}
 >
 {copied ==="task" ? (
 <Check className="size-3.5" aria-hidden />
 ) : (
 <Copy className="size-3.5" aria-hidden />
 )}
 {t("tasks.logs.copy")}
 </GlassButton>
 </div>
 <GlassLogViewer lines={taskLogs} variant="task" maxHeight={160} />
 </div>
 ) : null}

 <div className="min-w-0">
 <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
 <h3 className="text-[13px] font-semibold text-[var(--danger)]">
 {t("tasks.logs.errors")}
 </h3>
 <div className="flex flex-wrap gap-1.5">
 <GlassButton
 type="button"
 variant="ghost"
 size="xs"
 disabled={errorLogs.length === 0}
 onClick={() => void copyText("error", errorLogs)}
 aria-label={t("tasks.logs.copyAllAria")}
 >
 {copied ==="error" ? (
 <Check className="size-3.5" aria-hidden />
 ) : (
 <Copy className="size-3.5" aria-hidden />
 )}
 {t("tasks.logs.copyAll")}
 </GlassButton>
 <GlassButton
 type="button"
 variant="ai"
 size="xs"
 disabled={errorLogs.length === 0}
 onClick={sendErrorsToAi}
 aria-label={t("tasks.logs.feedAiAria")}
 >
 <Sparkles className="size-3.5" aria-hidden />
 {t("tasks.logs.feedAi")}
 </GlassButton>
 </div>
 </div>
 <GlassLogViewer
 lines={errorLogs}
 variant="error"
 maxHeight={compact ? 180 : 220}
 />
 <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
 {t("tasks.logs.feedHint")}
 </p>
 </div>
 </div>
 );

 if (compact) {
 return (
 <div className="workspace-panel overflow-hidden rounded-[var(--panel-radius)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_calc(var(--glass-opacity)*70%),transparent)] bg-clip-padding p-3">
 <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
 {t("tasks.logs.errors")}
 </p>
 {body}
 </div>
 );
 }

 return <SectionCard title={t("tasks.logs.title")}>{body}</SectionCard>;
}
