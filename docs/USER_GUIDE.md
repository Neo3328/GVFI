# GVFI 使用说明（Windows）

版本：**1.0.0**

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 环境要求

- Windows 10 / 11（64 位）
- 完整发行包所需的配套目录：`ECCV2022-RIFE`、`AI_Tools`（按你收到的压缩包/安装说明放置，勿单独挪走相对路径）
- 使用大模型分析时：自备云端 API Key（应用不会预置密钥）

---

## 安装与启动

### 安装版（Setup）

1. 从官方下载页获取 `GVFI-Setup-1.0.0.exe`
2. 建议核对 [SHA256](../releases/1.0.0/DOWNLOADS.md)
3. 若 SmartScreen 提示未知发布者：确认哈希一致后，再选择「更多信息 → 仍要运行」（正式签名版应较少出现）
4. 按向导安装，完成后从开始菜单或桌面快捷方式启动 **GVFI**

### 便携版（Portable）

1. 下载 `GVFI-Portable-1.0.0.exe` 或解压发行包中的便携目录  
2. 双击运行；首次请保持与 `ECCV2022-RIFE` 等同套目录结构完整  

### 开发者本地打包包

若使用仓库内 `生成桌面软件.cmd` 生成的 `win-unpacked\GVFI.exe`，用根目录 **`启动GVFI.cmd`** 启动。

---

## 基本流程

1. **首页**：查看状态与快捷入口  
2. **视频**：选择本地视频（会先提示用途与隐私说明）→ 配置补帧/超分 → 开始任务  
3. **任务**：查看队列、进度与输出路径  
4. **AI**：配置模型后做视觉分析（会再确认是否向云端传输）  
5. **连接**：填写本地 API / 大模型 Base URL 与 API Key（仅保存在本机）  
6. **系统**：外观、字体、日志、关于、法律文档  

默认端口：

| 服务 | 地址 |
|------|------|
| 界面 | `http://127.0.0.1:3456` |
| 本地 API | `http://127.0.0.1:8765` |

---

## 隐私与安全要点

- API Key **不会**写进安装包；请勿把密钥发给他人或贴到公开反馈里  
- 选片、上传、云端分析前会有确认提示  
- 日志会尽量脱敏；反馈问题时请再检查一遍是否含密钥  
- 详见应用内：设置 → 法律与许可  

---

## 升级

1. 关闭 GVFI  
2. 安装新版 Setup（或更换 Portable 目录）  
3. 一般可保留 `%APPDATA%\gvfi-desktop\` 中的设置  

详见 [`docs/RELEASE.md`](./RELEASE.md) 第 7、8 节（升级与回滚）。

---

## 问题反馈

请准备：GVFI 版本（关于页）、Windows 版本、步骤、日志摘录。

渠道见关于页「问题反馈」，或发布页公布的邮箱 / Issue 地址。

常见日志位置：`%APPDATA%\gvfi-desktop\gvfi-desktop.log`

---

## 版权

**GVFI** — AI 视频工作站  

Developed by Mr. Gong  

Copyright © 2026 Mr. Gong. All Rights Reserved.
