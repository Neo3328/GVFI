"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  destroyGlassTree,
  loadLiquidGlass,
  mountGlassTree,
} from "@/lib/liquid-glass/loader";
import { registerGlassInstance } from "@/lib/liquid-glass/glass-controls";
import {
  EDGE_GLASS_CONTROLS,
  EDGE_GLASS_SHAPE,
} from "@/lib/liquid-glass/map-edge-preset";
import type {
  GlassButtonInstance,
  GlassContainerInstance,
} from "@/lib/liquid-glass/types";

export interface LiquidGlassNavItem {
  id: string;
  label: string;
}

interface LiquidGlassNavBarProps {
  items: LiquidGlassNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
  borderRadius?: number;
  tintOpacity?: number;
}

/** WebGL 导航栏 — Edge 预设 + liquid-glass-js 嵌套 pill 按钮 */
export function LiquidGlassNavBar({
  items,
  activeId,
  onNavigate,
  className,
  borderRadius = EDGE_GLASS_SHAPE.navRadius,
  tintOpacity = EDGE_GLASS_CONTROLS.tintOpacity,
}: LiquidGlassNavBarProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  useEffect(() => {
    let container: GlassContainerInstance | null = null;
    let cancelled = false;

    void loadLiquidGlass().then(({ Container, Button }) => {
      if (cancelled || !hostRef.current) return;

      container = new Container({
        type: "rounded",
        borderRadius,
        tintOpacity,
      }) as GlassContainerInstance;

      items.forEach((item) => {
        const navButton = new Button({
          text: item.label,
          size: EDGE_GLASS_SHAPE.navButtonSize,
          type: "pill",
          tintOpacity:
            item.id === activeId
              ? EDGE_GLASS_CONTROLS.tintOpacity! * 2.5
              : EDGE_GLASS_CONTROLS.tintOpacity,
          onClick: () => onNavigateRef.current(item.id),
        }) as GlassButtonInstance;
        container!.addChild(navButton);
        registerGlassInstance(navButton);
      });

      mountGlassTree(hostRef.current, container);
    });

    return () => {
      cancelled = true;
      if (container) destroyGlassTree(container);
    };
  }, [items, activeId, borderRadius, tintOpacity]);

  return (
    <div
      ref={hostRef}
      style={{
        maxWidth: EDGE_GLASS_SHAPE.refWidth,
        minHeight: EDGE_GLASS_SHAPE.refHeight,
      }}
      className={cn("mx-auto flex w-full items-center justify-center", className)}
      aria-label="Liquid Glass 导航"
    />
  );
}
