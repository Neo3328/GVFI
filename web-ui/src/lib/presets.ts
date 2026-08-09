import type { WorkflowPreset } from "@/lib/gvfi-types";

export const SR_MODEL_OPTIONS = [
  { value: "realcugan", label: "RealCUGAN" },
  { value: "realesrgan", label: "RealESRGAN" },
  { value: "swinir", label: "SwinIR" },
] as const;

export const RESOLUTION_OPTIONS = [
  { value: "source", label: "原始" },
  { value: "1080p", label: "1080p" },
  { value: "1440p", label: "1440p" },
  { value: "4k", label: "4K" },
] as const;

export const PRECISION_OPTIONS = [
  { value: "fp16", label: "FP16" },
  { value: "fp32", label: "FP32" },
  { value: "int8", label: "INT8" },
] as const;

export const FPS_OPTIONS = [
  { value: "60", label: "60 FPS" },
  { value: "120", label: "120 FPS" },
  { value: "240", label: "240 FPS" },
] as const;

export const BUILTIN_PRESETS: WorkflowPreset[] = [
  {
    name: "动漫补帧",
    builtin: true,
    model: "gvfi:rife-anime",
    fps: "120",
    superResolution: true,
    srModel: "realesrgan",
    resolution: "source",
    precision: "fp16",
    quality: 0.8,
  },
  {
    name: "电影高清",
    builtin: true,
    model: "gvfi:rife-v4.6",
    fps: "60",
    superResolution: false,
    srModel: "realesrgan",
    resolution: "source",
    precision: "fp16",
    quality: 0.85,
  },
  {
    name: "SVFI风格",
    builtin: true,
    model: "gvfi:rife-anime",
    fps: "120",
    superResolution: true,
    srModel: "realcugan",
    resolution: "1080p",
    precision: "fp16",
    quality: 0.9,
  },
];
