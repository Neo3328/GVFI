@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "GVFI_API_PORT=8765"

where pythonw >nul 2>&1
if not errorlevel 1 (
  start "" pythonw gvfi_api.py
  exit /b 0
)

where python >nul 2>&1
if not errorlevel 1 (
  start "" python gvfi_api.py
  exit /b 0
)

echo [错误] 未找到 Python，无法启动 GVFI API。
pause
exit /b 1
