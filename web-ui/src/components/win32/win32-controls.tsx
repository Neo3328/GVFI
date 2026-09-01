/**
 * GVFI — Figma-style dark glass form controls.
 * FieldRow, GroupBox, Select, Number, Slider, Checkbox, Switch, Button.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── GroupBox: glass floating card with cyan heading ────────── */
export interface GroupBoxProps {
  title: string;
  badge?: string;
  children: ReactNode;
  className?: string;
}

export function GroupBox({ title, badge, children, className }: GroupBoxProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10",
        "bg-gradient-to-b from-white/[0.04] to-white/[0.02]",
        "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]",
        "backdrop-blur-xl",
        className
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-1.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-cyan)]">
          {title}
        </h3>
        {badge ? (
          <span className="rounded-full bg-[var(--accent)]/15 px-1.5 py-0 text-[8.5px] font-medium uppercase tracking-wider text-[var(--accent-cyan)] ring-1 ring-inset ring-[var(--accent)]/30">
            {badge}
          </span>
        ) : null}
      </header>
      <div className="flex flex-col gap-1.5 p-2.5">{children}</div>
    </section>
  );
}

/* ── FieldRow: label + control, flexible width ───────────────── */
export interface FieldRowProps {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FieldRow({ label, hint, children, className }: FieldRowProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-white/55">
          {label}
        </span>
        {hint ? (
          <span className="truncate text-[9px] text-white/35">{hint}</span>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ── Select: dark glass with chevron ──────────────────────────── */
export function WinSelect({
  value,
  onChange,
  options,
  className,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        disabled={disabled}
        title={selected?.label ?? value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-7 w-full appearance-none rounded-lg border border-white/10 bg-black/30 pl-2.5 pr-8 text-[11px] text-white outline-none transition-colors duration-150",
          "hover:border-white/20",
          "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30",
          "disabled:cursor-not-allowed disabled:opacity-40"
        )}
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            title={o.label}
            className="bg-[#0a0d16] text-white"
          >
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-white/40"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M3 4.5 6 7.5 9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ── Number input ─────────────────────────────────────────── */
export function WinNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  className,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-7 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 text-center text-[11px] tabular-nums text-white outline-none transition-colors duration-150 hover:border-white/20 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 disabled:opacity-40"
      />
      {suffix ? (
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-white/40">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

/* ── Slider with value label ──────────────────────────────── */
export function WinSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--accent)] to-[#7c3aed]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 size-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(10,132,255,0.6)] transition-transform"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/80">
        {value}
      </span>
    </div>
  );
}

/* ── Checkbox ─────────────────────────────────────────────── */
export function WinCheckbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 text-[12px] text-white/85",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-md border transition-all duration-150",
          checked
            ? "border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_8px_rgba(10,132,255,0.5)]"
            : "border-white/20 bg-black/30"
        )}
      >
        {checked ? (
          <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none">
            <path
              d="M2.5 6 5 8.5 9.5 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {label}
    </label>
  );
}

/* ── Toggle switch (gradient pill) ─────────────────────────────────── */
export function WinSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 text-[12px] text-white/85",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200",
          checked
            ? "border-[var(--accent)]/60 bg-gradient-to-r from-[var(--accent)] to-[#7c3aed] shadow-[0_0_10px_rgba(10,132,255,0.45)]"
            : "border-white/15 bg-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-[1px] size-[14px] rounded-full bg-white shadow-md transition-transform duration-200 ease-out",
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          )}
        />
      </button>
    </label>
  );
}

/* ── Button ───────────────────────────────────────────────── */
export function WinButton({
  children,
  onClick,
  variant = "default",
  disabled,
  loading,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-[11.5px] font-semibold transition-all duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" &&
          "border-transparent bg-gradient-to-r from-[var(--accent)] to-[#7c3aed] text-white shadow-[0_4px_14px_rgba(10,132,255,0.4)] hover:shadow-[0_6px_20px_rgba(10,132,255,0.55)] hover:brightness-110 active:brightness-95",
        variant === "default" &&
          "border-white/15 bg-white/[0.06] text-white/90 backdrop-blur-md hover:bg-white/[0.1] hover:border-white/25 active:bg-white/[0.04]",
        variant === "danger" &&
          "border-transparent bg-gradient-to-r from-[var(--danger)] to-[#b91c1c] text-white shadow-[0_4px_14px_rgba(220,38,38,0.4)] hover:brightness-110 active:brightness-95",
        className
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" strokeWidth={2.4} />
      ) : null}
      {children}
    </button>
  );
}