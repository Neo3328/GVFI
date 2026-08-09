"use client";

import { useEffect, useMemo } from "react";
import {
  mediaUrlForPath,
  type VideoPreviewSources,
} from "@/lib/video-preview";

export interface UseVideoPreviewOptions {
  file: File | null;
  inputPath: string;
  outputPath: string;
}

/**
 * 解析处理页视频预览 URL：
 * - 上传文件 → blob URL
 * - 本机路径 / 输出路径 → /api/media 代理
 */
export function useVideoPreview({
  file,
  inputPath,
  outputPath,
}: UseVideoPreviewOptions): VideoPreviewSources {
  const blobUrl = useMemo(() => {
    if (!file) return undefined;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const pathBefore = inputPath.trim()
    ? mediaUrlForPath(inputPath)
    : undefined;

  const srcBefore = blobUrl ?? pathBefore;

  const srcAfter = outputPath.trim()
    ? mediaUrlForPath(outputPath)
    : undefined;

  return { srcBefore, srcAfter };
}
