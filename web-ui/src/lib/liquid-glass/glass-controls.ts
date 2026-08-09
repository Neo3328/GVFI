import type { GlassControls, GlassInstance } from "@/lib/liquid-glass/types";
import { EDGE_GLASS_CONTROLS } from "@/lib/liquid-glass/map-edge-preset";

export const DEFAULT_GLASS_CONTROLS: GlassControls = EDGE_GLASS_CONTROLS;

/** 将 glassControls 写入 CSS 变量，供 .glass-container / .glass-button 使用 */
export function applyGlassControlsToDocument(
  controls: GlassControls = DEFAULT_GLASS_CONTROLS
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--glass-edge-intensity", String(controls.edgeIntensity));
  root.style.setProperty("--glass-rim-intensity", String(controls.rimIntensity));
  root.style.setProperty("--glass-blur-radius", `${controls.blurRadius}px`);
  root.style.setProperty("--glass-tint-opacity", String(controls.tintOpacity));
  if (controls.tintColor) {
    root.style.setProperty("--glass-tint-color", controls.tintColor);
  }
}

export function initGlassControls(
  partial?: Partial<GlassControls>
): GlassControls {
  const merged = { ...DEFAULT_GLASS_CONTROLS, ...partial };
  if (typeof window !== "undefined") {
    window.glassControls = merged;
  }
  applyGlassControlsToDocument(merged);
  return merged;
}

export function setGlassControls(partial: Partial<GlassControls>) {
  const current =
    typeof window !== "undefined" && window.glassControls
      ? window.glassControls
      : DEFAULT_GLASS_CONTROLS;
  const next = { ...current, ...partial };
  initGlassControls(next);
  updateAllGlassInstances();
  return next;
}

/** 更新所有玻璃实例（CSS 层 + 可选 WebGL uniform） */
export function updateAllGlassInstances(
  instances: GlassInstance[] = getRegisteredInstances()
) {
  const controls =
    (typeof window !== "undefined" && window.glassControls) ||
    DEFAULT_GLASS_CONTROLS;

  applyGlassControlsToDocument(controls);

  instances.forEach((instance) => {
    if (instance.element) {
      instance.element.style.setProperty(
        "--glass-tint-opacity",
        String(controls.tintOpacity)
      );
    }

    const gl = instance.gl_refs?.gl;
    if (!gl) {
      instance.render?.();
      return;
    }

    const refs = instance.gl_refs!;
    if (refs.edgeIntensityLoc) {
      gl.uniform1f(refs.edgeIntensityLoc as WebGLUniformLocation, controls.edgeIntensity);
    }
    if (refs.rimIntensityLoc) {
      gl.uniform1f(refs.rimIntensityLoc as WebGLUniformLocation, controls.rimIntensity);
    }
    if (refs.blurRadiusLoc) {
      gl.uniform1f(refs.blurRadiusLoc as WebGLUniformLocation, controls.blurRadius);
    }
    if (refs.tintOpacityLoc) {
      gl.uniform1f(
        refs.tintOpacityLoc as WebGLUniformLocation,
        instance.element?.classList.contains("glass-button")
          ? (instance as { tintOpacity?: number }).tintOpacity ?? controls.tintOpacity
          : controls.tintOpacity
      );
    }
    instance.render?.();
  });
}

const registry: GlassInstance[] = [];

export function registerGlassInstance(instance: GlassInstance) {
  if (!registry.includes(instance)) registry.push(instance);
}

export function unregisterGlassInstance(instance: GlassInstance) {
  const idx = registry.indexOf(instance);
  if (idx >= 0) registry.splice(idx, 1);
}

export function getRegisteredInstances(): GlassInstance[] {
  return registry.slice();
}
