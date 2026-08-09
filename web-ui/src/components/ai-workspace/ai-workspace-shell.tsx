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

export function AiWorkspaceShell() {
  const { setChrome } = useWorkspaceChrome();

  useEffect(() => {
    setChrome({
      title: "AI 工作台",
      breadcrumbs: [
        { label: "GVFI", href: "/app/dashboard" },
        { label: "AI 工作台" },
      ],
      status: "online",
      statusLabel: "Gateway",
    });
  }, [setChrome]);

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[520px] flex-col gap-3">
      <header className="shrink-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-strong)]">
          AI 工作台
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          统一会话、模型配置与 AI 任务调度 — 所有大模型请求经 AI Gateway
        </p>
      </header>
      <div className="flex min-h-0 flex-1 gap-3">
        <SessionSidebar />
        <ChatPane />
        <ControlPanel />
      </div>
    </div>
  );
}
