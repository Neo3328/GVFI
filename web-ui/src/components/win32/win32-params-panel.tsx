/**
 * GVFI — Right-side parameter panel with six numbered GroupBoxes.
 * 1 AI model · 2 interpolation · 3 super-resolution · 4 denoise · 5 output · 6 task control.
 */
"use client";

import { useState } from "react";
import { FolderOpen, Play, Square, Eye } from "lucide-react";
import {
  GroupBox,
  WinButton,
  WinCheckbox,
  WinNumberInput,
  WinSelect,
  WinSlider,
} from "./win32-controls";
import { getDesktopBridge } from "@/lib/desktop";

export function WinParamsPanel() {
  // 1. AI model
  const [model, setModel] = useState("rife");
  // 2. interpolation
  const fps = 60;
  const [motionComp, setMotionComp] = useState(72);
  const [interp, setInterp] = useState(true);
  const [antiShake, setAntiShake] = useState(false);
  // 3. super resolution
  const [srScale, setSrScale] = useState(2);
  const [sharpen, setSharpen] = useState(35);
  const [colorEnhance, setColorEnhance] = useState(false);
  // 4. denoise
  const [denoise, setDenoise] = useState(30);
  const [denoiseMode, setDenoiseMode] = useState("smart");
  const [preserveDetail, setPreserveDetail] = useState(false);
  // 5. output
  const [container, setContainer] = useState("mp4");
  const [codec, setCodec] = useState("h264");
  const [bitrate, setBitrate] = useState(12);
  const [outDir, setOutDir] = useState("");
  // 6. task
  const [running, setRunning] = useState(false);

  const handleBrowse = async () => {
    const dir = await getDesktopBridge()?.selectDirectory?.();
    if (dir) setOutDir(dir);
  };

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[#e4e7eb] bg-[#f4f6f9] p-2.5">
      {/* 1. AI model */}
      <GroupBox title="1. AI处理模型">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <WinSelect
              value={model}
              onChange={setModel}
              options={[
                { value: "rife", label: "轻量补帧模型" },
                { value: "rife-heavy", label: "高精度补帧模型" },
                { value: "gmfs", label: "GMFlow 补帧模型" },
              ]}
            />
          </div>
          <WinButton className="shrink-0">加载模型</WinButton>
        </div>
        <div className="flex items-center justify-between text-[12px] text-[#555]">
          <span>目标帧率 {fps}fps</span>
          <span>
            设备：<span className="font-medium text-[#1a73e8]">CUDA</span>
          </span>
        </div>
      </GroupBox>

      {/* 2. Interpolation */}
      <GroupBox title="2. 补帧参数">
        <div className="flex items-center gap-2">
          <label className="w-[76px] shrink-0 text-right text-[12px] text-[#555]">
            运动补偿
          </label>
          <WinSlider value={motionComp} onChange={setMotionComp} min={0} max={100} suffix="%" />
        </div>
        <div className="flex items-center gap-2 pl-1">
          <WinCheckbox checked={interp} onChange={setInterp} label="开启帧插值" />
          <WinCheckbox checked={antiShake} onChange={setAntiShake} label="抗抖动" />
        </div>
      </GroupBox>

      {/* 3. Super resolution */}
      <GroupBox title="3. 超分与增强">
        <div className="flex items-center gap-2">
          <label className="w-[76px] shrink-0 text-right text-[12px] text-[#555]">
            超分比例
          </label>
          <WinSlider value={srScale} onChange={setSrScale} min={1} max={4} suffix=".0x" />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-[76px] shrink-0 text-right text-[12px] text-[#555]">
            锐化强度
          </label>
          <WinSlider value={sharpen} onChange={setSharpen} min={0} max={100} suffix="%" />
        </div>
        <div className="pl-1">
          <WinCheckbox checked={colorEnhance} onChange={setColorEnhance} label="色彩增强" />
        </div>
      </GroupBox>

      {/* 4. Denoise */}
      <GroupBox title="4. 降噪设置">
        <div className="flex items-center gap-2">
          <label className="w-[76px] shrink-0 text-right text-[12px] text-[#555]">
            降噪强度
          </label>
          <WinSlider value={denoise} onChange={setDenoise} min={0} max={100} suffix="%" />
        </div>
        <div className="flex items-center gap-2 pl-1">
          <div className="w-[76px]" />
          <WinSelect
            className="flex-1"
            value={denoiseMode}
            onChange={setDenoiseMode}
            options={[
              { value: "smart", label: "智能降噪" },
              { value: "off", label: "关闭降噪" },
              { value: "strong", label: "强力降噪" },
            ]}
          />
          <WinCheckbox checked={preserveDetail} onChange={setPreserveDetail} label="保留细节" />
        </div>
      </GroupBox>

      {/* 5. Output */}
      <GroupBox title="5. 输出配置">
        <div className="flex items-center gap-2">
          <WinSelect
            value={container}
            onChange={setContainer}
            options={[
              { value: "mp4", label: "MP4" },
              { value: "mkv", label: "MKV" },
              { value: "mov", label: "MOV" },
            ]}
          />
          <WinSelect
            value={codec}
            onChange={setCodec}
            options={[
              { value: "h264", label: "H.264" },
              { value: "h265", label: "H.265" },
              { value: "av1", label: "AV1" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-[44px] shrink-0 text-[12px] text-[#555]">输入</span>
          <WinNumberInput value={bitrate} onChange={setBitrate} min={1} max={200} suffix="Mbps" />
        </div>
        <div className="flex items-center gap-2">
          <input
            value={outDir}
            readOnly
            placeholder="选择输出目录"
            className="h-[30px] min-w-0 flex-1 rounded-[5px] border border-[#d4d9df] bg-white px-2 text-[12px] text-[#333] outline-none placeholder:text-[#aaa] hover:border-[#1a73e8] focus:border-[#1a73e8]"
          />
          <WinButton onClick={() => void handleBrowse()} className="shrink-0">
            <FolderOpen className="h-[13px] w-[13px]" strokeWidth={2} />
            浏览
          </WinButton>
        </div>
      </GroupBox>

      {/* 6. Task control */}
      <GroupBox title="6. 任务控制">
        <div className="flex items-center gap-2">
          <WinButton className="flex-1">
            <Eye className="h-[13px] w-[13px]" strokeWidth={2} />
            预览
          </WinButton>
          <WinButton
            variant="primary"
            className="flex-1"
            onClick={() => setRunning((r) => !r)}
          >
            <Play className="h-[13px] w-[13px]" strokeWidth={2.2} />
            {running ? "处理中…" : "开始处理"}
          </WinButton>
          <WinButton
            variant="danger"
            className="flex-1"
            disabled={!running}
            onClick={() => setRunning(false)}
          >
            <Square className="h-[11px] w-[11px]" strokeWidth={2.2} />
            停止
          </WinButton>
        </div>
      </GroupBox>
    </aside>
  );
}
