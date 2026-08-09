@echo off
chcp 65001 >nul
title GVFI - 桌面版启动器
cd /d "%~dp0.."

call "%~dp0_resolve-exe.cmd"
if errorlevel 1 (
    echo [错误] 未找到桌面程序。
    echo        请先运行「生成桌面软件.cmd」，或使用「启动GVFI.cmd」进入开发模式。
    pause
    exit /b 1
)

echo [GVFI] 启动桌面版 (%GVFI_DIST%)...
echo        路径: %GVFI_EXE%
echo.
start "" "%GVFI_EXE%"
exit /b 0
