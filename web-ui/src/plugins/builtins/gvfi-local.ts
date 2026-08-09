import { registerPlugin } from "@/plugins/registry";
import type { GvfiPluginManifest } from "@/plugins/types";
import { tr } from "@/lib/i18n/runtime";
import { getLocalRenderService } from "@/services/render-service";

export const GVFI_LOCAL_PLUGIN_ID = "gvfi-local";

export const gvfiLocalPlugin: GvfiPluginManifest = {
  id: GVFI_LOCAL_PLUGIN_ID,
  name: "GVFI Local Render",
  version: "1.0.0",
  get description() {
    return tr("plugin.local.description");
  },
  renderBackend: {
    id: "local",
    get label() {
      return tr("plugin.local.label");
    },
    kind: "local",
    createService: () => getLocalRenderService(),
  },
};

export function registerGvfiLocalPlugin(): void {
  registerPlugin(gvfiLocalPlugin);
}
