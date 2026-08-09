# GVFI Web UI

Next.js 16 + Electron — Liquid Glass AI 视频工作站前端。

Developed by Mr. Gong · Copyright © 2026 Mr. Gong. All Rights Reserved.

## 开发

```bash
npm install
npm run dev -- --port 3456   # Web 开发
npm run desktop              # Electron（需 API :8765）
npm run build                # 生产构建
npm run dist:win             # 打包 Windows 目录版
```

从项目根目录打包推荐：`生成桌面软件.cmd`

UI 热更新（不重打 Electron 壳）：

```bat
..\scripts\sync-desktop-ui.cmd
```

## 主要路由

| 路径 | 页面 |
|------|------|
| `/app/process` | 视频处理（本地补帧 / AI 大模型） |
| `/app/render` | 渲染中心 |
| `/app/settings/api` | API 与大模型密钥 |
| `/app/settings/about` | 关于 |

## 品牌常量

统一引用 `@/lib/brand`，详见根目录 `.cursor/rules/gvfi-copyright.mdc`。
