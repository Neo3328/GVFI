/**
 * GVFI — Process run section (local render + AI report view).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { ActionPanel } from"@/components/action-panel";
import { OutputPanel } from"@/components/output-panel";
import { AnalysisReportPanel } from"@/components/process/analysis-report-panel";
import { useProcessWorkspace } from"@/components/process/process-workspace-context";

export function ProcessRunSection() {
 const ctx = useProcessWorkspace();

 if (ctx.mode ==="llm") {
 return (
 <div className="mx-auto flex w-full max-w-4xl flex-col gap-[var(--space-4)]">
 <AnalysisReportPanel reportPath={ctx.lastReportPath} />
 <OutputPanel
 outputDir={ctx.outputDir}
 lastOutputPath={ctx.lastReportPath}
 />
 </div>
 );
 }

 return (
 <div className="mx-auto flex w-full max-w-4xl flex-col gap-[var(--space-4)]">
 <OutputPanel
 outputDir={ctx.outputDir}
 lastOutputPath={ctx.lastOutputPath}
 />
 <ActionPanel
 progress={ctx.progress}
 isRendering={ctx.isRendering}
 canStart={ctx.hasInput && ctx.serviceReady !== false}
 onStart={() => {
 void ctx.handleStartLocal();
 }}
 onStop={() => {
 void ctx.handleStop();
 }}
 />
 </div>
 );
}
