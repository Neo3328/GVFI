"use client";

import { ParamsPanel } from"@/components/params-panel";
import { PresetPanel } from"@/components/preset-panel";
import { SvfiPanel } from"@/components/svfi-panel";
import { LlmVideoPanel } from"@/components/process/llm-video-panel";
import { useProcessWorkspace } from"@/components/process/process-workspace-context";
import { GlassTabPanel } from"@/components/glass/glass-tabs";

export function ProcessSettingsSection() {
 const ctx = useProcessWorkspace();

 if (ctx.mode ==="llm") {
 return (
 <div className="mx-auto w-full max-w-4xl">
 <LlmVideoPanel
 progress={ctx.progress}
 isRunning={ctx.isRendering}
 canStart={ctx.hasInput && ctx.serviceReady !== false}
 lastReportPath={ctx.lastReportPath}
 onStart={() => {
 void ctx.handleStartLlm();
 }}
 onStop={() => {
 void ctx.handleStop();
 }}
 />
 </div>
 );
 }

 return (
 <div className="mx-auto flex w-full max-w-4xl flex-col gap-[var(--space-4)]">
 <GlassTabPanel>
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
 </GlassTabPanel>
 </div>
 );
}
