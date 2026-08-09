@echo off
chcp 65001 >nul
cd /d "%~dp0..\web-ui"

echo [GVFI] 同步 Next.js standalone 到已打包桌面目录...
call npm run build
if errorlevel 1 exit /b 1
call npm run prepare:standalone
if errorlevel 1 exit /b 1

set "SYNCED=0"

if exist "dist-gvfi\win-unpacked\resources\standalone\server.js" (
  echo [GVFI] 更新 dist-gvfi ...
  robocopy ".next\standalone" "dist-gvfi\win-unpacked\resources\standalone" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
  if errorlevel 8 exit /b 1
  set "SYNCED=1"
)

if exist "dist-gvfi-build\win-unpacked\resources\standalone\server.js" (
  echo [GVFI] 更新 dist-gvfi-build ...
  robocopy ".next\standalone" "dist-gvfi-build\win-unpacked\resources\standalone" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
  if errorlevel 8 exit /b 1
  set "SYNCED=1"
)

if "%SYNCED%"=="0" (
  echo [GVFI] 未找到已打包目录，请先运行「生成桌面软件.cmd」
  exit /b 1
)

echo.
echo ========================================
echo  桌面 UI 已热更新（无需重打 Electron 壳）
echo  运行：启动GVFI.cmd 或 GVFI.vbs
echo ========================================
