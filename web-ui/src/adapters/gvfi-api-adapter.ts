/**
 * 低层 HTTP 适配器 — 隔离 fetch 与 JobSettings ↔ API payload 映射。
 * UI 与 Service 层不应直接调用 fetch。
 */
import {
  cancelJob as httpCancelJob,
  createJob as httpCreateJob,
  fetchHealth as httpFetchHealth,
  fetchJobLogs as httpFetchJobLogs,
  getJob as httpGetJob,
  listJobs as httpListJobs,
} from "@/lib/gvfi-api";
import type {
  CreateJobResponse,
  HealthResponse,
  JobLogsResponse,
  JobSettings,
  JobTask,
  JobsListResponse,
} from "@/lib/gvfi-types";

export interface GvfiApiAdapterOptions {
  /** 相对路径前缀，默认 `/api`（Next 代理） */
  apiPrefix?: string;
}

/** API 请求体 — 与 gvfi_api.py POST /jobs 对齐 */
export interface GvfiJobPayload {
  model: string;
  fps: number;
  superResolution: boolean;
  srModel: string;
  resolution: string;
  gpu: number;
  precision: string;
  quality: number;
  inputPath?: string;
}

export function toApiJobPayload(settings: JobSettings): GvfiJobPayload {
  return {
    model: settings.model,
    fps: settings.fps,
    superResolution: settings.superResolution,
    srModel: settings.srModel,
    resolution: settings.resolution,
    gpu: settings.gpu,
    precision: settings.precision,
    quality: settings.quality,
    inputPath: settings.inputPath,
  };
}

export function toJobSettings(payload: GvfiJobPayload): JobSettings {
  return {
    model: payload.model,
    fps: payload.fps as JobSettings["fps"],
    superResolution: payload.superResolution,
    srModel: payload.srModel as JobSettings["srModel"],
    resolution: payload.resolution as JobSettings["resolution"],
    gpu: payload.gpu,
    precision: payload.precision as JobSettings["precision"],
    quality: payload.quality,
    inputPath: payload.inputPath,
  };
}

export const gvfiApiAdapter = {
  fetchHealth(): Promise<HealthResponse> {
    return httpFetchHealth();
  },

  listJobs(): Promise<JobsListResponse> {
    return httpListJobs();
  },

  getJob(taskId: string): Promise<JobTask> {
    return httpGetJob(taskId);
  },

  fetchJobLogs(taskId: string): Promise<JobLogsResponse> {
    return httpFetchJobLogs(taskId);
  },

  createJob(options: {
    settings: JobSettings;
    file?: File | null;
  }): Promise<CreateJobResponse> {
    return httpCreateJob(options);
  },

  cancelJob(taskId: string): Promise<void> {
    return httpCancelJob(taskId);
  },
};

export type GvfiApiAdapter = typeof gvfiApiAdapter;
