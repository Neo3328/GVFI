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
import { t } from "@/lib/i18n/t";
import type { Locale, MessageKey } from "@/lib/i18n/types";
import { DEFAULT_LOCALE } from "@/lib/i18n/types";
import { useLocaleStore } from "@/stores/locale-store";

export function mediaUrlForPath(absPath: string, preferDirect = false): string {
  const query = `path=${encodeURIComponent(absPath.trim())}`;
  if (preferDirect) {
    return `${GVFI_DIRECT_ORIGIN}/media?${query}`;
  }
  return `/api/media?${query}`;
}

function currentLocale(): Locale {
  try {
    return useLocaleStore.getState().locale;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function apiFallback(key: MessageKey, status: number): string {
  return t(currentLocale(), key, { status });
}

export async function fetchAppearanceSettings(): Promise<AppearanceSettingsResponse["pyqt"]> {
  const response = await apiFetch("/settings/appearance", { cache: "no-store" });
  const payload = await readJson<AppearanceSettingsResponse & { error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(
      apiErrorMessage(payload, apiFallback("api.err.appearanceRead", response.status))
    );
  }
  return payload.pyqt ?? {};
}

export async function fetchJobLogs(taskId: string): Promise<JobLogsResponse> {
  const response = await apiFetch(`/jobs/${encodeURIComponent(taskId)}/logs`, {
    cache: "no-store",
  });
  const payload = await readJson<JobLogsResponse & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(
      apiErrorMessage(payload, apiFallback("api.err.logsRead", response.status))
    );
  }
  return payload;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await apiFetch("/health", { cache: "no-store" });
  const payload = await readJson<HealthResponse & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(
      apiErrorMessage(payload, apiFallback("api.err.health", response.status))
    );
  }
  return payload;
}

export async function listJobs(): Promise<JobsListResponse> {
  const response = await apiFetch("/jobs", { cache: "no-store" });
  const payload = await readJson<JobsListResponse & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(
      apiErrorMessage(payload, apiFallback("api.err.jobsList", response.status))
    );
  }
  return payload;
}

export async function getJob(taskId: string): Promise<JobTask> {
  const response = await apiFetch(`/jobs/${encodeURIComponent(taskId)}`, {
    cache: "no-store",
  });
  const payload = await readJson<JobResponse>(response);
  if (!response.ok || !payload.task) {
    throw new Error(
      apiErrorMessage(payload, apiFallback("api.err.jobGet", response.status))
    );
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
    throw new Error(
      apiErrorMessage(payload, apiFallback("api.err.start", response.status))
    );
  }
  return payload;
}

export async function cancelJob(taskId: string): Promise<void> {
  const response = await apiFetch(`/jobs/${encodeURIComponent(taskId)}/cancel`, {
    method: "POST",
  });
  const payload = await readJson<{ error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(
      apiErrorMessage(payload, apiFallback("api.err.cancel", response.status))
    );
  }
}

export function isTerminalStatus(status: string): boolean {
  return ["succeeded", "failed", "cancelled"].includes(status);
}

/** Strip localized “current stage” chrome from status labels. */
export function stripStagePrefix(label: string): string {
  return label
    .replace(/^●\s*当前工序：\s*/, "")
    .replace(/^●\s*Current stage:\s*/i, "")
    .replace(/^●\s*/, "");
}

export function stageLabelOf(task: {
  status: string;
  stage: string;
  message: string;
  progress: number;
}): string {
  const locale = currentLocale();
  const stageMap: Record<string, MessageKey> = {
    queued: "process.stage.queued",
    extract: "process.stage.extract",
    rife: "process.stage.rife",
    interpolate: "process.stage.interpolate",
    upsample: "process.stage.upsample",
    encode: "process.stage.encode",
    analyze: "process.stage.analyze",
    done: "process.stage.doneFull",
    cancelled: "process.stage.cancelled",
    failed: "process.stage.failed",
  };
  const stageKey = stageMap[task.stage] ?? stageMap[task.status];
  const stage = stageKey ? t(locale, stageKey) : task.stage || task.status;
  if (task.message) {
    return t(locale, "process.stage.withMessage", { stage, message: task.message });
  }
  return t(locale, "process.stage.wrap", { detail: stage });
}
