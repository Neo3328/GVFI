# GVFI 文件清理审计报告

**生成时间：** 2026-08-09  
**范围：** 全项目只读审计（排除 `node_modules`、`dist*`、`.next`、`build`、`.git`、`AI_Tools` 大体积运行时、`user_data` 等）  
**状态：** **仅审计；未删除、未移动、未覆盖任何文件。**

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 一、项目总体文件统计（主要面）

| 区域 | 说明 | 估计规模 |
|------|------|----------|
| `web-ui/src` + 配置 | Next.js / Electron 应用源码 | ~205 个源文件，<1 MB |
| `web-ui/public` | 静态资源（含 liquid-glass JS） | 8 个文件 |
| `web-ui/electron` | 主进程 / preload / splash / i18n | 4 个文件 |
| 根 `scripts/` + 启动器 | Windows 启动与打包 | 10+4 个文件 |
| `docs/`、`releases/`、根 README/CHANGELOG | 发布与用户文档 | 少量 |
| `ECCV2022-RIFE` Python | API / Worker / 工具解析 | 数十个 .py（不含 models/AI_Tools） |
| **生成物** | `.next`、`dist-gvfi*`、`_asar-extract`、`ECCV2022-RIFE/dist` 等 | **数 GB**，见第四节 E |

---

## 二、风险分类定义（与任务约定一致）

| 类别 | 含义 | 处理 |
|------|------|------|
| **A** | 明确在使用（源码、构建、打包、启动、文档被引用） | **禁止修改** |
| **B** | 可能被动态使用（public 路径、IPC、运行时资源、模型目录） | **禁止自动删除**，需人工确认 |
| **C** | 重复或疑似遗留（旧文档、旧脚本、旧主题残留） | 需进一步检查 |
| **D** | 无静态引用且无构建用途 | 候选删除（仍需你确认后隔离） |
| **E** | 生成物或缓存 | 单独处理，**不与源码混淆** |

---

## 三、明确在使用（A）—— 摘要

下列**不得**删除，否则破坏构建或运行：

- `web-ui/package.json`、`next.config.ts`、`tsconfig.json`、`eslint.config.mjs`、`postcss.config.mjs`、`components.json`、`.npmrc`
- `web-ui/src/**`（全部应用源码，含 `lib/i18n`、`appearance-store` 等）
- `web-ui/electron/main.js`、`preload.js`、`splash.html`、`i18n.js`
- `web-ui/scripts/prepare-standalone.js`（`dist:*` 依赖）
- `web-ui/scripts/check-i18n-keys.js`、`scan-acceptance.js`（`npm test`）
- `web-ui/scripts/prod-acceptance.mjs`（`test:ui`）
- `web-ui/scripts/check-background-theme.js`、`check-device-label.js`（本次新增校验，建议纳入 CI 或文档说明后再决定是否保留）
- `web-ui/public/liquid-glass/*.js`（`loader.ts` 动态加载 `/liquid-glass/...`）
- `web-ui/THIRD_PARTY_NOTICES.md`（`extraResources` 打包）
- `web-ui/.env.example`（配置模板）
- 根 `启动GVFI.cmd`、`生成桌面软件.cmd`、`创建桌面快捷方式.bat`、`GVFI.vbs`、`scripts/**`
- `ECCV2022-RIFE/gvfi_api.py`、`main.py`、`tool_resolver.py`、`gvfi_runtime/**`、`GVFI_API.cmd`、`requirements.txt`
- `docs/RELEASE.md`、`docs/USER_GUIDE.md`、`releases/1.0.0/*`、`README.md`、`CHANGELOG.md`、`LICENSE`
- `web-ui/public/liquid-glass/glass.css`（**B**：与 `src/lib/liquid-glass/glass.css` 并存，需确认是否仍被引用）

---

## 四、疑似重复（C）—— 需人工确认后再合并

| 路径 | 理由 |
|------|------|
| `web-ui/docs/design-system.md` vs `web-ui/design-system/gvfi/*` | 内容部分重叠；设计 token 权威在 `src/design-tokens` |
| `web-ui/README.md` vs 根 `README.md` | 面向对象不同，需人工统一口径 |
| `web-ui/design-system/**` | 生成式规格文档，非运行时；可归档但不宜自动删 |
| `web-ui/.cursor/skills/**` | Cursor 技能缓存/模板，**不属于应用运行文件**；是否保留由你决定 |

---

## 五、疑似遗留（C）

| 路径 | 证据 |
|------|------|
| `web-ui/scripts/browser-acceptance.mjs`、`e2e-acceptance.mjs`、`debug-hydrate.mjs` | 不在 `package.json` scripts 中；与 `prod-acceptance.mjs` 重复调试用途 |
| `web-ui/public/*.svg`（`next`、`vercel`、`globe`、`file`、`window`） | Next 模板残留；全项目无引用命中 |
| `web-ui/CLAUDE.md` | 仅 `@AGENTS.md` 占位，若 AGENTS 唯一入口可删 |
| `web-ui/_next-err.txt`、`_test-err.txt`、`_server-err.txt`、`dist-build.log`、`tsconfig.tsbuildinfo` | 本地日志/增量缓存 |
| `ECCV2022-RIFE/build.py`、`RIFE_Pro.spec` | 旧 GUI/PyInstaller 路径，与当前 Electron 发布流分离 |
| `ECCV2022-RIFE/inference_video.py` | 上游示例式推理入口，未见当前生产调用 |

