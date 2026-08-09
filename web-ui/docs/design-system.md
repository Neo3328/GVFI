# GVFI Liquid Glass 设计规范（macOS）

Developed by Mr. Gong · Copyright © 2026 Mr. Gong. All Rights Reserved.

## 视觉目标

严格采用 **macOS Liquid Glass** 材质语言（参考天气 App 的磨砂透明度、空间层级、柔和光影与悬浮反馈），**禁止**天空、云、日月、雨雪、气象图标、山川风景等天气/风景元素。

## 信息架构（功能不变）

| 页面 | 唯一职责 |
|------|----------|
| 首页 | 概览与导航 |
| 任务 | 队列与状态 |
| 视频 | 导入 / 预览 / 本地渲染 |
| AI | 大模型分析与报告 |
| 连接 | API Profile + LLM |
| 系统 | 外观 / 开发者 / 日志 / 关于 |

> 外观升级不改变路由、业务逻辑与数据流。

## 材质

| 层级 | 表现 |
|------|------|
| 背景 | 石墨抽象光晕（非具象风景） |
| 侧栏 / 主舞台 | 独立圆角玻璃体，软阴影分层 |
| 卡片 | `glass-panel` / `GlassCard`，顶缘高光 + 环境阴影 |
| 控件 | 10px 连续圆角，系统蓝强调色 `#0a84ff` |

## 令牌

- `src/design-tokens/tokens.css` — 色板 / 圆角 / 字号
- `src/design-tokens/glass-base.css` — 面板与控件材质
- `src/design-tokens/glass.css` / `motion.css` — 阴影与动效
- 背景预设：`nebula` 石墨层叠 · `aurora` 柔光片层 · `studio` 浅色

## 动效

- 控件悬停：`translateY(-1px)` + 阴影加深（`duration-fast` ≈ 180ms）
- 尊重 `prefers-reduced-motion` / `prefers-reduced-transparency`

## 版权

保留 `@/lib/brand` 与 `<CopyrightFooter />`。
