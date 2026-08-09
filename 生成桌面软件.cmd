@echo off
chcp 65001 >nul
title GVFI - 生成桌面软件
cd /d "%~dp0"

echo ========================================
echo   GVFI - 生成 Windows 桌面软件
echo   Developed by Mr. Gong
echo ========================================
echo.

call "%~dp0scripts\build-desktop.cmd"
exit /b %ERRORLEVEL%
