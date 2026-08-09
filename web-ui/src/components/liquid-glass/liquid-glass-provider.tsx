"use client";

import { useEffect } from "react";
import { initGlassControls } from "@/lib/liquid-glass/glass-controls";
import { loadLiquidGlass } from "@/lib/liquid-glass/loader";
import "@/lib/liquid-glass/glass.css";

interface LiquidGlassProviderProps {
  children: React.ReactNode;
}

/** 预加载 WebGL 玻璃库并初始化全局 glassControls */
export function LiquidGlassProvider({ children }: LiquidGlassProviderProps) {
  useEffect(() => {
    initGlassControls();
    void loadLiquidGlass().catch((err) => {
      console.warn("[liquid-glass] preload failed:", err);
    });
  }, []);

  return children;
}
