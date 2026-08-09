"use client";

import { useMemo } from "react";
import { useApiConfigStore } from "@/services/api-config-store";
import { resolveRenderService } from "@/services/render-service-factory";
import type { IRenderService } from "@/services/render-service";

/**
 * UI 层访问 Application Service 的推荐 Hook。
 * 组件通过 renderService.createJob / getJob 操作，不直接 fetch。
 */
export function useRenderService(): IRenderService {
  const activeProfileId = useApiConfigStore((s) => s.activeProfileId);
  const profileKind = useApiConfigStore((s) => {
    const p = s.profiles.find((x) => x.id === s.activeProfileId);
    return p?.kind ?? "local";
  });

  return useMemo(
    () => resolveRenderService(profileKind),
    [activeProfileId, profileKind]
  );
}
