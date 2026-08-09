"use client";

/**
 * GVFI — Process workspace chrome (tabs + persistent upload).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { useEffect } from "react";
import { DashboardKpiRow } from "@/components/dashboard-kpi-row";
import { GlassTabs } from "@/components/glass/glass-tabs";
import { InputPanel } from "@/components/input-panel";
import {
  ProcessWorkspaceProvider,
  useProcessWorkspace,
  type ProcessMode,
} from "@/components/process/process-workspace-context";

function ProcessWorkspaceHeader() {
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
    if (mode === "llm") setMode("local");
  }, [mode, setMode]);

  return (
    <div className="mb-[var(--space-4)] flex flex-col gap-[var(--space-4)]">
      <GlassTabs
        value={mode === "llm" ? "local" : mode}
        onValueChange={(value) => setMode(value as ProcessMode)}
        items={[{ value: "local", label: "本地补帧" }]}
        className="max-w-md"
      />
      <DashboardKpiRow
        serviceReady={serviceReady}
        progress={progress}
        isRendering={isRendering}
        gpuLabel={gpuLabel}
        queueCount={queueCount}
      />
      {/* 上传区固定在视频处理各子页顶部，避免切换分区后“消失” */}
      <InputPanel
        fileName={file?.name ?? ""}
        inputPath={inputPath}
        onFileSelected={(next) => {
          setFile(next);
          if (next) appendTaskLog(`已选择文件：${next.name}`);
        }}
        onInputPathChange={setInputPath}
      />
      <p className="text-[12px] text-[var(--text-muted)]">
        大模型视频分析已迁至{" "}
        <a href="/app/ai" className="text-[var(--accent-cyan)] underline-offset-2 hover:underline">
          AI 工作台
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
