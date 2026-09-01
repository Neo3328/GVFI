"use client";

import { create } from"zustand";
import { useEffect } from"react";
import { glassSurface3 } from"@/components/glass/glass-styles";
import { motionToastEnter } from"@/components/workspace/motion";
import { useT } from"@/hooks/use-t";
import { cn } from"@/lib/utils";

export type ToastVariant ="default" |"success" |"error" |"ai";

export interface ToastItem {
 id: string;
 title: string;
 description?: string;
 variant?: ToastVariant;
 durationMs?: number;
}

interface ToastStore {
 toasts: ToastItem[];
 push: (toast: Omit<ToastItem,"id">) => void;
 dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
 toasts: [],
 push: (toast) => {
 const id = crypto.randomUUID();
 set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
 const duration = toast.durationMs ?? 3200;
 window.setTimeout(() => {
 set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
 }, duration);
 },
 dismiss: (id) =>
 set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: Omit<ToastItem,"id">) {
 useToastStore.getState().push(message);
}

export function GlassToaster() {
 const t = useT();
 const toasts = useToastStore((s) => s.toasts);
 const dismiss = useToastStore((s) => s.dismiss);

 useEffect(() => {
 /* portal mount */
 }, []);

 return (
 <div
 aria-live="polite"
 className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2"
 >
 {toasts.map((item) => (
 <div
 key={item.id}
 className={cn(
 glassSurface3,
"pointer-events-auto p-3",
 motionToastEnter,
 item.variant ==="success" &&"border-[var(--success)]/30",
 item.variant ==="error" &&"border-[var(--danger)]/30",
 item.variant ==="ai" &&"border-[var(--accent-cyan)]/30"
 )}
 >
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="text-[13px] font-medium">{item.title}</p>
 {item.description ? (
 <p className="mt-0.5 text-[11px] text-muted-foreground">
 {item.description}
 </p>
 ) : null}
 </div>
 <button
 type="button"
 aria-label={t("glass.closeToast")}
 className={cn(
"rounded-[var(--radius-sm)] px-1 text-[11px] text-[var(--text-muted)]",
"hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
 )}
 onClick={() => dismiss(item.id)}
 >
 {t("glass.close")}
 </button>
 </div>
 </div>
 ))}
 </div>
 );
}
