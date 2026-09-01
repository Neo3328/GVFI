"use client";

/**
 * GVFI — Process workspace chrome (tabs + persistent upload).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { useEffect } from"react";
import { DashboardKpiRow } from"@/components/dashboard-kpi-row";
import { GlassTabs } from"@/components/glass/glass-tabs";
import { InputPanel } from"@/components/input-panel";
import {
 ProcessWorkspaceProvider,
 useProcessWorkspace,
 type ProcessMode,
} from"@/components/process/process-workspace-context";
import { useT } from"@/hooks/use-t";

function ProcessWorkspaceHeader() {
 const t = useT();
 const {
 mode,
 setMode,
 serviceReady,
 progress,
 isRendering,
 gpuLabel,
 queueCount,
 file,
 inputPath,
 setFile,
 setInputPath,
 appendTaskLog,
 } = useProcessWorkspace();

 useEffect(() => {
 if (mode ==="llm") setMode("local");
 }, [mode, setMode]);

 return (
 <div className="mb-[var(--space-4)] flex flex-col gap-[var(--space-4)]">
 <GlassTabs
 value={mode ==="llm" ?"local" : mode}
 onValueChange={(value) => setMode(value as ProcessMode)}
 items={[{ value:"local", label: t("process.mode.local") }]}
 className="max-w-md"
 />
 <DashboardKpiRow
 serviceReady={serviceReady}
 progress={progress}
 isRendering={isRendering}
 gpuLabel={gpuLabel}
 queueCount={queueCount}
 />
 {/* Upload stays pinned across process sub-routes so it does not disappear on tab change */}
 <InputPanel
 fileName={file?.name ??""}
 inputPath={inputPath}
 onFileSelected={(next) => {
 setFile(next);
 if (next) appendTaskLog(t("video.fileSelected", { name: next.name }));
 }}
 onInputPathChange={setInputPath}
 />
 <p className="text-[12px] text-[var(--text-muted)]">
 {t("process.llmMovedBefore")}{""}
 <a href="/app/ai" className="text-[var(--accent-cyan)] underline-offset-2 hover:underline">
 {t("process.llmMovedLink")}
 </a>
 </p>
 </div>
 );
}

export function ProcessWorkspaceLayout({ children }: { children: React.ReactNode }) {
 return (
 <ProcessWorkspaceProvider>
 <div className="relative flex flex-1 flex-col">
 <ProcessWorkspaceHeader />
 {children}
 </div>
 </ProcessWorkspaceProvider>
 );
}
