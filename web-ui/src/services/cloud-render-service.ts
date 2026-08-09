import type { CreateJobInput } from "@/plugins/types";
import type {
  CreateJobResponse,
  HealthResponse,
  JobLogsResponse,
  JobTask,
} from "@/lib/gvfi-types";
import { tr } from "@/lib/i18n/runtime";
import type { IRenderService } from "@/services/render-service";

export class CloudRenderNotConfiguredError extends Error {
  constructor(message = tr("err.cloudUnconfigured")) {
    super(message);
    this.name = "CloudRenderNotConfiguredError";
  }
}

/**
 * Cloud AI Server — 占位实现。
 * 云端逻辑集中在此 Service，UI 组件不得复制 HTTP/队列逻辑。
 */
export class CloudRenderService implements IRenderService {
  readonly backendId = "cloud";

  constructor(private readonly baseUrl?: string) {}

  private notReady(): never {
    throw new CloudRenderNotConfiguredError(
      this.baseUrl
        ? tr("err.cloudUnimplemented", { url: this.baseUrl })
        : undefined
    );
  }

  checkHealth(): Promise<HealthResponse> {
    this.notReady();
  }

  listJobs(): Promise<JobTask[]> {
    this.notReady();
  }

  getJob(_taskId: string): Promise<JobTask> {
    this.notReady();
  }

  getJobLogs(_taskId: string): Promise<JobLogsResponse> {
    this.notReady();
  }

  createJob(_input: CreateJobInput): Promise<CreateJobResponse> {
    this.notReady();
  }

  cancelJob(_taskId: string): Promise<void> {
    this.notReady();
  }
}

export function createCloudRenderService(baseUrl?: string): CloudRenderService {
  return new CloudRenderService(baseUrl);
}
