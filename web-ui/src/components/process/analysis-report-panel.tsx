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
import { fetchAnalysisMarkdown } from "@/lib/llm-api";
import { cn } from "@/lib/utils";

interface AnalysisReportPanelProps {
  reportPath: string;
  className?: string;
  /** Compact height for embedding under settings */
  compact?: boolean;
}

function parseMeta(markdown: string): { model?: string; frames?: string } {
  const model = markdown.match(/[-*]\s*模型[：:]\s*(.+)/)?.[1]?.trim();
  const frames = markdown.match(/[-*]\s*抽帧数[：:]\s*(.+)/)?.[1]?.trim();
  return { model, frames };
}

export function AnalysisReportPanel({
  reportPath,
  className,
  compact = false,
}: AnalysisReportPanelProps) {
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
        title="AI 分析报告"
        description="完成大模型分析后，将在此可视化呈现 Markdown 报告。"
        className={className}
      >
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <FileText className="size-8 text-[var(--text-muted)] opacity-60" aria-hidden />
          <p className="text-[13px] text-[var(--text-muted)]">暂无分析报告</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            在「设置」中启动 AI 分析，结果会自动显示在这里
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      title="AI 分析报告"
      description="Markdown 可视化预览"
      className={className}
      headerAction={
        <div className="flex items-center gap-1">
          <GlassButton
            type="button"
            variant="ghost"
            size="xs"
            disabled={loading}
            onClick={() => void load(reportPath)}
            aria-label="刷新报告"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-3.5" aria-hidden />
            )}
            刷新
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
            {copied ? "已复制" : "复制"}
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
              模型 · {meta.model}
            </span>
          ) : null}
          {meta.frames ? (
            <span className="rounded-full border border-[var(--glass-border)] px-2.5 py-0.5">
              抽帧 · {meta.frames}
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
          <p className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-[12px] text-[#ffd0d8]">
            {error}
          </p>
        ) : null}

        <div
          className={cn(
            "gvfi-md-prose relative overflow-auto rounded-[var(--radius-md)] border border-[var(--glass-border)]",
            "bg-[color-mix(in_srgb,var(--bg-0)_55%,transparent)] px-4 py-4 sm:px-5 sm:py-5",
            compact ? "max-h-[320px]" : "max-h-[min(70vh,640px)] min-h-[220px]"
          )}
        >
          {loading && !content ? (
            <div className="flex h-40 items-center justify-center gap-2 text-[13px] text-[var(--text-muted)]">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              正在加载报告…
            </div>
          ) : content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          ) : !error ? (
            <p className="text-[13px] text-[var(--text-muted)]">报告内容为空</p>
          ) : null}
        </div>
      </div>
    </GlassPanel>
  );
}
