import type { GvfiPluginManifest, RenderBackendId } from "@/plugins/types";
import { tr } from "@/lib/i18n/runtime";

const plugins = new Map<string, GvfiPluginManifest>();

export function registerPlugin(manifest: GvfiPluginManifest): void {
  if (plugins.has(manifest.id)) {
    console.warn(`[plugins] ${tr("err.pluginsOverwrite", { id: manifest.id })}`);
  }
  plugins.set(manifest.id, manifest);
}

export function unregisterPlugin(id: string): void {
  plugins.delete(id);
}

export function getPlugin(id: string): GvfiPluginManifest | undefined {
  return plugins.get(id);
}

export function getPlugins(): GvfiPluginManifest[] {
  return Array.from(plugins.values());
}

export function getRenderBackendPlugins() {
  return getPlugins()
    .map((p) => p.renderBackend)
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
}

export function getRenderBackendPlugin(id: RenderBackendId) {
  return getRenderBackendPlugins().find((b) => b.id === id);
}

export function getUiPanelPlugins() {
  return getPlugins().flatMap((p) => p.uiPanels ?? []);
}

export function getModelPlugins() {
  return getPlugins().flatMap((p) => p.models ?? []);
}
