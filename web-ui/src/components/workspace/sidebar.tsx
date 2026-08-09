"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassFocusRing, glassMotion } from "@/components/glass/glass-styles";
import { motionPanel } from "@/components/workspace/motion";
import { useT } from "@/hooks/use-t";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  ariaLabel?: string;
}

export const sidebarVariants = cva(
  cn("flex shrink-0 flex-col", glassMotion),
  {
    variants: {
      width: {
        sm: "w-[72px]",
        md: "w-52",
        lg: "w-56",
      },
      collapsed: {
        true: "w-[72px]",
        false: "",
      },
      tone: {
        glass: "glass-panel",
        rail: cn(
          "glass-panel border-[var(--glass-border)]",
          "rounded-none border-y-0 border-l-0 lg:rounded-[var(--panel-radius)] lg:border",
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02)),color-mix(in_srgb,var(--bg-2)_calc(var(--glass-opacity)*78%),transparent)]",
          "lg:bg-clip-padding",
          "lg:shadow-[var(--lg-shadow-glass)]"
        ),
      },
    },
    defaultVariants: {
      width: "md",
      collapsed: false,
      tone: "glass",
    },
  }
);

export interface SidebarProps extends VariantProps<typeof sidebarVariants> {
  items: SidebarNavItem[];
  brand?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  iconOnly?: boolean;
}

export function Sidebar({
  items,
  brand,
  footer,
  width,
  collapsed,
  tone,
  className,
  iconOnly = false,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useT();
  const compact = iconOnly || collapsed || width === "sm";

  return (
    <aside
      data-slot="sidebar"
      aria-label={t("chrome.primaryNavAria")}
      className={cn(
        sidebarVariants({ width: compact ? "sm" : width, collapsed: compact, tone }),
        "overflow-hidden",
        className
      )}
    >
      <div
        data-slot="sidebar-scroll"
        className="relative z-[1] flex min-h-0 flex-1 flex-col"
      >
        {brand ? (
          <div className="border-b border-[var(--glass-border)] px-[var(--space-3)] py-[var(--space-4)]">
            {brand}
          </div>
        ) : null}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-[var(--space-1)] p-[var(--space-2)]",
            compact && "items-center"
          )}
        >
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const classNames = cn(
              compact
                ? "glass-option-chip size-11 flex-col gap-1 rounded-[var(--control-radius)] px-0 text-[10px]"
                : "glass-option flex min-h-9 items-center gap-[var(--space-2)] rounded-[var(--control-radius)] px-[var(--space-3)] py-[var(--space-2)] text-[13px]",
              "font-semibold",
              glassFocusRing,
              glassMotion,
              "active:scale-[0.98]",
              active && "is-active",
              active
                ? "text-[var(--accent)]"
                : "text-[var(--text-muted)]",
              !compact &&
                active &&
                "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.ariaLabel ?? item.label}
                aria-current={active ? "page" : undefined}
                title={compact ? item.label : undefined}
                className={classNames}
              >
                {Icon ? (
                  <Icon className="size-[18px] shrink-0" strokeWidth={2.25} aria-hidden />
                ) : null}
                {!compact ? (
                  <span className="truncate font-semibold">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        {footer ? (
          <div
            className={cn(
              "border-t border-[var(--glass-border)] p-[var(--space-2)]",
              compact && "flex flex-col items-center",
              motionPanel
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
