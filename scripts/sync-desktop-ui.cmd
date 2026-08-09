@echo off
chcp 65001 >nul
title GVFI - 热更新桌面 UI
cd /d "%~dp0..\web-ui"

echo ========================================
echo   GVFI - 热更新桌面 UI
echo ========================================
echo.

echo [1/2] 构建 Next.js 生产包...
call npm run build
if errorlevel 1 (
    echo [错误] 构建失败
    pause
    exit /b 1
)

echo [2/2] 同步 standalone 到已打包目录...
call npm run prepare:standalone
if errorlevel 1 (
    echo [错误] 资源准备失败
    pause
    exit /b 1
)

set "SYNCED=0"

if exist "dist-gvfi-fresh\win-unpacked\resources\standalone\server.js" (
    echo [GVFI] 更新 dist-gvfi-fresh ...
    robocopy ".next\standalone" "dist-gvfi-fresh\win-unpacked\resources\standalone" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
    if errorlevel 8 (
        echo [警告] dist-gvfi-fresh 同步可能不完整
    ) else (
        set "SYNCED=1"
    )
)

if exist "dist-gvfi\win-unpacked\resources\standalone\server.js" (
    echo [GVFI] 更新 dist-gvfi ...
    robocopy ".next\standalone" "dist-gvfi\win-unpacked\resources\standalone" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
    if errorlevel 8 (
        echo [警告] dist-gvfi 同步可能不完整
    ) else (
        set "SYNCED=1"
    )
)

if exist "dist-gvfi-build\win-unpacked\resources\standalone\server.js" (
    echo [GVFI] 更新 dist-gvfi-build ...
    robocopy ".next\standalone" "dist-gvfi-build\win-unpacked\resources\standalone" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
    if errorlevel 8 (
        echo [警告] dist-gvfi-build 同步可能不完整
    ) else (
        set "SYNCED=1"
    )
)

if "%SYNCED%"=="0" (
    echo [错误] 未找到已打包目录
    echo        请先运行「生成桌面软件.cmd」
    pause
    exit /b 1
)

echo.
echo ========================================
echo   桌面 UI 已热更新（无需重打 Electron 壳）
echo   运行：启动GVFI.cmd 或 GVFI.vbs
echo ========================================
