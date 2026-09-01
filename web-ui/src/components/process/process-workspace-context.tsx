/**
 * GVFI — Process workspace shared state & actions.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import {
 createContext,
 useContext,
 useEffect,
 useMemo,
 useState,
 type ReactNode,
} from"react";
import { usePathname } from"next/navigation";
import { useHealth } from"@/hooks/use-health";
import { useJobPolling } from"@/hooks/use-job-polling";
import { useRenderService } from"@/hooks/use-render-service";
import { useVideoPreview } from"@/hooks/use-video-preview";
import { isTerminalStatus, stripStagePrefix } from"@/lib/gvfi-api";
import { formatDeviceLabel } from"@/lib/i18n/device-label";
import { t } from"@/lib/i18n/t";
import type { MessageKey } from"@/lib/i18n/types";
import { createLlmJob } from"@/lib/llm-api";
import { LLM_PROVIDER_PRESETS } from"@/lib/llm-types";
import { BUILTIN_PRESETS } from"@/lib/presets";
import type {
 FpsOption,
 GvfiGpu,
 GvfiModel,
 PrecisionOption,
 ResolutionOption,
 SrModelOption,
 WorkflowPreset,
} from"@/lib/gvfi-types";
import { useJobStore } from"@/stores/job-store";
import { useLlmConfigStore } from"@/stores/llm-config-store";
import { useLocaleStore } from"@/stores/locale-store";
import { useWorkspaceChrome } from"@/components/workspace/workspace-chrome-context";
import { pageTitleForPath } from"@/components/workspace/workspace-nav";
import { useT } from"@/hooks/use-t";

export type ProcessMode ="local" |"llm";

function tr(
 key: MessageKey,
 params?: Record<string, string | number>
): string {
 return t(useLocaleStore.getState().locale, key, params);
}

function stageDetail(detailKey: MessageKey): string {
 return tr("process.stage.wrap", { detail: tr(detailKey) });
}

function resolveModelId(models: GvfiModel[], preferred: string): string {
 const generalId ="gvfi:rife-v4.6";
 if (preferred && models.some((item) => item.id === preferred)) return preferred;
 const byName = models.find(
 (item) => item.name === preferred || preferred.endsWith(item.name)
 );
 if (byName) return byName.id;
 const general = models.find(
 (item) => item.id === generalId || item.name ==="rife-v4.6"
 );
 if (general) return general.id;
 const nonAnime = models.find((item) => item.name !=="rife-anime");
 return nonAnime?.id ?? models[0]?.id ?? (preferred || generalId);
}

export interface ProcessWorkspaceContextValue {
 mode: ProcessMode;
 setMode: (mode: ProcessMode) => void;
 file: File | null;
 setFile: (file: File | null) => void;
 inputPath: string;
 setInputPath: (path: string) => void;
 model: string;
 setModel: (model: string) => void;
 fps: FpsOption;
 setFps: (fps: FpsOption) => void;
 resolution: ResolutionOption;
 setResolution: (resolution: ResolutionOption) => void;
 gpu: number;
 setGpu: (gpu: number) => void;
 precision: PrecisionOption;
 setPrecision: (precision: PrecisionOption) => void;
 superResolution: boolean;
 setSuperResolution: (value: boolean) => void;
 srModel: SrModelOption;
 setSrModel: (model: SrModelOption) => void;
 quality: number;
 setQuality: (quality: number) => void;
 presets: WorkflowPreset[];
 selectedPreset: string;
 setSelectedPreset: (name: string) => void;
 lastReportPath: string;
 models: GvfiModel[];
 gpus: GvfiGpu[];
 progress: number;
 isRendering: boolean;
 serviceReady: boolean | null;
 queueCount: number;
 taskLogs: string[];
 errorLogs: string[];
 stageLabel: string;
 outputDir: string;
 lastOutputPath: string;
 srcBefore: string | undefined;
 srcAfter: string | undefined;
 gpuLabel: string;
 hasInput: boolean;
 appendTaskLog: (line: string) => void;
 appendErrorLog: (line: string) => void;
 handleApplyPreset: () => void;
 handleCreatePreset: () => void;
 handleSavePreset: () => void;
 handleDeletePreset: () => void;
 handleStartLocal: () => Promise<void>;
 handleStartTask: (taskType:"interp" |"sr" |"both") => Promise<void>;
 handleStartLlm: () => Promise<void>;
 handleStop: () => Promise<void>;
}

const ProcessWorkspaceContext = createContext<ProcessWorkspaceContextValue | null>(
 null
);

export function ProcessWorkspaceProvider({ children }: { children: ReactNode }) {
 const pathname = usePathname();
 const tHook = useT();
 const renderService = useRenderService();
 const { applyTask, startPolling } = useJobPolling({ renderService });
 const { setChrome } = useWorkspaceChrome();
 const llmConfig = useLlmConfigStore();

 const [mode, setMode] = useState<ProcessMode>("local");

 const {
 progress,
 stageLabel,
 isRendering,
 serviceReady,
 queueCount,
 models,
 gpus,
 outputDir,
 lastOutputPath,
 taskLogs,
 errorLogs,
 appendTaskLog,
 appendErrorLog,
 setTaskId,
 setIsRendering,
 setProgress,
 setStageLabel,
 } = useJobStore();

 const [presets, setPresets] = useState<WorkflowPreset[]>(BUILTIN_PRESETS);
 const [selectedPreset, setSelectedPreset] = useState(
 BUILTIN_PRESETS.find((p) => p.model ==="gvfi:rife-v4.6")?.name ??
"cinema-hd"
 );
 const [file, setFile] = useState<File | null>(null);
 const [inputPath, setInputPath] = useState("");
 const [model, setModel] = useState("gvfi:rife-v4.6");
 const [fps, setFps] = useState<FpsOption>("120");
 const [resolution, setResolution] = useState<ResolutionOption>("source");
 const [gpu, setGpu] = useState(0);
 const [precision, setPrecision] = useState<PrecisionOption>("fp16");
 const [superResolution, setSuperResolution] = useState(true);
 const [srModel, setSrModel] = useState<SrModelOption>("realesrgan");
 const [quality, setQuality] = useState(0.8);
 const [lastReportPath, setLastReportPath] = useState("");

 useHealth({
 renderService,
 onHealthLoaded: ({ models: nextModels, gpus: nextGpus }) => {
 setModel((prev) => resolveModelId(nextModels, prev));
 setGpu((prev) =>
 nextGpus.some((g) => g.index === prev) ? prev : (nextGpus[0]?.index ?? 0)
 );
 },
 });

 const { srcBefore, srcAfter } = useVideoPreview({
 file,
 inputPath,
 outputPath: mode ==="local" ? lastOutputPath :"",
 });

 useEffect(() => {
 if (mode ==="llm" && lastOutputPath.endsWith(".md")) {
 setLastReportPath(lastOutputPath);
 }
 }, [mode, lastOutputPath]);

 /* Legacy /app/process/* only — dedicated pages own their chrome */
 useEffect(() => {
 if (!pathname.startsWith("/app/process")) return;
 const sectionLabel = pageTitleForPath(pathname, tHook);
 setChrome({
 title: file?.name || inputPath.trim() || sectionLabel,
 breadcrumbs: [
 { label: tHook("common.app"), href:"/app/dashboard" },
 {
 label: mode ==="llm" ? tHook("nav.ai") : tHook("nav.video"),
 href: mode ==="llm" ?"/app/ai" :"/app/video",
 },
 { label: sectionLabel },
 ],
 status:
 serviceReady === false
 ?"offline"
 : serviceReady
 ? isRendering
 ?"warning"
 :"online"
 :"idle",
 statusLabel: stripStagePrefix(stageLabel),
 });
 }, [
 pathname,
 serviceReady,
 stageLabel,
 isRendering,
 setChrome,
 file,
 inputPath,
 mode,
 tHook,
 ]);

 const applyPresetValues = (preset: WorkflowPreset, available: GvfiModel[]) => {
 setModel(resolveModelId(available, preset.model));
 setFps(preset.fps);
 setSuperResolution(preset.superResolution);
 setSrModel(preset.srModel);
 setResolution(preset.resolution);
 setPrecision(preset.precision);
 setQuality(preset.quality);
 };

 const handleApplyPreset = () => {
 const preset = presets.find((item) => item.name === selectedPreset);
 if (!preset) {
 appendErrorLog(tr("process.preset.notFound", { name: selectedPreset }));
 return;
 }
 applyPresetValues(preset, models);
 appendTaskLog(tr("process.preset.applied", { name: preset.name }));
 setStageLabel(
 tr("process.stage.wrap", {
 detail: tr("process.preset.appliedDetail", { name: preset.name }),
 })
 );
 };

 const handleCreatePreset = () => {
 const name = window.prompt(tr("process.preset.namePrompt"))?.trim();
 if (!name) {
 appendErrorLog(tr("process.preset.emptyName"));
 return;
 }
 if (presets.some((item) => item.name === name && item.builtin)) {
 appendErrorLog(tr("process.preset.cannotOverwrite"));
 return;
 }
 const next: WorkflowPreset = {
 name,
 builtin: false,
 model,
 fps,
 superResolution,
 srModel,
 resolution,
 precision,
 quality,
 };
 setPresets((prev) => [...prev.filter((item) => item.name !== name), next]);
 setSelectedPreset(name);
 appendTaskLog(tr("process.preset.created", { name }));
 };

 const handleSavePreset = () => {
 const current = presets.find((item) => item.name === selectedPreset);
 if (current?.builtin) {
 const name = window
 .prompt(
 tr("process.preset.saveAsPrompt"),
 tr("process.preset.saveAsDefault", { name: selectedPreset })
 )
 ?.trim();
 if (!name) return;
 if (presets.some((item) => item.name === name && item.builtin)) {
 appendErrorLog(tr("process.preset.cannotOverwriteShort"));
 return;
 }
 const next: WorkflowPreset = {
 name,
 builtin: false,
 model,
 fps,
 superResolution,
 srModel,
 resolution,
 precision,
 quality,
 };
 setPresets((prev) => [...prev.filter((item) => item.name !== name), next]);
 setSelectedPreset(name);
 appendTaskLog(tr("process.preset.saved", { name }));
 return;
 }
 setPresets((prev) =>
 prev.map((item) =>
 item.name === selectedPreset
 ? {
 ...item,
 model,
 fps,
 superResolution,
 srModel,
 resolution,
 precision,
 quality,
 }
 : item
 )
 );
 appendTaskLog(tr("process.preset.saved", { name: selectedPreset }));
 };

 const handleDeletePreset = () => {
 const current = presets.find((item) => item.name === selectedPreset);
 if (!current) return;
 if (current.builtin) {
 appendErrorLog(tr("process.preset.cannotDeleteBuiltin"));
 return;
 }
 if (!window.confirm(tr("process.preset.confirmDelete", { name: current.name })))
 return;
 const next = presets.filter((item) => item.name !== current.name);
 setPresets(next);
 setSelectedPreset(next[0]?.name ??"");
 appendTaskLog(tr("process.preset.deleted", { name: current.name }));
 };

 const handleStartTask = async (taskType:"interp" |"sr" |"both") => {
 if (!file && !inputPath.trim()) {
 appendErrorLog(tr("process.err.needInput"));
 return;
 }
 if (serviceReady === false) {
 appendErrorLog(tr("process.err.serviceDown"));
 return;
 }
 if (file && !window.confirm(tr("video.input.uploadConfirm"))) {
 return;
 }

 setIsRendering(true);
 setProgress(0);
 setStageLabel(stageDetail("process.stage.submitJob"));
 appendTaskLog(
 tr("process.log.submitJob", {
 name: file?.name || inputPath,
 fps,
 model,
 })
 );

 try {
 const settings = {
 task_type: taskType,
 model,
 fps: Number(fps),
 superResolution: taskType !=="interp" && superResolution,
 srModel,
 resolution,
 gpu,
 precision,
 quality,
 inputPath: inputPath.trim() || undefined,
 };
 useJobStore.getState().setLastRenderSettings(settings);
 const result = await renderService.createJob({
 file,
 settings,
 });
 setTaskId(result.task.id);
 void applyTask(result.task, result.warnings);
 if (!isTerminalStatus(result.task.status)) {
 startPolling(result.task.id);
 }
 } catch (error) {
 setIsRendering(false);
 setStageLabel(stageDetail("process.stage.submitFail"));
 appendErrorLog(error instanceof Error ? error.message : String(error));
 }
 };

 const handleStartLocal = () => handleStartTask("both");

 const handleStartLlm = async () => {
 if (!file && !inputPath.trim()) {
 appendErrorLog(tr("process.err.needInput"));
 return;
 }
 if (serviceReady === false) {
 appendErrorLog(tr("process.err.serviceDown"));
 return;
 }
 if (!llmConfig.hasApiKey()) {
 appendErrorLog(tr("process.err.needLlmKey"));
 return;
 }
 if (!window.confirm(tr("video.input.llmConsent"))) {
 return;
 }

 const preset = LLM_PROVIDER_PRESETS.find((p) => p.id === llmConfig.provider);

 setIsRendering(true);
 setProgress(0);
 setStageLabel(stageDetail("process.stage.submitAi"));
 appendTaskLog(
 tr("process.log.submitLlm", {
 name: file?.name || inputPath,
 model: llmConfig.model,
 })
 );

 try {
 const result = await createLlmJob({
 file,
 settings: {
 engine:"llm",
 llmProvider: llmConfig.provider,
 llmModel: llmConfig.model,
 apiKey: llmConfig.apiKey,
 baseUrl:
 llmConfig.provider ==="custom"
 ? llmConfig.baseUrl
 : preset?.baseUrl,
 prompt: llmConfig.getActivePrompt(),
 maxFrames: llmConfig.maxFrames,
 inputPath: inputPath.trim() || undefined,
 },
 });
 setTaskId(result.task.id);
 void applyTask(result.task, result.warnings);
 if (!isTerminalStatus(result.task.status)) {
 startPolling(result.task.id);
 } else if (result.task.output_path) {
 setLastReportPath(result.task.output_path);
 }
 } catch (error) {
 setIsRendering(false);
 setStageLabel(stageDetail("process.stage.submitFail"));
 appendErrorLog(error instanceof Error ? error.message : String(error));
 }
 };

 const handleStop = async () => {
 const { taskId } = useJobStore.getState();
 if (!taskId) {
 appendErrorLog(tr("process.err.noCancelTarget"));
 return;
 }
 try {
 await renderService.cancelJob(taskId);
 appendTaskLog(tr("process.log.cancelRequested"));
 setStageLabel(stageDetail("process.stage.stopping"));
 } catch (error) {
 appendErrorLog(error instanceof Error ? error.message : String(error));
 }
 };

 const locale = useLocaleStore((s) => s.locale);

 const gpuLabel = useMemo(() => {
 const selected = gpus.find((item) => item.index === gpu);
 if (selected) return formatDeviceLabel(locale, selected);
 if (gpus.length > 0) {
 return t(locale,"process.gpu.indexed", { index: gpu });
 }
 return t(locale,"dashboard.kpi.gpuMissing");
 }, [gpus, gpu, locale]);

 const hasInput = Boolean(file || inputPath.trim());

 const value = useMemo<ProcessWorkspaceContextValue>(
 () => ({
 mode,
 setMode,
 file,
 setFile,
 inputPath,
 setInputPath,
 model,
 setModel,
 fps,
 setFps,
 resolution,
 setResolution,
 gpu,
 setGpu,
 precision,
 setPrecision,
 superResolution,
 setSuperResolution,
 srModel,
 setSrModel,
 quality,
 setQuality,
 presets,
 selectedPreset,
 setSelectedPreset,
 lastReportPath,
 models,
 gpus,
 progress,
 isRendering,
 serviceReady,
 queueCount,
 taskLogs,
 errorLogs,
 stageLabel,
 outputDir,
 lastOutputPath,
 srcBefore,
 srcAfter,
 gpuLabel,
 hasInput,
 appendTaskLog,
 appendErrorLog,
 handleApplyPreset,
 handleCreatePreset,
 handleSavePreset,
 handleDeletePreset,
 handleStartLocal,
 handleStartTask,
 handleStartLlm,
 handleStop,
 }),
 [
 mode,
 file,
 inputPath,
 model,
 fps,
 resolution,
 gpu,
 precision,
 superResolution,
 srModel,
 quality,
 presets,
 selectedPreset,
 lastReportPath,
 models,
 gpus,
 progress,
 isRendering,
 serviceReady,
 queueCount,
 taskLogs,
 errorLogs,
 stageLabel,
 outputDir,
 lastOutputPath,
 srcBefore,
 srcAfter,
 gpuLabel,
 hasInput,
 appendTaskLog,
 appendErrorLog,
 ]
 );

 return (
 <ProcessWorkspaceContext.Provider value={value}>
 {children}
 </ProcessWorkspaceContext.Provider>
 );
}

export function useProcessWorkspace() {
 const ctx = useContext(ProcessWorkspaceContext);
 if (!ctx) {
 throw new Error("useProcessWorkspace must be used within ProcessWorkspaceProvider");
 }
 return ctx;
}
