export type {
  GvfiPluginManifest,
  ModelPlugin,
  RenderBackendPlugin,
  UiPanelPlugin,
  RenderBackendId,
  CreateJobInput,
  JobPollResult,
} from "@/plugins/types";

export {
  registerPlugin,
  unregisterPlugin,
  getPlugin,
  getPlugins,
  getRenderBackendPlugins,
  getRenderBackendPlugin,
  getUiPanelPlugins,
  getModelPlugins,
} from "@/plugins/registry";

export {
  GVFI_LOCAL_PLUGIN_ID,
  gvfiLocalPlugin,
  registerGvfiLocalPlugin,
} from "@/plugins/builtins/gvfi-local";

export { ensurePluginsRegistered } from "@/services/render-service-factory";
