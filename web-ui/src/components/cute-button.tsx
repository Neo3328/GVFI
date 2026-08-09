import type { ComponentProps } from "react";
import { GlassButton, type GlassButtonProps } from "@/components/glass/glass-button";
import { cn } from "@/lib/utils";

type LegacyVariant = GlassButtonProps["variant"] | "outline" | "default" | "secondary";

type CuteButtonProps = Omit<GlassButtonProps, "variant"> & {
  variant?: LegacyVariant;
};

function mapVariant(variant?: LegacyVariant): GlassButtonProps["variant"] {
  if (!variant || variant === "default" || variant === "primary") return "primary";
  if (variant === "outline" || variant === "secondary") return "ghost";
  return variant;
}

/** Backward-compatible alias over `GlassButton` */
export function CuteButton({
  className,
  children = "继续",
  variant,
  size = "md",
  ...props
}: CuteButtonProps) {
  return (
    <GlassButton
      {...props}
      variant={mapVariant(variant)}
      size={size}
      data-slot="ios-button"
      className={cn(className)}
    >
      {children}
    </GlassButton>
  );
}

export const cuteButtonClassName = "";
export const cuteOutlineButtonClassName = "";
