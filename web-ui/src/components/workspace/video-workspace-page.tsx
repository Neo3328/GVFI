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
import { LogsPanel } from "@/components/logs-panel";
import { useProcessWorkspace } from "@/components/process/process-workspace-context";
import { VideoComparisonViewer } from "@/components/workspace/video-comparison-viewer";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { useT } from "@/hooks/use-t";
import { stripStagePrefix } from "@/lib/gvfi-api";

export function VideoWorkspacePage() {
  const t = useT();
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
      title: ctx.file?.name || ctx.inputPath.trim() || t("video.title"),
      breadcrumbs: [
        { label: t("common.app"), href: "/app/dashboard" },
        { label: t("video.crumb") },
      ],
      status:
        ctx.serviceReady === false
          ? "offline"
          : ctx.serviceReady
            ? ctx.isRendering
              ? "warning"
              : "online"
            : "idle",
      statusLabel: stripStagePrefix(ctx.stageLabel),
    });
  }, [
    setChrome,
    ctx.file,
    ctx.inputPath,
    ctx.serviceReady,
    ctx.isRendering,
    ctx.stageLabel,
    t,
  ]);

  return (
    <div className="workspace-split flex flex-col">
      {/* Primary: preview stage */}
      <section className="workspace-panel flex min-w-0 flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-strong)]">
              {t("video.title")}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">
              {t("video.subtitle")}
            </p>
          </div>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => setAdvancedOpen(true)}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            {t("video.advanced")}
          </GlassButton>
        </div>

        <InputPanel
          fileName={ctx.file?.name ?? ""}
          inputPath={ctx.inputPath}
          onFileSelected={(next) => {
            ctx.setFile(next);
            if (next) ctx.appendTaskLog(t("video.fileSelected", { name: next.name }));
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
          <div className="flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-[var(--panel-radius)] border border-dashed border-[var(--glass-border)] bg-clip-padding px-6 text-center">
            <p className="text-[15px] font-medium text-[var(--text-strong)]">
              {t("video.emptyTitle")}
            </p>
            <p className="mt-2 max-w-sm text-[13px] text-[var(--text-muted)]">
              {t("video.emptyHint")}
            </p>
          </div>
        )}
      </section>

      {/* Secondary: run controls + error logs */}
      <aside className="workspace-sticky-aside flex flex-col gap-4">
        <div className="workspace-panel overflow-hidden rounded-[var(--panel-radius)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_calc(var(--glass-opacity)*70%),transparent)] bg-clip-padding p-4 backdrop-blur-[var(--glass-blur)]">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("video.run")}
          </p>
          <GlassProgressLabel>
            <span className="text-[13px] text-[var(--text-muted)]">{t("video.progress")}</span>
            <span className="text-[13px] tabular-nums">{progress}%</span>
          </GlassProgressLabel>
          <GlassProgress
            className="mt-2"
            value={progress}
            ai={ctx.isRendering}
            aria-label={t("video.progressAria")}
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
              {t("video.start")}
            </GlassButton>
            <GlassButton
              type="button"
              variant="ghost"
              disabled={!ctx.isRendering}
              onClick={() => {
                void ctx.handleStop();
              }}
            >
              {t("video.stop")}
            </GlassButton>
          </div>
          {ctx.lastOutputPath && !ctx.lastOutputPath.endsWith(".md") ? (
            <p
              className="mt-3 truncate text-[11px] text-[var(--text-muted)]"
              title={ctx.lastOutputPath}
            >
              {t("video.output", { path: ctx.lastOutputPath })}
            </p>
          ) : null}
        </div>
        <LogsPanel
          compact
          taskLogs={ctx.taskLogs}
          errorLogs={ctx.errorLogs}
        />
        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
          {t("video.footerHint")}
        </p>
      </aside>

      <GlassDrawer
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        title={t("video.advanced")}
        description={t("video.advancedDesc")}
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
