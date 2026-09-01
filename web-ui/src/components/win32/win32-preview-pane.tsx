/**
 * GVFI — Center video preview canvas + transport controls.
 * Dark canvas, white control strip, blue play button.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Repeat,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_FRAMES = 305; // 00:00:12:45 @ 24fps
const FPS = 24;

function frameToTC(frame: number): string {
  const totalSec = Math.floor(frame / FPS);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  const f = String(frame % FPS).padStart(2, "0");
  return `${h}:${m}:${s}:${f}`;
}

export function WinPreviewPane() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCurrentFrame((f) => {
        if (f >= TOTAL_FRAMES) {
          setPlaying(false);
          return TOTAL_FRAMES;
        }
        return f + 1;
      });
    }, 1000 / FPS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing]);

  const step = (delta: number) =>
    setCurrentFrame((f) => Math.max(0, Math.min(TOTAL_FRAMES, f + delta)));

  const progress = (currentFrame / TOTAL_FRAMES) * 100;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
      {/* Canvas */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[6px] bg-[#2b2f36]">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] text-white/35">视频预览区域</span>
        </div>
        {/* progress bar at canvas bottom */}
        <div className="absolute inset-x-0 bottom-0 h-[5px] bg-white/20">
          <div
            className="h-full bg-[#1a73e8] transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Transport strip */}
      <div className="flex h-[52px] shrink-0 items-center gap-3 rounded-[6px] border border-[#e2e6eb] bg-white px-3">
        <ChevronLeft className="h-[18px] w-[18px] text-[#666]" strokeWidth={2} />
        <span className="w-[104px] shrink-0 font-mono text-[13px] text-[#333]">
          {frameToTC(currentFrame)}
        </span>

        <div className="flex flex-1 items-center justify-center gap-2.5">
          <TransportButton onClick={() => step(-10)} title="后退10帧">
            <SkipBack className="h-[15px] w-[15px]" strokeWidth={2} />
          </TransportButton>
          <TransportButton onClick={() => step(-1)} title="上一帧">
            <ChevronLeft className="h-[16px] w-[16px]" strokeWidth={2.2} />
          </TransportButton>
          <button
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "暂停" : "播放"}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-sm transition-colors duration-180 ease-out hover:bg-[#3a8af0] active:bg-[#155fc4]"
          >
            {playing ? (
              <Pause className="h-[16px] w-[16px]" strokeWidth={2.2} />
            ) : (
              <Play className="ml-[2px] h-[16px] w-[16px]" strokeWidth={2.2} />
            )}
          </button>
          <TransportButton onClick={() => step(1)} title="下一帧">
            <ChevronRight className="h-[16px] w-[16px]" strokeWidth={2.2} />
          </TransportButton>
          <TransportButton onClick={() => step(10)} title="前进10帧">
            <SkipForward className="h-[15px] w-[15px]" strokeWidth={2} />
          </TransportButton>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <TransportButton small title="循环">
            <Repeat className="h-[14px] w-[14px]" strokeWidth={2} />
          </TransportButton>
          <TransportButton small title="倍速">
            <span className="text-[10px] font-semibold">1x</span>
          </TransportButton>
          <TransportButton small title="音量">
            <Volume2 className="h-[14px] w-[14px]" strokeWidth={2} />
          </TransportButton>
          <TransportButton small title="统计">
            <BarChart3 className="h-[14px] w-[14px]" strokeWidth={2} />
          </TransportButton>
        </div>
      </div>
    </section>
  );
}

function TransportButton({
  children,
  onClick,
  title,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center justify-center rounded-full border border-[#d4d9df] bg-white text-[#555] transition-colors duration-180 ease-out hover:border-[#1a73e8] hover:text-[#1a73e8] active:bg-[#eaf2fe]",
        small ? "h-[28px] w-[28px]" : "h-[32px] w-[32px]"
      )}
    >
      {children}
    </button>
  );
}
