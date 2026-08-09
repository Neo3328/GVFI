/**
 * GVFI — Video processing workspace (import · preview · run).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassDrawer } from "@/components/glass/glass-drawer";
import { GlassProgress, GlassProgressLabel } from "@/components/glass/glass-progress";
import { InputPanel } from "@/components/input-panel";
import { ParamsPanel } from "@/components/params-panel";
import { PresetPanel } from "@/components/preset-panel";
import { SvfiPanel } from "@/components/svfi-panel";
import { useProcessWorkspace } from "@/components/process/process-workspace-context";
import { VideoComparisonViewer } from "@/components/workspace/video-comparison-viewer";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";

export function VideoWorkspacePage() {
  const ctx = useProcessWorkspace();
  const { setMode } = ctx;
  const { setChrome } = useWorkspaceChrome();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasSource = Boolean(ctx.file || ctx.inputPath.trim() || ctx.srcBefore);
  const progress = Math.min(100, Math.max(0, ctx.progress));

  useEffect(() => {
    setMode("local");
  }, [setMode]);

  useEffect(() => {
    setChrome({
      title: ctx.file?.name || ctx.inputPath.trim() || "视频处理",
      breadcrumbs: [
        { label: "GVFI", href: "/app/dashboard" },
        { label: "视频" },
      ],
      status:
        ctx.serviceReady === false
          ? "offline"
          : ctx.serviceReady
            ? ctx.isRendering
              ? "warning"
              : "online"
            : "idle",
      statusLabel: ctx.stageLabel
        .replace(/^●\s*当前工序：\s*/, "")
        .replace(/^●\s*/, ""),
    });
  }, [
    setChrome,
    ctx.file,
    ctx.inputPath,
    ctx.serviceReady,
    ctx.isRendering,
    ctx.stageLabel,
  ]);

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
      {/* Primary: preview stage */}
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-strong)]">
              视频处理
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">
              导入素材、预览对比，一键启动本地补帧
            </p>
          </div>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => setAdvancedOpen(true)}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            高级参数
          </GlassButton>
        </div>

        <InputPanel
          fileName={ctx.file?.name ?? ""}
          inputPath={ctx.inputPath}
          onFileSelected={(next) => {
            ctx.setFile(next);
            if (next) ctx.appendTaskLog(`已选择文件：${next.name}`);
          }}
          onInputPathChange={ctx.setInputPath}
        />

        {hasSource ? (
          <VideoComparisonViewer
            srcBefore={ctx.srcBefore}
            srcAfter={ctx.srcAfter}
            compareMode={ctx.srcBefore && ctx.srcAfter ? "slider" : "toggle"}
          />
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--glass-border)] px-6 text-center">
            <p className="text-[15px] font-medium text-[var(--text-strong)]">
              添加视频开始处理
            </p>
            <p className="mt-2 max-w-sm text-[13px] text-[var(--text-muted)]">
              拖拽文件或填写本机路径。编码与超分细节在「高级参数」中调整。
            </p>
          </div>
        )}
      </section>

      {/* Secondary: run controls — list, not card stack */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <div className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_calc(var(--glass-opacity)*70%),transparent)] p-4 backdrop-blur-[var(--glass-blur)]">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            运行
          </p>
          <GlassProgressLabel>
            <span className="text-[13px] text-[var(--text-muted)]">进度</span>
            <span className="text-[13px] tabular-nums">{progress}%</span>
          </GlassProgressLabel>
          <GlassProgress
            className="mt-2"
            value={progress}
            ai={ctx.isRendering}
            aria-label="渲染进度"
          />
          <div className="mt-4 flex flex-col gap-2">
            <GlassButton
              type="button"
              variant="primary"
              disabled={!ctx.hasInput || ctx.serviceReady === false || ctx.isRendering}
              onClick={() => {
                void ctx.handleStartLocal();
              }}
            >
              开始补帧
            </GlassButton>
            <GlassButton
              type="button"
              variant="ghost"
              disabled={!ctx.isRendering}
              onClick={() => {
                void ctx.handleStop();
              }}
            >
              停止
            </GlassButton>
          </div>
          {ctx.lastOutputPath && !ctx.lastOutputPath.endsWith(".md") ? (
            <p
              className="mt-3 truncate text-[11px] text-[var(--text-muted)]"
              title={ctx.lastOutputPath}
            >
              输出：{ctx.lastOutputPath}
            </p>
          ) : null}
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
          任务队列与历史请到「任务」页查看。API 在「参数」页。
        </p>
      </aside>

      <GlassDrawer
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        title="高级参数"
        description="补帧模型、超分与预设 — 不影响主流程阅读"
      >
        <div className="flex flex-col gap-5">
          <PresetPanel
            presets={ctx.presets}
            selectedName={ctx.selectedPreset}
            onSelectedNameChange={ctx.setSelectedPreset}
            onApply={ctx.handleApplyPreset}
            onCreate={ctx.handleCreatePreset}
            onSave={ctx.handleSavePreset}
            onDelete={ctx.handleDeletePreset}
          />
          <ParamsPanel
            model={ctx.model}
            fps={ctx.fps}
            resolution={ctx.resolution}
            gpu={ctx.gpu}
            precision={ctx.precision}
            models={ctx.models}
            gpus={ctx.gpus}
            onModelChange={ctx.setModel}
            onFpsChange={ctx.setFps}
            onResolutionChange={ctx.setResolution}
            onGpuChange={ctx.setGpu}
            onPrecisionChange={ctx.setPrecision}
          />
          <SvfiPanel
            superResolution={ctx.superResolution}
            srModel={ctx.srModel}
            quality={ctx.quality}
            onSuperResolutionChange={ctx.setSuperResolution}
            onSrModelChange={ctx.setSrModel}
            onQualityChange={ctx.setQuality}
          />
        </div>
      </GlassDrawer>
    </div>
  );
}
