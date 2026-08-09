"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/workspace";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { pageTitleForPath } from "@/components/workspace/workspace-nav";

interface PhasePlaceholderProps {
  pathname: string;
  phase: string;
  description: string;
}

export function PhasePlaceholder({
  pathname,
  phase,
  description,
}: PhasePlaceholderProps) {
  const { setChrome } = useWorkspaceChrome();

  useEffect(() => {
    setChrome({
      title: pageTitleForPath(pathname),
      breadcrumbs: [
        { label: "GVFI", href: "/app/process/input" },
        { label: pageTitleForPath(pathname) },
      ],
      status: "idle",
    });
  }, [pathname, setChrome]);

  return (
    <EmptyState
      title={`${pageTitleForPath(pathname)} · 即将推出`}
      description={`${description}（${phase}）`}
    />
  );
}
