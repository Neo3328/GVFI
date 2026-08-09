"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TopBarBreadcrumb } from "@/components/workspace/top-bar";

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

const defaultChrome: WorkspaceChromeState = {
  title: "GVFI 控制台",
  breadcrumbs: [{ label: "GVFI", href: "/app" }],
  status: "idle",
};

const WorkspaceChromeContext = createContext<WorkspaceChromeContextValue | null>(
  null
);

export function WorkspaceChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChromeState] = useState<WorkspaceChromeState>(defaultChrome);

  const setChrome = useCallback((patch: Partial<WorkspaceChromeState>) => {
    setChromeState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetChrome = useCallback(() => {
    setChromeState(defaultChrome);
  }, []);

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
