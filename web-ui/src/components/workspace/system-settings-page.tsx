/**
 * GVFI — System settings (appearance, developer, logs, about).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppearancePanel } from "@/components/appearance-panel";
import { DeveloperSettingsPanel } from "@/components/settings/developer-settings-panel";
import { LogsPanel } from "@/components/logs-panel";
import { CopyrightFooter } from "@/components/brand/copyright-footer";
import { APP_NAME } from "@/lib/brand";
import { useProcessWorkspace } from "@/components/process/process-workspace-context";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { cn } from "@/lib/utils";

type SystemTab = "appearance" | "developer" | "logs" | "about";

export function SystemSettingsPage() {
  const { setChrome } = useWorkspaceChrome();
  const { taskLogs, errorLogs, appendTaskLog } = useProcessWorkspace();
  const [tab, setTab] = useState<SystemTab>("appearance");

  useEffect(() => {
    setChrome({
      title: "系统设置",
      breadcrumbs: [
        { label: "GVFI", href: "/app/dashboard" },
        { label: "系统" },
      ],
      status: "idle",
    });
  }, [setChrome]);

  const tabs: { id: SystemTab; label: string }[] = [
    { id: "appearance", label: "外观" },
    { id: "developer", label: "开发者" },
    { id: "logs", label: "日志" },
    { id: "about", label: "关于" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-strong)]">
          系统
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          主题材质、开发者诊断、运行日志与版本信息
        </p>
      </header>

      <div
        role="tablist"
        className="flex gap-1 border-b border-[var(--glass-border)]"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={cn(
              "px-3 py-2 text-[13px] font-semibold transition-colors",
              tab === item.id
                ? "border-b-2 border-[var(--accent-cyan)] text-[var(--text-strong)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
            )}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "appearance" ? (
        <AppearancePanel onLog={appendTaskLog} />
      ) : null}

      {tab === "developer" ? <DeveloperSettingsPanel /> : null}

      {tab === "logs" ? (
        <LogsPanel taskLogs={taskLogs} errorLogs={errorLogs} />
      ) : null}

      {tab === "about" ? (
        <div className="flex flex-col gap-4 py-2">
          <p className="text-[15px] font-semibold text-[var(--text-strong)]">
            {APP_NAME}
          </p>
          <p className="text-[13px] text-[var(--text-muted)]">
            AI 视频补帧与大模型分析工作站
          </p>
          <CopyrightFooter variant="stacked" align="left" />
          <Link
            href="/app/settings/about"
            className="text-[12px] text-[var(--accent-cyan)] underline-offset-2 hover:underline"
          >
            打开完整关于页
          </Link>
        </div>
      ) : null}
    </div>
  );
}
