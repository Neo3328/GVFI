/**
 * GVFI — Win32-style bottom log pane + status bar.
 * Read-only multi-line log output, status bar at bottom-right.
 */
"use client";

import { Circle } from "lucide-react";

const SAMPLE_LOGS = [
  "[10:32:01] [INFO] GVFI 引擎初始化完成",
  "[10:32:01] [INFO] Native 后端已加载: rife-v4.6",
  "[10:32:02] [INFO] Vulkan 设备: NVIDIA GeForce RTX 5060 Laptop GPU",
  "[10:32:05] [INFO] 已加载输入文件: input_video.mp4 (1920x1080, 24fps, 00:01:40)",
  "[10:32:06] [INFO] 场景检测: 发现 3 个场景切换点",
  "[10:32:06] [INFO] 任务配置: 补帧 24→60fps, 超分 2x, CRF=18",
  "[10:32:07] [RUN] 开始处理场景 1/3 (帧 0-815)",
  "[10:32:12] [RUN] 场景 1 进度: 34% (277/816 帧)",
  "[10:32:15] [RUN] 平均速度: 45.9ms/帧, 预计剩余 24.8s",
];

export function WinLogPane() {
  return (
    <div className="flex h-[120px] shrink-0 flex-col border-t border-[#c0c0c0] bg-[#fafafa]">
      <div className="flex h-[22px] items-center justify-between border-b border-[#e0e0e0] bg-[#f0f0f0] px-2">
        <span className="text-[11px] font-medium text-[#333]">运行日志</span>
        <span className="text-[10px] text-[#888]">自动滚动</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] leading-[1.5] text-[#333]">
        {SAMPLE_LOGS.map((line, i) => (
          <div key={i} className={logLineClass(line)}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WinStatusBar() {
  return (
    <div className="flex h-[22px] shrink-0 items-center justify-between border-t border-[#c0c0c0] bg-[#f0f0f0] px-2">
      <div className="flex items-center gap-3 text-[11px] text-[#333]">
        <span className="flex items-center gap-1">
          <Circle className="h-[8px] w-[8px] fill-[#107c10] text-[#107c10]" />
          就绪
        </span>
        <span className="text-[#888]">|</span>
        <span>GPU: RTX 5060 Laptop</span>
        <span className="text-[#888]">|</span>
        <span>显存: 6.2 / 8.0 GB</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-[#666]">
        <span>任务: 1 进行中</span>
        <span className="text-[#888]">|</span>
        <span>v1.1.0</span>
      </div>
    </div>
  );
}

function logLineClass(line: string): string {
  if (line.includes("[ERROR]")) return "text-[#c42b1c]";
  if (line.includes("[WARN]")) return "text-[#ca5010]";
  if (line.includes("[RUN]")) return "text-[#0067c0]";
  return "text-[#333]";
}
