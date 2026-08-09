# GVFI 可执行开发计划

> 依据：`PRD.md` V1.0（2026-08-09）  
> 目标：关闭 V1 验收缺口 → 稳定发布 → 再排 V1.1 增强（不碰 PRD §9 禁区）  
> 原则：不改 `VideoWorker` / `svfi_pipeline`；不扩六大导航职责；密钥不进 Git。

---

## 0. 现状基线（已完成，勿重复造轮子）

| 域 | 状态 | 主要落点 |
|----|------|----------|
| IA 六页导航 | ✅ | `workspace-nav.ts`、各 `/app/*` |
| 本地渲染 API | ✅ | `ECCV2022-RIFE/gvfi_api.py`、`tool_resolver.py` |
| 视频 / 任务 / 连接 / AI | ✅ | `video-workspace-page`、`render-center`、`settings-hub`、`ai-workspace` |
| Liquid Glass Hover/Press | ✅ | `ios-liquid-button.css` |
| 布局 + motion 档位 | ✅ | `workspace-layout.css`、`motion-quality.ts` |
| 报错复制 / 投喂 AI | ✅ | `logs-panel.tsx`、`error-log-bridge.ts` |
| 文档 + Git 基线 | ✅ | `PRD.md`、`web-ui/docs/*`、本地 `main` |
| **V1 收尾（PRD §8.3）** | ❌ 未关 | 备份说明、主路径冒烟清单、打包启动稳态 |

**本计划从 Phase 0 起按序执行；每阶段有明确命令与完成定义（DoD）。**

---

## Phase 0 — 环境冻结与分支（0.5 天）

### 目的
固定可复现的开发/打包环境，避免验收时「我这边好、你那边挂」。

### 任务清单

| ID | 动作 | 命令 / 操作 | DoD |
|----|------|-------------|-----|
| P0-1 | 确认 Node / Python | `node -v`（≥20）、`python --version` | 版本记入本机笔记或 `CHANGELOG` 环境备注 |
| P0-2 | 安装前端依赖 | `cd web-ui && npm ci` 或 `npm install` | `npm run build` 成功 |
| P0-3 | 确认 API 依赖 | `cd ECCV2022-RIFE && pip install -r requirements.txt`（按现有文件） | `python gvfi_api.py` 可起或桌面版可拉起 |
| P0-4 | 工具链存在性 | 目视 `AI_Tools` 与 `ECCV2022-RIFE` 内 ffmpeg/rife | `GET :8765/health` 中对应字段为 true（或明确 warnings） |
| P0-5 | Git 工作区干净策略 | 功能分支：`git checkout -b release/v1-closeout` | 分支存在；大目录仍被 ignore |

### 验收映射
为 A1–A3、F3 做准备。

---

## Phase 1 — V1 文档收尾：备份 / 恢复 / 日志路径（0.5–1 天）

> 对应 PRD §7.3、§8.3 第 1 条、验收 F2/F4。

### 任务清单

