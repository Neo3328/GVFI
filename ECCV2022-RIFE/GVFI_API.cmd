@echo off
chcp 65001 >nul
title GVFI API Server
cd /d "%~dp0"

echo ========================================
echo   GVFI API Server
echo   地址: http://127.0.0.1:8765
echo ========================================
echo.

set "GVFI_API_PORT=8765"

where pythonw >nul 2>&1
if not errorlevel 1 (
    echo [GVFI] 使用 pythonw 启动（无控制台窗口）...
    start "" pythonw gvfi_api.py
    exit /b 0
)

where python >nul 2>&1
if not errorlevel 1 (
    echo [GVFI] 使用 python 启动...
    start "" python gvfi_api.py
    exit /b 0
)

echo [错误] 未找到 Python，无法启动 GVFI API
echo        请安装 Python 3.10+ 并添加到 PATH
pause
exit /b 1
