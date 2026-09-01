/**
 * GVFI — Glass modal dialog.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, type ComponentProps, type ReactNode } from"react";
import { X } from"lucide-react";
import { GlassButton } from"@/components/glass/glass-button";
import { GlassIconButton } from"@/components/glass/glass-button";
import { glassSurface3, glassTextTitle } from"@/components/glass/glass-styles";
import { useT } from"@/hooks/use-t";
import { cn } from"@/lib/utils";

type GlassDialogProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 title: string;
 description?: string;
 children?: ReactNode;
 footer?: ReactNode;
 className?: string;
};

export function GlassDialog({
 open,
 onOpenChange,
 title,
 description,
 children,
 footer,
 className,
}: GlassDialogProps) {
 const t = useT();
 useEffect(() => {
 if (!open) return;
 const onKey = (event: KeyboardEvent) => {
 if (event.key ==="Escape") onOpenChange(false);
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [open, onOpenChange]);

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <button
 type="button"
 aria-label={t("glass.closeDialog")}
 className="absolute inset-0 bg-black/40"
 onClick={() => onOpenChange(false)}
 />
 <div
 role="dialog"
 aria-modal="true"
 aria-labelledby="glass-dialog-title"
 className={cn(
 glassSurface3,
"relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 p-5 duration-250 motion-reduce:animate-none",
 className
 )}
 >
 <div className="mb-4 flex items-start justify-between gap-3">
 <div>
 <h2 id="glass-dialog-title" className={glassTextTitle}>
 {title}
 </h2>
 {description ? (
 <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
 ) : null}
 </div>
 <GlassIconButton
 size="sm"
 aria-label={t("glass.close")}
 onClick={() => onOpenChange(false)}
 >
 <X />
 </GlassIconButton>
 </div>
 {children ? <div className="text-[13px]">{children}</div> : null}
 {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
 </div>
 </div>
 );
}

export function GlassDialogActions({
 className,
 ...props
}: ComponentProps<"div">) {
 return <div className={cn("flex justify-end gap-2", className)} {...props} />;
}

export { GlassButton as GlassDialogCloseButton };
