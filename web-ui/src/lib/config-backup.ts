"use client";

import { useAiModelConfigStore } from "@/stores/ai-model-config-store";
import { useApiConfigStore, type ApiProfile } from "@/services/api-config-store";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useDisplayStore } from "@/stores/display-store";
import { useLocaleStore } from "@/stores/locale-store";

export const CONFIG_BACKUP_VERSION = 1;

export type GvfiConfigBackup = {
  schema: "gvfi-config-backup";
  version: 1;
  exportedAt: string;
  includesSecrets: boolean;
  api: { profiles: ApiProfile[]; activeProfileId: string | null };
  appearance: ReturnType<typeof useAppearanceStore.getState>;
  display: ReturnType<typeof useDisplayStore.getState>;
  locale: { locale: ReturnType<typeof useLocaleStore.getState>["locale"] };
  ai: ReturnType<typeof useAiModelConfigStore.getState>;
};

function stripActions<T extends object>(state: T) {
  return Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== "function"));
}

export function createConfigBackup(includeSecrets: boolean): GvfiConfigBackup {
  const api = useApiConfigStore.getState();
  const ai = useAiModelConfigStore.getState();
  const profiles = api.profiles.map((profile) => includeSecrets
    ? { ...profile }
    : { ...profile, apiKey: undefined, token: undefined });
  return {
    schema: "gvfi-config-backup",
    version: CONFIG_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    includesSecrets: includeSecrets,
    api: { profiles, activeProfileId: api.activeProfileId },
    appearance: stripActions(useAppearanceStore.getState()) as unknown as GvfiConfigBackup["appearance"],
    display: stripActions(useDisplayStore.getState()) as unknown as GvfiConfigBackup["display"],
    locale: { locale: useLocaleStore.getState().locale },
    ai: { ...stripActions(ai), apiKey: includeSecrets ? ai.apiKey : "" } as unknown as GvfiConfigBackup["ai"],
  };
}

export function parseConfigBackup(raw: string): GvfiConfigBackup {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("invalid");
  const data = value as Partial<GvfiConfigBackup>;
  if (data.schema !== "gvfi-config-backup" || data.version !== CONFIG_BACKUP_VERSION) throw new Error("version");
  if (!data.api?.profiles || !Array.isArray(data.api.profiles)) throw new Error("shape");
  return data as GvfiConfigBackup;
}

export function applyConfigBackup(data: GvfiConfigBackup) {
  const api = useApiConfigStore.getState();
  const currentProfiles = api.profiles;
  const profiles = data.api.profiles.map((profile) => {
    const current = currentProfiles.find((item) => item.id === profile.id);
    return { ...profile, apiKey: profile.apiKey ?? current?.apiKey, token: profile.token ?? current?.token };
  });
  useApiConfigStore.setState({ profiles, activeProfileId: data.api.activeProfileId });
  useAppearanceStore.setState(data.appearance);
  useDisplayStore.setState(data.display);
  useLocaleStore.setState(data.locale);
  useAiModelConfigStore.setState(data.ai);
  useAppearanceStore.getState().apply();
  useDisplayStore.getState().apply();
  useLocaleStore.getState().syncHtmlLang();
}
