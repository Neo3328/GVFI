/**
 * GVFI — API base URL helper with profile-aware routing.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { useApiConfigStore } from "@/services/api-config-store";

/** Direct GVFI Python API (used when Next rewrite proxy fails). */
export const GVFI_DIRECT_ORIGIN =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GVFI_API_ORIGIN) ||
  "http://127.0.0.1:8765";

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "");
}

/** Active profile baseUrl — `/api`, absolute http(s), or empty → defaults. */
export function getActiveApiBase(): string {
  if (typeof window === "undefined") return "/api";
  try {
    const profile = useApiConfigStore.getState().getActiveProfile();
    const base = profile?.baseUrl?.trim();
    return base || "/api";
  } catch {
    return "/api";
  }
}

export function getActiveDirectOrigin(): string {
  const base = getActiveApiBase();
  if (base.startsWith("http://") || base.startsWith("https://")) {
    return normalizeBase(base);
  }
  return GVFI_DIRECT_ORIGIN;
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  try {
    const profile = useApiConfigStore.getState().getActiveProfile();
    if (!profile) return {};
    const headers: Record<string, string> = {};
    if (profile.apiKey?.trim()) {
      headers.Authorization = `Bearer ${profile.apiKey.trim()}`;
    } else if (profile.token?.trim()) {
      headers.Authorization = `Bearer ${profile.token.trim()}`;
    }
    return headers;
  } catch {
    return {};
  }
}

/**
 * Build request URL.
 * Prefer same-origin `/api/...` (Next rewrite → :8765) unless profile is absolute.
 * Callers may retry with `preferDirect: true`.
 */
export function apiUrl(path: string, preferDirect = false): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const base = getActiveApiBase();

  if (base.startsWith("http://") || base.startsWith("https://")) {
    return `${normalizeBase(base)}${clean}`;
  }

  if (preferDirect) {
    return `${getActiveDirectOrigin()}${clean}`;
  }

  const proxyRoot = base.startsWith("/") ? normalizeBase(base) : "/api";
  return `${proxyRoot}${clean}`;
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export function apiErrorMessage(
  payload: { error?: string; message?: string },
  fallback: string
): string {
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  return fallback;
}

function hasRequestBody(init?: RequestInit): boolean {
  return init?.body != null;
}

function isMultipartBody(init?: RequestInit): boolean {
  if (typeof FormData !== "undefined" && init?.body instanceof FormData) {
    return true;
  }
  return false;
}

function mergeInit(init?: RequestInit): RequestInit {
  const auth = authHeaders();
  if (!Object.keys(auth).length) return init ?? {};
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(auth)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return { ...init, headers };
}

/**
 * Fetch GVFI API with automatic fallback from `/api` proxy to direct :8765.
 *
 * - Multipart / large uploads go **direct** first (Next rewrite defaults to 10MB).
 * - Body is never reused across retries (FormData can only be read once).
 * - Active API profile from `gvfi-api-config-v1` controls base URL + auth.
 * - Bug#4 修复：原实现每次失败都会再访问一次 127.0.0.1:8765（preflight 已经被代理拦下 / 不可达），
 *   结果是 Next.js 进程侧吐出大量 ECONNRESET 噪声，并让 UI 处于无限重试循环。
 *   现在加入 per-process cooldown：默认 5 秒内只重试一次，超过的请求直接 reject，
 *   让 useHealth 等 hook 进入 off-line 状态而非疯狂打日志。
 */
const DIRECT_FALLBACK_COOLDOWN_MS = 5_000;
let directFallbackBlockedUntil = 0;

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const multipart = isMultipartBody(init);
  const hasBody = hasRequestBody(init);
  const requestInit = mergeInit(init);
  const absoluteProfile =
    getActiveApiBase().startsWith("http://") ||
    getActiveApiBase().startsWith("https://");

  // Absolute profile: always hit that origin (no /api proxy).
  if (absoluteProfile) {
    return fetch(apiUrl(path, true), requestInit);
  }

  // Uploads / POST bodies: hit Python API directly to avoid proxy body limits.
  if (multipart || (hasBody && init?.method && init.method.toUpperCase() !== "GET")) {
    try {
      return await fetch(apiUrl(path, true), requestInit);
    } catch (directError) {
      if (!hasBody) {
        return fetch(apiUrl(path, false), requestInit);
      }
      throw directError;
    }
  }

  // Bug#4：普通 GET 请求先走 /api 代理；代理失败时仅在 cooldown 之外降级到直连，避免日志风暴。
  if (Date.now() < directFallbackBlockedUntil) {
    return fetch(apiUrl(path, false), requestInit);
  }

  try {
    const response = await fetch(apiUrl(path, false), requestInit);
    if (response.status >= 500) {
      try {
        return await fetch(apiUrl(path, true), requestInit);
      } catch {
        directFallbackBlockedUntil = Date.now() + DIRECT_FALLBACK_COOLDOWN_MS;
        return response;
      }
    }
    return response;
  } catch {
    directFallbackBlockedUntil = Date.now() + DIRECT_FALLBACK_COOLDOWN_MS;
    return fetch(apiUrl(path, false), requestInit);
  }
}

export { readJson };
