/**
 * GVFI — AI chat session store (P0 local persist).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AiMessageRole = "user" | "assistant" | "system";

export interface AiChatMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: number;
  streaming?: boolean;
}

export interface AiSession {
  id: string;
  title: string;
  favorite: boolean;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  messages: AiChatMessage[];
}

interface AiSessionStore {
  sessions: AiSession[];
  activeSessionId: string | null;
  searchQuery: string;
  createSession: (title?: string) => string;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  toggleFavorite: (id: string) => void;
  togglePinned: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  appendMessage: (sessionId: string, message: Omit<AiChatMessage, "id" | "createdAt"> & { id?: string }) => string;
  updateMessageContent: (sessionId: string, messageId: string, content: string, streaming?: boolean) => void;
  getActiveSession: () => AiSession | null;
  filteredSessions: () => AiSession[];
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function sortSessions(list: AiSession[]): AiSession[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export const useAiSessionStore = create<AiSessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      searchQuery: "",

      createSession: (title = "新会话") => {
        const id = uid();
        const now = Date.now();
        const session: AiSession = {
          id,
          title,
          favorite: false,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((s) => ({
          sessions: [session, ...s.sessions],
          activeSessionId: id,
        }));
        return id;
      },

      deleteSession: (id) => {
        set((s) => {
          const sessions = s.sessions.filter((x) => x.id !== id);
          const activeSessionId =
            s.activeSessionId === id
              ? sessions[0]?.id ?? null
              : s.activeSessionId;
          return { sessions, activeSessionId };
        });
      },

      renameSession: (id, title) => {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, title, updatedAt: Date.now() } : x
          ),
        }));
      },

      toggleFavorite: (id) => {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, favorite: !x.favorite, updatedAt: Date.now() } : x
          ),
        }));
      },

      togglePinned: (id) => {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, pinned: !x.pinned, updatedAt: Date.now() } : x
          ),
        }));
      },

      setActiveSession: (id) => set({ activeSessionId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      appendMessage: (sessionId, message) => {
        const id = message.id ?? uid();
        const createdAt = Date.now();
        set((s) => ({
          sessions: s.sessions.map((x) => {
            if (x.id !== sessionId) return x;
            const title =
              x.messages.length === 0 && message.role === "user"
                ? message.content.slice(0, 32) || x.title
                : x.title;
            return {
              ...x,
              title,
              updatedAt: createdAt,
              messages: [
                ...x.messages,
                {
                  id,
                  role: message.role,
                  content: message.content,
                  createdAt,
                  streaming: message.streaming,
                },
              ],
            };
          }),
        }));
        return id;
      },

      updateMessageContent: (sessionId, messageId, content, streaming) => {
        set((s) => ({
          sessions: s.sessions.map((x) => {
            if (x.id !== sessionId) return x;
            return {
              ...x,
              updatedAt: Date.now(),
              messages: x.messages.map((m) =>
                m.id === messageId
                  ? {
                      ...m,
                      content,
                      streaming: streaming ?? m.streaming,
                    }
                  : m
              ),
            };
          }),
        }));
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((x) => x.id === activeSessionId) ?? null;
      },

      filteredSessions: () => {
        const { sessions, searchQuery } = get();
        const q = searchQuery.trim().toLowerCase();
        const list = sortSessions(sessions);
        if (!q) return list;
        return list.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.messages.some((m) => m.content.toLowerCase().includes(q))
        );
      },
    }),
    {
      name: "gvfi-ai-sessions-v1",
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);
