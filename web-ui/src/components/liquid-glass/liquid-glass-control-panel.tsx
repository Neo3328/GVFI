"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/hooks/use-t";
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

export interface LiquidGlassControlAction {
  id: string;
  label: string;
  type?: "circle" | "pill" | "rounded";
  size?: number;
  disabled?: boolean;
  onClick: () => void;
}

interface LiquidGlassControlPanelProps {
  actions: LiquidGlassControlAction[];
  className?: string;
  borderRadius?: number;
  tintOpacity?: number;
}

const PANEL_TINT = Math.min(
  0.18,
  (EDGE_GLASS_CONTROLS.tintOpacity ?? 0.06) * 2.2
);

/** WebGL 控制面板 — Edge 预设 + circle 播放/停止按钮 */
export function LiquidGlassControlPanel({
  actions,
  className,
  borderRadius = EDGE_GLASS_SHAPE.panelRadius,
  tintOpacity = PANEL_TINT,
}: LiquidGlassControlPanelProps) {
  const t = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    let controlPanel: GlassContainerInstance | null = null;
    let cancelled = false;

    void loadLiquidGlass().then(({ Container, Button }) => {
      if (cancelled || !hostRef.current) return;

      controlPanel = new Container({
        type: "rounded",
        borderRadius,
        tintOpacity,
      }) as GlassContainerInstance;

      actionsRef.current.forEach((action) => {
        const btn = new Button({
          text: action.label,
          size: action.size ?? EDGE_GLASS_SHAPE.controlButtonSize,
          type: action.type ?? "circle",
          tintOpacity: action.disabled
            ? EDGE_GLASS_CONTROLS.tintOpacity
            : PANEL_TINT * 1.6,
          onClick: () => {
            if (!action.disabled) action.onClick();
          },
        }) as GlassButtonInstance;

        if (action.disabled) {
          btn.element.style.opacity = "0.45";
          btn.element.style.pointerEvents = "none";
        }

        controlPanel!.addChild(btn);
        registerGlassInstance(btn);
      });

      mountGlassTree(hostRef.current, controlPanel);
    });

    return () => {
      cancelled = true;
      if (controlPanel) destroyGlassTree(controlPanel);
    };
  }, [actions, borderRadius, tintOpacity]);

  return (
    <div
      ref={hostRef}
      style={{
        maxWidth: Math.round(EDGE_GLASS_SHAPE.refWidth * 0.55),
        minHeight: EDGE_GLASS_SHAPE.refHeight,
      }}
      className={cn("mx-auto flex w-full items-center justify-center", className)}
      aria-label={t("liquid.controlAria")}
    />
  );
}
