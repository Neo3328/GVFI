# GVFI 配置文件说明

Developed by Mr. Gong · Copyright © 2026 Mr. Gong. All Rights Reserved.

## 前端持久化（localStorage）

| Key | 模块 | 内容 |
|-----|------|------|
| `gvfi-api-config-v1` | `api-config-store` | API Profiles（baseUrl、超时、并发、鉴权） |
| `gvfi-appearance-v2` | `appearance-store` | 主题、玻璃材质（不含大图 data URL） |
| `gvfi-appearance-bg-image` | `appearance-store` | 自定义背景 data URL（独立存储，避免滑条卡顿） |
| LLM 配置 key | `llm-config-store` | 服务商 / model / apiKey / baseUrl |

### 内置 API Profile

| ID | Base URL | 用途 |
|----|----------|------|
| `local-default` | `/api` | Next 代理 → `:8765` |
| `local-direct` | `http://127.0.0.1:8765` | 直连引擎（上传/排障） |

## 环境变量

| 变量 | 作用 |
|------|------|
| `GVFI_PORT` | Web UI 端口（默认 3456） |
| `GVFI_API_HOST` / `GVFI_API_PORT` | Python API 监听（默认 127.0.0.1:8765） |
| `GVFI_API_ORIGIN` | Electron → Next 告知上游 |
| `NEXT_PUBLIC_GVFI_API_ORIGIN` | 前端直连默认 origin |
| `GVFI_ROOT` | 仓库根（含 ECCV2022-RIFE） |
| `GVFI_PYTHON` | Python 解释器路径 |

## Python / 桌面

| 路径 | 说明 |
|------|------|
| `ECCV2022-RIFE/ui_prefs` 设置文件 | PyQt 主题与背景提示 |
| `%APPDATA%\gvfi-desktop\gvfi-desktop.log` | Electron 启动与子进程日志 |
| `ECCV2022-RIFE/user_data/uploads` | 上传缓存 |
| `ECCV2022-RIFE/user_data/output` | 输出目录 |

## 工具搜索根（tool_resolver）

按优先级扫描：`ECCV2022-RIFE` → `_internal` → 仓库父目录 → `AI_Tools/**` → PyInstaller `_MEIPASS`。
