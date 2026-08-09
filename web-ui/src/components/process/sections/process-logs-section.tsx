/**
 * GVFI — Process logs section.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { AppearancePanel } from "@/components/appearance-panel";
import { LogsPanel } from "@/components/logs-panel";
import { AnalysisReportPanel } from "@/components/process/analysis-report-panel";
import { useProcessWorkspace } from "@/components/process/process-workspace-context";

export function ProcessLogsSection() {
  const {
    mode,
    taskLogs,
    errorLogs,
    appendTaskLog,
    lastReportPath,
  } = useProcessWorkspace();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-[var(--space-4)]">
      {mode === "local" ? <AppearancePanel onLog={appendTaskLog} /> : null}
      {mode === "llm" && lastReportPath ? (
        <AnalysisReportPanel reportPath={lastReportPath} compact />
      ) : null}
      <LogsPanel taskLogs={taskLogs} errorLogs={errorLogs} />
    </div>
  );
}