| ID | 动作 | 文件 | 具体内容 | DoD |
|----|------|------|----------|-----|
| P1-1 | 写备份专章 | `README.md` 新增「备份与恢复」**或** `web-ui/docs/backup.md` | 列出：`user_data`、localStorage keys、`%APPDATA%\gvfi-desktop\`、勿备份方式（勿提交 Key） | 读者按文档能复述「备份哪三个位置」 |
| P1-2 | 系统关于/开发者露出路径 | `system-settings-page.tsx` 关于 Tab 或开发者 Tab | 展示桌面日志路径文案；链到备份文档 | UI 可见，无需翻仓库 |
| P1-3 | 同步 config 文档 | `web-ui/docs/config.md` | 与 PRD §7.1 表一致 | Key 名称无遗漏 |
| P1-4 | PRD 勾选 | `PRD.md` §8.3 | 将「配置备份/恢复说明」改为 `[x]` | 与实现一致 |

### 执行顺序
P1-1 → P1-3 → P1-2 → P1-4 → `npm run build`。

### DoD（阶段）
- README 或 `docs/backup.md` 可独立指导备份恢复。  
- 系统 → 开发者/关于 能看到日志路径。  

---

## Phase 2 — 主路径冒烟自动化 + 手工清单（1 天）

> 对应 PRD §8.3 第 2 条、验收 A–D / C 主路径。

### 2.1 自动化脚本（推荐）

| ID | 动作 | 文件 | 内容 | DoD |
|----|------|------|------|-----|
| P2-1 | 健康探测脚本 | `scripts/smoke-health.cmd` 或 `.ps1` | 请求 `:3456/app/dashboard` 与 `:8765/health`，打印 status + `ok/rife_ready` | 退出码 0=通过 |
| P2-2 | 路由探测 | 同上脚本扩展 | 依次 GET 六路由，非 200 则 fail | 六页全 200 |
| P2-3 | 接入文档 | `README.md` 或 `scripts/README.md` | 写清「先启动 GVFI 再跑 smoke」 | 新人可跟做 |

**示例（PowerShell 片段，可直接落脚本）：**

```powershell
$routes = '/app/dashboard','/app/tasks','/app/video','/app/ai','/app/settings','/app/system'
$h = Invoke-WebRequest http://127.0.0.1:8765/health -UseBasicParsing
if ($h.StatusCode -ne 200) { throw 'health fail' }
foreach ($r in $routes) {
  $u = Invoke-WebRequest "http://127.0.0.1:3456$r" -UseBasicParsing
  if ($u.StatusCode -ne 200) { throw "UI fail $r" }
}
Write-Output 'SMOKE_PASS'
```

### 2.2 手工验收清单（必做一次）

按 PRD §10 逐条勾选，结果记入 `docs/qa-v1-checklist.md`（新建）：

| 批次 | 用例 ID | 操作步骤 | 期望 |
|------|---------|----------|------|
| 启动 | A1–A4 | 启动包 → 开六页 | 见 PRD |
| IA | B1–B2 | 检查连接无外观；旧路由跳转 | 见 PRD |
| 视频 | C1–C3 | 选短视频或路径 → 开始（引擎就绪时）→ 任务页 | 有任务记录 |
| AI/日志 | D1–D3 | 配置 Key 测连；复制报错；投喂 AI | 草案进输入框 |
| UI | E1–E5 | Hover/Press；DPI 125%；版权 | 见 PRD |
| 数据 | F1–F2 | 改外观后重启；查日志路径 | 配置仍在 |

### DoD（阶段）
- `SMOKE_PASS` 可重复跑通。  
- `docs/qa-v1-checklist.md` 全部勾选或标注阻塞项（附截图/日志路径）。  

---

## Phase 3 — 打包稳态与启动入口（1 天）

> 对应 PRD §8.3 第 3 条、验收 A1。

| ID | 动作 | 命令 / 文件 | DoD |
|----|------|-------------|-----|
| P3-1 | 杀旧进程 | `taskkill /F /IM GVFI.exe`（若占用） | 无 EBUSY |
| P3-2 | 构建 UI | `cd web-ui && npm run build && npm run prepare:standalone` | 无 TS/编译错误 |
| P3-3 | 打桌面包 | `npx electron-builder --win --dir --config.directories.output=dist-gvfi-fresh` | 存在 `GVFI.exe` |
| P3-4 | 热同步脚本对齐 | 更新 `scripts/sync-desktop-ui.cmd`：**包含** `dist-gvfi-fresh` | 改 UI 后可 robocopy 到 fresh |
| P3-5 | 启动验证 | `启动GVFI.cmd` 或直接 exe | A1+A2+A3；桌面日志有 boot 时间戳 |
| P3-6 | 单实例/崩溃 | 二次启动应聚焦已有窗口；杀进程再启仍可恢复 | 无多开脏端口（或文档说明） |

### DoD（阶段）
- 冷启动（关机后重开）一次成功。  
- PRD §8.3 三条全部 `[x]`。  

---

## Phase 4 — V1 缺陷收敛（按冒烟结果，1–3 天）

> 仅修验收失败项；禁止借机做 §9 功能。

### 优先级

| 优先级 | 类型 | 处理规则 |
|--------|------|----------|
| P0 | 无法启动 / health 永假 / 六页白屏 | 当天修；修完重跑 Phase 2 |
| P1 | 补帧无法建任务、投喂 AI 丢格式、Profile 不生效 | 下一工作日修 |
| P2 | DPI 小错位、动效细节、文案 | 排入本 Phase 末尾 |

### 建议排查入口

| 症状 | 先看 |
|------|------|
| UI 起不来 | `%APPDATA%\gvfi-desktop\gvfi-desktop.log`、`electron/main.js` 并行 boot |
| 引擎未就绪 | `tool_resolver`、AI_Tools 路径、health warnings |
| 上传失败 | 直连 `:8765`、Profile baseUrl、代理 body 限制 |
| 投喂空 | `error-log-bridge` + ChatPane `consumeErrorLogForAi` |
| Hover 上浮 | 全局搜 `translate-y` / `translateY` 于按钮相关类 |

### DoD（阶段）
- qa checklist 无未解释的 P0/P1。  
- `CHANGELOG.md` 增加 V1 closeout 条目。  

---

## Phase 5 — V1 发布冻结（0.5 天）

| ID | 动作 | DoD |
|----|------|-----|
| P5-1 | 打 Git tag | `git tag v1.0.0`（在 closeout 提交后） |
| P5-2 | 冻结说明 | `CHANGELOG` 标明 V1.0 范围 = PRD V1 |
| P5-3 | 发布包路径约定 | 对外只推荐 `dist-gvfi-fresh\win-unpacked\GVFI.exe` + `启动GVFI.cmd` |
| P5-4 | 回归 | 再跑一次 smoke + C1（可选短视频） | 全绿 |

**V1 完成定义：** PRD §8.3 全勾 + §10 A–F 无阻塞失败。

---

## Phase 6 — V1.1 增强排期（V1 发布后，可选）

> 不阻塞 V1；需单独评审；仍禁止 PRD §9。

| 序号 | 主题 | 预估 | 产出 | 验收 |
|------|------|------|------|------|
| V1.1-1 | 配置一键导出/导入 JSON（Key 可选脱敏） | 2–3 天 | 系统页「导出/导入」；`docs/backup.md` 更新 | 导出→清空→导入后 Profile/外观恢复 |
| V1.1-2 | 任务页：失败任务「一键投喂 AI」 | 1 天 | 任务行操作按钮复用 `error-log-bridge` | D3 从任务页也可走通 |
| V1.1-3 | 首页快捷入口与空状态文案打磨 | 1 天 | 引擎离线时引导去「连接」 | B1 不破坏一页一责 |
| V1.1-4 | sync-desktop-ui 默认含 fresh + 失败提示 | 0.5 天 | 脚本 | 热更新后无需整包 |
| V1.1-5 | 桌面图标 / 非默认 Electron 图标 | 1 天 | `electron` 资源 | 安装感更专业 |
| V1.1-6 | 云渲染正式对接 | 另立项 | 超出 stub | **不在 V1.1 默认范围** |

---

## 模块级执行备忘（开发时对照 PRD §5）

改代码前先对号入座，避免串页：

| 改动类型 | 允许落点 | 禁止落点 |
|----------|----------|----------|
| 补帧参数 | 视频页 / Drawer | 连接、系统、首页 |
| API Base URL / LLM Key | 连接页 | 视频页、系统外观 |
| 主题 / 玻璃 | 系统 → 外观 | 连接页 |
| 队列展示 | 任务页（首页仅摘要） | 连接页 |
| 对话 / 报告 | AI 工作台 | 视频主表单区 |
| 算法管线 | 仅 bugfix 且不改契约 | 禁止「重构 Worker」类需求混入 UI PR |

---

## 每日执行节奏（建议）

```
上午：选当前 Phase 未完成 ID → 改代码 → npm run build
下午：启动桌面或 smoke → 勾 qa checklist → 记 CHANGELOG
阻塞：写入 qa 文件「阻塞项」+ 日志路径，不跳 Phase 5
```

### 推荐命令速查

```bat
REM 开发
cd web-ui && npm run dev -- --port 3456

