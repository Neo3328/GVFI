# GVFI · AI 视频工作站

Liquid Glass 风格桌面应用 — 本地 RIFE 补帧、超分，以及大模型视觉视频分析。

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 功能概览

| 模块 | 路由 | 说明 |
|------|------|------|
| **首页** | `/app/dashboard` | KPI 与快捷入口 |
| **任务** | `/app/tasks` | 任务队列与输出 |
| **视频** | `/app/video` | 导入、预览、本地补帧/超分 |
| **AI** | `/app/ai` | 大模型视觉分析与报告 |
| **连接** | `/app/settings` | API Profile、大模型 URL/密钥 |
| **系统** | `/app/system` | 外观 / 开发者 / 日志 / 关于 |

---

## 目录结构

```
GVFI/
├── 启动GVFI.cmd              ★ 推荐入口（打包版优先，否则开发模式）
├── 生成桌面软件.cmd          完整 Electron 打包
├── 创建桌面快捷方式.bat      桌面快捷方式 + 静默启动
├── GVFI.vbs                  无黑窗口启动（需已打包）
│
├── scripts/                  启动、打包、热更新脚本
├── web-ui/                   Next.js 16 + Electron 前端源码
├── ECCV2022-RIFE/            RIFE 算法、VideoWorker、GVFI API (:8765)
├── AI_Tools/                 RealESRGAN 等 CLI 工具
└── .cursor/rules/            项目规范（含版权保留规则）
```

---

## 环境要求

- **Windows 10/11**（x64）
- **Python 3** + `ECCV2022-RIFE/requirements.txt` 依赖
- **Node.js 20+**（仅开发或自行打包时需要）
- 项目根目录保持完整，**勿移动** `ECCV2022-RIFE` 与 `AI_Tools` 相对位置

---

## 快速开始

### 方式一：已打包（推荐）

1. 若尚无 `GVFI.exe`，双击 **`生成桌面软件.cmd`**（首次约 3–5 分钟）
2. 双击 **`启动GVFI.cmd`**
3. 可选：运行 **`创建桌面快捷方式.bat`**

打包输出：

- `web-ui/dist-gvfi-fresh/win-unpacked/GVFI.exe`（推荐，避免主目录 EBUSY）
- `web-ui/dist-gvfi/win-unpacked/GVFI.exe`（主目录）
- `web-ui/dist-gvfi-build/win-unpacked/GVFI.exe`（主目录被占用时的备用）

### 方式二：开发模式

双击 **`启动GVFI.cmd`**（无打包版时自动进入），或：

```bat
scripts\launch-dev.cmd    REM Electron + API
scripts\launch-web.cmd    REM 仅浏览器 http://127.0.0.1:3456/app
```

---

## 脚本一览

| 入口 | 实际脚本 | 用途 |
|------|----------|------|
| `启动GVFI.cmd` | `_resolve-exe` → desktop / dev | 智能启动 |
| `生成桌面软件.cmd` | `scripts/build-desktop.cmd` | 完整打包 |
| `创建桌面快捷方式.bat` | `scripts/create-shortcut.bat` | 桌面图标 |
| `GVFI.vbs` | `scripts/launch-desktop.vbs` | 静默启动 |
| — | `scripts/sync-desktop-ui.cmd` | 仅热更新 UI（不重打 Electron） |
| — | `scripts/launch-web.cmd` | Web 开发 |
| — | `ECCV2022-RIFE/GVFI_API.cmd` | 单独启动后端 API |

---

## 服务端口

| 服务 | 地址 |
|------|------|
| Web UI | `http://127.0.0.1:3456` |
| GVFI API | `http://127.0.0.1:8765` |

健康检查：`http://127.0.0.1:8765/health`

---

## 前端开发

详见 [`web-ui/README.md`](web-ui/README.md)

```bat
cd web-ui
npm install
npm run dev -- --port 3456
npm run build
npm run dist:win
```

修改 UI 后快速同步到已安装包：

```bat
scripts\sync-desktop-ui.cmd
```

---

## 常见问题

**Q：打包时提示 EBUSY / 文件被占用？**  
关闭正在运行的 `GVFI.exe`，或让脚本自动写入 `dist-gvfi-build`。

**Q：界面白块、标签看不清？**  
使用最新打包；在外观中选择 **浅色**、**Dark** 或 **图片主题**。

**Q：AI 大模型无响应？**  
在 **连接** 页配置 Key 并测试；需 API 服务 `:8765` 正常。也可切换「本地直连」Profile。

**Q：补帧失败？**  
确认 `AI_Tools` 或 `ECCV2022-RIFE` 内 ffmpeg、RIFE 模型完整；查看系统 → 日志 / `%APPDATA%\gvfi-desktop\gvfi-desktop.log`。

**Q：文档在哪？**  
- API：`web-ui/docs/api.md`
- 配置：`web-ui/docs/config.md`
- 动画：`web-ui/docs/motion.md`
- 架构：`web-ui/docs/architecture.md`
- 更新：`CHANGELOG.md`
- 使用说明：`docs/USER_GUIDE.md`
- 对外发布：`docs/RELEASE.md`
- 1.0.0 下载与哈希：`releases/1.0.0/DOWNLOADS.md`

---

## 对外发布（Windows 1.0.0）

正式给他人使用前请阅读 [`docs/RELEASE.md`](docs/RELEASE.md)。摘要：

1. **代码签名**：设置 `CSC_LINK` / `CSC_KEY_PASSWORD` 后打包，降低 SmartScreen「未知发布者」提示  
2. **版本**：`1.0.0`（`web-ui/package.json` + `APP_VERSION`）  
3. **产物**：`cd web-ui && npm run dist:win:release` → Setup + Portable  
4. **哈希**：`scripts\release-checksums.ps1 -Version 1.0.0` → 填入 `releases/1.0.0/DOWNLOADS.md`  
5. **反馈**：配置 `FEEDBACK_EMAIL` / `FEEDBACK_URL`（`web-ui/src/lib/brand.ts`）  
6. **升级**：本版手动安装；回滚保留上一版安装包与 SHA-256  

---

## 版权

**GVFI** — AI 视频工作站

Developed by Mr. Gong

Copyright © 2026 Mr. Gong. All Rights Reserved.
