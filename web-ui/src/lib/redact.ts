/**
 * GVFI — Redact secrets from logs and diagnostic payloads.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

const SENSITIVE_KEY =
  /^(api[_-]?key|token|authorization|password|secret|access[_-]?token|refresh[_-]?token|bearer)$/i;

const BEARER_RE = /Bearer\s+[A-Za-z0-9._\-+/=]+/gi;
const KEY_ASSIGN_RE =
  /("?(?:api[_-]?key|apiKey|token|authorization|password|secret)"?\s*[:=]\s*)(["']?)[^"'\\s,}\\]]+/gi;

export function redactString(value: string): string {
  return value
    .replace(BEARER_RE, "Bearer ***")
    .replace(KEY_ASSIGN_RE, "$1$2***");
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[Truncated]";
  if (typeof value === "string") return redactString(value);
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = nested ? "***" : nested;
    } else {
      out[key] = redactValue(nested, depth + 1);
    }
  }
  return out;
}
