/**
 * GVFI — Electron preload (window controls bridge).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gvfiDesktop", {
  isDesktop: true,
  platform: process.platform,
  windowMinimize: () => ipcRenderer.invoke("gvfi:window-minimize"),
  windowMaximizeToggle: () => ipcRenderer.invoke("gvfi:window-maximize-toggle"),
  windowClose: () => ipcRenderer.invoke("gvfi:window-close"),
  windowIsMaximized: () => ipcRenderer.invoke("gvfi:window-is-maximized"),
  setLocale: (locale) => ipcRenderer.invoke("gvfi:set-locale", locale),
  getLocale: () => ipcRenderer.invoke("gvfi:get-locale"),
  restartApi: () => ipcRenderer.invoke("gvfi:restart-api"),
  writeTextCopy: (payload) => ipcRenderer.invoke("gvfi:write-text-copy", payload),
  revealInFolder: (targetPath) =>
    ipcRenderer.invoke("gvfi:reveal-in-folder", targetPath),
  onMaximizedChange: (callback) => {
    if (typeof callback !== "function") return () => {};
    const handler = (_event, value) => callback(Boolean(value));
    ipcRenderer.on("gvfi:maximized-changed", handler);
    return () => ipcRenderer.removeListener("gvfi:maximized-changed", handler);
  },
});
