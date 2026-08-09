export type JobStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type FpsOption = "60" | "120" | "240";

export type ResolutionOption = "source" | "1080p" | "1440p" | "4k";

export type SrModelOption = "realcugan" | "realesrgan" | "swinir";

export type PrecisionOption = "fp16" | "fp32" | "int8";

export type ThemeOption = "studio" | "dark" | "ai" | "kawaii" | "blush" | "cream";

/** Liquid Glass theme ids — light / Dark / image */
export type AppearanceTheme = "light" | "dark" | "image";

export interface PyQtAppearanceHints {
  theme?: string;
  web_theme?: AppearanceTheme | "studio" | "ai";
  glass_opacity?: number;
  background_path?: string;
  font_family?: string;
  font_size?: number;
  last_preset?: string;
}

export interface AppearanceSettingsResponse {
  pyqt: PyQtAppearanceHints;
  background_url?: string | null;
}

export interface JobLogsResponse {
  logs: string[];
  error_logs: string[];
}

export interface GvfiModel {
  id: string;
  name: string;
  path: string;
}

export interface GvfiGpu {
  index: number;
  name: string;
  vram_mb: number;
}

export interface HealthResponse {
  ok: boolean;
  ffmpeg: boolean;
  ffprobe: boolean;
  rife_ready: boolean;
  models: GvfiModel[];
  gpus: GvfiGpu[];
  output_dir: string;
  rife_ncnn_dir: string;
  warnings: string[];
  engine?: "gvfi";
}

export interface JobTask {
  id: string;
  input_path: string;
  output_path: string;
  status: JobStatus;
  progress: number;
  stage: string;
  message: string;
  error: string;
  created_at: string;
  updated_at: string;
}

export interface JobSettings {
  model: string;
  fps: number;
  superResolution: boolean;
  srModel: SrModelOption;
  resolution: ResolutionOption;
  gpu: number;
  precision: PrecisionOption;
  quality: number;
  inputPath?: string;
}

export interface CreateJobResponse {
  task: JobTask;
  warnings?: string[];
  error?: string;
  message?: string;
}

export interface JobResponse {
  task: JobTask;
  error?: string;
}

export interface JobsListResponse {
  tasks: JobTask[];
}

export interface WorkflowPreset {
  name: string;
  builtin: boolean;
  model: string;
  fps: FpsOption;
  superResolution: boolean;
  srModel: SrModelOption;
  resolution: ResolutionOption;
  precision: PrecisionOption;
  quality: number;
}

export interface RenderSettings {
  file: File | null;
  inputPath: string;
  model: string;
  fps: FpsOption;
  superResolution: boolean;
  srModel: SrModelOption;
  resolution: ResolutionOption;
  gpu: number;
  precision: PrecisionOption;
  quality: number;
  presetName: string;
}
