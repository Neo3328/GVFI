/**
 * GVFI — AI Workspace control panel (models / API / tasks).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useState } from"react";
import { ExternalLink, Loader2 } from"lucide-react";
import Link from"next/link";
import { glassTextCaption } from"@/components/glass/glass-styles";
import {
 aiField,
 aiPanelSurface,
 aiSectionTitle,
} from"@/components/ai-workspace/ai-field";
import { useT } from"@/hooks/use-t";
import {
 llmProviderLabel,
 llmTaskLabel,
} from"@/lib/i18n/catalog-labels";
import { cn } from"@/lib/utils";
import { LLM_PROVIDER_PRESETS, LLM_TASK_PRESETS } from"@/lib/llm-types";
import type { LlmProviderId } from"@/lib/llm-types";
import { aiGateway } from"@/services/ai-gateway";
import { useAiModelConfigStore } from"@/stores/ai-model-config-store";
import { useJobStore } from"@/stores/job-store";

export function ControlPanel() {
 const t = useT();
 const cfg = useAiModelConfigStore();
 const [testing, setTesting] = useState(false);
 const [testMsg, setTestMsg] = useState("");
 const [jobMsg, setJobMsg] = useState("");
 const [jobBusy, setJobBusy] = useState(false);
 const activeTask = useJobStore((s) => s.activeTask);

 async function handleTest() {
 setTesting(true);
 setTestMsg("");
 try {
 const result = await aiGateway.testConnection();
 setTestMsg(result.message);
 } catch (err) {
 setTestMsg(err instanceof Error ? err.message : String(err));
 } finally {
 setTesting(false);
 }
 }

 async function handleVideoAnalyze() {
 setJobBusy(true);
 setJobMsg("");
 try {
 const input = window.prompt(t("ai.control.promptPath"));
 if (!input?.trim()) {
 setJobMsg(t("ai.control.cancelled"));
 return;
 }
 const result = await aiGateway.enqueueLlmJob({
 inputPath: input.trim(),
 prompt: cfg.getActivePrompt(),
 maxFrames: cfg.maxFrames,
 });
 setJobMsg(t("ai.control.jobSubmitted", { taskId: result.taskId }));
 } catch (err) {
 setJobMsg(err instanceof Error ? err.message : String(err));
 } finally {
 setJobBusy(false);
 }
 }

 return (
 <aside className={cn(aiPanelSurface,"w-full lg:w-auto")}>
 <div className="glass-scroll min-h-0 flex-1 space-y-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-4">
 <section className="pb-4">
 <h3 className={aiSectionTitle}>{t("ai.control.models")}</h3>
 <p className={cn(glassTextCaption,"mt-1 mb-2.5")}>
 {t("ai.control.current", {
 provider: llmProviderLabel(t, cfg.provider, cfg.provider),
 model: cfg.model,
 })}
 </p>
 <label className="block">
 <span className={glassTextCaption}>{t("ai.control.provider")}</span>
 <select
 value={cfg.provider}
 onChange={(e) => cfg.setProvider(e.target.value as LlmProviderId)}
 className={aiField}
 >
 {LLM_PROVIDER_PRESETS.map((p) => (
 <option key={p.id} value={p.id}>
 {llmProviderLabel(t, p.id, t(p.labelKey))}
 </option>
 ))}
 </select>
 </label>
 <label className="mt-2.5 block">
 <span className={glassTextCaption}>{t("ai.control.modelId")}</span>
 <input
 value={cfg.model}
 onChange={(e) => cfg.setModel(e.target.value)}
 className={aiField}
 />
 </label>
 </section>

 <section className="border-t border-[color-mix(in_srgb,var(--glass-border)_70%,transparent)] py-4">
 <h3 className={aiSectionTitle}>{t("ai.control.api")}</h3>
 <label className="mt-2.5 block">
 <span className={glassTextCaption}>{t("ai.control.baseUrl")}</span>
 <input
 value={cfg.baseUrl}
 onChange={(e) => cfg.setBaseUrl(e.target.value)}
 className={aiField}
 />
 </label>
 <label className="mt-2.5 block">
 <span className={glassTextCaption}>{t("ai.control.endpoint")}</span>
 <input
 value={cfg.endpoint}
 onChange={(e) => cfg.setEndpoint(e.target.value)}
 className={aiField}
 />
 </label>
 <label className="mt-2.5 block">
 <span className={glassTextCaption}>{t("ai.control.apiKey")}</span>
 <input
 type="password"
 value={cfg.apiKey}
 onChange={(e) => cfg.setApiKey(e.target.value)}
 className={aiField}
 />
 </label>
 <div className="mt-2.5 grid grid-cols-2 gap-2.5">
 <label className="block">
 <span className={glassTextCaption}>{t("ai.control.temperature")}</span>
 <input
 type="number"
 step="0.1"
 min={0}
 max={2}
 value={cfg.temperature}
 onChange={(e) => cfg.setTemperature(Number(e.target.value))}
 className={aiField}
 />
 </label>
 <label className="block">
 <span className={glassTextCaption}>{t("ai.control.maxTokens")}</span>
 <input
 type="number"
 min={256}
 value={cfg.maxTokens}
 onChange={(e) => cfg.setMaxTokens(Number(e.target.value))}
 className={aiField}
 />
 </label>
 <label className="block">
 <span className={glassTextCaption}>{t("ai.control.topP")}</span>
 <input
 type="number"
 step="0.05"
 min={0}
 max={1}
 value={cfg.topP}
 onChange={(e) => cfg.setTopP(Number(e.target.value))}
 className={aiField}
 />
 </label>
 <label className="block">
 <span className={glassTextCaption}>{t("ai.control.timeout")}</span>
 <input
 type="number"
 min={5000}
 value={cfg.timeoutMs}
 onChange={(e) => cfg.setTimeoutMs(Number(e.target.value))}
 className={aiField}
 />
 </label>
 </div>
 <button
 type="button"
 onClick={() => void handleTest()}
 disabled={testing}
 className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[11px] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_35%,transparent)] px-2 py-2 text-[12px] font-medium text-[var(--text-strong)] transition-colors hover:bg-[color-mix(in_srgb,var(--bg-2)_55%,transparent)] disabled:opacity-60"
 >
 {testing ? <Loader2 className="size-3.5 animate-spin" /> : null}
 {t("ai.control.test")}
 </button>
 {testMsg ? (
 <p
 className={cn(
"mt-2 text-[11px] leading-snug",
 /成功|success|ok/i.test(testMsg)
 ?"text-[var(--success)]"
 :"text-[var(--text-muted)]"
 )}
 >
 {testMsg}
 </p>
 ) : null}
 </section>

 <section className="border-t border-[color-mix(in_srgb,var(--glass-border)_70%,transparent)] py-4">
 <h3 className={aiSectionTitle}>{t("ai.control.presets")}</h3>
 <select
 value={cfg.taskPreset}
 onChange={(e) =>
 cfg.setTaskPreset(e.target.value as typeof cfg.taskPreset)
 }
 className={cn(aiField,"mt-2.5")}
 >
 {LLM_TASK_PRESETS.map((p) => (
 <option key={p.id} value={p.id}>
 {llmTaskLabel(t, p.id)}
 </option>
 ))}
 </select>
 <label className="mt-2.5 block">
 <span className={glassTextCaption}>{t("ai.control.maxFrames")}</span>
 <input
 type="number"
 min={1}
 max={32}
 value={cfg.maxFrames}
 onChange={(e) => cfg.setMaxFrames(Number(e.target.value))}
 className={aiField}
 />
 </label>
 <button
 type="button"
 disabled={jobBusy}
 onClick={() => void handleVideoAnalyze()}
 className="mt-3 w-full rounded-[11px] bg-[color-mix(in_srgb,var(--accent-cyan)_28%,transparent)] px-2 py-2.5 text-[12px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-cyan)_38%,transparent)] disabled:opacity-60"
 >
 {jobBusy ? t("ai.control.submitting") : t("ai.control.analyze")}
 </button>
 {jobMsg ? (
 <p className={cn(glassTextCaption,"mt-2")}>{jobMsg}</p>
 ) : null}
 </section>

 <section className="border-t border-[color-mix(in_srgb,var(--glass-border)_70%,transparent)] pt-4">
 <h3 className={aiSectionTitle}>{t("ai.control.queue")}</h3>
 <p className={cn(glassTextCaption,"mt-1.5")}>
 {t("ai.control.queueHint")}
 </p>
 {activeTask ? (
 <div className="mt-2.5 rounded-[11px] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-0)_35%,transparent)] px-2.5 py-2 text-[12px]">
 <p className="text-[var(--text-strong)]">{activeTask.stage}</p>
 <p className="text-[var(--text-muted)]">
 {Math.round((activeTask.progress ?? 0) * 100)}% ·{""}
 {activeTask.status}
 </p>
 </div>
 ) : (
 <p className={cn(glassTextCaption,"mt-2.5")}>
 {t("ai.control.noTask")}
 </p>
 )}
 <Link
 href="/app/tasks"
 className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--accent-cyan)] hover:underline"
 >
 {t("ai.control.openTasks")} <ExternalLink className="size-3" />
 </Link>
 </section>
 </div>
 </aside>
 );
}
