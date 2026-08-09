@echo off
chcp 65001 >nul
cd /d "%~dp0..\web-ui"

if not exist "node_modules" (
  echo [GVFI] 首次运行，正在安装依赖...
  call npm install --proxy=null --https-proxy=null
  if errorlevel 1 exit /b 1
)

echo [GVFI] 启动 GVFI API (127.0.0.1:8765)...
start "" "%~dp0..\ECCV2022-RIFE\GVFI_API.cmd"

timeout /t 3 /nobreak >nul

if not exist ".next\BUILD_ID" (
  echo [GVFI] 构建应用界面...
  call npm run build
  if errorlevel 1 exit /b 1
)

echo [GVFI] 打开 Electron 开发版...
call npm run desktop
exit /b %ERRORLEVEL%
