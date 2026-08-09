/**
 * GVFI — AI Workspace chat pane.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Paperclip, Send, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  glassSurface2,
  glassTextCaption,
  glassTextTitle,
} from "@/components/glass/glass-styles";
import { cn } from "@/lib/utils";
import { aiGateway } from "@/services/ai-gateway";
import { useAiModelConfigStore } from "@/stores/ai-model-config-store";
import { useAiSessionStore } from "@/stores/ai-session-store";
import { LLM_PROVIDER_PRESETS } from "@/lib/llm-types";

export function ChatPane() {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const model = useAiModelConfigStore((s) => s.model);
  const provider = useAiModelConfigStore((s) => s.provider);
  const setModel = useAiModelConfigStore((s) => s.setModel);
  const hasApiKey = useAiModelConfigStore((s) => s.hasApiKey);

  const {
    activeSessionId,
    createSession,
    getActiveSession,
    appendMessage,
    updateMessageContent,
  } = useAiSessionStore();

  const session = getActiveSession();

  useEffect(() => {
    const state = useAiSessionStore.getState();
    if (!state.activeSessionId) {
      if (state.sessions[0]) state.setActiveSession(state.sessions[0].id);
      else createSession("欢迎");
    }
  }, [activeSessionId, createSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length, session?.messages.at(-1)?.content]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    if (!hasApiKey()) {
      setError("请先在右侧配置 API Key");
      return;
    }
    let sid = activeSessionId;
    if (!sid) sid = createSession();
    setDraft("");
    setError("");
    setSending(true);

    appendMessage(sid, { role: "user", content: text });
    const assistantId = appendMessage(sid, {
      role: "assistant",
      content: "",
      streaming: true,
    });

    const history = useAiSessionStore
      .getState()
      .sessions.find((s) => s.id === sid)
      ?.messages.filter((m) => m.id !== assistantId && m.content)
      .map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })) ?? [];

    try {
      let acc = "";
      await aiGateway.chat({
        messages: history,
        onToken: (delta) => {
          acc += delta;
          const snapshot = acc;
          startTransition(() => {
            updateMessageContent(sid!, assistantId, snapshot, true);
          });
        },
      });
      updateMessageContent(sid, assistantId, acc || "（空回复）", false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateMessageContent(sid, assistantId, `错误：${msg}`, false);
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  function handleStop() {
    aiGateway.cancel();
    setSending(false);
  }

  const preset = LLM_PROVIDER_PRESETS.find((p) => p.id === provider);

  return (
    <section
      className={cn(glassSurface2, "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden")}
    >
      <header className="flex items-center justify-between gap-3 border-b border-[var(--glass-border)] px-4 py-3">
        <div>
          <h2 className={glassTextTitle}>{session?.title ?? "会话"}</h2>
          <p className={glassTextCaption}>
            {preset?.label ?? provider} · {model}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!session?.messages.length ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-[15px] font-medium text-[var(--text-strong)]">
              开始与模型对话
            </p>
            <p className={glassTextCaption}>
              支持技术分析、代码辅助与视频处理建议。视频视觉分析请用右侧面板。
            </p>
          </div>
        ) : (
          session.messages.map((m) => (
            <article
              key={m.id}
              className={cn(
                "max-w-[90%] rounded-[var(--radius-md)] px-3 py-2 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "ml-auto bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--text-strong)]"
                  : "mr-auto border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-0)_35%,transparent)] text-[var(--text-normal)]"
              )}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-invert max-w-none prose-pre:bg-[var(--bg-0)] prose-code:text-[var(--accent-cyan)]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content || (m.streaming ? "…" : "")}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </article>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="px-4 pb-1 text-[12px] text-[var(--danger)]">{error}</p>
      ) : null}

      <footer className="border-t border-[var(--glass-border)] p-3">
        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-0)_45%,transparent)] p-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={3}
            placeholder="请输入任务…"
            className="w-full resize-none bg-transparent px-2 py-1 text-[13px] text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <div className="flex items-center gap-2 px-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[11px] text-[var(--text-muted)] opacity-60"
              title="P0 附件占位"
              disabled
            >
              <Paperclip className="size-3.5" />
              附件
            </button>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-transparent px-2 py-1 text-[11px] text-[var(--text-normal)]"
            >
              <option value={model}>{model}</option>
              {preset?.defaultModel && preset.defaultModel !== model ? (
                <option value={preset.defaultModel}>{preset.defaultModel}</option>
              ) : null}
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="deepseek-chat">deepseek-chat</option>
            </select>
            <div className="flex-1" />
            {sending ? (
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--danger)] px-3 py-1.5 text-[12px] font-medium text-white"
              >
                <Square className="size-3.5" />
                停止
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSend()}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--accent-cyan)] px-3 py-1.5 text-[12px] font-medium text-[var(--bg-0)]"
              >
                {sending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                发送
              </button>
            )}
          </div>
        </div>
      </footer>
    </section>
  );
}
