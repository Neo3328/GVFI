/**
 * GVFI — Backward-compatible GlassButton alias.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { GlassButton, type GlassButtonProps } from"@/components/glass/glass-button";
import { useT } from"@/hooks/use-t";
import { cn } from"@/lib/utils";

type LegacyVariant = GlassButtonProps["variant"] |"outline" |"default" |"secondary";

type CuteButtonProps = Omit<GlassButtonProps,"variant"> & {
 variant?: LegacyVariant;
};

function mapVariant(variant?: LegacyVariant): GlassButtonProps["variant"] {
 if (!variant || variant ==="default" || variant ==="primary") return"primary";
 if (variant ==="outline" || variant ==="secondary") return"ghost";
 return variant;
}

/** Backward-compatible alias over `GlassButton` */
export function CuteButton({
 className,
 children,
 variant,
 size ="md",
 ...props
}: CuteButtonProps) {
 const t = useT();
 return (
 <GlassButton
 {...props}
 variant={mapVariant(variant)}
 size={size}
 data-slot="ios-button"
 className={cn(className)}
 >
 {children ?? t("common.continue")}
 </GlassButton>
 );
}

export const cuteButtonClassName ="";
export const cuteOutlineButtonClassName ="";
