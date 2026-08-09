import { getModelPlugins } from "@/plugins/registry";
import { getLocalRenderService } from "@/services/render-service";
import type { GvfiModel, HealthResponse } from "@/lib/gvfi-types";

export interface ModelCatalogEntry extends GvfiModel {
  source: "health" | "plugin";
  pluginId?: string;
}

/** 聚合本地 health + 插件注册的模型 */
export class ModelService {
  async listModels(): Promise<ModelCatalogEntry[]> {
    const health = await getLocalRenderService().checkHealth();
    const fromHealth = health.models.map((m) => ({
      ...m,
      source: "health" as const,
    }));

    const fromPlugins = getModelPlugins().flatMap((plugin) =>
      (plugin.models ?? []).map((m) => ({
        ...m,
        source: "plugin" as const,
        pluginId: plugin.id,
      }))
    );

    const merged = new Map<string, ModelCatalogEntry>();
    for (const entry of [...fromHealth, ...fromPlugins]) {
      merged.set(entry.id, entry);
    }
    return Array.from(merged.values());
  }

  async getHealth(): Promise<HealthResponse> {
    return getLocalRenderService().checkHealth();
  }
}

let modelServiceSingleton: ModelService | null = null;

export function getModelService(): ModelService {
  if (!modelServiceSingleton) modelServiceSingleton = new ModelService();
  return modelServiceSingleton;
}
