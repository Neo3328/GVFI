/**
 * GVFI — AI Workspace chat pane.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Paperclip, Send, Sparkles, Square, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AiFixActions } from "@/components/ai-workspace/ai-fix-actions";
import { glassTextCaption } from "@/components/glass/glass-styles";
import { aiPanelSurface } from "@/components/ai-workspace/ai-field";
import { useT } from "@/hooks/use-t";
import {
  formatAttachmentsForPrompt,
  readTextAttachment,
  type AiTextAttachment,
} from "@/lib/ai-text-attach";
import { parseGvfiFixPayload } from "@/lib/ai-fix-protocol";
import { cn } from "@/lib/utils";
import { aiGateway } from "@/services/ai-gateway";
import { useAiModelConfigStore } from "@/stores/ai-model-config-store";
import { useAiSessionStore } from "@/stores/ai-session-store";
import { llmProviderLabel } from "@/lib/i18n/catalog-labels";
import { LLM_PROVIDER_PRESETS } from "@/lib/llm-types";
import { consumeErrorLogForAi } from "@/lib/error-log-bridge";

export function ChatPane() {
  const t = useT();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<AiTextAttachment[]>([]);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const canSend =
    (Boolean(draft.trim()) || attachments.length > 0) && !sending;

  useEffect(() => {
    const state = useAiSessionStore.getState();
    if (!state.activeSessionId) {
      if (state.sessions[0]) state.setActiveSession(state.sessions[0].id);
      else createSession(t("ai.session.welcome"));
    }
  }, [activeSessionId, createSession, t]);

  useEffect(() => {
    const pending = consumeErrorLogForAi();
    if (pending) setDraft(pending);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length, session?.messages.at(-1)?.content]);

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const next: AiTextAttachment[] = [...attachments];
    for (const file of Array.from(files)) {
      try {
        const item = await readTextAttachment(file);
        if (next.some((a) => a.name === item.name && a.path === item.path)) {
          continue;
        }
        next.push(item);
      } catch (err) {
        const code = err instanceof Error ? err.message : String(err);
        if (code === "TOO_LARGE") {
          setError(t("ai.chat.attachTooLarge"));
        } else if (code === "UNSUPPORTED_TYPE") {
          setError(t("ai.chat.attachUnsupported"));
        } else {
          setError(t("ai.chat.attachFail"));
        }
      }
    }
    setAttachments(next.slice(0, 6));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend() {
    const text = draft.trim();
    const attachBlock = formatAttachmentsForPrompt(attachments);
    if ((!text && !attachBlock) || sending) return;
    if (!hasApiKey()) {
      setError(t("ai.chat.needKey"));
      return;
    }
    let sid = activeSessionId;
    if (!sid) sid = createSession();
    const userContent = [text, attachBlock].filter(Boolean).join("\n\n");
    const attachMeta = attachments.map((a) => ({
      name: a.name,
      path: a.path,
      size: a.size,
    }));

    setDraft("");
    setAttachments([]);
    setError("");
    setSending(true);

    appendMessage(sid, {
      role: "user",
      content: userContent,
      attachments: attachMeta.length ? attachMeta : undefined,
    });
    const assistantId = appendMessage(sid, {
      role: "assistant",
      content: "",
      streaming: true,
    });

    const history =
      useAiSessionStore
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
      updateMessageContent(
        sid,
        assistantId,
        acc || t("ai.chat.emptyReply"),
        false
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateMessageContent(
        sid,
        assistantId,
        `${t("ai.chat.errorPrefix")}${msg}`,
        false
      );
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
    <section className={cn(aiPanelSurface, "min-w-0")}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--glass-border)_80%,transparent)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-[var(--text-strong)]">
            {session?.title ?? t("ai.chat.session")}
          </h2>
          <p className={cn(glassTextCaption, "mt-0.5 truncate")}>
            {llmProviderLabel(t, provider, provider)} · {model}
          </p>
        </div>
      </header>

      <div className="glass-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5">
        {!session?.messages.length ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--accent-cyan)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_10%,transparent)]">
              <Sparkles className="size-5 text-[var(--accent-cyan)]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[15px] font-medium text-[var(--text-strong)]">
                {t("ai.chat.emptyTitle")}
              </p>
              <p className={cn(glassTextCaption, "mx-auto max-w-sm leading-relaxed")}>
                {t("ai.chat.emptyHint")}
              </p>
            </div>
          </div>
        ) : (
          session.messages.map((m) => {
            const parsed =
              m.role === "assistant" && !m.streaming
                ? parseGvfiFixPayload(m.content)
                : null;
            const display =
              parsed?.prose && parsed.fix
                ? parsed.prose || m.content
                : m.content;
            return (
              <article
                key={m.id}
                className={cn(
                  "max-w-[88%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] text-[var(--text-strong)]"
                    : "mr-auto border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-0)_40%,transparent)] text-[var(--text-normal)]"
                )}
              >
                {m.role === "assistant" ? (
                  <>
                    <div className="prose prose-invert max-w-none prose-pre:bg-[var(--bg-0)] prose-code:text-[var(--accent-cyan)]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {display || (m.streaming ? "…" : "")}
                      </ReactMarkdown>
                    </div>
                    {!m.streaming && m.content ? (
                      <AiFixActions content={m.content} />
                    ) : null}
                  </>
                ) : (
                  <>
                    {m.attachments?.length ? (
                      <ul className="mb-2 flex flex-wrap gap-1.5">
                        {m.attachments.map((a) => (
                          <li
                            key={`${a.name}-${a.path ?? ""}`}
                            className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
                          >
                            {a.name}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </>
                )}
              </article>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="px-4 pb-1 text-[12px] text-[var(--danger)]">{error}</p>
      ) : null}

      <footer className="shrink-0 border-t border-[color-mix(in_srgb,var(--glass-border)_80%,transparent)] p-3">
        <div className="rounded-[16px] border border-[color-mix(in_srgb,var(--glass-border)_90%,transparent)] bg-[color-mix(in_srgb,var(--bg-0)_50%,transparent)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {attachments.length > 0 ? (
            <ul className="mb-2 flex flex-wrap gap-1.5 px-1">
              {attachments.map((a) => (
                <li
                  key={`${a.name}-${a.path ?? a.size}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-fill)_30%,transparent)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
                >
                  <span className="max-w-[10rem] truncate">{a.name}</span>
                  <button
                    type="button"
                    className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                    aria-label={t("ai.chat.attachRemove")}
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter(
                          (x) => !(x.name === a.name && x.path === a.path)
                        )
                      )
                    }
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            placeholder={t("ai.chat.placeholder")}
            className="w-full resize-none bg-transparent px-2 py-1.5 text-[13px] leading-relaxed text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <div className="mt-1.5 flex items-center gap-2 px-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".json,.txt,.md,.py,.ts,.tsx,.js,.jsx,.mjs,.cjs,.cmd,.bat,.yml,.yaml,.toml,.ini,.log,.css,.html,.xml,.env,.example"
              onChange={(e) => void onPickFiles(e.target.files)}
            />
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[var(--text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--glass-fill)_40%,transparent)] hover:text-[var(--text-strong)]"
              title={t("ai.chat.attachTitle")}
              aria-label={t("ai.chat.attach")}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" />
            </button>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="min-w-0 max-w-[11rem] truncate rounded-full border border-[color-mix(in_srgb,var(--accent-cyan)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)] px-3 py-1 text-[11px] font-medium text-[var(--text-strong)] outline-none"
            >
              <option value={model}>{model}</option>
              {preset?.defaultModel && preset.defaultModel !== model ? (
                <option value={preset.defaultModel}>{preset.defaultModel}</option>
              ) : null}
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="deepseek-chat">deepseek-chat</option>
            </select>
            <div className="ml-auto flex shrink-0 items-center">
              {sending ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[11px] bg-[var(--danger)] px-3.5 text-[12px] font-semibold text-white"
                >
                  <Square className="size-3.5" />
                  {t("ai.chat.stop")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-[11px] px-3.5 text-[12px] font-semibold transition-opacity",
                    canSend
                      ? "bg-[var(--accent-cyan)] text-[var(--bg-0)]"
                      : "cursor-not-allowed bg-[color-mix(in_srgb,var(--accent-cyan)_35%,transparent)] text-[var(--bg-0)] opacity-55"
                  )}
                >
                  <Send className="size-3.5" />
                  {t("ai.chat.send")}
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}
