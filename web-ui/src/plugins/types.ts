import type { ReactNode } from "react";
import type { GvfiModel, JobSettings, JobTask } from "@/lib/gvfi-types";
import type { IRenderService } from "@/services/render-service";

/** 渲染后端标识 */
export type RenderBackendId = "local" | "cloud" | (string & {});

/** UI 面板插件 — 向 AppShell 注入可选面板 */
export interface UiPanelPlugin {
  id: string;
  title: string;
  /** 路由 slug，如 `process` */
  route?: string;
  order?: number;
  render: () => ReactNode;
}

/** AI 模型插件 — 扩展模型目录 */
export interface ModelPlugin {
  id: string;
  label: string;
  /** 静态模型列表；动态列表由 renderService / modelService 提供 */
  models?: GvfiModel[];
}

/** 渲染后端插件 — 绑定 Application Service */
export interface RenderBackendPlugin {
  id: RenderBackendId;
  label: string;
  kind: "local" | "cloud";
  /** 由插件提供的渲染服务实例 */
  createService: () => IRenderService;
}

/** 插件清单 */
export interface GvfiPluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  renderBackend?: RenderBackendPlugin;
  models?: ModelPlugin[];
  uiPanels?: UiPanelPlugin[];
}

export interface CreateJobInput {
  settings: JobSettings;
  file?: File | null;
}

export interface JobPollResult {
  task: JobTask;
  warnings?: string[];
}

export type { JobSettings, JobTask, GvfiModel };
