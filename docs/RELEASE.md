# GVFI 对外发布清单（Windows）

面向正式给他人使用前的发布准备。当前首个对外版本：**1.0.0**。

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. 代码签名（强烈建议）

未签名的 `.exe` 在 Windows SmartScreen 上常提示「未知发布者」，用户可能不敢安装。

### 需要什么

- 代码签名证书（EV 证书可更快建立声誉；OV 也可，但 SmartScreen 信誉积累更慢）
- Windows SDK 的 `signtool`，或由 `electron-builder` 代签

### electron-builder 环境变量（推荐）

打包前在发布机设置（勿提交到 Git）：

```bat
set CSC_LINK=D:\certs\gvfi-codesign.pfx
set CSC_KEY_PASSWORD=********
```

然后：

```bat
cd web-ui
npm run dist:win:release
```

签名成功后，安装包属性 → 数字签名 应显示发布者名称。

### 手动签名示例

```bat
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /f gvfi-codesign.pfx /p ******** GVFI-Setup-1.0.0.exe
signtool verify /pa GVFI-Setup-1.0.0.exe
```

### 未拿到证书时

- 仍可分发，但须在下载页明确写清：可能出现 SmartScreen，用户需点「更多信息 → 仍要运行」
- 优先提供 SHA256，避免被篡改却无法察觉

---

## 2. 版本号

| 位置 | 值 |
|------|-----|
| 产品版本 | **1.0.0** |
| `web-ui/package.json` → `version` | `1.0.0` |
| `web-ui/src/lib/brand.ts` → `APP_VERSION` | `1.0.0` |
| 安装包文件名 | `GVFI-Setup-1.0.0.exe` / `GVFI-Portable-1.0.0.exe` |

约定：语义化版本 `MAJOR.MINOR.PATCH`。破坏性变更升 MAJOR；功能升 MINOR；修复升 PATCH。

发版前同步修改上述两处，并在 `CHANGELOG.md` 增加对应条目。

---

## 3. 更新日志

权威变更记录：仓库根目录 [`CHANGELOG.md`](../CHANGELOG.md)。

对外短版见 [`releases/1.0.0/RELEASE_NOTES.md`](../releases/1.0.0/RELEASE_NOTES.md)。

---

## 4. 使用说明

终端用户文档：[`docs/USER_GUIDE.md`](./USER_GUIDE.md)。

应用内也可查看：系统 → 关于 → 法律与许可。

---

## 5. 下载地址与文件哈希

发布时填写 [`releases/1.0.0/DOWNLOADS.md`](../releases/1.0.0/DOWNLOADS.md)。

生成哈希（打包完成后）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release-checksums.ps1 -Version 1.0.0
```

将输出的 SHA256 粘贴到 `DOWNLOADS.md`，并与下载页一并公示。用户校验：

```powershell
Get-FileHash .\GVFI-Setup-1.0.0.exe -Algorithm SHA256
```

---

## 6. 问题反馈渠道

| 渠道 | 说明 |
|------|------|
| 应用内 | 系统 → 日志（可复制错误）；关于页「问题反馈」 |
| 邮件 | 在 `web-ui/src/lib/brand.ts` 的 `FEEDBACK_EMAIL` 配置后对外公布 |
| Issue / 表单 | 在 `FEEDBACK_URL` 配置公开地址（GitHub Issues、问卷等） |

反馈时请附带：版本号、Windows 版本、复现步骤、日志片段（已脱敏，勿粘贴 API Key）。

---

## 7. 升级方式

### 当前：手动升级（默认）

1. 关闭正在运行的 GVFI  
2. 下载新版安装包并校验 SHA256  
3. 运行 `GVFI-Setup-x.y.z.exe` 覆盖安装（或解压 Portable 到新目录）  
4. 用户数据默认在 `%APPDATA%\gvfi-desktop\`，一般可保留设置与密钥  

热更新 UI（仅开发/内测机、已有 unpacked 目录时）：

```bat
scripts\sync-desktop-ui.cmd
```

正式对外请用完整安装包，不要依赖热更新脚本。

### 自动更新（后续可选）

尚未接入 `electron-updater`。若以后启用：

1. `package.json` 增加 `publish`（如 GitHub Releases / 自建 static）  
2. 主进程接入 `autoUpdater`，仅校验签名产物  
3. 发布 `latest.yml` + 安装包 + 签名  
4. 在关于页显示「检查更新」  

在自动更新上线前，一律按手动升级操作。

---

## 8. 旧版本回滚

1. **保留上一版安装包与 SHA256**（至少 N-1），放在 `releases/<旧版本>/` 或对象存储归档  
2. 卸载或直接覆盖安装旧版 Setup  
3. 若配置异常：备份后删除 `%APPDATA%\gvfi-desktop\` 再装旧版（会清除本地 API Key 等，需重新填写）  
4. Portable 版：保留整个旧目录即可双开对比，确认后删除新目录  

回滚检查清单：

- [ ] 旧版 `GVFI-Setup-*.exe` 可下载  
- [ ] SHA256 与当时公示一致  
- [ ] 本地 API（`:8765`）与 `ECCV2022-RIFE` / `AI_Tools` 路径仍匹配当前发行形态  

---

## 9. 发版当日检查表

- [ ] `APP_VERSION` / `package.json` 均为目标版本  
- [ ] `CHANGELOG.md` + `releases/x.y.z/RELEASE_NOTES.md` 已写  
- [ ] 已代码签名（或已注明 SmartScreen 风险）  
- [ ] `npm run dist:win:release` 成功  
- [ ] `release-checksums.ps1` 已生成并写入 `DOWNLOADS.md`  
- [ ] 下载页可访问；反馈邮箱/链接有效  
- [ ] 干净 Windows 机冒烟：安装 → 启动 → 选视频同意 → 本地任务 → 关于页版本号  
- [ ] 归档上一版安装包供回滚  

---

## 版权

**GVFI** — AI Video Workstation  

Developed by Mr. Gong  

Copyright © 2026 Mr. Gong. All Rights Reserved.
