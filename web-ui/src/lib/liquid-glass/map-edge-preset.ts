import edgePresetJson from "@/lib/liquid-glass/presets/edge-liquid-glass-2026-08-03.json";
import type { GlassControls } from "@/lib/liquid-glass/types";

export interface EdgeLiquidGlassControls {
  refThickness: number;
  refFactor: number;
  refDispersion: number;
  refFresnelRange: number;
  refFresnelHardness: number;
  refFresnelFactor: number;
  glareFactor: number;
  glareHardness: number;
  blurRadius: number;
  tint: { r: number; g: number; b: number; a: number };
  shapeWidth: number;
  shapeHeight: number;
  shapeRadius: number;
  mergeRate: number;
}

export interface EdgeGlassShape {
  /** 参考宽度（适中缩放后） */
  refWidth: number;
  /** 参考高度 */
  refHeight: number;
  /** 圆角容器 */
  containerRadius: number;
  /** 导航栏圆角 */
  navRadius: number;
  /** 控制面板圆角 */
  panelRadius: number;
  /** 导航 pill 按钮字号 */
  navButtonSize: number;
  /** 控制区圆形按钮字号 */
  controlButtonSize: number;
}

const edgeControls = edgePresetJson.controls as EdgeLiquidGlassControls;

/** Edge 预设 → liquid-glass-js / CSS 参数 */
export function mapEdgePresetToGlassControls(
  controls: EdgeLiquidGlassControls = edgeControls
): GlassControls {
  const tintAlpha =
    controls.tint.a > 0 ? controls.tint.a / 255 : 0.06;

  return {
    edgeIntensity: controls.refFactor / 100,
    rimIntensity: controls.refFresnelFactor / 1000,
    baseIntensity: controls.glareFactor / 10000,
    edgeDistance: controls.refFresnelRange / 100,
    rimDistance: 0.75,
    baseDistance: controls.refThickness / 800,
    cornerBoost: controls.refFresnelHardness / 1000,
    rippleEffect: controls.refDispersion / 100,
    blurRadius: controls.blurRadius,
    tintOpacity: tintAlpha,
    tintColor: `rgb(${controls.tint.r}, ${controls.tint.g}, ${controls.tint.b})`,
    mergeRate: controls.mergeRate,
  };
}

/**
 * 原预设 350×200，UI 使用适中比例（约 72%）并压低高度基准。
 */
export function moderateShapeFromEdgePreset(
  controls: EdgeLiquidGlassControls = edgeControls
): EdgeGlassShape {
  const scale = 0.72;
  const refWidth = Math.round(controls.shapeWidth * scale);
  const refHeight = Math.round(controls.shapeHeight * scale * 0.32);
  const radiusRatio = controls.shapeRadius / controls.shapeHeight;

  return {
    refWidth,
    refHeight: Math.max(48, refHeight),
    containerRadius: Math.round(Math.min(refHeight * radiusRatio, 22)),
    navRadius: Math.round(Math.min(refHeight * radiusRatio * 0.9, 18)),
    panelRadius: Math.round(Math.min(refHeight * radiusRatio * 0.65, 14)),
    navButtonSize: 15,
    controlButtonSize: 22,
  };
}

export const EDGE_LIQUID_GLASS_PRESET = edgePresetJson;
export const EDGE_GLASS_CONTROLS = mapEdgePresetToGlassControls();
export const EDGE_GLASS_SHAPE = moderateShapeFromEdgePreset();
