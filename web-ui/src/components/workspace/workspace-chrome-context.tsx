/**
 * GVFI — Workspace chrome title / breadcrumb context.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TopBarBreadcrumb } from "@/components/workspace/top-bar";
import { useT } from "@/hooks/use-t";
import type { TranslateFn } from "@/lib/i18n/t";

export interface WorkspaceChromeState {
  title: string;
  breadcrumbs: TopBarBreadcrumb[];
  status: "online" | "offline" | "warning" | "idle";
  statusLabel?: string;
}

interface WorkspaceChromeContextValue extends WorkspaceChromeState {
  setChrome: (patch: Partial<WorkspaceChromeState>) => void;
  resetChrome: () => void;
}

function buildDefaultChrome(t: TranslateFn): WorkspaceChromeState {
  return {
    title: t("chrome.defaultTitle"),
    breadcrumbs: [{ label: t("common.app"), href: "/app" }],
    status: "idle",
  };
}

const WorkspaceChromeContext = createContext<WorkspaceChromeContextValue | null>(
  null
);

export function WorkspaceChromeProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const makeDefault = useCallback(() => buildDefaultChrome(t), [t]);
  const [chrome, setChromeState] = useState<WorkspaceChromeState>(() =>
    buildDefaultChrome(t)
  );

  /* Re-localize idle chrome when locale (via `t`) changes — defer to avoid sync setState-in-effect. */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setChromeState((prev) => {
        if (prev.status !== "idle" || prev.statusLabel) return prev;
        if (prev.breadcrumbs.length > 1) return prev;
        return makeDefault();
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [makeDefault]);

  const setChrome = useCallback((patch: Partial<WorkspaceChromeState>) => {
    setChromeState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetChrome = useCallback(() => {
    setChromeState(makeDefault());
  }, [makeDefault]);

  const value = useMemo(
    () => ({ ...chrome, setChrome, resetChrome }),
    [chrome, setChrome, resetChrome]
  );

  return (
    <WorkspaceChromeContext.Provider value={value}>
      {children}
    </WorkspaceChromeContext.Provider>
  );
}

export function useWorkspaceChrome() {
  const ctx = useContext(WorkspaceChromeContext);
  if (!ctx) {
    throw new Error("useWorkspaceChrome must be used within WorkspaceChromeProvider");
  }
  return ctx;
}

/** Optional hook for pages that may render outside shell during transition */
export function useWorkspaceChromeOptional() {
  return useContext(WorkspaceChromeContext);
}
