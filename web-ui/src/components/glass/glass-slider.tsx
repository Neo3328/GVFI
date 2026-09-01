"use client";

/**
 * GVFI — Glass slider control.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { ComponentProps } from"react";
import { Slider } from"@/components/ui/slider";
import { cn } from"@/lib/utils";

export function GlassSlider({
 className,
 ...props
}: ComponentProps<typeof Slider>) {
 return (
 <Slider
 className={cn(
"[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:rounded-full",
"[&_[data-slot=slider-track]]:border [&_[data-slot=slider-track]]:border-[var(--glass-border)]",
"[&_[data-slot=slider-track]]:bg-[linear-gradient(165deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]",
"[&_[data-slot=slider-track]]:",
"[&_[data-slot=slider-track]]:shadow-[inset_1px_1px_0_rgba(255,255,255,0.2)]",
"[&_[data-slot=slider-range]]:bg-[linear-gradient(90deg,var(--accent),var(--accent-cyan))]",
"[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:rounded-full",
"[&_[data-slot=slider-thumb]]:border [&_[data-slot=slider-thumb]]:border-white/40",
"[&_[data-slot=slider-thumb]]:bg-[var(--text-strong)]",
"[&_[data-slot=slider-thumb]]:shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
 className
 )}
 {...props}
 />
 );
}
