# GVFI Scripts

Windows 启动与打包脚本，由根目录 `.cmd` / `.vbs` 调用。

| 脚本 | 说明 |
|------|------|
| `_resolve-exe.cmd` | 查找 `dist-gvfi` / `dist-gvfi-build` 中的 `GVFI.exe` |
| `launch-desktop.cmd` | 启动已打包桌面版 |
| `launch-desktop.vbs` | 无窗口调用 launch-desktop |
| `launch-dev.cmd` | 启动 API + Electron 开发 |
| `launch-web.cmd` | 启动 API + Next.js dev (:3456) |
| `build-desktop.cmd` | build → standalone → electron-builder |
| `sync-desktop-ui.cmd` | 热更新 standalone 到已打包目录 |
| `create-shortcut.bat` | 创建桌面快捷方式 |

所有脚本使用 `chcp 65001` 以正确显示中文。
