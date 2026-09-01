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
        "mb-2.5 rounded-[6px] border border-[#3b3b40] bg-[#29292d] p-3.5 shadow-none",
        className
      )}
    >
      <legend className="px-1.5 text-[12px] font-semibold text-[#b9a7ff]">
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
      <label className="w-[88px] shrink-0 text-right text-[12px] text-[#b8b8be]">
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
        "h-[28px] w-full rounded-[5px] border border-[#4a4a50] bg-[#202023] px-2 text-[12px] text-[#f4f4f5]",
        "outline-none transition-colors duration-180 ease-out",
        "hover:border-[#77717f] focus:border-[#7561ff] focus:ring-1 focus:ring-[#7561ff]",
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
        className="h-[28px] w-full rounded-[5px] border border-[#4a4a50] bg-[#202023] px-2 text-[12px] text-[#f4f4f5] outline-none transition-colors duration-180 ease-out hover:border-[#77717f] focus:border-[#7561ff] focus:ring-1 focus:ring-[#7561ff]"
      />
      {suffix ? (
        <span className="shrink-0 text-[11px] text-[#8d8d95]">{suffix}</span>
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
        className="h-[4px] flex-1 cursor-pointer appearance-none rounded-full bg-[#4a4a50] accent-[#7561ff]"
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
    <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-[#c7c7cc]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[14px] w-[14px] cursor-pointer accent-[#7561ff]"
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
    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#c7c7cc]">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[18px] w-[34px] shrink-0 rounded-full border transition-colors duration-180 ease-out",
          checked ? "border-[#7561ff] bg-[#7561ff]" : "border-[#55555c] bg-[#3a3a40]"
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
        "h-[30px] rounded-[5px] border px-3 text-[12px] font-medium transition-all duration-180 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-[#7561ff] bg-[#7561ff] text-white hover:bg-[#8473ff] active:bg-[#6250e8]",
        variant === "default" &&
          "border-[#4a4a50] bg-[#35353a] text-[#e5e5e8] hover:bg-[#414149] active:bg-[#2f2f34]",
        variant === "danger" &&
          "border-[#a64646] bg-[#8f3d46] text-white hover:bg-[#a44b55] active:bg-[#74323a]",
        className
      )}
    >
      {children}
    </button>
  );
}
