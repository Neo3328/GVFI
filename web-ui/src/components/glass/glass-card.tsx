import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  glassSurface2,
  glassSurface3,
  glassSurface4,
  glassSurfaceChrome,
  glassTextBody,
  glassTextCaption,
  glassTextTitle,
  glassMotion,
} from "@/components/glass/glass-styles";
import { cn } from "@/lib/utils";

export const glassPanelVariants = cva("overflow-hidden", {
  variants: {
    variant: {
      default: glassSurface2,
      elevated: glassSurface3,
      inset: glassSurface4,
      chrome: glassSurfaceChrome,
    },
    padding: {
      none: "p-0",
      sm: "px-3 py-2",
      md: "px-4 py-3",
      lg: "px-5 py-4",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

type GlassCardProps = ComponentProps<"div"> & {
  interactive?: boolean;
  aiActive?: boolean;
};

export function GlassCard({
  className,
  interactive,
  aiActive,
  ...props
}: GlassCardProps) {
  return (
    <div
      data-slot="glass-card"
      className={cn(
        glassSurface2,
        "p-4 text-card-foreground",
        interactive &&
          "cursor-pointer hover:scale-[0.99] hover:shadow-[var(--lg-shadow-glass)] motion-reduce:hover:scale-100",
        aiActive &&
          "ring-1 ring-[color-mix(in_srgb,var(--lg-accent-ai)_35%,transparent)]",
        className
      )}
      {...props}
    />
  );
}

export function GlassCardHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-card-header"
      className={cn("mb-3 flex flex-col gap-1", className)}
      {...props}
    />
  );
}

export function GlassCardTitle({
  className,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="glass-card-title"
      className={cn(glassTextTitle, className)}
      {...props}
    />
  );
}

export function GlassCardDescription({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      data-slot="glass-card-description"
      className={cn(glassTextCaption, className)}
      {...props}
    />
  );
}

export function GlassCardContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-card-content"
      className={cn(glassTextBody, className)}
      {...props}
    />
  );
}

type GlassPanelProps = ComponentProps<"section"> &
  VariantProps<typeof glassPanelVariants> & {
    title?: string;
    description?: string;
    headerAction?: ReactNode;
  };

export function GlassPanel({
  title,
  description,
  headerAction,
  variant,
  padding,
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <section
      data-slot="glass-panel"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {title ? (
        <div className="flex items-start justify-between gap-2 px-1">
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {title}
            </h2>
            {description ? (
              <p className={cn(glassTextCaption, "mt-0.5 normal-case")}>
                {description}
              </p>
            ) : null}
          </div>
          {headerAction}
        </div>
      ) : null}
      <div
        className={cn(
          "glass-panel relative z-[1] flex flex-col gap-3",
          padding === "none"
            ? "p-0"
            : padding === "sm"
              ? "p-3"
              : padding === "lg"
                ? "p-5"
                : "p-4",
          variant === "elevated" && "lg-glass-3",
          variant === "inset" && "lg-glass-1",
          glassMotion
        )}
      >
        {children}
      </div>
    </section>
  );
}
