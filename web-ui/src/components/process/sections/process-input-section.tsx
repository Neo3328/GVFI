"use client";

/**
 * GVFI — Process input section (preview).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { useProcessWorkspace } from "@/components/process/process-workspace-context";
import { VideoComparisonViewer } from "@/components/workspace/video-comparison-viewer";

export function ProcessInputSection() {
  const { mode, srcBefore, srcAfter, file, inputPath } = useProcessWorkspace();
  const hasSource = Boolean(file || inputPath.trim() || srcBefore);

  if (mode !== "local") {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_55%,transparent)] px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
        AI 大模型模式请在上方完成视频选择后，切换到「设置」填写分析参数并开始。
      </div>
    );
  }

  if (!hasSource) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-[var(--radius-md)] border border-dashed border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_40%,transparent)] px-4 py-10 text-center">
        <p className="text-[15px] font-medium text-[var(--text-strong)]">
          请先在上方添加视频
        </p>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">
          支持拖拽上传，或填写本机绝对路径
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-[var(--space-4)]">
      <VideoComparisonViewer
        srcBefore={srcBefore}
        srcAfter={srcAfter}
        compareMode={srcBefore && srcAfter ? "slider" : "toggle"}
      />
    </div>
  );
}
