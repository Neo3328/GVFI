/**
 * GVFI — Before/after video comparison viewer.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useCallback, useId, useRef, useState } from"react";
import { cva, type VariantProps } from"class-variance-authority";
import { cn } from"@/lib/utils";
import { GlassPanel } from"@/components/glass/glass-card";
import { glassFocusRing, glassMotion } from"@/components/glass/glass-styles";
import { motionControl } from"@/components/workspace/motion";
import { useT } from"@/hooks/use-t";

export const videoComparisonVariants = cva(
"relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-0)]",
 {
 variants: {
 aspect: {
 video:"aspect-video",
 cinema:"aspect-[2.39/1]",
 square:"aspect-square",
 },
 size: {
 sm:"max-w-md",
 md:"max-w-2xl",
 lg:"max-w-4xl",
 full:"w-full",
 },
 },
 defaultVariants: {
 aspect:"video",
 size:"full",
 },
 }
);

export interface VideoComparisonViewerProps
 extends VariantProps<typeof videoComparisonVariants> {
 srcBefore?: string;
 srcAfter?: string;
 labelBefore?: string;
 labelAfter?: string;
 className?: string;
 compareMode?:"slider" |"toggle";
}

/**
 * Video comparison preview — CSS glass border, no WebGL refraction in the video area
 */
export function VideoComparisonViewer({
 srcBefore,
 srcAfter,
 labelBefore,
 labelAfter,
 aspect,
 size,
 className,
 compareMode ="slider",
}: VideoComparisonViewerProps) {
 const t = useT();
 const before = labelBefore ?? t("video.compare.before");
 const after = labelAfter ?? t("video.compare.after");
 const sliderId = useId();
 const containerRef = useRef<HTMLDivElement>(null);
 const [position, setPosition] = useState(50);
 const [showAfter, setShowAfter] = useState(true);

 const onSliderChange = useCallback((value: number) => {
 setPosition(Math.min(100, Math.max(0, value)));
 }, []);

 const hasBoth = Boolean(srcBefore && srcAfter);

 return (
 <GlassPanel
 variant="inset"
 padding="none"
 title={t("video.compare.title")}
 description={
 hasBoth ? t("video.compare.descBoth") : t("video.compare.descEmpty")
 }
 className={className}
 >
 <div
 ref={containerRef}
 className={cn(videoComparisonVariants({ aspect, size }),"mx-auto w-full")}
 aria-label={t("video.compare.aria")}
 >
 {!srcBefore && !srcAfter ? (
 <div className="flex h-full min-h-[180px] items-center justify-center text-[13px] text-[var(--text-muted)]">
 {t("video.compare.none")}
 </div>
 ) : compareMode ==="slider" && hasBoth ? (
 <div className="relative h-full w-full">
 <video
 src={srcBefore}
 className="absolute inset-0 h-full w-full object-contain"
 muted
 playsInline
 preload="metadata"
 aria-label={before}
 />
 <div
 className="absolute inset-0 overflow-hidden"
 style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
 >
 <video
 src={srcAfter}
 className="h-full w-full object-contain"
 muted
 playsInline
 preload="metadata"
 aria-label={after}
 />
 </div>
 <div
 className="pointer-events-none absolute inset-y-0 w-0.5 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
 style={{ left: `${position}%` }}
 aria-hidden
 />
 </div>
 ) : (
 <video
 src={showAfter && srcAfter ? srcAfter : srcBefore}
 className="h-full w-full object-contain"
 controls
 playsInline
 preload="metadata"
 aria-label={showAfter ? after : before}
 />
 )}

 {(srcBefore || srcAfter) && compareMode ==="toggle" && hasBoth ? (
 <div className="absolute bottom-[var(--space-2)] right-[var(--space-2)] flex gap-[var(--space-2)]">
 <button
 type="button"
 aria-pressed={!showAfter}
 aria-label={t("video.compare.show", { label: before })}
 className={cn(
"rounded-[var(--radius-sm)] px-[var(--space-2)] py-1 text-[11px]",
 glassFocusRing,
 glassMotion,
 !showAfter
 ?"bg-[var(--accent)] text-white"
 :"bg-[color-mix(in_srgb,var(--bg-2)_80%,transparent)] text-[var(--text-normal)]"
 )}
 onClick={() => setShowAfter(false)}
 >
 {before}
 </button>
 <button
 type="button"
 aria-pressed={showAfter}
 aria-label={t("video.compare.show", { label: after })}
 className={cn(
"rounded-[var(--radius-sm)] px-[var(--space-2)] py-1 text-[11px]",
 glassFocusRing,
 glassMotion,
 showAfter
 ?"bg-[var(--accent)] text-white"
 :"bg-[color-mix(in_srgb,var(--bg-2)_80%,transparent)] text-[var(--text-normal)]"
 )}
 onClick={() => setShowAfter(true)}
 >
 {after}
 </button>
 </div>
 ) : null}
 </div>

 {hasBoth && compareMode ==="slider" ? (
 <div className="border-t border-[var(--separator)] px-[var(--space-4)] py-[var(--space-3)]">
 <label htmlFor={sliderId} className="sr-only">
 {t("video.compare.position")}
 </label>
 <input
 id={sliderId}
 type="range"
 min={0}
 max={100}
 value={position}
 onChange={(e) => onSliderChange(Number(e.target.value))}
 className={cn(
"w-full accent-[var(--accent)]",
 glassFocusRing,
 motionControl
 )}
 aria-valuetext={`${Math.round(position)}% ${after}`}
 />
 <div className="mt-1 flex justify-between text-[10px] text-[var(--text-muted)]">
 <span>{before}</span>
 <span>{after}</span>
 </div>
 </div>
 ) : null}
 </GlassPanel>
 );
}
