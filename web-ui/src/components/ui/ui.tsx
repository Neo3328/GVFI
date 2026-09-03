/**
 * GVFI — 统一实体设计系统控件（唯一 UI 基元层）。
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * 设计原则：
 *  - 实体不透明深色，零玻璃 / 磨砂 / 光晕，样式全部来自 workbench.css 的 wb- 类。
 *  - 点击事件只绑定在外层 button/控件上，内部图标仅 aria-hidden 展示并固定占位。
 *  - 不依赖任何在线字体图标 / CDN / emoji；图标由调用方以 @/icons 本地 SVG 传入。
 */

"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Button */
type Variant = "default" | "primary" | "danger" | "ghost";
type Size = "xs" | "sm" | "md";

const VARIANT_CLASS: Record<Variant, string> = {
  default: "",
  primary: "wb-primary",
  danger: "wb-danger",
  ghost: "wb-ghost",
};

const SIZE_CLASS: Record<Size, string> = {
  xs: "wb-size-xs",
  sm: "wb-size-sm",
  md: "",
};

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "default",
  size = "md",
  leftIcon,
  fullWidth,
  className,
  children,
  ...rest
}: BtnProps) {
  return (
    <button
      type="button"
      className={cn(
        "wb-btn wb-interactive",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && "wb-block",
        className
      )}
      {...rest}
    >
      {leftIcon ? (
        <span
          aria-hidden
          className="inline-flex shrink-0 items-center justify-center"
          style={{ width: 15, height: 15 }}
        >
          {leftIcon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  label,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("wb-icon-btn wb-interactive", className)}
      {...rest}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center"
        style={{ width: 16, height: 16 }}
      >
        {children}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------- Card */
export function Card({
  title,
  description,
  action,
  children,
  flush,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("wb-card", flush && "pad-flush", className)}>
      {title || action ? (
        <header className="wb-card-head">
          <div className="min-w-0">
            {title ? <div className="wb-card-title">{title}</div> : null}
            {description ? <div className="wb-card-desc">{description}</div> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(flush ? "wb-card-body flush" : "wb-card-body", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Inputs */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("wb-input wb-interactive", className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("wb-textarea wb-interactive", className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("wb-select wb-interactive", className)} {...rest}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ Switch */
export function Switch({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      data-on={checked}
      className="wb-switch wb-interactive"
      onClick={() => onChange(!checked)}
    >
      <span className="wb-knob" aria-hidden />
    </button>
  );
}

/* ---------------------------------------------------------------- Checkbox */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn("wb-check", disabled && "wb-disabled")}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ Slider */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="range"
      className="wb-range"
      aria-label={ariaLabel}
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/* ------------------------------------------------------------------- Badge */
export function Badge({
  tone = "default",
  children,
  className,
}: {
  tone?: "default" | "ok" | "warn" | "err" | "info";
  children: ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === "default" ? "" : `wb-${tone === "ok" ? "ok" : tone === "warn" ? "warn" : tone === "err" ? "err" : "info"}`;
  return <span className={cn("wb-badge", toneClass, className)}>{children}</span>;
}

/* -------------------------------------------------------------------- Tabs */
export interface TabItem {
  id: string;
  label: ReactNode;
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="wb-tabs">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={cn("wb-tab wb-interactive", value === item.id && "wb-active")}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Empty */
export function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="wb-empty">
      {icon ? (
        <span
          aria-hidden
          className="inline-flex items-center justify-center"
          style={{ width: 34, height: 34 }}
        >
          {icon}
        </span>
      ) : null}
      <div className="wb-empty-title">{title}</div>
      {sub ? <div className="wb-empty-sub">{sub}</div> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- LogBox */
export function LogBox({
  lines,
  error,
  maxHeight = 220,
  emptyText,
}: {
  lines: string[];
  error?: boolean;
  maxHeight?: number;
  emptyText?: string;
}) {
  return (
    <div className="wb-logbox wb-scroll" style={{ maxHeight }}>
      {lines.length === 0 ? (
        <p className="wb-logbox-line wb-mute">{emptyText ?? "—"}</p>
      ) : (
        lines.map((line, idx) => (
          <div
              key={`${idx}-${line.slice(0, 12)}`}
              className={cn("wb-logbox-line", error && "is-err")}
            >
              {line}
            </div>
        ))
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Progress */
export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="wb-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="wb-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
