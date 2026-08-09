/**
 * GVFI — AI Workspace control panel (models / API / tasks).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  glassSurface2,
  glassTextCaption,
  glassTextTitle,
} from "@/components/glass/glass-styles";
import { cn } from "@/lib/utils";
import { LLM_PROVIDER_PRESETS, LLM_TASK_PRESETS } from "@/lib/llm-types";
import { aiGateway } from "@/services/ai-gateway";
import { useAiModelConfigStore } from "@/stores/ai-model-config-store";
import { useJobStore } from "@/stores/job-store";

export function ControlPanel() {
  const cfg = useAiModelConfigStore();
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [jobMsg, setJobMsg] = useState("");
  const [jobBusy, setJobBusy] = useState(false);
  const activeTask = useJobStore((s) => s.activeTask);

  async function handleTest() {
    setTesting(true);
    setTestMsg("");
    try {
      const result = await aiGateway.testConnection();
      setTestMsg(result.message);
    } catch (err) {
      setTestMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setTesting(false);
    }
  }

  async function handleVideoAnalyze() {
    setJobBusy(true);
    setJobMsg("");
    try {
      const input = window.prompt("输入本地视频绝对路径（或取消后用任务页上传）");
      if (!input?.trim()) {
        setJobMsg("已取消");
        return;
      }
      const result = await aiGateway.enqueueLlmJob({
        inputPath: input.trim(),
        prompt: cfg.getActivePrompt(),
        maxFrames: cfg.maxFrames,
      });
      setJobMsg(`已提交视频分析任务 ${result.taskId}`);
    } catch (err) {
      setJobMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setJobBusy(false);
    }
  }

  return (
    <aside
      className={cn(
        glassSurface2,
        "flex h-full w-[300px] shrink-0 flex-col gap-4 overflow-y-auto p-3"
      )}
    >
      <section>
        <h3 className={glassTextTitle}>模型管理</h3>
        <p className={cn(glassTextCaption, "mt-1 mb-2")}>
          当前：{LLM_PROVIDER_PRESETS.find((p) => p.id === cfg.provider)?.label} ·{" "}
          {cfg.model}
        </p>
        <div className="space-y-1.5">
          {LLM_PROVIDER_PRESETS.map((p) => (
            <label
              key={p.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-1.5 text-[12px]",
                cfg.provider === p.id
                  ? "border-[color-mix(in_srgb,var(--accent-cyan)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_10%,transparent)]"
                  : "border-[var(--glass-border)]"
              )}
            >
              <input
                type="radio"
                name="ai-provider"
                checked={cfg.provider === p.id}
                onChange={() => cfg.setProvider(p.id)}
              />
              <span className="text-[var(--text-strong)]">{p.label}</span>
            </label>
          ))}
        </div>
        <label className="mt-2 block">
          <span className={glassTextCaption}>模型 ID</span>
          <input
            value={cfg.model}
            onChange={(e) => cfg.setModel(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] text-[var(--text-normal)] outline-none"
          />
        </label>
      </section>

      <section>
        <h3 className={glassTextTitle}>API 配置</h3>
        <label className="mt-2 block">
          <span className={glassTextCaption}>服务地址 (Base URL)</span>
          <input
            value={cfg.baseUrl}
            onChange={(e) => cfg.setBaseUrl(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] text-[var(--text-normal)] outline-none"
          />
        </label>
        <label className="mt-2 block">
          <span className={glassTextCaption}>Endpoint</span>
          <input
            value={cfg.endpoint}
            onChange={(e) => cfg.setEndpoint(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] text-[var(--text-normal)] outline-none"
          />
        </label>
        <label className="mt-2 block">
          <span className={glassTextCaption}>API Key</span>
          <input
            type="password"
            value={cfg.apiKey}
            onChange={(e) => cfg.setApiKey(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] text-[var(--text-normal)] outline-none"
          />
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="block">
            <span className={glassTextCaption}>Temperature</span>
            <input
              type="number"
              step="0.1"
              min={0}
              max={2}
              value={cfg.temperature}
              onChange={(e) => cfg.setTemperature(Number(e.target.value))}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] outline-none"
            />
          </label>
          <label className="block">
            <span className={glassTextCaption}>Max Tokens</span>
            <input
              type="number"
              min={256}
              value={cfg.maxTokens}
              onChange={(e) => cfg.setMaxTokens(Number(e.target.value))}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] outline-none"
            />
          </label>
          <label className="block">
            <span className={glassTextCaption}>Top P</span>
            <input
              type="number"
              step="0.05"
              min={0}
              max={1}
              value={cfg.topP}
              onChange={(e) => cfg.setTopP(Number(e.target.value))}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] outline-none"
            />
          </label>
          <label className="block">
            <span className={glassTextCaption}>超时 (ms)</span>
            <input
              type="number"
              min={5000}
              value={cfg.timeoutMs}
              onChange={(e) => cfg.setTimeoutMs(Number(e.target.value))}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] outline-none"
            />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void handleTest()}
            disabled={testing}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-2 py-1.5 text-[12px] text-[var(--text-strong)]"
          >
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : null}
            测试连接
          </button>
        </div>
        {testMsg ? (
          <p
            className={cn(
              "mt-2 text-[11px]",
              testMsg.includes("成功") ? "text-[var(--success)]" : "text-[var(--text-muted)]"
            )}
          >
            {testMsg}
          </p>
        ) : null}
      </section>

      <section>
        <h3 className={glassTextTitle}>任务预设</h3>
        <select
          value={cfg.taskPreset}
          onChange={(e) =>
            cfg.setTaskPreset(e.target.value as typeof cfg.taskPreset)
          }
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px]"
        >
          {LLM_TASK_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <label className="mt-2 block">
          <span className={glassTextCaption}>抽帧数</span>
          <input
            type="number"
            min={1}
            max={32}
            value={cfg.maxFrames}
            onChange={(e) => cfg.setMaxFrames(Number(e.target.value))}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-[12px] outline-none"
          />
        </label>
        <button
          type="button"
          disabled={jobBusy}
          onClick={() => void handleVideoAnalyze()}
          className="mt-3 w-full rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--accent)_35%,transparent)] px-2 py-2 text-[12px] font-medium text-[var(--text-strong)]"
        >
          {jobBusy ? "提交中…" : "视频视觉分析（经 Gateway）"}
        </button>
        {jobMsg ? <p className={cn(glassTextCaption, "mt-2")}>{jobMsg}</p> : null}
      </section>

      <section>
        <h3 className={glassTextTitle}>任务队列</h3>
        <p className={cn(glassTextCaption, "mt-1")}>
          本地渲染 / LLM 作业见任务页
        </p>
        {activeTask ? (
          <div className="mt-2 rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-2 py-2 text-[12px]">
            <p className="text-[var(--text-strong)]">{activeTask.stage}</p>
            <p className="text-[var(--text-muted)]">
              {Math.round((activeTask.progress ?? 0) * 100)}% · {activeTask.status}
            </p>
          </div>
        ) : (
          <p className={cn(glassTextCaption, "mt-2")}>当前无活动任务</p>
        )}
        <Link
          href="/app/tasks"
          className="mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--accent-cyan)]"
        >
          打开任务中心 <ExternalLink className="size-3" />
        </Link>
      </section>
    </aside>
  );
}
