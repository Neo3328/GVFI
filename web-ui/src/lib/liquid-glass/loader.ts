import html2canvas from "html2canvas";
import {
  initGlassControls,
  registerGlassInstance,
  unregisterGlassInstance,
} from "@/lib/liquid-glass/glass-controls";
import type { GlassContainerInstance } from "@/lib/liquid-glass/types";

export type LiquidGlassAPI = {
  Container: NonNullable<typeof window.Container>;
  Button: NonNullable<typeof window.Button>;
};

let loadPromise: Promise<LiquidGlassAPI> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-liquid-glass="${src}"]`
    );
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed: ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.liquidGlass = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Failed: ${src}`)));
    document.head.appendChild(script);
  });
}

export async function loadLiquidGlass(): Promise<LiquidGlassAPI> {
  if (typeof window === "undefined") {
    throw new Error("loadLiquidGlass() is client-only");
  }

  if (window.Container && window.Button) {
    return { Container: window.Container, Button: window.Button };
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      window.html2canvas = html2canvas;
      initGlassControls();

      await loadScript("/liquid-glass/container.js");
      await loadScript("/liquid-glass/button.js");

      if (!window.Container || !window.Button) {
        throw new Error("liquid-glass scripts did not expose Container/Button");
      }

      return { Container: window.Container, Button: window.Button };
    })();
  }

  return loadPromise;
}

export function destroyGlassTree(root: GlassContainerInstance) {
  const ContainerCtor = window.Container as
    | (typeof window.Container & { instances?: GlassContainerInstance[] })
    | undefined;

  const walk = (node: GlassContainerInstance) => {
    node.children?.forEach((child) => {
      if ("children" in child && Array.isArray(child.children)) {
        walk(child as GlassContainerInstance);
      }
      unregisterGlassInstance(child);
      if (ContainerCtor?.instances) {
        const idx = ContainerCtor.instances.indexOf(child as GlassContainerInstance);
        if (idx >= 0) ContainerCtor.instances.splice(idx, 1);
      }
    });
  };

  walk(root);
  unregisterGlassInstance(root);
  if (ContainerCtor?.instances) {
    const idx = ContainerCtor.instances.indexOf(root);
    if (idx >= 0) ContainerCtor.instances.splice(idx, 1);
  }
  root.element.remove();
}

export function mountGlassTree(
  host: HTMLElement,
  root: GlassContainerInstance
) {
  host.appendChild(root.element);
  registerGlassInstance(root);
  root.updateSizeFromDOM();
}
