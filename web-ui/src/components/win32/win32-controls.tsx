/**
 * GVFI — Win32-style base controls: GroupBox, labeled field rows.
 * Opaque light-gray panels, 6px radius, 1px gray borders, no glass.
 */
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ── GroupBox ─────────────────────────────────────────────── */
export interface GroupBoxProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function GroupBox({ title, children, className }: GroupBoxProps) {
  return (
    <fieldset
      className={cn(
        "mb-2.5 rounded-[8px] border border-[#e0e7ef] bg-white p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <legend className="px-1.5 text-[12px] font-bold text-[#1565c0]">
        {title}
      </legend>
      <div className="flex flex-col gap-2">{children}</div>
    </fieldset>
  );
}

/* ── Labeled field row: label left, control right ─────────── */
export interface FieldRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function FieldRow({ label, children, className }: FieldRowProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label className="w-[88px] shrink-0 text-right text-[12px] text-[#333]">
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ── Win32-style select ───────────────────────────────────── */
export function WinSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-[26px] w-full rounded-[4px] border border-[#c0c0c0] bg-white px-2 text-[12px] text-[#1a1a1a]",
        "outline-none transition-colors duration-180 ease-out",
        "hover:border-[#a0a0a0] focus:border-[#0067c0] focus:ring-1 focus:ring-[#0067c0]",
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── Win32-style number input ─────────────────────────────── */
export function WinNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[26px] w-full rounded-[4px] border border-[#c0c0c0] bg-white px-2 text-[12px] text-[#1a1a1a] outline-none transition-colors duration-180 ease-out hover:border-[#a0a0a0] focus:border-[#0067c0] focus:ring-1 focus:ring-[#0067c0]"
      />
      {suffix ? (
        <span className="shrink-0 text-[11px] text-[#666]">{suffix}</span>
      ) : null}
    </div>
  );
}

/* ── Win32-style slider with value label ──────────────────── */
export function WinSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[4px] flex-1 cursor-pointer appearance-none rounded-full bg-[#d0d0d0] accent-[#0067c0]"
      />
      <span className="w-[36px] shrink-0 text-right text-[11px] text-[#333]">
        {value}
      </span>
    </div>
  );
}

/* ── Win32-style checkbox ─────────────────────────────────── */
export function WinCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-[#333]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[14px] w-[14px] cursor-pointer accent-[#0067c0]"
      />
      {label}
    </label>
  );
}

/* ── Win32-style toggle switch ────────────────────────────── */
export function WinSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#333]">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[18px] w-[34px] shrink-0 rounded-full border transition-colors duration-180 ease-out",
          checked ? "border-[#0067c0] bg-[#0067c0]" : "border-[#c0c0c0] bg-[#e8e8e8]"
        )}
      >
        <span
          className={cn(
            "absolute top-[1px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform duration-180 ease-out",
            checked ? "translate-x-[17px]" : "translate-x-[1px]"
          )}
        />
      </button>
      {label}
    </label>
  );
}

/* ── Win32-style button ───────────────────────────────────── */
export function WinButton({
  children,
  onClick,
  variant = "default",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-[28px] rounded-[4px] border px-3 text-[12px] font-medium transition-all duration-180 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-[#005a9e] bg-[#0067c0] text-white hover:bg-[#106ebe] active:bg-[#005a9e]",
        variant === "default" &&
          "border-[#c0c0c0] bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8] active:bg-[#dcdcdc]",
        variant === "danger" &&
          "border-[#a02020] bg-[#c42b1c] text-white hover:bg-[#d03525] active:bg-[#a02020]",
        className
      )}
    >
      {children}
    </button>
  );
}
