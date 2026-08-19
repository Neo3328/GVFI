/**
 * GVFI — Action cards for AI gvfi-fix payloads (retry + file copies).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { FolderOpen, Loader2, RotateCcw, Save } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { useJobPolling } from "@/hooks/use-job-polling";
import { useT } from "@/hooks/use-t";
import { useRenderService } from "@/hooks/use-render-service";
import { revealInFolder, saveTextCopy } from "@/lib/ai-file-copy";
import {
  hasActionableFix,
  parseGvfiFixPayload,
  type GvfiSettingsPatch,
} from "@/lib/ai-fix-protocol";
import { isTerminalStatus } from "@/lib/gvfi-api";
import type { JobSettings } from "@/lib/gvfi-types";
import { useJobStore } from "@/stores/job-store";

function mergeSettings(
  base: JobSettings | null,
  patch: GvfiSettingsPatch,
  fallbackInputPath?: string
): JobSettings {
  const start: JobSettings = base ?? {
    model: "gvfi:rife-v4.6",
    fps: 60,
    superResolution: false,
    srModel: "realesrgan",
    resolution: "source",
    gpu: 0,
    precision: "fp16",
    quality: 18,
    inputPath: fallbackInputPath,
  };

  return {
    ...start,
    ...(typeof patch.model === "string" ? { model: patch.model } : {}),
    ...(typeof patch.fps === "number" ? { fps: patch.fps } : {}),
    ...(typeof patch.superResolution === "boolean"
      ? { superResolution: patch.superResolution }
      : {}),
    ...(typeof patch.srModel === "string"
      ? { srModel: patch.srModel as JobSettings["srModel"] }
      : {}),
    ...(typeof patch.resolution === "string"
      ? { resolution: patch.resolution as JobSettings["resolution"] }
      : {}),
    ...(typeof patch.gpu === "number" ? { gpu: patch.gpu } : {}),
    ...(typeof patch.precision === "string"
      ? { precision: patch.precision as JobSettings["precision"] }
      : {}),
    ...(typeof patch.quality === "number" ? { quality: patch.quality } : {}),
    ...(typeof patch.inputPath === "string"
      ? { inputPath: patch.inputPath }
      : {}),
    inputPath:
      (typeof patch.inputPath === "string" && patch.inputPath) ||
      start.inputPath ||
      fallbackInputPath,
  };
}

export function AiFixActions({ content }: { content: string }) {
  const t = useT();
  const renderService = useRenderService();
  const { applyTask, startPolling } = useJobPolling({ renderService });
  const { fix } = parseGvfiFixPayload(content);
  const lastRenderSettings = useJobStore((s) => s.lastRenderSettings);
  const activeTask = useJobStore((s) => s.activeTask);
  const setLastRenderSettings = useJobStore((s) => s.setLastRenderSettings);
  const setTaskId = useJobStore((s) => s.setTaskId);
  const appendTaskLog = useJobStore((s) => s.appendTaskLog);
  const appendErrorLog = useJobStore((s) => s.appendErrorLog);

  const [busy, setBusy] = useState<"retry" | "save" | null>(null);
  const [status, setStatus] = useState("");
  const [savedPaths, setSavedPaths] = useState<string[]>([]);

  if (!fix || !hasActionableFix(fix)) return null;

  const hasPatch =
    Boolean(fix.settings_patch) &&
    Object.keys(fix.settings_patch ?? {}).length > 0;
  const edits = fix.file_edits ?? [];

  const applyRetry = async () => {
    if (!fix.settings_patch) return;
    setBusy("retry");
    setStatus("");
    try {
      const inputPath =
        (typeof fix.settings_patch.inputPath === "string" &&
          fix.settings_patch.inputPath) ||
        lastRenderSettings?.inputPath ||
        activeTask?.input_path ||
        "";
      if (!inputPath.trim()) {
        setStatus(t("ai.fix.needInputPath"));
        return;
      }
      const settings = mergeSettings(
        lastRenderSettings,
        fix.settings_patch,
        inputPath.trim()
      );
      setLastRenderSettings(settings);
      const result = await renderService.createJob({ settings });
      setTaskId(result.task.id);
      void applyTask(result.task, result.warnings);
      if (!isTerminalStatus(result.task.status)) {
        startPolling(result.task.id);
      }
      appendTaskLog(
        t("ai.fix.retryStarted", { id: result.task.id.slice(0, 8) })
      );
      setStatus(t("ai.fix.retryOk", { id: result.task.id.slice(0, 8) }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      appendErrorLog(msg);
      setStatus(`${t("ai.fix.retryFail")}: ${msg}`);
    } finally {
      setBusy(null);
    }
  };

  const saveCopies = async () => {
    if (!edits.length) return;
    setBusy("save");
    setStatus("");
    const paths: string[] = [];
    try {
      for (const edit of edits) {
        const suggestedName =
          edit.name ||
          (edit.path ? edit.path.split(/[/\\]/).pop() : "") ||
          "untitled.txt";
        const result = await saveTextCopy({
          sourcePath: edit.path || undefined,
          suggestedName,
          content: edit.content,
        });
        if (!result.ok) {
          throw new Error(result.error || "WRITE_FAILED");
        }
        if (result.path) paths.push(result.path);
      }
      setSavedPaths(paths);
      const first = paths[0] ?? "";
      const isFsPath = first.includes("/") || first.includes("\\");
      setStatus(
        t("ai.fix.saveOk", {
          count: paths.length,
          mode: isFsPath
            ? t("ai.fix.modeDesktop")
            : t("ai.fix.modeDownload"),
        })
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setStatus(`${t("ai.fix.saveFail")}: ${msg}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-3 space-y-2 rounded-[12px] border border-[color-mix(in_srgb,var(--accent-cyan)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_8%,transparent)] px-3 py-2.5">
      {fix.diagnosis ? (
        <p className="text-[12px] leading-relaxed text-[var(--text-strong)]">
          <span className="font-medium text-[var(--accent-cyan)]">
            {t("ai.fix.diagnosisLabel")}
          </span>{" "}
          {fix.diagnosis}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {hasPatch ? (
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            disabled={busy !== null}
            onClick={() => void applyRetry()}
          >
            {busy === "retry" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <RotateCcw className="size-3.5" aria-hidden />
            )}
            {t("ai.fix.applyRetry")}
          </GlassButton>
        ) : null}

        {edits.length > 0 ? (
          <GlassButton
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy !== null}
            onClick={() => void saveCopies()}
          >
            {busy === "save" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="size-3.5" aria-hidden />
            )}
            {t("ai.fix.saveCopies", { count: edits.length })}
          </GlassButton>
        ) : null}
      </div>

      {status ? (
        <p className="text-[11px] text-[var(--text-muted)]">{status}</p>
      ) : null}

      {savedPaths.length > 0 ? (
        <ul className="space-y-1 text-[11px] text-[var(--text-muted)]">
          {savedPaths.map((p) => (
            <li key={p} className="flex flex-wrap items-center gap-2 break-all">
              <code className="text-[var(--text-strong)]">{p}</code>
              {p.includes("\\") || p.includes("/") ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[var(--accent-cyan)]"
                  onClick={() => void revealInFolder(p)}
                >
                  <FolderOpen className="size-3" aria-hidden />
                  {t("ai.fix.reveal")}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
