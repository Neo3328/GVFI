/**
 * GVFI — AI Workspace session sidebar.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { Pin, Plus, Search, Star, Trash2 } from "lucide-react";
import { glassSurface2, glassTextCaption, glassTextTitle } from "@/components/glass/glass-styles";
import { cn } from "@/lib/utils";
import { useAiSessionStore } from "@/stores/ai-session-store";

export function SessionSidebar() {
  const {
    activeSessionId,
    searchQuery,
    setSearchQuery,
    createSession,
    setActiveSession,
    deleteSession,
    toggleFavorite,
    togglePinned,
    filteredSessions,
  } = useAiSessionStore();

  const sessions = filteredSessions();
  const recent = sessions.filter((s) => !s.favorite);
  const favorites = sessions.filter((s) => s.favorite);

  return (
    <aside
      className={cn(
        glassSurface2,
        "flex h-full min-h-0 w-[240px] shrink-0 flex-col overflow-hidden p-3"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={glassTextTitle}>AI Workspace</h2>
        <button
          type="button"
          aria-label="新建会话"
          className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--glass-border)] text-[var(--accent-cyan)] hover:bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)]"
          onClick={() => createSession()}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <label className="relative mb-3 block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索会话"
          className="w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-0)_40%,transparent)] py-2 pr-2 pl-8 text-[12px] text-[var(--text-normal)] outline-none placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--accent-cyan)]"
        />
      </label>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
        {favorites.length > 0 ? (
          <section>
            <p className={cn(glassTextCaption, "mb-1.5 px-1 uppercase tracking-wide")}>
              收藏
            </p>
            <ul className="space-y-1">
              {favorites.map((s) => (
                <SessionRow
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  active={s.id === activeSessionId}
                  favorite={s.favorite}
                  pinned={s.pinned}
                  onSelect={() => setActiveSession(s.id)}
                  onFavorite={() => toggleFavorite(s.id)}
                  onPin={() => togglePinned(s.id)}
                  onDelete={() => deleteSession(s.id)}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <p className={cn(glassTextCaption, "mb-1.5 px-1 uppercase tracking-wide")}>
            最近使用
          </p>
          {recent.length === 0 ? (
            <p className={cn(glassTextCaption, "px-1")}>暂无会话，点击 + 新建</p>
          ) : (
            <ul className="space-y-1">
              {recent.map((s) => (
                <SessionRow
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  active={s.id === activeSessionId}
                  favorite={s.favorite}
                  pinned={s.pinned}
                  onSelect={() => setActiveSession(s.id)}
                  onFavorite={() => toggleFavorite(s.id)}
                  onPin={() => togglePinned(s.id)}
                  onDelete={() => deleteSession(s.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}

function SessionRow(props: {
  id: string;
  title: string;
  active: boolean;
  favorite: boolean;
  pinned: boolean;
  onSelect: () => void;
  onFavorite: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-1.5",
          props.active
            ? "border-[color-mix(in_srgb,var(--accent-cyan)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)]"
            : "border-transparent hover:bg-[color-mix(in_srgb,var(--bg-2)_50%,transparent)]"
        )}
      >
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-[13px] text-[var(--text-strong)]"
          onClick={props.onSelect}
        >
          {props.pinned ? "📌 " : ""}
          {props.title || "未命名"}
        </button>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100"
          aria-label="收藏"
          onClick={props.onFavorite}
        >
          <Star
            className={cn(
              "size-3.5",
              props.favorite
                ? "fill-[var(--accent-cyan)] text-[var(--accent-cyan)]"
                : "text-[var(--text-muted)]"
            )}
          />
        </button>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100"
          aria-label="置顶"
          onClick={props.onPin}
        >
          <Pin className="size-3.5 text-[var(--text-muted)]" />
        </button>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100"
          aria-label="删除"
          onClick={props.onDelete}
        >
          <Trash2 className="size-3.5 text-[var(--danger)]" />
        </button>
      </div>
    </li>
  );
}
