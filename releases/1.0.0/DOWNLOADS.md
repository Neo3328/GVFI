# GVFI 1.0.0 下载与校验

> **交付状态（2026-08-10）：** 已通过 GitHub Actions 自动构建并发布到 Releases。  
> 下载入口：https://github.com/Neo3328/GVFI/releases/latest

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

## 下载地址

打开 [Releases 页面](https://github.com/Neo3328/GVFI/releases/latest)，展开 **Assets** 下载：

| 产物 | 文件名 | 说明 |
|------|--------|------|
| 安装版 (NSIS) | `GVFI-Setup-1.0.0-x64.exe` | 推荐：安装到系统、创建桌面快捷方式 |
| 便携版 | `GVFI-Portable-1.0.0-x64.exe` | 免安装，解压即用 |
| 校验清单 | `SHA256SUMS.txt` | 上面两个文件的 SHA-256 |
| 更新日志 | `RELEASE_NOTES.md` | 本仓库 `releases/1.0.0/RELEASE_NOTES.md` |
| 使用说明 | `USER_GUIDE.md` | 本仓库 `docs/USER_GUIDE.md` |

> 请勿点「Code → Download ZIP」——那是源码，不是可直接运行的软件。

## 文件哈希（SHA-256）

| 文件 | SHA-256 |
|------|---------|
| `GVFI-Setup-1.0.0-x64.exe` | `998ce50f7701afc9282b44277391e09c34cfe2102789386b84f441c2456604e1` |
| `GVFI-Portable-1.0.0-x64.exe` | `63c1419dac5ee51df237eb721fad7d33902e4a3b67a22b756fbe4fa6fc8c3edc` |

校验示例（PowerShell）：

```powershell
Get-FileHash .\GVFI-Setup-1.0.0-x64.exe -Algorithm SHA256
```

输出应与上表一致（大小写不敏感）。**哈希不一致时请勿安装**，重新下载或联系发布方。

## 签名状态

- [ ] 已使用代码签名证书签名（SmartScreen「未知发布者」风险显著降低）
- [x] **暂未签名** — 本版未配置代码签名证书

因此安装时 Windows 可能弹出 **「Windows 已保护你的电脑 / 未知发布者」**：点击 **「更多信息」→「仍要运行」** 即可。安装前可用上表 SHA-256 核对文件未被篡改。

## 问题反馈

| 类型 | 地址 |
|------|------|
| 应用内 | 系统 → 日志（可复制错误）；关于页「问题反馈」 |
| 网页 / Issue | https://github.com/Neo3328/GVFI/issues |
