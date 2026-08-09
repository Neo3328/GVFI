import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/glass/glass-card";
import { cn } from "@/lib/utils";

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

export function GlassEmptyState(props: StateBaseProps) {
  return <GlassStateBase {...props} />;
}

export function GlassLoadingState({
  title = "加载中",
  description,
  className,
}: Omit<StateBaseProps, "icon">) {
  return (
    <GlassStateBase
      title={title}
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
  title = "出现错误",
  description,
  onRetry,
  className,
}: Omit<StateBaseProps, "icon" | "action"> & { onRetry?: () => void }) {
  return (
    <GlassStateBase
      title={title}
      description={description}
      className={className}
      action={
        onRetry ? (
          <GlassButton variant="glass" size="sm" onClick={onRetry} aria-label="重试操作">
            重试
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
