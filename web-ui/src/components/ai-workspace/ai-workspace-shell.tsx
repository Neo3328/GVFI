/**
 * GVFI — AI Workspace three-pane shell.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect } from "react";
import { ChatPane } from "@/components/ai-workspace/chat-pane";
import { ControlPanel } from "@/components/ai-workspace/control-panel";
import { SessionSidebar } from "@/components/ai-workspace/session-sidebar";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { useT } from "@/hooks/use-t";

export function AiWorkspaceShell() {
  const t = useT();
  const { setChrome } = useWorkspaceChrome();

  useEffect(() => {
    setChrome({
      title: t("ai.title"),
      breadcrumbs: [
        { label: t("common.app"), href: "/app" },
        { label: t("ai.title") },
      ],
      status: "online",
      statusLabel: t("common.gateway"),
    });
  }, [setChrome, t]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p className="shrink-0 truncate text-[12px] text-[var(--text-muted)]">
        {t("ai.subtitle")}
      </p>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_minmax(280px,340px)] lg:items-stretch">
        <SessionSidebar />
        <ChatPane />
        <ControlPanel />
      </div>
    </div>
  );
}
