# GVFI 1.0.0 最终交付报告

| 字段 | 内容 |
|------|------|
| 产品 | GVFI（AI 视频工作站） |
| 声明版本（源码） | **1.0.0** |
| 开发者 | Mr. Gong |
| 报告日期 | 2026-08-09 |
| 报告性质 | 交付核对；**未完成项与未实测项均标「未验证」** |

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. 版本号

| 来源 | 值 | 状态 |
|------|-----|------|
| `web-ui/package.json` → `version` | `1.0.0` | 已写入源码 |
| `web-ui/src/lib/brand.ts` → `APP_VERSION` | `1.0.0` | 已写入源码 |
| 现有 `dist-gvfi-fresh\win-unpacked\GVFI.exe` 的 FileVersion / ProductVersion | `0.1.0` / `0.1.0.0` | **与 1.0.0 不一致**（旧产物） |
| `GVFI-Setup-1.0.0.exe` / `GVFI-Portable-1.0.0.exe` 内嵌版本 | — | **未验证**（安装包不存在，见第 5 节） |

**结论：** 源码已标为 1.0.0；**尚未打出带 1.0.0 版本信息的正式安装包。**

---

## 2. 功能清单（按产品能力列出）

下列为 1.0.0 源码所宣称/已实现的能力。标注「端到端未验证」表示本交付周期内未做完整业务实测。

| 模块 | 能力 | 实现状态 | 验收状态 |
|------|------|----------|----------|
| 首页 | KPI、快捷入口、API 健康提示 | 已实现 | UI 路由冒烟见历史记录；**1.0.0 复测未验证** |
| 任务 | 任务队列与输出查看 | 已实现 | **端到端未验证** |
| 视频 | 本地选片、补帧/超分参数、提交本地任务 | 已实现 | 选片同意弹窗代码已加；**弹窗与真实补帧/超分未验证** |
| AI | 大模型视觉分析（自备 Key） | 已实现 | 云端确认弹窗代码已加；**真实云端调用未验证** |
| 连接 | API Profile、LLM URL/Key（本机存储） | 已实现 | **未验证** |
| 系统 | 外观、字体与显示、日志、关于 | 已实现 | 主题/字体/语言曾实测；**关于页反馈区 1.0.0 新增未验证** |
| 法律 | 隐私政策 / 用户协议 / 第三方许可证 | 已实现（应用内 + `THIRD_PARTY_NOTICES.md`） | **页面走读未验证** |
| 国际化 | zh-CN / en | 已实现（647 键对齐，2026-08-09 复检） | 键对齐已通过；**全 UI 无残留文案未对 1.0.0 复测** |
| 桌面壳 | Electron frameless、启动闪屏、拉起本地 UI/API | 已实现 | 曾启动成功；**`sandbox: true` 之后未复测** |
| 隐私加固 | 日志脱敏、上传清理、CORS 收紧、`/media` 限制 | 代码已改 | **运行时未验证** |
| 自动更新 | — | **未实现** | 不适用 |

配套依赖（非安装包内嵌假设）：`ECCV2022-RIFE`、`AI_Tools`、本机 Python — **完整捆绑与干净机安装未验证**。

---

## 3. 测试结果

### 3.1 本报告生成时已复检

| 项 | 命令/方法 | 结果 |
|----|-----------|------|
| i18n 键对齐 | `node scripts/check-i18n-keys.js` | **通过**（zh 647 / en 647，无单边键） |
| TypeScript | `npx tsc --noEmit` | **通过**（exit 0，报告生成时对最终源码树执行） |
| 正式 NSIS/Portable 是否存在 | 文件系统检查 | **不存在** |
| 现有 unpacked exe 签名 | `Get-AuthenticodeSignature` | **NotSigned** |
| 现有 unpacked exe 版本资源 | `FileVersionInfo` | **0.1.0**（非 1.0.0） |

### 3.2 历史实测（版本升级与后续改动之前）

以下记录于 2026-08-09 生产 UI（`:3010`）+ Playwright，**发生在隐私合规、法律页、关于页反馈、版本升至 1.0.0 之前或部分交错期间**。  
**不得视为 1.0.0 最终交付已通过。**

| 项 | 历史结果 | 对 1.0.0 最终树 |
|----|----------|-----------------|
| `scripts/prod-acceptance.mjs` | 21 pass / 0 fail | **未验证**（未对最终源码重跑） |
| 全路由冒烟 | 历史通过 | **未验证** |
| 中英切换与 persist 水合 | 历史通过 | **未验证** |
| 字体/主题刷新保持 | 历史通过 | **未验证** |
| Electron 启动（API+UI ready） | 历史已启动 | **未验证**（且其后改过 `sandbox`） |
| 窗口拖动 / 最小化最大化关闭手感 | 历史注明需人工补看 | **未验证** |
| `npm run lint` / `npm run build` | 历史曾通过 | **未验证**（未对最终树重跑） |
| 真实视频补帧/超分/LLM 全流程 | — | **未验证** |
| 干净 Windows 安装 SmartScreen 体验 | — | **未验证** |
| 卸载是否保留/清除用户数据 | — | **未验证** |
| 升级覆盖安装 / 回滚 | — | **未验证** |

