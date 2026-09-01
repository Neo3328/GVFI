/**
 * GVFI — Blue-white base controls: GroupBox, labeled field rows.
 * White cards, thin gray borders, Material Blue accent (#1a73e8).
 */
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ── GroupBox: white card with bold title ─────────────────── */
export interface GroupBoxProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function GroupBox({ title, children, className }: GroupBoxProps) {
  return (
    <fieldset
      className={cn(
        "mb-2.5 rounded-[6px] border border-[#e2e6eb] bg-white p-3",
        className
      )}
    >
      <legend className="px-1 text-[13px] font-bold text-[#222]">
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
      <label className="w-[76px] shrink-0 text-right text-[12px] text-[#555]">
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ── Select ───────────────────────────────────────────────── */
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
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-[30px] w-full rounded-[5px] border border-[#d4d9df] bg-white px-2 text-[12px] text-[#1a1a1a]",
        "outline-none transition-colors duration-180 ease-out disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#999]",
        "hover:border-[#1a73e8] focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15",
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

/* ── Number / text input ──────────────────────────────────── */
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
    <div className={cn("flex items-center gap-1", className)}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[30px] w-full rounded-[5px] border border-[#d4d9df] bg-white px-2 text-[12px] text-[#1a1a1a] outline-none transition-colors duration-180 ease-out hover:border-[#1a73e8] focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 disabled:bg-[#f5f5f5] disabled:text-[#999]"
      />
      {suffix ? (
        <span className="shrink-0 text-[11px] text-[#888]">{suffix}</span>
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
  suffix,
  className,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex flex-1 items-center gap-1.5", className)}>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[4px] flex-1 cursor-pointer appearance-none rounded-full bg-[#dfe3e8] accent-[#1a73e8] disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="shrink-0 whitespace-nowrap text-right text-[11px] tabular-nums text-[#666]">
        {value}
        {suffix ?? ""}
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
        "flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[12px] text-[#333]",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[14px] w-[14px] cursor-pointer accent-[#1a73e8]"
      />
      {label}
    </label>
  );
}

/* ── Toggle switch ────────────────────────────────────────── */
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
        "flex cursor-pointer items-center gap-2 text-[12px] text-[#333]",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[18px] w-[34px] shrink-0 rounded-full border transition-colors duration-180 ease-out",
          checked
            ? "border-[#1a73e8] bg-[#1a73e8]"
            : "border-[#c4c9d0] bg-[#e4e7eb]"
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

/* ── Button ───────────────────────────────────────────────── */
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
        "inline-flex h-[32px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[5px] border px-3 text-[12px] font-medium transition-all duration-180 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-[#1a73e8] bg-[#1a73e8] text-white hover:bg-[#3a8af0] active:bg-[#155fc4]",
        variant === "default" &&
          "border-[#d4d9df] bg-[#f2f4f7] text-[#333] hover:border-[#1a73e8] hover:bg-[#eaf2fe] active:bg-[#dcebfd]",
        variant === "danger" &&
          "border-[#d4d9df] bg-white text-[#333] hover:border-[#e81123] hover:text-[#e81123] active:bg-[#fdecec]",
        className
      )}
    >
      {children}
    </button>
  );
}
