"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ApiProfileKind = "local" | "cloud";

export interface ApiProfile {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  token?: string;
  timeoutMs: number;
  concurrency: number;
  uploadLimitMb?: number;
  isDefault: boolean;
  kind: ApiProfileKind;
}

export interface ApiConfigState {
  profiles: ApiProfile[];
  activeProfileId: string | null;
  addProfile: (profile: Omit<ApiProfile, "id"> & { id?: string }) => string;
  updateProfile: (id: string, patch: Partial<Omit<ApiProfile, "id">>) => void;
  removeProfile: (id: string) => void;
  setDefaultProfile: (id: string) => void;
  getDefaultProfile: () => ApiProfile | null;
  getActiveProfile: () => ApiProfile | null;
}

const LOCAL_DEFAULT_BASE = "/api";
const LOCAL_DIRECT_BASE = "http://127.0.0.1:8765";

function createLocalDefaultProfile(): ApiProfile {
  return {
    id: "local-default",
    name: "本地代理 (/api)",
    baseUrl: LOCAL_DEFAULT_BASE,
    timeoutMs: 60_000,
    concurrency: 1,
    uploadLimitMb: 2048,
    isDefault: true,
    kind: "local",
  };
}

function createLocalDirectProfile(): ApiProfile {
  return {
    id: "local-direct",
    name: "本地直连 (:8765)",
    baseUrl: LOCAL_DIRECT_BASE,
    timeoutMs: 120_000,
    concurrency: 1,
    uploadLimitMb: 2048,
    isDefault: false,
    kind: "local",
  };
}

function ensureBuiltinProfiles(profiles: ApiProfile[]): ApiProfile[] {
  const byId = new Map(profiles.map((p) => [p.id, p]));
  if (!byId.has("local-default")) {
    byId.set("local-default", createLocalDefaultProfile());
  }
  if (!byId.has("local-direct")) {
    byId.set("local-direct", createLocalDirectProfile());
  }
  return Array.from(byId.values());
}

function normalizeProfiles(profiles: ApiProfile[]): ApiProfile[] {
  const next = ensureBuiltinProfiles(
    profiles.length === 0 ? [createLocalDefaultProfile()] : profiles
  );
  const hasDefault = next.some((p) => p.isDefault);
  if (!hasDefault) {
    return next.map((p, i) => ({ ...p, isDefault: i === 0 }));
  }
  return next;
}

export const useApiConfigStore = create<ApiConfigState>()(
  persist(
    (set, get) => ({
      profiles: [createLocalDefaultProfile(), createLocalDirectProfile()],
      activeProfileId: "local-default",

      addProfile: (profile) => {
        const id = profile.id ?? `profile-${crypto.randomUUID()}`;
        set((state) => {
          const next: ApiProfile = {
            id,
            name: profile.name,
            baseUrl: profile.baseUrl,
            apiKey: profile.apiKey,
            token: profile.token,
            timeoutMs: profile.timeoutMs ?? 60_000,
            concurrency: profile.concurrency ?? 1,
            uploadLimitMb: profile.uploadLimitMb,
            isDefault: profile.isDefault ?? false,
            kind: profile.kind ?? "local",
          };
          let profiles = [...state.profiles, next];
          if (next.isDefault) {
            profiles = profiles.map((p) => ({
              ...p,
              isDefault: p.id === id,
            }));
          }
          return { profiles, activeProfileId: state.activeProfileId ?? id };
        });
        return id;
      },

      updateProfile: (id, patch) => {
        set((state) => {
          let profiles = state.profiles.map((p) =>
            p.id === id ? { ...p, ...patch, id } : p
          );
          if (patch.isDefault) {
            profiles = profiles.map((p) => ({
              ...p,
              isDefault: p.id === id,
            }));
          }
          return { profiles: normalizeProfiles(profiles) };
        });
      },

      removeProfile: (id) => {
        set((state) => {
          if (state.profiles.length <= 1) return state;
          const profiles = normalizeProfiles(
            state.profiles.filter((p) => p.id !== id)
          );
          const activeProfileId =
            state.activeProfileId === id
              ? profiles.find((p) => p.isDefault)?.id ?? profiles[0]?.id ?? null
              : state.activeProfileId;
          return { profiles, activeProfileId };
        });
      },

      setDefaultProfile: (id) => {
        get().updateProfile(id, { isDefault: true });
        set({ activeProfileId: id });
      },

      getDefaultProfile: () => {
        const { profiles } = get();
        return profiles.find((p) => p.isDefault) ?? profiles[0] ?? null;
      },

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        if (activeProfileId) {
          return profiles.find((p) => p.id === activeProfileId) ?? null;
        }
        return get().getDefaultProfile();
      },
    }),
    {
      name: "gvfi-api-config-v1",
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ApiConfigState> | undefined;
        const profiles = normalizeProfiles(saved?.profiles ?? current.profiles);
        return {
          ...current,
          ...saved,
          profiles,
        };
      },
    }
  )
);

/** 敏感字段 — 禁止写入日志 */
export function redactProfile(profile: ApiProfile): Omit<ApiProfile, "apiKey" | "token"> & {
  hasApiKey: boolean;
  hasToken: boolean;
} {
  const { apiKey, token, ...rest } = profile;
  return {
    ...rest,
    hasApiKey: Boolean(apiKey),
    hasToken: Boolean(token),
  };
}
