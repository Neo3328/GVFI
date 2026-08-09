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
  --text-strong: #f5f5f7;
  --text-normal: #d2d2d7;
  --text-muted: #98989f;
  --accent: #0a84ff;
  --accent-cyan: #64d2ff;
  --glass-border: rgba(255, 255, 255, 0.28);
  --glass-opacity: 0.42;
  --glass-blur: 40px;
  --glass-shadow-blur: 48px;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-control: 10px;
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
  color: #d2d2d7;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei UI", system-ui, sans-serif;
}
#lg-background-layer {
  background:
    radial-gradient(ellipse 55% 40% at 30% 0%, rgba(255,255,255,0.07), transparent 50%),
    radial-gradient(ellipse 50% 45% at 78% 100%, rgba(10,132,255,0.1), transparent 48%),
    linear-gradient(145deg, #0a0c10 0%, #141820 50%, #1a2030 100%);
}
.glass-panel {
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 22px;
  background: linear-gradient(168deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)), rgba(28, 34, 45, 0.42);
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
  color: #f5f5f7 !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  border-radius: 10px !important;
}
@keyframes gvfi-splash-out {
  0%, 70% { opacity: 1; pointer-events: auto; }
  100% { opacity: 0; pointer-events: none; visibility: hidden; }
}
[data-gvfi-splash] {
  animation: gvfi-splash-out 2s ease forwards;
}
`;
