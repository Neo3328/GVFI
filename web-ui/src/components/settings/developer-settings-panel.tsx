/**
 * GVFI — Developer / plugin / diagnostics settings.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassPanel } from "@/components/glass/glass-card";
import { getPlugins } from "@/plugins/registry";
import {
  clearClientLogs,
  getClientLogs,
  type ClientLogEntry,
} from "@/lib/client-log";
import { getActiveApiBase, getActiveDirectOrigin } from "@/lib/api-client";
import { useApiConfigStore } from "@/services/api-config-store";

export function DeveloperSettingsPanel() {
  const [logs, setLogs] = useState<ClientLogEntry[]>([]);
  const plugins = getPlugins();
  const profiles = useApiConfigStore((s) => s.profiles);
  const activeId = useApiConfigStore((s) => s.activeProfileId);

  useEffect(() => {
    setLogs([...getClientLogs()]);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <GlassPanel
        title="运行时诊断"
        description="客户端日志缓冲、活动 API 路由与桌面端日志路径。"
      >
        <ul className="space-y-2 text-[12px] text-[var(--text-muted)]">
          <li>
            活动 Base：
            <code className="ml-1 text-[var(--text-strong)]">{getActiveApiBase()}</code>
          </li>
          <li>
            直连 Origin：
            <code className="ml-1 text-[var(--text-strong)]">
              {getActiveDirectOrigin()}
            </code>
          </li>
          <li>
            配置数：{profiles.length} · 活动 ID：{activeId ?? "—"}
          </li>
          <li>
            桌面日志：
            <code className="ml-1 text-[var(--text-strong)]">
              %APPDATA%\gvfi-desktop\gvfi-desktop.log
            </code>
          </li>
        </ul>
        <div className="mt-3 flex gap-2">
          <GlassButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLogs([...getClientLogs()])}
          >
            刷新客户端日志
          </GlassButton>
          <GlassButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearClientLogs();
              setLogs([]);
            }}
          >
            清空
          </GlassButton>
        </div>
        <pre className="mt-3 max-h-48 overflow-auto rounded-[12px] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-fill)_22%,transparent)] p-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
          {logs.length === 0
            ? "（暂无客户端日志）"
            : logs
                .slice(-80)
                .map(
                  (e) =>
                    `${e.ts} [${e.level}] [${e.scope}] ${e.message}`
                )
                .join("\n")}
        </pre>
      </GlassPanel>

      <GlassPanel
        title="已注册插件"
        description="插件化扩展清单（渲染后端 / 模型 / UI 面板）。"
      >
        {plugins.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)]">暂无插件</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {plugins.map((plugin) => (
              <li
                key={plugin.id}
                className="rounded-[12px] border border-[var(--glass-border)] px-3 py-2"
              >
                <p className="text-[13px] font-semibold text-[var(--text-strong)]">
                  {plugin.name}{" "}
                  <span className="text-[11px] font-normal text-[var(--text-muted)]">
                    v{plugin.version}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {plugin.id}
                  {plugin.description ? ` — ${plugin.description}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {[
                    plugin.renderBackend ? `渲染:${plugin.renderBackend.id}` : null,
                    plugin.models?.length
                      ? `模型插件:${plugin.models.length}`
                      : null,
                    plugin.uiPanels?.length
                      ? `面板:${plugin.uiPanels.length}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "（无扩展点）"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
