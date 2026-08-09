import type { ReactNode } from "react";
import { GlassPanel } from "@/components/glass/glass-card";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerAction?: ReactNode;
}

/** @deprecated Prefer `GlassPanel` directly in new code */
export function SectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
  headerAction,
}: SectionCardProps) {
  return (
    <GlassPanel
      title={title}
      description={description}
      headerAction={headerAction}
      className={className}
    >
      <div className={contentClassName}>{children}</div>
    </GlassPanel>
  );
}
