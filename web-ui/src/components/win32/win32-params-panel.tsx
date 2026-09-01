/**
 * GVFI — Right-side parameter panel (dark glass, groupbox layout).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { FolderOpen, FolderSearch, Cpu } from "lucide-react";
import { useState } from "react";
import type { JobSettings } from "@/lib/gvfi-types";
import { getDesktopBridge } from "@/lib/desktop";
import {
  GroupBox,
  FieldRow,
  WinSelect,
  WinNumberInput,
  WinSlider,
  WinCheckbox,
  WinSwitch,
  WinButton,
} from "./win32-controls";

export function WinParamsPanel({
  hasInput,
  inputName,
  running,
  starting,
  onStart,
  onStop,
}: {
  hasInput: boolean;
  inputName: string | null;
  running: boolean;
  starting: boolean;
  onStart: (settings: JobSettings & {
    outputDir: string;
    container: string;
    codec: string;
    audioCopy: boolean;
    sceneDetect: boolean;
    sharpen: number;
    denoiseEnabled: boolean;
    denoiseStrength: number;
    preserveDetail: boolean;
    backend: string;
  }) => void;
  onStop: () => void;
}) {
  // AI model
  const [model, setModel] = useState("rife-v4.6");
  const [backend, setBackend] = useState("native");
  const [gpu, setGpu] = useState("0");

  // Interpolation
  const [targetFps, setTargetFps] = useState(60);
  const [sceneDetect, setSceneDetect] = useState(true);
  const [taskType, setTaskType] = useState<"interp" | "sr" | "both">("both");

  // Super-res
  const [srEnabled, setSrEnabled] = useState(true);
  const [srModel, setSrModel] = useState("realesrgan");
  const [resolution, setResolution] = useState("source");
  const [sharpen, setSharpen] = useState(30);

  // Denoise
  const [denoiseEnabled, setDenoiseEnabled] = useState(false);
  const [denoiseStrength, setDenoiseStrength] = useState(50);
  const [preserveDetail, setPreserveDetail] = useState(true);

  // Output
  const [outputDir, setOutputDir] = useState("D:\\Videos\\GVFI_Output");
  const [container, setContainer] = useState("mp4");
  const [codec, setCodec] = useState("h264");
  const [crf, setCrf] = useState(18);
  const [audioCopy, setAudioCopy] = useState(true);

  const handleBrowse = async () => {
    const picked = await getDesktopBridge()?.selectDirectory?.();
    if (picked) setOutputDir(picked);
  };

  const handleOpenOutput = async () => {
    await getDesktopBridge()?.openPath?.(outputDir);
  };

  const handleStart = () => {
    onStart({
      task_type: taskType,
      model,
      fps: targetFps,
      superResolution: srEnabled,
      srModel: srModel as JobSettings["srModel"],
      resolution: resolution as JobSettings["resolution"],
      gpu: Number(gpu),
      precision: "fp16",
      quality: crf,
      outputDir,
      container,
      codec,
      audioCopy,
      sceneDetect,
      sharpen,
      denoiseEnabled,
      denoiseStrength,
      preserveDetail,
      backend,
    });
  };

  return (
    <aside className="relative flex h-full w-[320px] shrink-0 flex-col gap-1.5 overflow-y-auto overflow-x-hidden p-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent">
      <div
        aria-hidden
        className="pointer-events-none sticky bottom-0 -mt-4 h-4 bg-gradient-to-t from-[#07090f] to-transparent"
      />
      {/* ── AI 模型 ── */}
      <GroupBox title="AI 模型" badge={model === "rife-v4.6" ? "推荐" : undefined}>
        <FieldRow label="推理模型" hint="RIFE 系列">
          <WinSelect
            value={model}
            onChange={setModel}
            disabled={running}
            options={[
              { value: "rife-v4.6", label: "RIFE v4.6 (推荐)" },
              { value: "rife-v4.0", label: "RIFE v4.0" },
              { value: "rife-v3.1", label: "RIFE v3.1" },
            ]}
          />
        </FieldRow>
        <FieldRow label="推理后端" hint="Native / CLI">
          <WinSelect
            value={backend}
            onChange={setBackend}
            disabled={running}
            options={[
              { value: "native", label: "Native (ncnn/Vulkan)" },
              { value: "cli", label: "CLI 子进程" },
            ]}
          />
        </FieldRow>
        <FieldRow label="计算设备" hint="GPU 选择">
          <WinSelect
            value={gpu}
            onChange={setGpu}
            disabled={running}
            options={[
              { value: "0", label: "GPU 0 · RTX 5060" },
              { value: "1", label: "GPU 1 · 核显" },
            ]}
          />
        </FieldRow>
      </GroupBox>

      {/* ── 补帧参数 ── */}
      <GroupBox title="补帧参数">
        <FieldRow label="任务类型">
          <WinSelect
            value={taskType}
            onChange={(v) => setTaskType(v as typeof taskType)}
            disabled={running}
            options={[
              { value: "both", label: "补帧 + 超分" },
              { value: "interp", label: "仅补帧" },
              { value: "sr", label: "仅超分" },
            ]}
          />
        </FieldRow>
        <FieldRow label="目标帧率">
          <WinNumberInput
            value={targetFps}
            onChange={setTargetFps}
            min={24}
            max={240}
            suffix="fps"
            disabled={running}
          />
        </FieldRow>
        <FieldRow label="场景检测">
          <WinSwitch
            checked={sceneDetect}
            onChange={setSceneDetect}
            disabled={running}
            label={sceneDetect ? "已启用" : "已禁用"}
          />
        </FieldRow>
      </GroupBox>

      {/* ── 超分与增强 ── */}
      <GroupBox title="超分与增强">
        <FieldRow label="启用超分">
          <WinSwitch
            checked={srEnabled}
            onChange={setSrEnabled}
            disabled={running}
            label={srEnabled ? "已启用" : "已禁用"}
          />
        </FieldRow>
        <FieldRow label="超分模型" hint={srEnabled ? undefined : "已禁用"}>
          <WinSelect
            value={srModel}
            onChange={setSrModel}
            disabled={running || !srEnabled}
            options={[
              { value: "realesrgan", label: "RealESRGAN" },
              { value: "realcugan", label: "RealCUGAN" },
              { value: "swinir", label: "SwinIR" },
            ]}
          />
        </FieldRow>
        <FieldRow label="输出分辨率" hint={srEnabled ? undefined : "已禁用"}>
          <WinSelect
            value={resolution}
            onChange={setResolution}
            disabled={running || !srEnabled}
            options={[
              { value: "source", label: "跟随源 / 倍数" },
              { value: "1080p", label: "1080p" },
              { value: "1440p", label: "1440p" },
              { value: "4k", label: "4K" },
            ]}
          />
        </FieldRow>
        <FieldRow label="锐化强度">
          <WinSlider
            value={sharpen}
            onChange={setSharpen}
            min={0}
            max={100}
            disabled={running}
          />
        </FieldRow>
      </GroupBox>

      {/* ── 降噪设置 ── */}
      <GroupBox title="降噪设置">
        <FieldRow label="启用降噪">
          <WinSwitch
            checked={denoiseEnabled}
            onChange={setDenoiseEnabled}
            disabled={running}
            label={denoiseEnabled ? "已启用" : "已禁用"}
          />
        </FieldRow>
        <FieldRow label="降噪强度">
          <WinSlider
            value={denoiseStrength}
            onChange={setDenoiseStrength}
            min={0}
            max={100}
            disabled={running || !denoiseEnabled}
          />
        </FieldRow>
        <FieldRow label="细节保护">
          <WinCheckbox
            checked={preserveDetail}
            onChange={setPreserveDetail}
            disabled={running}
            label="保留边缘细节"
          />
        </FieldRow>
      </GroupBox>

      {/* ── 输出配置 ── */}
      <GroupBox title="输出配置">
        <FieldRow label="输出目录">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={outputDir}
                disabled={running}
                onChange={(e) => setOutputDir(e.target.value)}
                title={outputDir}
                className="h-7 w-full truncate rounded-lg border border-white/10 bg-black/30 px-2 pr-7 text-[11px] text-white outline-none transition-colors duration-150 hover:border-white/20 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 disabled:opacity-40"
              />
              <FolderOpen
                className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-white/30"
                strokeWidth={1.8}
              />
            </div>
            <WinButton variant="default" onClick={() => void handleBrowse()}>
              浏览
            </WinButton>
          </div>
        </FieldRow>
        <FieldRow label="封装格式">
          <WinSelect
            value={container}
            onChange={setContainer}
            disabled={running}
            options={[
              { value: "mp4", label: "MP4" },
              { value: "mkv", label: "MKV" },
              { value: "mov", label: "MOV" },
            ]}
          />
        </FieldRow>
        <FieldRow label="视频编码">
          <WinSelect
            value={codec}
            onChange={setCodec}
            disabled={running}
            options={[
              { value: "h264", label: "H.264 (AVC)" },
              { value: "h265", label: "H.265 (HEVC)" },
              { value: "av1", label: "AV1" },
            ]}
          />
        </FieldRow>
        <FieldRow label="画质 CRF">
          <WinNumberInput
            value={crf}
            onChange={setCrf}
            min={0}
            max={51}
            disabled={running}
          />
        </FieldRow>
        <FieldRow label="音频处理">
          <WinCheckbox
            checked={audioCopy}
            onChange={setAudioCopy}
            disabled={running}
            label="直接复制音频流"
          />
        </FieldRow>
        <button
          onClick={() => void handleOpenOutput()}
          className="mt-0.5 inline-flex items-center gap-1 self-end text-[11px] font-medium text-[var(--accent-cyan)] transition-colors duration-150 hover:text-white"
        >
          <FolderSearch className="size-3" strokeWidth={2} />
          打开输出文件夹
        </button>
      </GroupBox>

      {/* ── 任务控制 ── */}
      <GroupBox title="任务控制" badge={running ? "运行中" : hasInput ? "就绪" : "等待输入"}>
        {hasInput ? (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <Cpu className="size-4 shrink-0 text-[var(--accent-cyan)]" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-medium text-white/85">
                {inputName}
              </p>
              <p className="mt-0.5 text-[10px] text-white/40">
                {taskType === "both"
                  ? "补帧 + 超分"
                  : taskType === "interp"
                    ? "仅补帧"
                    : "仅超分"}
                · {targetFps}fps · CRF {crf}
              </p>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-2.5 text-[11px] leading-relaxed text-white/55">
            请先点击左侧「输入文件」选择视频后再启动任务。
          </p>
        )}
        <div className="flex gap-2 pt-1">
          {running ? (
            <WinButton variant="danger" className="flex-1" onClick={onStop}>
              停止处理
            </WinButton>
          ) : (
            <WinButton
              variant="primary"
              className="flex-1"
              loading={starting}
              disabled={!hasInput}
              onClick={handleStart}
            >
              开始处理
            </WinButton>
          )}
        </div>
      </GroupBox>
    </aside>
  );
}