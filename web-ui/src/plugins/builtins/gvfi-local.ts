import { registerPlugin } from "@/plugins/registry";
import type { GvfiPluginManifest } from "@/plugins/types";
import { getLocalRenderService } from "@/services/render-service";

export const GVFI_LOCAL_PLUGIN_ID = "gvfi-local";

export const gvfiLocalPlugin: GvfiPluginManifest = {
  id: GVFI_LOCAL_PLUGIN_ID,
  name: "GVFI Local Render",
  version: "1.0.0",
  description: "本地 GVFI API（gvfi_api.py）渲染后端",
  renderBackend: {
    id: "local",
    label: "本地渲染",
    kind: "local",
    createService: () => getLocalRenderService(),
  },
};

export function registerGvfiLocalPlugin(): void {
  registerPlugin(gvfiLocalPlugin);
}
