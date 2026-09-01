"use client";

/**
 * GVFI — Process input section (preview).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { useProcessWorkspace } from"@/components/process/process-workspace-context";
import { VideoComparisonViewer } from"@/components/workspace/video-comparison-viewer";
import { useT } from"@/hooks/use-t";

export function ProcessInputSection() {
 const t = useT();
 const { mode, srcBefore, srcAfter, file, inputPath } = useProcessWorkspace();
 const hasSource = Boolean(file || inputPath.trim() || srcBefore);

 if (mode !=="local") {
 return (
 <div className="mx-auto w-full max-w-4xl rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_55%,transparent)] px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
 {t("process.input.llmHint")}
 </div>
 );
 }

 if (!hasSource) {
 return (
 <div className="mx-auto w-full max-w-4xl rounded-[var(--radius-md)] border border-dashed border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_40%,transparent)] px-4 py-10 text-center">
 <p className="text-[15px] font-medium text-[var(--text-strong)]">
 {t("process.input.addVideo")}
 </p>
 <p className="mt-2 text-[13px] text-[var(--text-muted)]">
 {t("process.input.addHint")}
 </p>
 </div>
 );
 }

 return (
 <div className="mx-auto flex w-full max-w-4xl flex-col gap-[var(--space-4)]">
 <VideoComparisonViewer
 srcBefore={srcBefore}
 srcAfter={srcAfter}
 compareMode={srcBefore && srcAfter ?"slider" :"toggle"}
 />
 </div>
 );
}
