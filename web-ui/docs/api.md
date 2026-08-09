# GVFI API 接口说明

> 本地渲染引擎 HTTP API · 默认 `http://127.0.0.1:8765`  
> Web UI 通过 `/api` 反向代理或直连访问；活动 Base URL 由「连接」页 API Profile 控制。

Developed by Mr. Gong · Copyright © 2026 Mr. Gong. All Rights Reserved.

## 鉴权

- 本地默认无需鉴权。
- 若 API Profile 配置了 `apiKey` / `token`，客户端会附加 `Authorization: Bearer <token>`。

## 端点一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查：ffmpeg / RIFE / 模型目录 |
| GET | `/settings/appearance` | PyQt 外观偏好（供 Web 水合） |
| GET | `/settings/background` | 背景图文件流（若存在） |
| GET | `/media` | 媒体/输出目录信息 |
| GET | `/jobs` | 任务列表 |
| POST | `/jobs` | 创建补帧或 LLM 分析任务（multipart） |
| GET | `/jobs/{id}` | 任务状态 |
| GET | `/jobs/{id}/logs` | 任务日志 |
| POST | `/jobs/{id}/cancel` | 取消任务 |
| POST | `/llm/test` | 测试大模型连通性 |

## GET `/health`

```json
{
  "ok": true,
  "ffmpeg": true,
  "ffprobe": true,
  "rife_ready": true,
  "models": [{ "id": "gvfi:rife-v4.6", "name": "rife-v4.6", "path": "..." }],
  "gpus": [{ "index": 0, "name": "本地 Vulkan", "vram_mb": 0 }],
  "warnings": []
}
```

- `ok` / `rife_ready`：引擎可执行补帧。
- API 进程可达但引擎未就绪时，UI 显示「已连通 / 引擎未就绪」。

## POST `/jobs`

`multipart/form-data`：

| 字段 | 说明 |
|------|------|
| `file` | 输入视频 |
| `settings` | JSON 字符串，JobSettings 结构 |

响应：`{ "id": "<jobId>", ... }`

## POST `/llm/test`

JSON body：

```json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4o"
}
```

## 工具解析

运行时依赖由 `ECCV2022-RIFE/tool_resolver.py` 解析，候选根包括：

1. `ECCV2022-RIFE/`
2. `_internal/`（打包）
3. 仓库父目录
4. **`AI_Tools/`** 及子目录（FFmpeg / RIFE_ncnn / RealCUGAN 等）

## 前端调用约定

- 使用 `apiFetch` / `apiUrl`（`web-ui/src/lib/api-client.ts`）。
- 大体积上传优先直连 `:8765`，绕过 Next 代理默认 body 限制。
- Profile `baseUrl` 为绝对 `http(s)` 时，全部请求走该 origin。
