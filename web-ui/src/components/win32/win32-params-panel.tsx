/**
 * GVFI — Win32-style high-density parameter panel (right column).
 * 6 GroupBox sections: AI model, interpolation, super-res, denoise, output, task control.
 * Labels left-aligned, controls right-aligned, clean dividers between groups.
 */
"use client";

import { FolderOpen, FolderOpen as FolderIcon } from "lucide-react";
import { useState } from "react";
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

export function WinParamsPanel() {
  // AI model
  const [model, setModel] = useState("rife-v4.6");
  const [backend, setBackend] = useState("native");
  const [gpu, setGpu] = useState("0");

  // Interpolation
  const [targetFps, setTargetFps] = useState(60);
  const [sceneDetect, setSceneDetect] = useState(true);
  const [taskType, setTaskType] = useState("both");

  // Super-res
  const [srEnabled, setSrEnabled] = useState(true);
  const [srModel, setSrModel] = useState("realesrgan-x4plus");
  const [srScale, setSrScale] = useState(2);
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

  return (
    <div className="flex w-[320px] shrink-0 flex-col overflow-y-auto bg-[#f5f5f5] p-2">
      {/* ── AI处理模型组 ── */}
      <GroupBox title="AI处理模型">
        <FieldRow label="推理模型">
          <WinSelect
            value={model}
            onChange={setModel}
            options={[
              { value: "rife-v4.6", label: "RIFE v4.6 (推荐)" },
              { value: "rife-v4.0", label: "RIFE v4.0" },
              { value: "rife-v3.1", label: "RIFE v3.1" },
              { value: "cain", label: "CAIN" },
            ]}
          />
        </FieldRow>
        <FieldRow label="推理后端">
          <WinSelect
            value={backend}
            onChange={setBackend}
            options={[
              { value: "native", label: "Native (ncnn/Vulkan)" },
              { value: "cli", label: "CLI 子进程" },
            ]}
          />
        </FieldRow>
        <FieldRow label="GPU设备">
          <WinSelect
            value={gpu}
            onChange={setGpu}
            options={[
              { value: "0", label: "GPU 0: RTX 5060 Laptop" },
              { value: "1", label: "GPU 1: Intel UHD" },
            ]}
          />
        </FieldRow>
      </GroupBox>

      {/* ── 补帧参数组 ── */}
      <GroupBox title="补帧参数">
        <FieldRow label="任务类型">
          <WinSelect
            value={taskType}
            onChange={setTaskType}
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
            step={1}
            suffix="fps"
          />
        </FieldRow>
        <FieldRow label="场景检测">
          <WinSwitch
            checked={sceneDetect}
            onChange={setSceneDetect}
            label={sceneDetect ? "已启用" : "已禁用"}
          />
        </FieldRow>
      </GroupBox>

      {/* ── 超分与增强组 ── */}
      <GroupBox title="超分与增强">
        <FieldRow label="启用超分">
          <WinSwitch
            checked={srEnabled}
            onChange={setSrEnabled}
            label={srEnabled ? "已启用" : "已禁用"}
          />
        </FieldRow>
        <FieldRow label="超分模型">
          <WinSelect
            value={srModel}
            onChange={setSrModel}
            options={[
              { value: "realesrgan-x4plus", label: "RealESRGAN x4+" },
              { value: "realesrgan-x2", label: "RealESRGAN x2" },
              { value: "waifu2x", label: "Waifu2x" },
            ]}
          />
        </FieldRow>
        <FieldRow label="放大倍数">
          <WinSelect
            value={String(srScale)}
            onChange={(v) => setSrScale(Number(v))}
            options={[
              { value: "1", label: "1x (原始)" },
              { value: "2", label: "2x" },
              { value: "3", label: "3x" },
              { value: "4", label: "4x" },
            ]}
          />
        </FieldRow>
        <FieldRow label="锐化强度">
          <WinSlider
            value={sharpen}
            onChange={setSharpen}
            min={0}
            max={100}
          />
        </FieldRow>
      </GroupBox>

      {/* ── 降噪设置组 ── */}
      <GroupBox title="降噪设置">
        <FieldRow label="启用降噪">
          <WinSwitch
            checked={denoiseEnabled}
            onChange={setDenoiseEnabled}
            label={denoiseEnabled ? "已启用" : "已禁用"}
          />
        </FieldRow>
        <FieldRow label="降噪强度">
          <WinSlider
            value={denoiseStrength}
            onChange={setDenoiseStrength}
            min={0}
            max={100}
          />
        </FieldRow>
        <FieldRow label="细节保护">
          <WinCheckbox
            checked={preserveDetail}
            onChange={setPreserveDetail}
            label="保留边缘细节"
          />
        </FieldRow>
      </GroupBox>

      {/* ── 输出配置组 ── */}
      <GroupBox title="输出配置">
        <FieldRow label="输出目录">
          <div className="flex gap-1">
            <input
              type="text"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              className="h-[26px] flex-1 rounded-[4px] border border-[#c0c0c0] bg-white px-2 text-[11px] text-[#1a1a1a] outline-none transition-colors duration-180 ease-out hover:border-[#a0a0a0] focus:border-[#0067c0] focus:ring-1 focus:ring-[#0067c0]"
            />
            <button
              title="浏览目录"
              className="flex h-[26px] w-[28px] shrink-0 items-center justify-center rounded-[4px] border border-[#c0c0c0] bg-[#f5f5f5] text-[#333] transition-colors duration-180 ease-out hover:bg-[#e8e8e8] active:bg-[#dcdcdc]"
            >
              <FolderOpen className="h-[14px] w-[14px]" strokeWidth={1.8} />
            </button>
          </div>
        </FieldRow>
        <FieldRow label="封装格式">
          <WinSelect
            value={container}
            onChange={setContainer}
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
            step={1}
          />
        </FieldRow>
        <FieldRow label="音频处理">
          <WinCheckbox
            checked={audioCopy}
            onChange={setAudioCopy}
            label="直接复制音频流"
          />
        </FieldRow>
        <div className="mt-1 flex justify-end">
          <button className="flex items-center gap-1 text-[11px] text-[#0067c0] underline-offset-2 hover:underline">
            <FolderIcon className="h-[12px] w-[12px]" strokeWidth={1.8} />
            打开输出文件夹
          </button>
        </div>
      </GroupBox>

      {/* ── 任务控制组 ── */}
      <GroupBox title="任务控制">
        <div className="flex gap-2">
          <WinButton variant="primary" className="flex-1">
            开始处理
          </WinButton>
          <WinButton variant="danger" className="flex-1">
            停止
          </WinButton>
        </div>
        <div className="text-[11px] text-[#666]">
          预计用时：约 3 分 20 秒
        </div>
      </GroupBox>
    </div>
  );
}
