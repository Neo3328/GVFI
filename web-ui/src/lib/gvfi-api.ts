/**
 * GVFI — HTTP client for local RIFE API.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import {
  apiErrorMessage,
  apiFetch,
  GVFI_DIRECT_ORIGIN,
  readJson,
} from "@/lib/api-client";
import type {
  AppearanceSettingsResponse,
  CreateJobResponse,
  HealthResponse,
  JobLogsResponse,
  JobResponse,
  JobSettings,
  JobTask,
  JobsListResponse,
} from "@/lib/gvfi-types";

export function mediaUrlForPath(absPath: string, preferDirect = false): string {
  const query = `path=${encodeURIComponent(absPath.trim())}`;
  if (preferDirect) {
    return `${GVFI_DIRECT_ORIGIN}/media?${query}`;
  }
  return `/api/media?${query}`;
}

export async function fetchAppearanceSettings(): Promise<AppearanceSettingsResponse["pyqt"]> {
  const response = await apiFetch("/settings/appearance", { cache: "no-store" });
  const payload = await readJson<AppearanceSettingsResponse & { error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, `外观设置读取失败 (${response.status})`));
  }
  return payload.pyqt ?? {};
}

export async function fetchJobLogs(taskId: string): Promise<JobLogsResponse> {
  const response = await apiFetch(`/jobs/${encodeURIComponent(taskId)}/logs`, {
    cache: "no-store",
  });
  const payload = await readJson<JobLogsResponse & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, `日志读取失败 (${response.status})`));
  }
  return payload;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await apiFetch("/health", { cache: "no-store" });
  const payload = await readJson<HealthResponse & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, `GVFI 健康检查失败 (${response.status})`));
  }
  return payload;
}

export async function listJobs(): Promise<JobsListResponse> {
  const response = await apiFetch("/jobs", { cache: "no-store" });
  const payload = await readJson<JobsListResponse & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, `任务列表失败 (${response.status})`));
  }
  return payload;
}

export async function getJob(taskId: string): Promise<JobTask> {
  const response = await apiFetch(`/jobs/${encodeURIComponent(taskId)}`, {
    cache: "no-store",
  });
  const payload = await readJson<JobResponse>(response);
  if (!response.ok || !payload.task) {
    throw new Error(apiErrorMessage(payload, `查询任务失败 (${response.status})`));
  }
  return payload.task;
}

export async function createJob(options: {
  settings: JobSettings;
  file?: File | null;
}): Promise<CreateJobResponse> {
  const { settings, file } = options;
  let response: Response;

  if (file) {
    const form = new FormData();
    form.append("file", file);
    form.append(
      "settings",
      JSON.stringify({
        model: settings.model,
        fps: settings.fps,
        superResolution: settings.superResolution,
        srModel: settings.srModel,
        resolution: settings.resolution,
        gpu: settings.gpu,
        precision: settings.precision,
        quality: settings.quality,
        inputPath: settings.inputPath,
      })
    );
    response = await apiFetch("/jobs", { method: "POST", body: form });
  } else {
    response = await apiFetch("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
  }

  const payload = await readJson<CreateJobResponse>(response);
  if (!response.ok || !payload.task?.id) {
    throw new Error(apiErrorMessage(payload, `启动失败 (${response.status})`));
  }
  return payload;
}

export async function cancelJob(taskId: string): Promise<void> {
  const response = await apiFetch(`/jobs/${encodeURIComponent(taskId)}/cancel`, {
    method: "POST",
  });
  const payload = await readJson<{ error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, `取消失败 (${response.status})`));
  }
}

export function isTerminalStatus(status: string): boolean {
  return ["succeeded", "failed", "cancelled"].includes(status);
}

export function stageLabelOf(task: {
  status: string;
  stage: string;
  message: string;
  progress: number;
}): string {
  const stageMap: Record<string, string> = {
    queued: "排队中",
    extract: "抽帧",
    rife: "RIFE 插帧",
    interpolate: "插帧",
    upsample: "超分",
    encode: "视频合成",
    analyze: "AI 分析",
    done: "已完成",
    cancelled: "已取消",
    failed: "失败",
  };
  const stage =
    stageMap[task.stage] ?? task.stage ?? stageMap[task.status] ?? task.status;
  if (task.message) {
    return `● 当前工序：${stage} · ${task.message}`;
  }
  return `● 当前工序：${stage}`;
}
