"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useHealth } from "@/hooks/use-health";
import { useJobPolling } from "@/hooks/use-job-polling";
import { useRenderService } from "@/hooks/use-render-service";
import { useVideoPreview } from "@/hooks/use-video-preview";
import { isTerminalStatus } from "@/lib/gvfi-api";
import { createLlmJob } from "@/lib/llm-api";
import { LLM_PROVIDER_PRESETS } from "@/lib/llm-types";
import { BUILTIN_PRESETS } from "@/lib/presets";
import type {
  FpsOption,
  GvfiGpu,
  GvfiModel,
  PrecisionOption,
  ResolutionOption,
  SrModelOption,
  WorkflowPreset,
} from "@/lib/gvfi-types";
import { useJobStore } from "@/stores/job-store";
import { useLlmConfigStore } from "@/stores/llm-config-store";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { pageTitleForPath } from "@/components/workspace/workspace-nav";

export type ProcessMode = "local" | "llm";

function resolveModelId(models: GvfiModel[], preferred: string): string {
  if (models.some((item) => item.id === preferred)) return preferred;
  const byName = models.find(
    (item) => item.name === preferred || preferred.endsWith(item.name)
  );
  return byName?.id ?? models[0]?.id ?? preferred;
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
  handleStartLlm: () => Promise<void>;
  handleStop: () => Promise<void>;
}

const ProcessWorkspaceContext = createContext<ProcessWorkspaceContextValue | null>(
  null
);

