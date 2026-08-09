/**
 * GVFI — Visual AI analysis markdown report panel.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassPanel } from "@/components/glass/glass-card";
import { useT } from "@/hooks/use-t";
import { fetchAnalysisMarkdown } from "@/lib/llm-api";
import { cn } from "@/lib/utils";

interface AnalysisReportPanelProps {
  reportPath: string;
  className?: string;
  /** Compact height for embedding under settings */
  compact?: boolean;
}

function parseMeta(markdown: string): { model?: string; frames?: string } {
  /* Parse report body meta (zh/en labels emitted by analysis pipeline) */
  const model = markdown
    .match(/[-*]\s*(?:模型|Model)[：:]\s*(.+)/i)?.[1]
    ?.trim();
  const frames = markdown
    .match(/[-*]\s*(?:抽帧数|Frames?)[：:]\s*(.+)/i)?.[1]
    ?.trim();
  return { model, frames };
}

export function AnalysisReportPanel({
  reportPath,
  className,
  compact = false,
}: AnalysisReportPanelProps) {
  const t = useT();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async (path: string) => {
    if (!path) {
      setContent("");
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const text = await fetchAnalysisMarkdown(path);
      setContent(text);
    } catch (err) {
      setContent("");
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(reportPath);
  }, [reportPath]);

  const meta = useMemo(() => parseMeta(content), [content]);
  const fileName = reportPath
    ? reportPath.replace(/\\/g, "/").split("/").pop() || "analysis.md"
    : "";

  if (!reportPath) {
    return (
      <GlassPanel
        title={t("report.title")}
        description={t("report.emptyDesc")}
        className={className}
      >
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <FileText className="size-8 text-[var(--text-muted)] opacity-60" aria-hidden />
          <p className="text-[13px] text-[var(--text-muted)]">{t("report.empty")}</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {t("report.emptyHint")}
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      title={t("report.title")}
      description={t("report.previewDesc")}
      className={className}
      headerAction={
        <div className="flex items-center gap-1">
          <GlassButton
            type="button"
            variant="ghost"
            size="xs"
            disabled={loading}
            onClick={() => void load(reportPath)}
            aria-label={t("report.refreshAria")}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-3.5" aria-hidden />
            )}
            {t("report.refresh")}
          </GlassButton>
          <GlassButton
            type="button"
            variant="ghost"
            size="xs"
            disabled={!content}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(content);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              } catch {
                /* ignore */
              }
            }}
          >
            <Copy className="size-3.5" aria-hidden />
            {copied ? t("report.copied") : t("report.copy")}
          </GlassButton>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)] px-2.5 py-0.5 font-medium text-[var(--accent-cyan)]">
            <FileText className="size-3" aria-hidden />
            {fileName}
          </span>
          {meta.model ? (
            <span className="rounded-full border border-[var(--glass-border)] px-2.5 py-0.5">
              {t("report.modelMeta", { model: meta.model })}
            </span>
          ) : null}
          {meta.frames ? (
            <span className="rounded-full border border-[var(--glass-border)] px-2.5 py-0.5">
              {t("report.framesMeta", { frames: meta.frames })}
            </span>
          ) : null}
        </div>

        <p
          className="truncate text-[10px] text-[var(--text-muted)]"
          title={reportPath}
        >
          <ExternalLink className="mr-1 inline size-3 align-[-2px]" aria-hidden />
          {reportPath}
        </p>

        {error ? (
          <p className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-[12px] text-[color-mix(in_srgb,var(--danger)_72%,white)]">
            {error}
          </p>
        ) : null}

        <div
          className={cn(
            "relative overflow-hidden rounded-[var(--card-radius)] border border-[var(--glass-border)]",
            "bg-[color-mix(in_srgb,var(--bg-0)_55%,transparent)] bg-clip-padding",
            compact ? "max-h-[320px]" : "max-h-[min(70vh,640px)] min-h-[220px]"
          )}
        >
          <div
            className={cn(
              "gvfi-md-prose h-full overflow-auto px-4 py-4 sm:px-5 sm:py-5",
              compact ? "max-h-[320px]" : "max-h-[min(70vh,640px)]"
            )}
          >
            {loading && !content ? (
              <div className="flex h-40 items-center justify-center gap-2 text-[13px] text-[var(--text-muted)]">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("report.loading")}
              </div>
            ) : content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : !error ? (
              <p className="text-[13px] text-[var(--text-muted)]">
                {t("report.emptyContent")}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
