# GVFI 1.0.0 下载与校验

> **交付状态（2026-08-09）：** Setup / Portable **尚未生成**，下表哈希均为 **未验证**。  
> 完整结论见 [`DELIVERY_REPORT.md`](./DELIVERY_REPORT.md)。  
> 生成哈希：`powershell -ExecutionPolicy Bypass -File scripts\release-checksums.ps1 -Version 1.0.0`

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

## 下载地址

| 产物 | 文件名 | 下载地址 |
|------|--------|----------|
| 安装版 (NSIS) | `GVFI-Setup-1.0.0-x64.exe` | _待填写：GitHub Release 附件直链_ |
| 便携版 | `GVFI-Portable-1.0.0-x64.exe` | _待填写：GitHub Release 附件直链_ |
| 校验清单 | `SHA256SUMS.txt` | _待填写：GitHub Release 附件直链_ |
| 更新日志 | `RELEASE_NOTES.md` | 本仓库 `releases/1.0.0/RELEASE_NOTES.md` |
| 使用说明 | `USER_GUIDE.md` | 本仓库 `docs/USER_GUIDE.md` |

## 文件哈希（SHA-256）

| 文件 | SHA-256 |
|------|---------|
| `GVFI-Setup-1.0.0-x64.exe` | _待填写（打包签名后生成）_ |
| `GVFI-Portable-1.0.0-x64.exe` | _待填写_ |

校验示例：

```powershell
Get-FileHash .\GVFI-Setup-1.0.0.exe -Algorithm SHA256
```

哈希不一致时请勿安装，并联系发布方。

## 问题反馈

| 类型 | 地址 |
|------|------|
| 邮件 | 与 `FEEDBACK_EMAIL`（`web-ui/src/lib/brand.ts`）保持一致后填写 |
| 网页 / Issue | 与 `FEEDBACK_URL` 保持一致后填写 |

## 签名状态

- [ ] 已使用代码签名证书签名（SmartScreen「未知发布者」风险显著降低）  
- [ ] 暂未签名（下载页已注明风险与哈希校验步骤）