export function ProcessWorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
    BUILTIN_PRESETS[0]?.name ?? "动漫补帧"
  );
  const [file, setFile] = useState<File | null>(null);
  const [inputPath, setInputPath] = useState("");
  const [model, setModel] = useState("gvfi:rife-anime");
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
    outputPath: mode === "local" ? lastOutputPath : "",
  });

  useEffect(() => {
    if (mode === "llm" && lastOutputPath.endsWith(".md")) {
      setLastReportPath(lastOutputPath);
    }
  }, [mode, lastOutputPath]);

  /* Legacy /app/process/* only — dedicated pages own their chrome */
  useEffect(() => {
    if (!pathname.startsWith("/app/process")) return;
    const sectionLabel = pageTitleForPath(pathname);
    setChrome({
      title: file?.name || inputPath.trim() || sectionLabel,
      breadcrumbs: [
        { label: "GVFI", href: "/app/dashboard" },
        { label: mode === "llm" ? "AI" : "视频", href: mode === "llm" ? "/app/ai" : "/app/video" },
        { label: sectionLabel },
      ],
      status:
        serviceReady === false
          ? "offline"
          : serviceReady
            ? isRendering
              ? "warning"
              : "online"
            : "idle",
      statusLabel: stageLabel
        .replace(/^●\s*当前工序：\s*/, "")
        .replace(/^●\s*/, ""),
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
      appendErrorLog(`找不到预设：${selectedPreset}`);
      return;
    }
    applyPresetValues(preset, models);
    appendTaskLog(`已应用「${preset.name}」`);
    setStageLabel(`● 当前工序：已应用「${preset.name}」`);
  };

  const handleCreatePreset = () => {
    const name = window.prompt("预设名称：")?.trim();
    if (!name) {
      appendErrorLog("新建预设失败：名称不能为空。");
      return;
    }
    if (presets.some((item) => item.name === name && item.builtin)) {
      appendErrorLog("不能覆盖内置预设名称，请换一个名字。");
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
    appendTaskLog(`已新建「${name}」`);
  };

  const handleSavePreset = () => {
    const current = presets.find((item) => item.name === selectedPreset);
    if (current?.builtin) {
      const name = window
        .prompt("内置预设请另存为新名称：", `${selectedPreset}-自定义`)
        ?.trim();
      if (!name) return;
      if (presets.some((item) => item.name === name && item.builtin)) {
        appendErrorLog("不能覆盖内置预设名称。");
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
      appendTaskLog(`已保存「${name}」`);
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
    appendTaskLog(`已保存「${selectedPreset}」`);
  };

  const handleDeletePreset = () => {
    const current = presets.find((item) => item.name === selectedPreset);
    if (!current) return;
    if (current.builtin) {
      appendErrorLog("内置预设不能删除。");
      return;
    }
    if (!window.confirm(`确定删除「${current.name}」？`)) return;
    const next = presets.filter((item) => item.name !== current.name);
    setPresets(next);
    setSelectedPreset(next[0]?.name ?? "");
    appendTaskLog(`已删除「${current.name}」`);
  };

  const handleStartLocal = async () => {
    if (!file && !inputPath.trim()) {
      appendErrorLog("请先上传视频，或填写本机输入路径。");
      return;
    }
    if (serviceReady === false) {
      appendErrorLog("GVFI 服务不可用，请先运行 GVFI_API.cmd。");
      return;
    }

    setIsRendering(true);
    setProgress(0);
    setStageLabel("● 当前工序：提交任务");
    appendTaskLog(
      `提交任务：${file?.name || inputPath} · ${fps}fps · ${model}`
    );

    try {
      const result = await renderService.createJob({
        file,
        settings: {
          model,
          fps: Number(fps),
          superResolution,
          srModel,
          resolution,
          gpu,
          precision,
          quality,
          inputPath: inputPath.trim() || undefined,
        },
      });
      setTaskId(result.task.id);
      applyTask(result.task, result.warnings);
      if (!isTerminalStatus(result.task.status)) {
        startPolling(result.task.id);
      }
    } catch (error) {
      setIsRendering(false);
      setStageLabel("● 当前工序：提交失败");
      appendErrorLog(error instanceof Error ? error.message : String(error));
    }
  };

  const handleStartLlm = async () => {
    if (!file && !inputPath.trim()) {
      appendErrorLog("请先上传视频，或填写本机输入路径。");
      return;
    }
    if (serviceReady === false) {
      appendErrorLog("GVFI 服务不可用，请先运行 GVFI_API.cmd。");
      return;
    }
    if (!llmConfig.hasApiKey()) {
      appendErrorLog("请先在 API 设置中配置大模型密钥。");
      return;
    }

    const preset = LLM_PROVIDER_PRESETS.find((p) => p.id === llmConfig.provider);

    setIsRendering(true);
    setProgress(0);
    setStageLabel("● 当前工序：提交 AI 分析");
    appendTaskLog(`提交 LLM 任务：${file?.name || inputPath} · ${llmConfig.model}`);

    try {
      const result = await createLlmJob({
        file,
        settings: {
          engine: "llm",
          llmProvider: llmConfig.provider,
          llmModel: llmConfig.model,
          apiKey: llmConfig.apiKey,
          baseUrl:
            llmConfig.provider === "custom"
              ? llmConfig.baseUrl
              : preset?.baseUrl,
          prompt: llmConfig.getActivePrompt(),
          maxFrames: llmConfig.maxFrames,
          inputPath: inputPath.trim() || undefined,
        },
      });
      setTaskId(result.task.id);
      applyTask(result.task, result.warnings);
      if (!isTerminalStatus(result.task.status)) {
        startPolling(result.task.id);
      } else if (result.task.output_path) {
        setLastReportPath(result.task.output_path);
      }
    } catch (error) {
      setIsRendering(false);
      setStageLabel("● 当前工序：提交失败");
      appendErrorLog(error instanceof Error ? error.message : String(error));
    }
  };

  const handleStop = async () => {
    const { taskId } = useJobStore.getState();
    if (!taskId) {
      appendErrorLog("当前没有可取消的任务。");
      return;
    }
    try {
      await renderService.cancelJob(taskId);
      appendTaskLog("已请求取消任务");
      setStageLabel("● 当前工序：正在停止");
    } catch (error) {
      appendErrorLog(error instanceof Error ? error.message : String(error));
    }
  };

  const gpuLabel =
    gpus.find((item) => item.index === gpu)?.name ??
    (gpus.length > 0 ? `GPU ${gpu}` : "未检测到");

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
