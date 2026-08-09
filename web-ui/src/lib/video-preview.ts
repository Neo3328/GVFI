import { mediaUrlForPath } from "@/lib/gvfi-api";

export { mediaUrlForPath };

export interface VideoPreviewSources {
  srcBefore?: string;
  srcAfter?: string;
}

export function resolvePathPreview(absPath: string): string | undefined {
  const trimmed = absPath.trim();
  if (!trimmed) return undefined;
  return mediaUrlForPath(trimmed);
}

export function resolveOutputPreview(outputPath: string): string | undefined {
  return resolvePathPreview(outputPath);
}
