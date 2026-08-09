@echo off
chcp 65001 >nul
title GVFI AI 视频工作站
cd /d "%~dp0"

echo ========================================
echo   GVFI AI 视频工作站
echo   Developed by Mr. Gong
echo ========================================
echo.

REM 优先使用已打包版本
call "%~dp0scripts\_resolve-exe.cmd"
if not errorlevel 1 (
    echo [GVFI] 检测到已打包版本，启动桌面应用...
    call "%~dp0scripts\launch-desktop.cmd"
    exit /b %ERRORLEVEL%
)

echo [GVFI] 未检测到打包版，进入开发模式...
echo        提示：打包完成后可直接双击 web-ui\dist-gvfi\win-unpacked\GVFI.exe
echo.

call "%~dp0scripts\launch-dev.cmd"
exit /b %ERRORLEVEL%
