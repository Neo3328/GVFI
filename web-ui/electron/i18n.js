/**
 * GVFI — Electron main-process locale helpers.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const MESSAGES = {
  "zh-CN": {
    bootFailedTitle: "GVFI 启动失败",
    bootFailedBody: "{message}\n\n日志: {log}",
    pageLoadFail: "页面加载失败 ({code}): {desc}\n{url}",
    waitTimeout: "等待服务超时: {url}",
    standaloneMissing: "未找到 standalone 服务: {path}",
    depsMissing:
      "未找到 standalone 依赖 (node_modules/next)。请重新打包桌面版，或运行 scripts\\sync-desktop-ui.cmd 同步 UI。",
    splashTagline: "AI 视频工作站",
  },
  en: {
    bootFailedTitle: "GVFI failed to start",
    bootFailedBody: "{message}\n\nLog: {log}",
    pageLoadFail: "Page failed to load ({code}): {desc}\n{url}",
    waitTimeout: "Timed out waiting for service: {url}",
    standaloneMissing: "Standalone server not found: {path}",
    depsMissing:
      "Standalone dependencies missing (node_modules/next). Rebuild the desktop app or run scripts\\sync-desktop-ui.cmd.",
    splashTagline: "AI Video Workstation",
  },
};

let currentLocale = "zh-CN";

function localeFilePath() {
  try {
    return path.join(app.getPath("userData"), "gvfi-locale.json");
  } catch {
    return null;
  }
}

function normalizeLocale(value) {
  if (!value || typeof value !== "string") return null;
  const v = value.toLowerCase();
  if (v.startsWith("zh")) return "zh-CN";
  if (v.startsWith("en")) return "en";
  return null;
}

function loadPersistedLocale() {
  const file = localeFilePath();
  if (!file || !fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return normalizeLocale(data.locale);
  } catch {
    return null;
  }
}

function detectLocale() {
  return (
    loadPersistedLocale() ||
    normalizeLocale(app.getLocale?.() || "") ||
    "zh-CN"
  );
}

function setLocale(locale) {
  const next = normalizeLocale(locale) || "zh-CN";
  currentLocale = next;
  const file = localeFilePath();
  if (!file) return next;
  try {
    fs.writeFileSync(file, JSON.stringify({ locale: next }), "utf8");
  } catch {
    /* ignore */
  }
  return next;
}

function initLocale() {
  currentLocale = detectLocale();
  return currentLocale;
}

function t(key, params) {
  const catalog = MESSAGES[currentLocale] || MESSAGES["zh-CN"];
  let text = catalog[key] || MESSAGES.en[key] || String(key);
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

function getLocale() {
  return currentLocale;
}

module.exports = {
  initLocale,
  setLocale,
  getLocale,
  t,
};
