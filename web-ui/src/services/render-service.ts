import { gvfiApiAdapter } from "@/adapters/gvfi-api-adapter";
import type { CreateJobInput, JobPollResult } from "@/plugins/types";
import type {
  CreateJobResponse,
  HealthResponse,
  JobLogsResponse,
  JobTask,
} from "@/lib/gvfi-types";

/** Application Service — 渲染任务生命周期（与 UI 解耦） */
export interface IRenderService {
  readonly backendId: string;
  checkHealth(): Promise<HealthResponse>;
  listJobs(): Promise<JobTask[]>;
  getJob(taskId: string): Promise<JobTask>;
  getJobLogs(taskId: string): Promise<JobLogsResponse>;
  createJob(input: CreateJobInput): Promise<CreateJobResponse>;
  cancelJob(taskId: string): Promise<void>;
}

export class LocalRenderService implements IRenderService {
  readonly backendId = "local";

  checkHealth(): Promise<HealthResponse> {
    return gvfiApiAdapter.fetchHealth();
  }

  async listJobs(): Promise<JobTask[]> {
    const { tasks } = await gvfiApiAdapter.listJobs();
    return tasks;
  }

  getJob(taskId: string): Promise<JobTask> {
    return gvfiApiAdapter.getJob(taskId);
  }

  getJobLogs(taskId: string): Promise<JobLogsResponse> {
    return gvfiApiAdapter.fetchJobLogs(taskId);
  }

  createJob(input: CreateJobInput): Promise<CreateJobResponse> {
    return gvfiApiAdapter.createJob({
      settings: input.settings,
      file: input.file,
    });
  }

  cancelJob(taskId: string): Promise<void> {
    return gvfiApiAdapter.cancelJob(taskId);
  }
}

let localSingleton: LocalRenderService | null = null;

export function getLocalRenderService(): LocalRenderService {
  if (!localSingleton) localSingleton = new LocalRenderService();
  return localSingleton;
}

export type { JobPollResult };
