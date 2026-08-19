/**
 * GVFI — One-click local API quick connect.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Check, Loader2, Plug, RotateCw, X } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassPanel } from "@/components/glass/glass-card";
import { useT } from "@/hooks/use-t";
import { getDesktopBridge } from "@/lib/desktop";
import { fetchHealth } from "@/lib/gvfi-api";
import { useApiConfigStore } from "@/services/api-config-store";
import { logApi } from "@/lib/client-log";

type ConnectState = "idle" | "checking" | "ok" | "fail";

export function ApiQuickConnect() {
  const t = useT();
  const setDefaultProfile = useApiConfigStore((s) => s.setDefaultProfile);
  const [state, setState] = useState<ConnectState>("idle");
  const [detail, setDetail] = useState("");
  const [restarting, setRestarting] = useState(false);
  const canRestart = Boolean(getDesktopBridge()?.restartApi);

  const restartEngine = async () => {
    const bridge = getDesktopBridge();
    if (!bridge?.restartApi) return;
    setRestarting(true);
    setDetail("");
    try {
      const ok = await bridge.restartApi();
      logApi.info(t("settings.api.quickConnect.logRestart"), { ok });
      if (ok) {
        await connect();
      } else {
        setState("fail");
        setDetail(t("settings.api.quickConnect.restartFailed"));
      }
    } catch {
      setState("fail");
      setDetail(t("settings.api.quickConnect.restartFailed"));
    } finally {
      setRestarting(false);
    }
  };

  const connect = async () => {
    setState("checking");
    setDetail("");
    try {
      const health = await fetchHealth();
      if (health.ok) {
        setDefaultProfile("local-default");
        setState("ok");
        logApi.info(t("settings.api.quickConnect.logOk"), {
          models: health.models?.length ?? 0,
          gpus: health.gpus?.length ?? 0,
        });
      } else {
        setState("fail");
        setDetail(t("settings.api.quickConnect.notReady"));
      }
    } catch (error) {
      setState("fail");
      setDetail(error instanceof Error ? error.message : "");
      logApi.warn(t("settings.api.quickConnect.logFail"));
    }
  };

  return (
    <GlassPanel
      title={t("settings.api.quickConnect.title")}
      description={t("settings.api.quickConnect.desc")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <GlassButton
          type="button"
          variant="glass"
          size="sm"
          disabled={state === "checking"}
          onClick={() => void connect()}
        >
          {state === "checking" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Plug className="size-4" aria-hidden />
          )}
          {state === "checking"
            ? t("settings.api.quickConnect.checking")
            : t("settings.api.quickConnect.button")}
        </GlassButton>

        {state === "ok" ? (
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--accent-cyan)]">
            <Check className="size-3.5" aria-hidden />
            {t("settings.api.quickConnect.success")}
          </span>
        ) : null}

        {state === "fail" ? (
          <div className="flex w-full flex-col gap-1.5 rounded-[var(--card-radius)] border border-[var(--glass-border)] px-3 py-2 text-[12px] text-[var(--text-muted)]">
            <p className="flex items-center gap-1.5 text-[var(--text-strong)]">
              <X className="size-3.5 text-red-400" aria-hidden />
              {t("settings.api.quickConnect.failed")}
            </p>
            <p>{t("settings.api.quickConnect.hint")}</p>
            {detail ? (
              <p className="break-all text-[11px] opacity-80">{detail}</p>
            ) : null}
            {canRestart ? (
              <div className="mt-1">
                <GlassButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={restarting}
                  onClick={() => void restartEngine()}
                >
                  {restarting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RotateCw className="size-4" aria-hidden />
                  )}
                  {restarting
                    ? t("settings.api.quickConnect.restarting")
                    : t("settings.api.quickConnect.restart")}
                </GlassButton>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </GlassPanel>
  );
}
