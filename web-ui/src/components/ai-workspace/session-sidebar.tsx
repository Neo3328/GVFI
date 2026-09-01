/**
 * GVFI — AI Workspace session sidebar.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { Pin, Plus, Search, Star, Trash2 } from"lucide-react";
import { glassTextCaption } from"@/components/glass/glass-styles";
import {
 aiField,
 aiPanelSurface,
 aiSectionTitle,
} from"@/components/ai-workspace/ai-field";
import { useT } from"@/hooks/use-t";
import { cn } from"@/lib/utils";
import { useAiSessionStore } from"@/stores/ai-session-store";

export function SessionSidebar() {
 const t = useT();
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
 <aside className={cn(aiPanelSurface,"w-full p-3 lg:w-auto")}>
 <div className="mb-3 flex items-center justify-between gap-2">
 <h2 className={aiSectionTitle}>{t("ai.session.title")}</h2>
 <button
 type="button"
 aria-label={t("ai.session.new")}
 className="inline-flex size-8 items-center justify-center rounded-[10px] border border-[var(--glass-border)] text-[var(--accent-cyan)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-cyan)_14%,transparent)]"
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
 placeholder={t("ai.session.search")}
 className={cn(aiField,"mt-0 py-2 pr-2 pl-8")}
 />
 </label>

 <div className="glass-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-0.5 pb-1">
 {favorites.length > 0 ? (
 <section>
 <p className={cn(glassTextCaption,"mb-1.5 px-1 uppercase tracking-[0.08em]")}>
 {t("ai.session.favorites")}
 </p>
 <ul className="space-y-1">
 {favorites.map((s) => (
 <SessionRow
 key={s.id}
 title={s.title}
 untitledLabel={t("ai.session.untitled")}
 favoriteLabel={t("ai.session.favorite")}
 pinLabel={t("ai.session.pin")}
 deleteLabel={t("ai.session.delete")}
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
 <p className={cn(glassTextCaption,"mb-1.5 px-1 uppercase tracking-[0.08em]")}>
 {t("ai.session.recent")}
 </p>
 {recent.length === 0 ? (
 <p className={cn(glassTextCaption,"px-1")}>{t("ai.session.empty")}</p>
 ) : (
 <ul className="space-y-1">
 {recent.map((s) => (
 <SessionRow
 key={s.id}
 title={s.title}
 untitledLabel={t("ai.session.untitled")}
 favoriteLabel={t("ai.session.favorite")}
 pinLabel={t("ai.session.pin")}
 deleteLabel={t("ai.session.delete")}
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
 title: string;
 untitledLabel: string;
 favoriteLabel: string;
 pinLabel: string;
 deleteLabel: string;
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
"group flex items-center gap-0.5 rounded-[10px] border px-1.5 py-1 transition-colors",
 props.active
 ?"border-[color-mix(in_srgb,var(--accent-cyan)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)]"
 :"border-transparent hover:bg-[color-mix(in_srgb,var(--bg-2)_45%,transparent)]"
 )}
 >
 <button
 type="button"
 className="min-w-0 flex-1 truncate px-1 py-1 text-left text-[13px] text-[var(--text-strong)]"
 onClick={props.onSelect}
 >
 {props.pinned ? (
 <Pin className="mr-1 inline size-3 align-[-1px] text-[var(--accent-cyan)]" />
 ) : null}
 {props.title || props.untitledLabel}
 </button>
 <button
 type="button"
 className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100"
 aria-label={props.favoriteLabel}
 onClick={props.onFavorite}
 >
 <Star
 className={cn(
"size-3.5",
 props.favorite
 ?"fill-[var(--accent-cyan)] text-[var(--accent-cyan)]"
 :"text-[var(--text-muted)]"
 )}
 />
 </button>
 <button
 type="button"
 className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100"
 aria-label={props.pinLabel}
 onClick={props.onPin}
 >
 <Pin className="size-3.5 text-[var(--text-muted)]" />
 </button>
 <button
 type="button"
 className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100"
 aria-label={props.deleteLabel}
 onClick={props.onDelete}
 >
 <Trash2 className="size-3.5 text-[var(--danger)]" />
 </button>
 </div>
 </li>
 );
}
