@echo off
chcp 65001 >nul
call "%~dp0_resolve-exe.cmd"
if errorlevel 1 (
  echo [GVFI] 未找到桌面程序。
  echo        请先运行「生成桌面软件.cmd」，或开发模式使用「启动GVFI.cmd」自动降级。
  pause
  exit /b 1
)

echo [GVFI] 启动桌面版 (%GVFI_DIST%)...
start "" "%GVFI_EXE%"
exit /b 0
