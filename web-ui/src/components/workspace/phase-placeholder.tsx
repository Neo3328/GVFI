"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/workspace";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { pageTitleForPath } from "@/components/workspace/workspace-nav";
import { useT } from "@/hooks/use-t";

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
  const t = useT();
  const { setChrome } = useWorkspaceChrome();
  const title = pageTitleForPath(pathname, t);

  useEffect(() => {
    setChrome({
      title,
      breadcrumbs: [
        { label: t("common.app"), href: "/app/process/input" },
        { label: title },
      ],
      status: "idle",
    });
  }, [pathname, setChrome, t, title]);

  return (
    <EmptyState
      title={`${title} · ${t("common.comingSoon")}`}
      description={`${description}（${phase}）`}
    />
  );
}
