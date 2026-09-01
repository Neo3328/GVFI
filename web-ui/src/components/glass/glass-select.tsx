"use client";

/**
 * GVFI — Glass select wrappers.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { ComponentProps } from"react";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select";
import { cn } from"@/lib/utils";

type GlassSelectProps = ComponentProps<typeof Select>;

/**
 * Prefer passing `items={{ value: label }}` so Select.Value shows
 * localized labels instead of raw option values when the popup is closed.
 */
export function GlassSelect({ ...props }: GlassSelectProps) {
 return <Select {...props} />;
}

export function GlassSelectTrigger({
 className,
 ...props
}: ComponentProps<typeof SelectTrigger>) {
 return (
 <SelectTrigger
 className={cn(
"glass-select h-9 w-full text-[13px] font-medium text-[var(--text-strong)] shadow-none",
 className
 )}
 {...props}
 />
 );
}

export function GlassSelectContent({
 className,
 ...props
}: ComponentProps<typeof SelectContent>) {
 return (
 <SelectContent className={cn("glass-option-menu p-1", className)} {...props} />
 );
}

export function GlassSelectItem({
 className,
 ...props
}: ComponentProps<typeof SelectItem>) {
 return (
 <SelectItem className={cn("glass-option-item text-[13px]", className)} {...props} />
 );
}

export { SelectValue as GlassSelectValue };
