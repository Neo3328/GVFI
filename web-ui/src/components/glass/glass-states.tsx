/**
 * GVFI — Glass empty / loading / error states.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import type { ComponentProps, ReactNode } from"react";
import { Loader2 } from"lucide-react";
import { GlassButton } from"@/components/glass/glass-button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from"@/components/glass/glass-card";
import { useT } from"@/hooks/use-t";
import { cn } from"@/lib/utils";

type StateBaseProps = {
 title: string;
 description?: string;
 icon?: ReactNode;
 action?: ReactNode;
 className?: string;
};

function GlassStateBase({
 title,
 description,
 icon,
 action,
 className,
}: StateBaseProps) {
 return (
 <GlassCard
 className={cn("flex flex-col items-center px-6 py-8 text-center", className)}
 role="status"
 >
 {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
 <GlassCardHeader className="items-center">
 <GlassCardTitle className="text-[15px]">{title}</GlassCardTitle>
 {description ? (
 <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>
 ) : null}
 </GlassCardHeader>
 {action ? <GlassCardContent>{action}</GlassCardContent> : null}
 </GlassCard>
 );
}

export function GlassEmptyState({
 title,
 description,
 icon,
 action,
 className,
}: Partial<StateBaseProps> & { className?: string }) {
 const t = useT();
 return (
 <GlassStateBase
 title={title ?? t("glass.empty")}
 description={description}
 icon={icon}
 action={action}
 className={className}
 />
 );
}

export function GlassLoadingState({
 title,
 description,
 className,
}: Omit<StateBaseProps,"icon" |"title"> & { title?: string }) {
 const t = useT();
 return (
 <GlassStateBase
 title={title ?? t("glass.loading")}
 description={description}
 className={className}
 icon={
 <Loader2
 className="size-6 motion-safe:animate-spin motion-reduce:animate-none"
 aria-hidden
 />
 }
 />
 );
}

export function GlassErrorState({
 title,
 description,
 onRetry,
 className,
}: Omit<StateBaseProps,"icon" |"action" |"title"> & {
 title?: string;
 onRetry?: () => void;
}) {
 const t = useT();
 return (
 <GlassStateBase
 title={title ?? t("glass.error")}
 description={description}
 className={className}
 action={
 onRetry ? (
 <GlassButton
 variant="glass"
 size="sm"
 onClick={onRetry}
 aria-label={t("glass.retryAria")}
 >
 {t("glass.retry")}
 </GlassButton>
 ) : undefined
 }
 />
 );
}

export function GlassSkeleton({
 className,
 ...props
}: ComponentProps<"div">) {
 return (
 <div
 className={cn(
"animate-pulse rounded-[10px] bg-[color-mix(in_srgb,var(--lg-glass-fill)_50%,transparent)] motion-reduce:animate-none",
 className
 )}
 {...props}
 />
 );
}