### 3.3 明确未执行

- `npm run dist:win:release`（未生成 Setup/Portable）
- 代码签名与 `signtool verify`
- 安装包 SHA-256 公示值（无文件可哈希）
- 自动更新（功能不存在）

---

## 4. 已知问题

1. **1.0.0 正式安装包未生成** — `GVFI-Setup-1.0.0.exe`、`GVFI-Portable-1.0.0.exe` 均不存在。  
2. **磁盘上的桌面产物仍为 0.1.0 且未签名** — 见第 5、6、7 节；不可当作 1.0.0 交付物。  
3. **无代码签名证书流程落地** — SmartScreen「未知发布者」风险仍在；签名状态见第 7 节。  
4. **反馈渠道未配置** — `FEEDBACK_EMAIL`、`FEEDBACK_URL` 均为空字符串；关于页仅保留「系统」入口。  
5. **下载地址与哈希未公示** — `releases/1.0.0/DOWNLOADS.md` 仍为占位。  
6. **自动更新未接入** — 仅支持手动升级说明。  
7. **Electron `sandbox: true` 后的 IPC/窗口控件** — **未验证**。  
8. **隐私同意弹窗、上传清理、CORS、`/media` 限制** — 代码存在，**运行时未验证**。  
9. **开发模式 HMR 曾不稳定** — 历史验收改用 production；当前 dev 稳定性 **未验证**。

---

## 5. 安装包路径

### 5.1 1.0.0 目标产物（预期路径，当前均不存在）

| 产物 | 预期路径 | 状态 |
|------|----------|------|
| NSIS 安装版 | `web-ui/dist-gvfi/GVFI-Setup-1.0.0.exe` | **未验证 / 文件不存在** |
| Portable | `web-ui/dist-gvfi/GVFI-Portable-1.0.0.exe` | **未验证 / 文件不存在** |

生成命令（尚未在本交付节点执行成功产出）：

```bat
cd web-ui
npm run dist:win:release
```

### 5.2 现存相关产物（非 1.0.0 正式包）

| 路径 | 说明 | 可否作为 1.0.0 交付 |
|------|------|-------------------|
| `web-ui/dist-gvfi-fresh/win-unpacked/GVFI.exe` | unpacked 桌面壳，mtime 2026-08-09；**FileVersion 0.1.0** | **否** |
| `web-ui/dist-gvfi-build/win-unpacked/GVFI.exe` | 更旧备用 unpacked | **否** |
| `web-ui/dist-gvfi/win-unpacked.tmp/electron.exe` | 临时/不完整产物 | **否** |

---

## 6. 文件 SHA-256

### 6.1 1.0.0 Setup / Portable

| 文件 | SHA-256 |
|------|---------|
| `GVFI-Setup-1.0.0.exe` | **未验证**（文件不存在） |
| `GVFI-Portable-1.0.0.exe` | **未验证**（文件不存在） |

### 6.2 仅供对照的旧产物（非交付物）

| 文件 | SHA-256 | 备注 |
|------|---------|------|
| `web-ui/dist-gvfi-fresh/win-unpacked/GVFI.exe` | `a5d983c621d50767daf3b09f0c7cef0c42326b5c31ff1d1121494cb6fa62c4e8` | 已计算；版本 **0.1.0**；**NotSigned** |

