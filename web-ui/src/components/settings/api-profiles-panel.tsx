/**
 * GVFI — Manual API profile / base URL configuration.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassInput } from "@/components/glass/glass-input";
import { GlassPanel } from "@/components/glass/glass-card";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/glass/glass-select";
import {
  useApiConfigStore,
  type ApiProfileKind,
} from "@/services/api-config-store";
import { getActiveApiBase, getActiveDirectOrigin } from "@/lib/api-client";
import { logApi } from "@/lib/client-log";

export function ApiProfilesPanel() {
  const profiles = useApiConfigStore((s) => s.profiles);
  const activeProfileId = useApiConfigStore((s) => s.activeProfileId);
  const addProfile = useApiConfigStore((s) => s.addProfile);
  const updateProfile = useApiConfigStore((s) => s.updateProfile);
  const removeProfile = useApiConfigStore((s) => s.removeProfile);
  const setDefaultProfile = useApiConfigStore((s) => s.setDefaultProfile);

  const active =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;

  const [draftName, setDraftName] = useState("自定义 API");
  const [draftBase, setDraftBase] = useState("http://127.0.0.1:8765");
  const [draftKind, setDraftKind] = useState<ApiProfileKind>("local");

  return (
    <GlassPanel
      title="API 连接配置"
      description="手动指定渲染引擎 base URL、超时与鉴权。活动配置会驱动所有 /health、/jobs、上传请求。"
    >
      <div className="mb-4 rounded-[12px] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-fill)_28%,transparent)] px-3 py-2 text-[12px] text-[var(--text-muted)]">
        <p>
          当前路由：<code className="text-[var(--text-strong)]">{getActiveApiBase()}</code>
        </p>
        <p className="mt-1">
          直连回退：
          <code className="text-[var(--text-strong)]">{getActiveDirectOrigin()}</code>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {profiles.map((profile) => {
          const selected = profile.id === active?.id;
          return (
            <div
              key={profile.id}
              className={`flex flex-col gap-2 rounded-[14px] border px-3 py-3 ${
                selected
                  ? "border-[var(--accent-cyan)] bg-[color-mix(in_srgb,var(--accent-cyan)_8%,transparent)]"
                  : "border-[var(--glass-border)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-left text-[13px] font-semibold text-[var(--text-strong)]"
                  onClick={() => {
                    setDefaultProfile(profile.id);
                    logApi.info(`切换 API 配置：${profile.name}`, {
                      baseUrl: profile.baseUrl,
                    });
                  }}
                >
                  {profile.name}
                  {profile.isDefault ? (
                    <span className="ml-2 text-[11px] text-[var(--accent-cyan)]">
                      默认
                    </span>
                  ) : null}
                </button>
                <div className="flex gap-1">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="设为默认"
                    onClick={() => setDefaultProfile(profile.id)}
                  >
                    <Star className="size-3.5" aria-hidden />
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="删除配置"
                    disabled={profiles.length <= 1}
                    onClick={() => removeProfile(profile.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </GlassButton>
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[var(--text-muted)]">Base URL</span>
                <GlassInput
                  value={profile.baseUrl}
                  onChange={(e) =>
                    updateProfile(profile.id, { baseUrl: e.target.value })
                  }
                  placeholder="/api 或 http://127.0.0.1:8765"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[var(--text-muted)]">超时 (ms)</span>
                  <GlassInput
                    type="number"
                    value={profile.timeoutMs}
                    onChange={(e) =>
                      updateProfile(profile.id, {
                        timeoutMs: Number(e.target.value) || 60_000,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[var(--text-muted)]">并发</span>
                  <GlassInput
                    type="number"
                    value={profile.concurrency}
                    onChange={(e) =>
                      updateProfile(profile.id, {
                        concurrency: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[var(--text-muted)]">类型</span>
                  <GlassSelect
                    value={profile.kind}
                    onValueChange={(value) => {
                      if (value === "local" || value === "cloud") {
                        updateProfile(profile.id, { kind: value });
                      }
                    }}
                  >
                    <GlassSelectTrigger className="glass-select">
                      <GlassSelectValue />
                    </GlassSelectTrigger>
                    <GlassSelectContent>
                      <GlassSelectItem value="local">本地</GlassSelectItem>
                      <GlassSelectItem value="cloud">云端</GlassSelectItem>
                    </GlassSelectContent>
                  </GlassSelect>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[var(--text-muted)]">
                  API Key / Token（可选）
                </span>
                <GlassInput
                  type="password"
                  value={profile.apiKey ?? profile.token ?? ""}
                  onChange={(e) =>
                    updateProfile(profile.id, {
                      apiKey: e.target.value,
                      token: e.target.value,
                    })
                  }
                  placeholder="Bearer token（云端鉴权时填写）"
                  autoComplete="off"
                />
              </label>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-[var(--glass-border)] pt-4">
        <p className="text-[12px] font-medium text-[var(--text-strong)]">新增配置</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <GlassInput
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="名称"
          />
          <GlassInput
            value={draftBase}
            onChange={(e) => setDraftBase(e.target.value)}
            placeholder="Base URL"
            className="sm:col-span-2"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassSelect
            value={draftKind}
            onValueChange={(value) => {
              if (value === "local" || value === "cloud") setDraftKind(value);
            }}
          >
            <GlassSelectTrigger className="glass-select w-[140px]">
              <GlassSelectValue />
            </GlassSelectTrigger>
            <GlassSelectContent>
              <GlassSelectItem value="local">本地</GlassSelectItem>
              <GlassSelectItem value="cloud">云端</GlassSelectItem>
            </GlassSelectContent>
          </GlassSelect>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => {
              const id = addProfile({
                name: draftName.trim() || "自定义 API",
                baseUrl: draftBase.trim() || "http://127.0.0.1:8765",
                timeoutMs: 60_000,
                concurrency: 1,
                isDefault: false,
                kind: draftKind,
              });
              setDefaultProfile(id);
              logApi.info("新增 API 配置", { id, baseUrl: draftBase });
            }}
          >
            <Plus className="size-4" aria-hidden />
            添加并启用
          </GlassButton>
        </div>
      </div>
    </GlassPanel>
  );
}
