import type { ComponentProps } from"react";
import { cn } from"@/lib/utils";

type StatusKind ="idle" |"running" |"success" |"error" |"cancelled" |"pending" |"succeeded" |"failed";

function normalizeStatus(status: StatusKind):"idle" |"running" |"success" |"error" {
 if (status ==="running" || status ==="pending") return"running";
 if (status ==="success" || status ==="succeeded") return"success";
 if (status ==="error" || status ==="failed" || status ==="cancelled") return"error";
 return"idle";
}

type GlassStatusIndicatorProps = ComponentProps<"span"> & {
 status: StatusKind;
 pulse?: boolean;
 ai?: boolean;
};

export function GlassStatusIndicator({
 status,
 pulse,
 ai,
 className,
 ...props
}: GlassStatusIndicatorProps) {
 const kind = normalizeStatus(status);
 return (
 <span
 data-slot="glass-status-indicator"
 aria-hidden
 className={cn(
"relative inline-flex size-2 shrink-0 rounded-full",
 kind ==="idle" &&"bg-muted-foreground/50",
 kind ==="running" && (ai ?"bg-[var(--lg-accent-ai)]" :"bg-primary"),
 kind ==="success" &&"bg-[var(--lg-success)]",
 kind ==="error" &&"bg-destructive",
 pulse && kind ==="running" &&"motion-safe:animate-pulse",
 ai && kind ==="running" &&"shadow-[0_0_8px_rgba(0,212,255,0.45)]",
 className
 )}
 {...props}
 />
 );
}
