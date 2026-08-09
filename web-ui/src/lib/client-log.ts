/**
 * GVFI — Structured client-side logging for diagnostics.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

export type ClientLogLevel = "debug" | "info" | "warn" | "error";

export interface ClientLogEntry {
  ts: string;
  level: ClientLogLevel;
  scope: string;
  message: string;
  detail?: unknown;
}

const MAX_ENTRIES = 400;
const buffer: ClientLogEntry[] = [];
const listeners = new Set<(entry: ClientLogEntry) => void>();

function push(entry: ClientLogEntry) {
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
  listeners.forEach((fn) => fn(entry));

  const line = `[${entry.ts}] [${entry.level}] [${entry.scope}] ${entry.message}`;
  if (entry.level === "error") console.error(line, entry.detail ?? "");
  else if (entry.level === "warn") console.warn(line, entry.detail ?? "");
  else if (entry.level === "debug") console.debug(line, entry.detail ?? "");
  else console.info(line, entry.detail ?? "");
}

export function clientLog(
  level: ClientLogLevel,
  scope: string,
  message: string,
  detail?: unknown
) {
  push({
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    detail,
  });
}

export function getClientLogs(): readonly ClientLogEntry[] {
  return buffer;
}

export function clearClientLogs() {
  buffer.length = 0;
}

export function subscribeClientLogs(fn: (entry: ClientLogEntry) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const logApi = {
  info: (message: string, detail?: unknown) =>
    clientLog("info", "api", message, detail),
  warn: (message: string, detail?: unknown) =>
    clientLog("warn", "api", message, detail),
  error: (message: string, detail?: unknown) =>
    clientLog("error", "api", message, detail),
};
