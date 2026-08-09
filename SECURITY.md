# GVFI 安全政策

**Developed by Mr. Gong**  
**Copyright © 2026 Mr. Gong. All Rights Reserved.**

---

## 支持范围

| 组件 | 说明 |
|------|------|
| Windows 桌面端（Electron + Next.js） | 当前主发版目标 |
| 本地 Python API（`:8765`）与 RIFE/超分工具链 | 随项目运行 |

历史/旧版本不承诺回溯补丁；请优先使用最新发布版本。

## 报告漏洞

**请勿通过公开 Issue 提交敏感安全问题。**  
请通过以下任一方式私下报告（在公开前请等待修复确认）：

- 邮件：与仓库 `web-ui/src/lib/brand.ts` 中 `FEEDBACK_EMAIL` 一致（发版时配置）
- GitHub：使用仓库的 **Private vulnerability reporting**（若已开启）

## 提交内容（建议）

1. 影响版本与 Windows 版本
2. 复现步骤 / 概念验证（PoC）
3. 影响范围（数据泄露、RCE、路径遍历、上传滥用等）
4. 相关日志片段（**请自行脱敏：去除 API Key / Token / 本地路径中的隐私信息**）

## 响应目标

- **确认**：72 小时内回复已收到并初步评估
- **修复与公开**：按严重程度协调发布；公开前会与报告者沟通致谢（可选）

## 密钥与敏感数据

- **绝不提交**真实 `.env`、API Key、代码签名证书（`.pfx`/`.p12`）、私钥。
- 应用内填写的密钥仅存于本机（Electron `userData` / localStorage 约定），日志已做脱敏处理（`web-ui/electron/main.js`）。
- 若发现密钥误入库：立即轮换该密钥，并联系维护者清理 Git 历史。

## 发布安全

- Windows 安装包应进行代码签名；未签名时须公示 SHA-256（见 `docs/RELEASE.md`）。
- 依赖通过 `npm audit` 定期审查；打包产物不包含 `.env` 等本地配置。
