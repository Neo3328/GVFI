import type { ComponentProps } from"react";
import { cva, type VariantProps } from"class-variance-authority";
import { cn } from"@/lib/utils";
import { GlassStatusIndicator } from"@/components/glass/glass-status-indicator";

const statusIndicatorVariants = cva("", {
 variants: {
 size: {
 sm:"size-2",
 md:"size-2.5",
 lg:"size-3",
 },
 },
 defaultVariants: {
 size:"md",
 },
});

type StatusKind =
 |"idle"
 |"running"
 |"success"
 |"error"
 |"warning"
 |"online"
 |"offline";

function mapStatus(status: StatusKind):"idle" |"running" |"success" |"error" {
 if (status ==="running" || status ==="warning") return"running";
 if (status ==="success" || status ==="online") return"success";
 if (status ==="error" || status ==="offline") return"error";
 return"idle";
}

export type StatusIndicatorProps = ComponentProps<"span"> &
 VariantProps<typeof statusIndicatorVariants> & {
 status: StatusKind;
 label: string;
 pulse?: boolean;
 ai?: boolean;
 };

/** 带 aria-label 的状态指示点 */
export function StatusIndicator({
 status,
 label,
 pulse,
 ai,
 size,
 className,
 ...props
}: StatusIndicatorProps) {
 const mapped = mapStatus(status);
 return (
 <span
 role="status"
 aria-label={label}
 className={cn("inline-flex items-center", className)}
 {...props}
 >
 <GlassStatusIndicator
 status={mapped}
 pulse={pulse ?? mapped ==="running"}
 ai={ai}
 className={statusIndicatorVariants({ size })}
 />
 </span>
 );
}
