/**
 * GVFI — 根路由 (/) 处理.
 * - 开发模式 / 未登录场景：展示 Landing 介绍页（保持原行为）。
 * - 桌面应用启动后由 Electron 把窗口直接加载 /app，新主页由 /app/page.tsx 接管。
 *
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  return <LandingPage />;
}