@echo off
chcp 65001 >nul
title GVFI - 创建桌面快捷方式
cd /d "%~dp0"

echo ========================================
echo   GVFI - 创建桌面快捷方式
echo   Developed by Mr. Gong
echo ========================================
echo.

call "%~dp0scripts\create-shortcut.bat"
exit /b %ERRORLEVEL%