---

## 六、候选删除（D）—— 理由与证据

> 以下均为**候选**，未执行删除。确认后建议先移至 `.cleanup-quarantine/`。

| # | 路径 | 删除理由 | 证据/风险 |
|---|------|----------|-----------|
| 1 | `web-ui/public/next.svg` | 模板残留，无引用 | 全局搜索无命中 |
| 2 | `web-ui/public/vercel.svg` | 同上 | 同上 |
| 3 | `web-ui/public/globe.svg` | 同上 | 同上 |
| 4 | `web-ui/public/file.svg` | 同上 | 同上 |
| 5 | `web-ui/public/window.svg` | 同上 | 同上 |
| 6 | `web-ui/_next-err.txt` | 本地错误日志 | 非构建输入 |
| 7 | `web-ui/_test-err.txt` | 同上 | 同上 |
| 8 | `web-ui/_server-err.txt` | 同上 | 同上 |
| 9 | `web-ui/dist-build.log` | 打包日志 | `*.log` 已在 `.gitignore` |
| 10 | `web-ui/tsconfig.tsbuildinfo` | 增量构建缓存 | `*.tsbuildinfo` 已忽略 |
| 11 | `web-ui/CLAUDE.md` | 与 `AGENTS.md` 重复占位 | 仅保留 AGENTS 时需确认 |
| 12 | `web-ui/scripts/browser-acceptance.mjs` | 未被 `package.json` 引用 | 若仍用于调试可保留并登记 |
| 13 | `web-ui/scripts/e2e-acceptance.mjs` | 同上 | 同上 |
| 14 | `web-ui/scripts/debug-hydrate.mjs` | 同上 | 同上 |
| 15 | `ECCV2022-RIFE/components/` | 空目录 | 需确认无生成依赖 |

**已排除出候选（勿删）：** `web-ui/public/backgrounds/starlit-water.png` —— 文件已不存在；默认壁纸引用已从 `apply-appearance.ts` 移除。

---

## 七、生成物 / 缓存（E）—— 单独处理

| 路径 | 说明 | 建议 |
|------|------|------|
| `web-ui/.next/` | Next 构建缓存 | 可删，随构建重建 |
| `web-ui/dist-gvfi*/`、`dist-desktop/` | Electron 打包输出 | 保留当前使用的一路，其余可归档或删 |
| `web-ui/_asar-extract/`、`_asar-repack/` | ASAR 解包/重组临时 | 建议加入忽略或清理 |
| `ECCV2022-RIFE/build/`、`dist/`、`__pycache__/` | PyInstaller / Python 缓存 | 已在 `.gitignore`，可清 |
| `native/build/`、部分 `native/tools` | 本地构建产物 | 按 `.gitignore` 规则处理 |

---

## 八、可能动态使用（B）—— 禁止自动删除

| 路径/机制 | 风险说明 |
|-----------|----------|
| `public/liquid-glass/glass.css` | 与 `src/lib/liquid-glass/glass.css` 双份；需确认是否仍有 `url(/liquid-glass/glass.css)` 引用 |
| `public/**` 任意文件 | 打包 `extraResources` 会复制到安装包；删除前需确认用户端不通过 URL 直接请求 |
| `ECCV2022-RIFE/models/`、`AI_Tools/**` | 运行时模型/工具，体积大但为本地依赖 |
| `web-ui/design-system/**` | 设计/提示词资产，虽非运行时，可能供再生成使用 |
| `.env.example` 以外的 `.env*` | 本机配置，勿审计内容 |

---

## 九、引用分析摘要

已做全项目搜索：

- `import` / `require` / 动态 `import()`（TS/TSX/JS）
- `package.json` scripts 与 `electron-builder` `extraResources`
- `loader.ts` 中的 `/liquid-glass/*.js`
- Electron `main.js` 对 `splash.html`、standalone 路径、API 启动
- `next.config.ts` 中 `/api` 代理
- 根目录 `.cmd/.bat/.vbs` 对 `scripts/` 的调用链
- 模板 SVG：`next.svg`、`vercel.svg` 等在 `src/`、`electron/` 中**零命中**

无法完全静态证明的动态项已在第八节标注。

---

## 十、建议执行顺序（待你确认）

1. 先处理 **D** 表 #1–#10（SVG + 日志 + 缓存），低风险  
2. 再确认 #11–#15（文档/脚本/空目录）  
3. **E** 类生成物单独清理磁盘  
4. **C/B** 类文件在更新文档或合并前**不删**  

**未执行任何删除、移动或覆盖。**

---

## 十一、隔离与验证（确认后）

- 移动至：`.cleanup-quarantine/<原相对路径>`，并附 `MANIFEST.json`（原路径、时间、原因）  
- 验证：`npm test`、`tsc`、`npm run build`、桌面启动、首页/设置/关于页、图片上传、法律页  

---

*本报告满足「先分析、列清单、不盲删」；等你确认后我再执行安全清理。*
