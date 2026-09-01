/**
 * GVFI — Win32-style video preview pane with full player controls.
 * Center canvas + bottom transport: progress bar, timecode, frame step buttons.
 */
"use client";

import {
  SkipBack,
  Rewind,
  Play,
  FastForward,
  SkipForward,
  Pause,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function WinPreviewPane() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(34);
  const [currentFrame] = useState(816);
  const [totalFrames] = useState(2400);

  const currentTime = formatTime(currentFrame, 24);
  const totalTime = formatTime(totalFrames, 24);

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 bg-[#1f1f21]">
      {/* Preview canvas */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[6px] bg-[#151517] border border-[#35353a]">
          <div className="text-center">
            <div className="mb-2 text-[48px] text-[#555]">🎬</div>
            <p className="text-[12px] text-[#888]">视频预览区域</p>
            <p className="mt-1 text-[11px] text-[#666]">1920 × 1080 · 24fps</p>
          </div>
        </div>
      </div>

      {/* Transport controls */}
      <div className="mt-2.5 rounded-[6px] border border-[#3b3b40] bg-[#29292d] px-4 py-2.5">
        {/* Progress bar */}
        <div className="mb-2 flex items-center gap-2">
          <span className="w-[52px] shrink-0 text-right font-mono text-[11px] text-[#333]">
            {currentTime}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="h-[4px] flex-1 cursor-pointer appearance-none rounded-full bg-[#4a4a50] accent-[#7561ff]"
          />
          <span className="w-[52px] shrink-0 font-mono text-[11px] text-[#333]">
            {totalTime}
          </span>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-center gap-1">
          <TransportButton label="上一帧" onClick={() => {}}>
            <SkipBack className="h-[14px] w-[14px]" strokeWidth={2} />
          </TransportButton>
          <TransportButton label="后退" onClick={() => {}}>
            <Rewind className="h-[14px] w-[14px]" strokeWidth={2} />
          </TransportButton>
          <TransportButton
            label={playing ? "暂停" : "播放"}
            primary
            onClick={() => setPlaying(!playing)}
          >
            {playing ? (
              <Pause className="h-[16px] w-[16px]" strokeWidth={2} />
            ) : (
              <Play className="h-[16px] w-[16px]" strokeWidth={2} />
            )}
          </TransportButton>
          <TransportButton label="前进" onClick={() => {}}>
            <FastForward className="h-[14px] w-[14px]" strokeWidth={2} />
          </TransportButton>
          <TransportButton label="下一帧" onClick={() => {}}>
            <SkipForward className="h-[14px] w-[14px]" strokeWidth={2} />
          </TransportButton>
          <div className="ml-3 text-[11px] text-[#666]">
            帧 <span className="font-mono text-[#333]">{currentFrame}</span> /{" "}
            {totalFrames}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportButton({
  children,
  label,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-[26px] w-[32px] items-center justify-center rounded-[4px] border transition-all duration-180 ease-out",
        primary
          ? "border-[#7561ff] bg-[#7561ff] text-white hover:bg-[#8473ff] active:bg-[#6250e8]"
          : "border-[#4a4a50] bg-[#35353a] text-[#c8c8ce] hover:bg-[#414149] active:bg-[#2f2f34]"
      )}
    >
      {children}
    </button>
  );
}

function formatTime(frame: number, fps: number): string {
  const totalSeconds = Math.floor(frame / fps);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const f = frame % fps;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
}
