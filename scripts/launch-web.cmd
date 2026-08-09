@echo off
chcp 65001 >nul
title GVFI - Web 开发模式
cd /d "%~dp0.."

set "RIFE_DIR=%~dp0..\ECCV2022-RIFE"
set "WEB_DIR=%~dp0..\web-ui"

echo ========================================
echo   GVFI - Web 开发模式
echo ========================================
echo.

echo [1/2] 启动 GVFI API (127.0.0.1:8765)...
if exist "%RIFE_DIR%\GVFI_API.cmd" (
    start "" /min "%RIFE_DIR%\GVFI_API.cmd"
) else (
    echo [警告] 未找到 GVFI_API.cmd
)
timeout /t 2 /nobreak >nul

echo [2/2] 启动 Web 开发服务器...
echo        地址: http://127.0.0.1:3456/app
echo.
cd /d "%WEB_DIR%"
if not exist "node_modules" (
    echo 首次运行，安装依赖...
    call npm install --proxy=null --https-proxy=null
)
call npm run dev -- --port 3456
pause
