/**
 * GVFI — System settings (appearance, developer, logs, about).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppearancePanel } from "@/components/appearance-panel";
import { FontDisplayPanel } from "@/components/settings/font-display-panel";
import { DeveloperSettingsPanel } from "@/components/settings/developer-settings-panel";
import { ConfigBackupPanel } from "@/components/settings/config-backup-panel";
import { LogsPanel } from "@/components/logs-panel";
import { CopyrightFooter } from "@/components/brand/copyright-footer";
import { APP_NAME } from "@/lib/brand";
import { useProcessWorkspace } from "@/components/process/process-workspace-context";
import { useWorkspaceChrome } from "@/components/workspace/workspace-chrome-context";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

type SystemTab = "appearance" | "display" | "backup" | "developer" | "logs" | "about";

export function SystemSettingsPage() {
  const t = useT();
  const { setChrome } = useWorkspaceChrome();
  const { taskLogs, errorLogs, appendTaskLog } = useProcessWorkspace();
  const [tab, setTab] = useState<SystemTab>("appearance");

  useEffect(() => {
    setChrome({
      title: t("system.chromeTitle"),
      breadcrumbs: [
        { label: t("common.app"), href: "/app/dashboard" },
        { label: t("nav.system") },
      ],
      status: "idle",
    });
  }, [setChrome, t]);

  const tabs: { id: SystemTab; label: string }[] = [
    { id: "appearance", label: t("system.tab.appearance") },
    { id: "display", label: t("system.tab.display") },
    { id: "backup", label: t("system.tab.backup") },
    { id: "developer", label: t("system.tab.developer") },
    { id: "logs", label: t("system.tab.logs") },
    { id: "about", label: t("system.tab.about") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-strong)]">
          {t("system.title")}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          {t("system.subtitle")}
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

      {tab === "display" ? <FontDisplayPanel /> : null}

      {tab === "backup" ? <ConfigBackupPanel /> : null}

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
            {t("system.about.blurb")}
          </p>
          <CopyrightFooter variant="stacked" align="left" />
          <Link
            href="/app/settings/about"
            className="text-[12px] text-[var(--accent-cyan)] underline-offset-2 hover:underline"
          >
            {t("system.about.openFull")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
