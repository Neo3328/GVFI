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
import { useT } from "@/hooks/use-t";
import { apiProfileDisplayName } from "@/lib/i18n/catalog-labels";
import {
  useApiConfigStore,
  type ApiProfileKind,
} from "@/services/api-config-store";
import { getActiveApiBase, getActiveDirectOrigin } from "@/lib/api-client";
import { logApi } from "@/lib/client-log";

export function ApiProfilesPanel() {
  const t = useT();
  const profiles = useApiConfigStore((s) => s.profiles);
  const activeProfileId = useApiConfigStore((s) => s.activeProfileId);
  const addProfile = useApiConfigStore((s) => s.addProfile);
  const updateProfile = useApiConfigStore((s) => s.updateProfile);
  const removeProfile = useApiConfigStore((s) => s.removeProfile);
  const setDefaultProfile = useApiConfigStore((s) => s.setDefaultProfile);

  const active =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;

  const [draftName, setDraftName] = useState(() => t("settings.api.customName"));
  const [draftBase, setDraftBase] = useState("http://127.0.0.1:8765");
  const [draftKind, setDraftKind] = useState<ApiProfileKind>("local");

  return (
    <GlassPanel
      title={t("settings.api.title")}
      description={t("settings.api.desc")}
    >
      <div className="mb-4 overflow-hidden rounded-[var(--card-radius)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-fill)_28%,transparent)] bg-clip-padding px-3 py-2 text-[12px] text-[var(--text-muted)]">
        <p>
          {t("settings.api.route")}
          <code className="text-[var(--text-strong)]">{getActiveApiBase()}</code>
        </p>
        <p className="mt-1">
          {t("settings.api.direct")}
          <code className="text-[var(--text-strong)]">{getActiveDirectOrigin()}</code>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {profiles.map((profile) => {
          const selected = profile.id === active?.id;
          const displayName = apiProfileDisplayName(
            t,
            profile.id,
            profile.name
          );
          return (
            <div
              key={profile.id}
              className={`flex flex-col gap-2 overflow-hidden rounded-[var(--panel-radius)] border bg-clip-padding px-3 py-3 ${
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
                    logApi.info(
                      t("settings.api.logSwitched", { name: displayName }),
                      { baseUrl: profile.baseUrl }
                    );
                  }}
                >
                  {displayName}
                  {profile.isDefault ? (
                    <span className="ml-2 text-[11px] text-[var(--accent-cyan)]">
                      {t("settings.api.default")}
                    </span>
                  ) : null}
                </button>
                <div className="flex gap-1">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={t("settings.api.setDefaultAria")}
                    onClick={() => setDefaultProfile(profile.id)}
                  >
                    <Star className="size-3.5" aria-hidden />
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={t("settings.api.deleteAria")}
                    disabled={profiles.length <= 1}
                    onClick={() => removeProfile(profile.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </GlassButton>
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {t("settings.api.baseUrl")}
                </span>
                <GlassInput
                  value={profile.baseUrl}
                  onChange={(e) =>
                    updateProfile(profile.id, { baseUrl: e.target.value })
                  }
                  placeholder={t("settings.api.baseUrlPlaceholder")}
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {t("settings.api.timeout")}
                  </span>
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
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {t("settings.api.concurrency")}
                  </span>
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
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {t("settings.api.kind")}
                  </span>
                  <GlassSelect
                    value={profile.kind}
                    items={{
                      local: t("settings.api.local"),
                      cloud: t("settings.api.cloud"),
                    }}
                    onValueChange={(value) => {
                      if (value === "local" || value === "cloud") {
                        updateProfile(profile.id, { kind: value });
                      }
                    }}
                  >
                    <GlassSelectTrigger className="glass-select">
                                        {/* Bug#3 同源修复：children 回调确保 label 稳定渲染。*/}
                                        <GlassSelectValue>{(value) => {
                                          if (value === "local") return t("settings.api.local");
                                          if (value === "cloud") return t("settings.api.cloud");
                                          return "";
                                        }}</GlassSelectValue>
                                      </GlassSelectTrigger>
                                      <GlassSelectContent>
                                        <GlassSelectItem value="local">{t("settings.api.local")}</GlassSelectItem>
                                        <GlassSelectItem value="cloud">{t("settings.api.cloud")}</GlassSelectItem>
                                      </GlassSelectContent>
                                    </GlassSelect>
                                  </label>
                                </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {t("settings.api.keyLabel")}
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
                  placeholder={t("settings.api.keyPlaceholder")}
                  autoComplete="off"
                />
              </label>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-[var(--glass-border)] pt-4">
        <p className="text-[12px] font-medium text-[var(--text-strong)]">
          {t("settings.api.addSection")}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <GlassInput
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={t("settings.api.namePlaceholder")}
          />
          <GlassInput
            value={draftBase}
            onChange={(e) => setDraftBase(e.target.value)}
            placeholder={t("settings.api.baseUrl")}
            className="sm:col-span-2"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassSelect
            value={draftKind}
            items={{
              local: t("settings.api.local"),
              cloud: t("settings.api.cloud"),
            }}
            onValueChange={(value) => {
              if (value === "local" || value === "cloud") setDraftKind(value);
            }}
          >
            <GlassSelectTrigger className="glass-select w-[140px]">
                        {/* Bug#3 同源修复：children 回调确保 label 稳定渲染。*/}
                        <GlassSelectValue>{(value) => {
                          if (value === "local") return t("settings.api.local");
                          if (value === "cloud") return t("settings.api.cloud");
                          return "";
                        }}</GlassSelectValue>
                      </GlassSelectTrigger>
            <GlassSelectContent>
              <GlassSelectItem value="local">{t("settings.api.local")}</GlassSelectItem>
              <GlassSelectItem value="cloud">{t("settings.api.cloud")}</GlassSelectItem>
            </GlassSelectContent>
          </GlassSelect>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => {
              const id = addProfile({
                name: draftName.trim() || t("settings.api.customName"),
                baseUrl: draftBase.trim() || "http://127.0.0.1:8765",
                timeoutMs: 60_000,
                concurrency: 1,
                isDefault: false,
                kind: draftKind,
              });
              setDefaultProfile(id);
              logApi.info(t("settings.api.logAdded"), {
                id,
                baseUrl: draftBase,
              });
            }}
          >
            <Plus className="size-4" aria-hidden />
            {t("settings.api.addEnable")}
          </GlassButton>
        </div>
      </div>
    </GlassPanel>
  );
}
