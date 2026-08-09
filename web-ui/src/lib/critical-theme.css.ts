/**
 * GVFI — Critical inline theme for Electron first paint.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

/** 内联关键主题 — Electron/离线时外部 CSS 未加载也能正常显示 */
export const CRITICAL_THEME_CSS = `
:root {
  --bg-0: #0b0d12;
  --bg-1: #141820;
  --bg-2: #1c222d;
  --text-strong: #ffffff;
  --text-normal: #f0f0f2;
  --text-muted: #b0b0b8;
  --app-font-family: "YouYuan", "幼圆", "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif;
  --app-font-size: 13px;
  --app-font-weight: 400;
  --app-ui-scale: 1;
  --app-text-color: #ffffff;
  --app-text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  --app-contrast-scrim: 0.12;
  --accent: #0a84ff;
  --accent-cyan: #64d2ff;
  --glass-border: rgba(255, 255, 255, 0.28);
  --glass-opacity: 0.42;
  --glass-blur: 40px;
  --glass-shadow-blur: 48px;
  --window-radius: 16px;
  --panel-radius: 14px;
  --card-radius: 12px;
  --control-radius: 9px;
  --radius-sm: var(--control-radius);
  --radius-md: var(--card-radius);
  --radius-lg: var(--panel-radius);
  --radius-button: var(--control-radius);
  --control-height: 28px;
  --control-font: 13px;
  --foreground: var(--text-strong);
  --background: var(--bg-0);
  --muted-foreground: var(--text-muted);
}
html, body {
  min-height: 100%;
  margin: 0;
  background: transparent;
  color: #f0f0f2;
  color-scheme: dark;
  font-family: var(--app-font-family);
  font-size: calc(var(--app-font-size) * var(--app-ui-scale));
  font-weight: var(--app-font-weight);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.26) transparent;
}
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.26) transparent;
}
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  min-width: 24px;
  min-height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
}
*::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.34);
  border: 2px solid transparent;
  background-clip: padding-box;
}
*::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.44);
  border: 2px solid transparent;
  background-clip: padding-box;
}
*::-webkit-scrollbar-corner {
  background: transparent;
}
*::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
#lg-background-layer {
  background:
    radial-gradient(ellipse 55% 40% at 30% 0%, rgba(255,255,255,0.07), transparent 50%),
    radial-gradient(ellipse 50% 45% at 78% 100%, rgba(10,132,255,0.1), transparent 48%),
    linear-gradient(145deg, #0a0c10 0%, #141820 50%, #1a2030 100%);
}
.gvfi-window-frame {
  position: relative;
  min-height: 100dvh;
  background: transparent;
  isolation: isolate;
}
html[data-desktop-shell="true"] .gvfi-window-frame {
  border-radius: var(--window-radius);
  overflow: hidden;
}
.glass-panel {
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: var(--panel-radius);
  background: linear-gradient(168deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)), rgba(28, 34, 45, 0.42);
  background-clip: padding-box;
  overflow: hidden;
  backdrop-filter: blur(40px) saturate(180%);
  box-shadow: 0 12px 40px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.28);
}
.glass-field-label {
  font-size: 12px;
  color: #98989f;
}
[data-slot="select-trigger"],
[data-slot="glass-input"],
.glass-input,
.glass-select {
  color: var(--app-text-color, #f0f0f2) !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  border-radius: var(--control-radius) !important;
  background-clip: padding-box !important;
}
@keyframes gvfi-splash-out {
  0%, 70% { opacity: 1; pointer-events: auto; }
  100% { opacity: 0; pointer-events: none; visibility: hidden; }
}
[data-gvfi-splash] {
  animation: gvfi-splash-out 2s ease forwards;
}
`;