打包出 1.0.0 后应执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release-checksums.ps1 -Version 1.0.0
```

并将结果写入 `releases/1.0.0/DOWNLOADS.md`。

---

## 7. 签名状态

| 对象 | 状态 |
|------|------|
| 代码签名证书 / `CSC_LINK` 本机配置 | **未验证**（未见可用签名产物） |
| `GVFI-Setup-1.0.0.exe` | **未验证**（不存在） |
| `GVFI-Portable-1.0.0.exe` | **未验证**（不存在） |
| `dist-gvfi-fresh\win-unpacked\GVFI.exe` | **NotSigned**（已用 `Get-AuthenticodeSignature` 确认） |

`package.json` 中 `win.signAndEditExecutable: true`、`publisherName: "Mr. Gong"` 仅为构建配置意图；**不能等同于已签名。**

---

## 8. 配置与日志位置

| 类型 | 位置 | 说明 |
|------|------|------|
| Electron 用户数据根目录 | `%APPDATA%\gvfi-desktop\` | 由 Electron `app.getPath("userData")` 决定（`name`: `gvfi-desktop`） |
| 桌面壳日志 | `%APPDATA%\gvfi-desktop\gvfi-desktop.log` | 主进程写入；内容经脱敏函数处理（**脱敏有效性未验证**） |
| 桌面语言文件 | `%APPDATA%\gvfi-desktop\gvfi-locale.json` | Electron 侧 locale |
| UI 配置（浏览器/壳内 localStorage） | `gvfi-locale-v1`、`gvfi-appearance-v2`、`gvfi-display-v1`、`gvfi-api-config-v1`、`gvfi-ai-model-config-v1`、`gvfi-ai-sessions-v1` 等 | 含 API Key 等敏感项（仅本机） |
| 本地 API 上传/输出 | 用户数据下 `uploads` / 输出目录（由 `gvfi_api.py` 管理） | 任务结束清理与 72h 扫尾为代码行为；**未验证** |
| 第三方许可证副本（打包意图） | 安装目录 `resources\THIRD_PARTY_NOTICES.md` | **未验证**（因未打正式包） |

默认服务端口（文档约定）：UI `127.0.0.1:3456`，API `127.0.0.1:8765` — **1.0.0 安装包内连通性未验证**。

---

## 9. 卸载行为

依据 `electron-builder` NSIS 配置（`oneClick: false`、可改安装目录、创建桌面快捷方式；**未设置** `deleteAppDataOnUninstall: true`）：

| 预期行为（配置推断） | 实测 |
|----------------------|------|
| 开始菜单「卸载 GVFI」或「应用和功能」卸载 | **未验证**（无 Setup） |
| 移除安装目录内程序文件 | **未验证** |
| 默认**保留** `%APPDATA%\gvfi-desktop\`（含日志、locale、以及 Chromium/localStorage 中的密钥与外观） | **未验证**（符合常见 electron-builder 默认，但未实测） |
| 桌面快捷方式是否清除 | **未验证** |
| Portable 版无安装器卸载 — 删除目录即可；AppData 是否残留 | **未验证** |

若需卸载时清除用户数据，必须改 NSIS 配置并重新出包后再测 — **当前未做**。

---

## 10. 升级及回滚方法

### 10.1 升级（文档方案；流程未验证）

1. 关闭正在运行的 GVFI。  
2. 获取新版 `GVFI-Setup-x.y.z.exe`，核对 SHA-256。  
3. 运行安装包覆盖安装（或更换 Portable 目录）。  
4. 一般可保留 `%APPDATA%\gvfi-desktop\` 中的设置与密钥。  

**自动更新：** 未实现。  
**1.0.0 → 更高版本覆盖安装：** **未验证**。  
**`scripts\sync-desktop-ui.cmd`：** 仅适合开发/内测 unpacked，**不是**对外升级方式。

### 10.2 回滚（文档方案；流程未验证）

1. 保留上一版安装包及其 SHA-256。  
2. 关闭应用后安装旧版 Setup，或切回旧 Portable 目录。  
3. 若配置不兼容：备份后删除 `%APPDATA%\gvfi-desktop\`，再装旧版（会丢失本机密钥与偏好）。  

**从当前环境回滚到更旧已发布安装包：** **未验证**（且 1.0.0 Setup 本身尚未生成）。

---

## 11. 交付结论

| 维度 | 结论 |
|------|------|
| 源码版本号 | 已定为 **1.0.0** |
| 可对外分发的签名安装包 | **未就绪** |
| 可公示的 Setup/Portable SHA-256 | **未就绪** |
| 自动化 UI 验收针对最终 1.0.0 | **未验证** |
| 业务全链路（视频/AI） | **未验证** |
| 文档与发布清单 | 已具备（`docs/RELEASE.md`、`USER_GUIDE.md`、`releases/1.0.0/*`） |

**总体：源码与文档达到「准备发版」状态；安装包、签名、哈希与 1.0.0 最终验收均未完成，不能宣称「已通过完整交付验收」。**

### 发版前最低补齐项

1. 配置代码签名后执行 `npm run dist:win:release`  
2. 计算并公示 SHA-256，更新 `DOWNLOADS.md`  
3. 对 Setup 做干净机安装 / 卸载 / 关于页版本号核对  
4. 重跑 `prod-acceptance` + 至少一条真实本地视频任务  
5. 填写 `FEEDBACK_EMAIL` 或 `FEEDBACK_URL`

---

## 附录 A — 相关文档

- [`docs/RELEASE.md`](../../docs/RELEASE.md)  
- [`docs/USER_GUIDE.md`](../../docs/USER_GUIDE.md)  
- [`RELEASE_NOTES.md`](./RELEASE_NOTES.md)  
- [`DOWNLOADS.md`](./DOWNLOADS.md)  
- [`CHANGELOG.md`](../../CHANGELOG.md)  
