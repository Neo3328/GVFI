/**
 * GVFI — Liquid Glass button with iOS native press / spring release.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { Button as ButtonPrimitive } from"@base-ui/react/button";
import { cva, type VariantProps } from"class-variance-authority";
import type { ComponentProps, ReactNode } from"react";
import { glassFocusRing } from"@/components/glass/glass-styles";
import { cn } from"@/lib/utils";

/** Large-curvature liquid glass face — specular / frost live in ios-liquid-button.css */
const liquidGlassSurface = cn(
"ios-lg-btn",
"relative isolate border border-white/22",
"bg-[color-mix(in_srgb,var(--bg-2)_68%,rgba(255,255,255)_14%)]"
);

export const glassButtonVariants = cva(
 cn(
"inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-semibold select-none",
"tracking-[-0.01em]",
"disabled:pointer-events-none disabled:saturate-50 disabled:brightness-75 disabled:opacity-55",
 glassFocusRing
 ),
 {
 variants: {
 variant: {
 primary: cn(
 liquidGlassSurface,
"border-transparent text-white",
"bg-[linear-gradient(180deg,#409cff_0%,#0a84ff_100%)]"
 ),
 ghost: cn(
"ios-lg-btn ios-lg-btn--ghost rounded-[var(--radius-button)] border border-transparent",
"text-[var(--text-strong)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
 ),
 glass: cn(liquidGlassSurface,"text-[var(--glass-label)]"),
 clear: cn(
 liquidGlassSurface,
"border-white/14 bg-[var(--glass-fill-clear)]",
"text-[var(--glass-label)]"
 ),
 destructive: cn(
 liquidGlassSurface,
"border-[color-mix(in_srgb,var(--danger)_35%,transparent)]",
"bg-[color-mix(in_srgb,var(--danger)_22%,var(--bg-2))]",
"text-[color-mix(in_srgb,var(--danger)_72%,white)]"
 ),
 ai: cn(
 liquidGlassSurface,
"border-[color-mix(in_srgb,var(--accent)_40%,transparent)]",
"bg-[color-mix(in_srgb,var(--accent)_16%,var(--bg-2))]",
"text-[color-mix(in_srgb,var(--accent)_55%,white)]"
 ),
 },
 size: {
 xs:"h-8 min-w-8 rounded-[var(--control-radius)] px-3.5 text-[11px]",
 sm:"h-9 min-w-9 rounded-[var(--control-radius)] px-4 text-[12px]",
 md:"h-11 min-w-11 rounded-[var(--control-radius)] px-5 text-[13px]",
 lg:"h-12 min-w-12 rounded-[var(--control-radius)] px-6 text-[15px]",
 },
 },
 defaultVariants: {
 variant:"primary",
 size:"md",
 },
 }
);

export type GlassButtonProps = ButtonPrimitive.Props &
 VariantProps<typeof glassButtonVariants> & {
 children?: ReactNode;
 };

export function GlassButton({
 className,
 variant,
 size,
 children,
 ...props
}: GlassButtonProps) {
 return (
 <ButtonPrimitive
 data-slot="glass-button"
 className={cn(glassButtonVariants({ variant, size }), className)}
 {...props}
 >
 <span
 className={cn(
"relative z-[2] inline-flex items-center justify-center gap-1.5",
"[&_svg]:pointer-events-none [&_svg]:shrink-0",
"[&_svg:not([class*='size-'])]:size-4",
 size ==="xs" &&"[&_svg:not([class*='size-'])]:size-3.5",
 size ==="lg" &&"[&_svg:not([class*='size-'])]:size-4",
"drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
 )}
 >
 {children}
 </span>
 </ButtonPrimitive>
 );
}

const iconButtonVariants = cva(
 cn(glassFocusRing,"ios-lg-btn"),
 {
 variants: {
 variant: {
 default:
"border border-transparent text-[var(--text-strong)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]",
 glass: cn(liquidGlassSurface,"text-[var(--text-strong)]"),
 primary:
"border border-primary/20 bg-primary/15 text-[var(--text-strong)] hover:bg-primary/25",
 },
 size: {
 sm:"size-9 rounded-[var(--control-radius)] [&_svg]:size-4",
 md:"size-11 rounded-[var(--control-radius)] [&_svg]:size-5",
 lg:"size-12 rounded-[var(--control-radius)] [&_svg]:size-5",
 },
 },
 defaultVariants: {
 variant:"default",
 size:"md",
 },
 }
);

export function GlassIconButton({
 className,
 variant,
 size,
 children,
 ...props
}: ButtonPrimitive.Props &
 VariantProps<typeof iconButtonVariants> & { children?: ReactNode }) {
 return (
 <ButtonPrimitive
 data-slot="glass-icon-button"
 className={cn(
"inline-flex items-center justify-center disabled:opacity-40",
 iconButtonVariants({ variant, size }),
 className
 )}
 {...props}
 >
 <span className="relative z-[2] inline-flex drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
 {children}
 </span>
 </ButtonPrimitive>
 );
}

export type GlassIconButtonProps = ComponentProps<typeof GlassIconButton>;
