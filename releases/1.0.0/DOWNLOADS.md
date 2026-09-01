# GVFI 1.0.0 下载与校验

> **交付状态（2026-08-10）：** 已通过 GitHub Actions 自动构建并发布到 Releases。  
> 下载入口：https://github.com/Neo3328/GVFI/releases/latest

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

## 下载地址

### 官方渠道（GitHub）

打开 [Releases 页面](https://github.com/Neo3328/GVFI/releases/latest)，展开 **Assets** 下载：

| 产物 | 文件名 | 说明 |
|------|--------|------|
| 安装版 (NSIS) | `GVFI-Setup-1.0.0-x64.exe` | 推荐：安装到系统、创建桌面快捷方式 |
| 便携版 | `GVFI-Portable-1.0.0-x64.exe` | 免安装，解压即用 |
| 校验清单 | `SHA256SUMS.txt` | 上面两个文件的 SHA-256 |
| 更新日志 | `RELEASE_NOTES.md` | 本仓库 `releases/1.0.0/RELEASE_NOTES.md` |
| 使用说明 | `USER_GUIDE.md` | 本仓库 `docs/USER_GUIDE.md` |

> 请勿点「Code → Download ZIP」——那是源码，不是可直接运行的软件。

### 国内镜像（百度网盘）

> 如果 GitHub 下载缓慢或失败，可使用国内镜像。

| 产物 | 链接 | 提取码 |
|------|------|--------|
| GVFI 1.0.0（Setup + Portable） | [百度网盘](https://pan.baidu.com/s/1hH8P9oHXKdHiNZsNBiM2ZA?pwd=x9n6) | `x9n6` |

**⚠️ 重要：** 镜像文件为**本地构建版本**，SHA-256 与 GitHub Release **不一致**。如需核对完整性，请使用下表「本地构建」哈希，而非 GitHub 官方哈希。

## 文件哈希（SHA-256）

### GitHub Release（官方构建）

| 文件 | SHA-256 |
|------|---------|
| `GVFI-Setup-1.0.0-x64.exe` | `998ce50f7701afc9282b44277391e09c34cfe2102789386b84f441c2456604e1` |
| `GVFI-Portable-1.0.0-x64.exe` | `63c1419dac5ee51df237eb721fad7d33902e4a3b67a22b756fbe4fa6fc8c3edc` |

### 本地构建（百度网盘镜像）

| 文件 | SHA-256 |
|------|---------|
| `GVFI-Setup-1.0.0-x64.exe` | `2f3d042bdd8d3329930390b45e31c629cf3245d024ab98d7ae4a2847479e6b79` |
| `GVFI-Portable-1.0.0-x64.exe` | `1bdaa36d900fbf21f747e423e91be09e9bd52817dccd9d020ea8c2db23639f59` |

> **说明：** 本地构建与 CI 构建因环境差异（Node 版本、时间戳等）导致哈希不同，属于正常现象。两者功能一致，均可使用。

校验示例（PowerShell）：

```powershell
Get-FileHash .\GVFI-Setup-1.0.0-x64.exe -Algorithm SHA256
```

输出应与对应渠道的哈希一致（大小写不敏感）。**哈希不一致时请勿安装**，重新下载或联系发布方。

## 签名状态

- [ ] 已使用代码签名证书签名（SmartScreen「未知发布者」风险显著降低）
- [x] **暂未签名** — 本版未配置代码签名证书

因此安装时 Windows 可能弹出 **「Windows 已保护你的电脑 / 未知发布者」**：点击 **「更多信息」→「仍要运行」** 即可。安装前可用上表 SHA-256 核对文件未被篡改。

## 问题反馈

| 类型 | 地址 |
|------|------|
| 应用内 | 系统 → 日志（可复制错误）；关于页「问题反馈」 |
| 网页 / Issue | https://github.com/Neo3328/GVFI/issues |
