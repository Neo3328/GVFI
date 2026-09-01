/**
 * GVFI — Central video preview stage.
 * Black canvas with film icon when empty; glass transport bar below.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import {
  SkipBack,
  Rewind,
  Play,
  FastForward,
  SkipForward,
  Pause,
  Film,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function WinPreviewPane({
  hasInput,
  inputName,
  onPickInput,
}: {
  hasInput: boolean;
  inputName: string | null;
  onPickInput?: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const totalFrames = hasInput ? 2400 : 0;
  const fps = 24;

  useEffect(() => {
    if (!playing || !hasInput) return;
    const timer = window.setInterval(() => {
      setCurrentFrame((f) => {
        if (f >= totalFrames - 1) {
          setPlaying(false);
          return totalFrames - 1;
        }
        return f + 1;
      });
    }, 1000 / fps);
    return () => window.clearInterval(timer);
  }, [playing, hasInput, totalFrames, fps]);

  const progress = totalFrames > 0 ? (currentFrame / (totalFrames - 1)) * 100 : 0;
  const step = (delta: number) => {
    if (!hasInput) return;
    setCurrentFrame((f) => Math.max(0, Math.min(totalFrames - 1, f + delta)));
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-2">
      {/* Preview canvas */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_8px_40px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        {/* Aurora glow on empty */}
        {!hasInput ? (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 50% at 50% 50%, rgba(10,132,255,0.18) 0%, rgba(124,58,237,0.10) 35%, transparent 70%)",
              }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-3 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[0_0_24px_rgba(10,132,255,0.3)]">
                <Film className="size-7 text-[var(--accent-cyan)]" strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">
                  未加载视频文件
                </p>
                <p className="mt-1 text-[12px] text-white/50">
                  从左侧「输入文件」选择本地视频以开始处理
                </p>
              </div>
              {onPickInput ? (
                <button
                  type="button"
                  onClick={onPickInput}
                  className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-[12px] font-semibold text-white backdrop-blur-md transition-all duration-150 hover:bg-white/[0.1] hover:border-white/25"
                >
                  <Upload className="size-3.5" strokeWidth={2} />
                  打开文件
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="text-center">
            <Film
              className="mx-auto mb-2 size-9 text-white/40"
              strokeWidth={1.5}
            />
            <p className="max-w-[80%] truncate px-4 text-[13px] text-white/85">
              {inputName}
            </p>
            <p className="mt-1 text-[10px] tabular-nums text-white/40">
              帧 {currentFrame} / {totalFrames}
            </p>
          </div>
        )}

        {/* Floating resolution badge */}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-[var(--accent-cyan)]" />
          1920 × 1080 · 24 fps
        </div>
        <div className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-md">
          PREVIEW
        </div>
      </div>

      {/* Transport controls */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] px-4 py-1.5 backdrop-blur-xl">
        {/* Progress bar */}
        <div className="mb-1.5 flex items-center gap-3">
          <span className="w-[72px] shrink-0 text-right font-mono text-[10.5px] tabular-nums text-white/70">
            {formatTime(currentFrame, fps)}
          </span>
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-cyan)] transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={totalFrames > 0 ? totalFrames - 1 : 0}
              value={currentFrame}
              disabled={!hasInput}
              onChange={(e) => setCurrentFrame(Number(e.target.value))}
              className="absolute inset-0 size-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
            />
          </div>
          <span className="w-[72px] shrink-0 font-mono text-[10.5px] tabular-nums text-white/40">
            {formatTime(totalFrames, fps)}
          </span>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-center gap-1.5">
          <TransportButton label="上一帧" disabled={!hasInput} onClick={() => step(-1)}>
            <SkipBack className="size-3.5" strokeWidth={2} />
          </TransportButton>
          <TransportButton label="后退 10 帧" disabled={!hasInput} onClick={() => step(-10)}>
            <Rewind className="size-3.5" strokeWidth={2} />
          </TransportButton>
          <TransportButton
            label={playing ? "暂停" : "播放"}
            primary
            disabled={!hasInput}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? (
              <Pause className="size-4" strokeWidth={2.2} />
            ) : (
              <Play className="size-4" strokeWidth={2.2} />
            )}
          </TransportButton>
          <TransportButton label="前进 10 帧" disabled={!hasInput} onClick={() => step(10)}>
            <FastForward className="size-3.5" strokeWidth={2} />
          </TransportButton>
          <TransportButton label="下一帧" disabled={!hasInput} onClick={() => step(1)}>
            <SkipForward className="size-3.5" strokeWidth={2} />
          </TransportButton>
          <div className="ml-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[10.5px] font-medium text-white/70">
            进度
            <span className="font-mono tabular-nums text-[var(--accent-cyan)]">
              {progress.toFixed(0)}%
            </span>
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
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg border transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-30",
        primary
          ? "border-transparent bg-gradient-to-r from-[var(--accent)] to-[#7c3aed] text-white shadow-[0_0_14px_rgba(10,132,255,0.45)] hover:brightness-110 active:brightness-95"
          : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
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