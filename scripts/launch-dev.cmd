@echo off
chcp 65001 >nul
title GVFI - 开发模式
cd /d "%~dp0..\web-ui"

echo ========================================
echo   GVFI - 开发模式
echo ========================================
echo.

REM 检查依赖
if not exist "node_modules" (
    echo [1/4] 首次运行，安装依赖...
    call npm install --proxy=null --https-proxy=null
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

REM 启动后端 API
echo [2/4] 启动 GVFI API (127.0.0.1:8765)...
start "" /min "%~dp0..\ECCV2022-RIFE\GVFI_API.cmd"
timeout /t 3 /nobreak >nul

REM 构建前端
echo [3/4] 构建应用界面...
if not exist ".next\BUILD_ID" (
    call npm run build
    if errorlevel 1 (
        echo [错误] 构建失败
        pause
        exit /b 1
    )
) else (
    echo       使用缓存构建
)

REM 启动 Electron
echo [4/4] 启动 Electron 开发版...
echo.
echo ========================================
echo   Web UI:  http://127.0.0.1:3456
echo   API:     http://127.0.0.1:8765
echo ========================================
echo.
call npm run desktop
exit /b %ERRORLEVEL%
