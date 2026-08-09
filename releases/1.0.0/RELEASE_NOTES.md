# GVFI 1.0.0 Release Notes

**发布日期：** 2026-08-09  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

## 本版定位

首个建议对外试用的 Windows 桌面版本：本地视频补帧/超分工作流、大模型视觉分析、Liquid Glass 界面，以及隐私相关提示与法律文档入口。

## 主要能力

- 本地 RIFE 补帧、超分任务队列与输出管理  
- AI 视觉分析（需自备 API Key；密钥仅存本机）  
- 中英文界面、外观 / 字体与显示设置  
- 选片与云端任务前的明确确认；日志脱敏  
- 应用内隐私政策、用户协议、第三方许可证  

## 安装包

见同目录 [`DOWNLOADS.md`](./DOWNLOADS.md)。

## 升级 / 回滚

- **升级：** 关闭应用后安装新版 Setup，或替换 Portable 目录。  
- **回滚：** 使用归档的上一版安装包覆盖安装；必要时清理 `%APPDATA%\gvfi-desktop\`（会丢失本机密钥与偏好）。  
- **自动更新：** 本版未启用；请手动下载安装。

## 已知说明

- 未代码签名时，Windows SmartScreen 可能提示「未知发布者」。  
- 完整本地算法依赖需随发行包提供 `ECCV2022-RIFE` / `AI_Tools`。  

## 反馈

见应用内「关于 → 问题反馈」，或发行页公布渠道。
