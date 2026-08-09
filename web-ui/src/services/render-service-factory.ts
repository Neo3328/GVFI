"use client";

import { getRenderBackendPlugin } from "@/plugins/registry";
import { registerGvfiLocalPlugin } from "@/plugins/builtins/gvfi-local";
import type { RenderBackendId } from "@/plugins/types";
import { useApiConfigStore } from "@/services/api-config-store";
import {
  createCloudRenderService,
  CloudRenderService,
} from "@/services/cloud-render-service";
import type { IRenderService } from "@/services/render-service";
import { getLocalRenderService } from "@/services/render-service";

let initialized = false;

/** 注册内置插件（幂等） */
export function ensurePluginsRegistered(): void {
  if (initialized) return;
  registerGvfiLocalPlugin();
  initialized = true;
}

/** 根据 API Profile 解析渲染服务 — UI 通过此入口访问，不直接 fetch */
export function resolveRenderService(profileKind?: "local" | "cloud"): IRenderService {
  ensurePluginsRegistered();

  const profile = useApiConfigStore.getState().getActiveProfile();
  const kind = profileKind ?? profile?.kind ?? "local";

  if (kind === "cloud") {
    return createCloudRenderService(profile?.baseUrl);
  }

  const plugin = getRenderBackendPlugin("local" as RenderBackendId);
  if (plugin) return plugin.createService();
  return getLocalRenderService();
}

export function getRenderServiceForBackend(id: RenderBackendId): IRenderService {
  ensurePluginsRegistered();
  const plugin = getRenderBackendPlugin(id);
  if (plugin) return plugin.createService();
  if (id === "local") return getLocalRenderService();
  if (id === "cloud") return new CloudRenderService();
  throw new Error(`未知渲染后端: ${id}`);
}

export type { IRenderService, CloudRenderService };