REM 构建
cd web-ui && npm run build && npm run prepare:standalone

REM 打包（推荐输出）
cd web-ui && npx electron-builder --win --dir --config.directories.output=dist-gvfi-fresh

REM 启动
启动GVFI.cmd

REM 冒烟（Phase 2 脚本就绪后）
scripts\smoke-health.cmd
```

---

## 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| `dist-gvfi` EBUSY | 打包失败 | 只用 `dist-gvfi-fresh`；先杀 `GVFI.exe` |
| 无 GPU / 缺模型 | C2 无法真渲染 | 验收区分「引擎未就绪提示正确」vs「渲染成功」；健康 warnings 必须可见 |
| AI_Tools 未分发 | 新机器 health 失败 | README 写明依赖目录；不做进 Git |
| 嵌套大文件误 commit | 仓库膨胀 | 提交前 `git status`；遵守 `.gitignore` |
| 需求回流「生活九模块」 | 范围爆炸 | 引用 PRD §9；另开 V2 评审 |

---

## 里程碑时间盒（可按人力压缩）

| 里程碑 | 内容 | 建议用时 |
|--------|------|----------|
| M0 | Phase 0+1 | 1 天 |
| M1 | Phase 2+3 | 1–2 天 |
| M2 | Phase 4+5 → **V1.0 发布** | 1–3 天 |
| M3 | Phase 6 择项 | 按项 |

**最短路径（仅关 V1）：** Phase 0 → 1 → 2 → 3 →（有缺陷才 4）→ 5。

---

## 完成勾选板（执行时直接打勾）

- [ ] P0 环境冻结  
- [ ] P1 备份文档 + UI 路径露出  
- [ ] P2 smoke 脚本 + qa checklist  
- [ ] P3 fresh 包冷启动稳定  
- [ ] P4 P0/P1 缺陷清零  
- [ ] P5 tag `v1.0.0` + CHANGELOG  
- [ ] PRD §8.3 三项全 `[x]`  
- [ ] PRD §10 A–F 无阻塞  

---

**本计划与 `PRD.md` 冲突时，以 PRD 为准；计划只描述「怎么做完 PRD」。**
