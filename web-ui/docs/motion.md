# GVFI 动画参数说明

> Liquid Glass 动效令牌 · 源文件 `web-ui/src/design-tokens/motion.css`  
> React 封装：`web-ui/src/components/workspace/motion.ts`

Developed by Mr. Gong · Copyright © 2026 Mr. Gong. All Rights Reserved.

## 设计原则

1. **反馈优先**：控件状态变化 ≤ 160ms，避免拖沓。
2. **页面切换**：260ms 淡入，配合 `prefers-reduced-motion` 可关闭。
3. **禁止噪声**：不在首屏叠多个无关脉冲动画。

## CSS 令牌

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--duration-press` | `80ms` | iOS 按钮按下 |
| `--duration-release` | `120ms` | iOS 按钮弹簧回弹 |
| `--ease-ios-press` | `cubic-bezier(0.32, 0.72, 0, 1)` | 按压 ease-out |
| `--ease-ios-spring` | `cubic-bezier(0.22, 1.28, 0.36, 1)` | 回弹微过冲弹簧 |
| `--duration-fast` | （tokens 内定义） | 悬停 / 聚焦微交互 |
| `--duration-control` | `160ms` | 开关、滑条 |
| `--duration-normal` | （tokens） | 面板展开 |
| `--duration-page` | `260ms` | 路由表面切换 |
| `--duration-toast-enter` | `180ms` | Toast 入场 |
| `--duration-toast-exit` | `130ms` | Toast 退场 |
| `--lg-duration-instant` | `100ms` | 即时反馈 |
| `--lg-duration-slow` | `400ms` | 强调过渡 |
| `--lg-ease-out` | `var(--ease-standard)` | 标准缓出 |
| `--lg-ease-spring` | `var(--ease-ios-spring)` | 按钮回弹弹簧 |

## iOS Liquid Glass 按钮

源文件：`design-tokens/ios-liquid-button.css` · 类名：`.ios-lg-btn`（`GlassButton` 默认启用）

| 阶段 | 时长 | 缓动 | 视觉 |
|------|------|------|------|
| 按下 | 80ms | `--ease-ios-press` | `scale(0.96)`、透明度↓、高光下移、阴影内收、磨砂减弱 |
| 松开 | 120ms | `--ease-ios-spring` | 尺寸/光影弹簧复原，轻微过冲后收敛 |

不改变 `onClick` / 路由 / 业务逻辑。

## React 工具类

| 导出 | 行为 |
|------|------|
| `motionControl` | 控件 transform/opacity/shadow |
| `motionPanel` | 面板展开 |
| `motionPage` | 页面级淡入 |
| `motionToastEnter` / `motionToastExit` | Toast |
| `motionProgress` | 进度条宽度 |

## 玻璃材质联动

外观滑条写入 CSS 变量（非动画时长，但影响视觉反馈）：

| 控件 | CSS 变量 |
|------|----------|
| 玻璃透明度 | `--glass-opacity` / `--lg-glass-opacity` |
| Blur | `--glass-blur` / `--lg-glass-blur` |
| 边框亮度 | `--glass-border-opacity` / `--lg-border-brightness` |
| 阴影 | `--glass-shadow-opacity` / `--lg-shadow-strength` |
| 辉光 | `--lg-glow-strength` |
| 背景不透明度 / 模糊 | `--lg-bg-opacity` / `--lg-bg-blur` |

## 无障碍

所有 motion 工具类附带 `motion-reduce:transition-none` / `motion-reduce:animate-none`。
