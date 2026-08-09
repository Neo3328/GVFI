/**
 * GVFI — Connection settings hub (API profiles + LLM).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect } from "react";
import { ApiSettingsPanel } from "@/components/settings/api-settings-panel";
import { ApiProfilesPanel } from "@/components/settings/api-profiles-panel";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";

export function SettingsHubPage() {
  const { setChrome } = useWorkspaceChrome();

  useEffect(() => {
    setChrome({
      title: "连接设置",
      breadcrumbs: [
        { label: "GVFI", href: "/app/dashboard" },
        { label: "连接" },
      ],
      status: "idle",
    });
  }, [setChrome]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-strong)]">
          连接设置
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          渲染引擎 Base URL 与超时 — 大模型密钥请在「AI 工作台」配置
        </p>
      </header>
      <ApiProfilesPanel />
      <ApiSettingsPanel />
    </div>
  );
}
