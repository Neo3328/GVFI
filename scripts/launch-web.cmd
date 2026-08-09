@echo off
chcp 65001 >nul
cd /d "%~dp0.."

set "RIFE_DIR=%~dp0..\ECCV2022-RIFE"
set "WEB_DIR=%~dp0..\web-ui"

echo [1/2] 启动 GVFI API...
if exist "%RIFE_DIR%\GVFI_API.cmd" (
  start "" "%RIFE_DIR%\GVFI_API.cmd"
) else (
  echo [警告] 未找到 GVFI_API.cmd
)

echo [2/2] 启动 Web 开发服务器 (http://127.0.0.1:3456/app)...
cd /d "%WEB_DIR%"
if not exist "node_modules" (
  call npm install --proxy=null --https-proxy=null
)
call npm run dev -- --port 3456
pause
