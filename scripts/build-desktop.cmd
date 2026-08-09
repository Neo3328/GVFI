@echo off
chcp 65001 >nul
cd /d "%~dp0..\web-ui"

echo [GVFI] 正在生成 Windows 桌面软件...
echo.

if not exist "node_modules" (
  echo [1/4] 安装依赖...
  call npm install --proxy=null --https-proxy=null
  if errorlevel 1 exit /b 1
) else (
  echo [1/4] 检查 electron-builder...
  call npm install electron-builder --save-dev --proxy=null --https-proxy=null
  if errorlevel 1 exit /b 1
)

echo [2/4] 构建 Next.js 生产包...
call npm run build
if errorlevel 1 exit /b 1

echo [3/4] 准备 standalone 资源...
call npm run prepare:standalone
if errorlevel 1 exit /b 1

echo [4/4] 打包 Electron 桌面应用...
call npx electron-builder --win dir
if errorlevel 1 (
  echo [GVFI] 主输出目录被占用，尝试 dist-gvfi-build ...
  call npx electron-builder --win dir --config.directories.output=dist-gvfi-build
  if errorlevel 1 (
    echo [GVFI] 完整打包失败。若已有 GVFI.exe，可运行 scripts\sync-desktop-ui.cmd 仅更新 UI。
    exit /b 1
  )
  robocopy "dist-gvfi-build\win-unpacked" "dist-gvfi\win-unpacked" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
  if errorlevel 8 exit /b 1
)

echo.
echo ========================================
echo  桌面软件已生成
echo  %~dp0..\web-ui\dist-gvfi\win-unpacked\GVFI.exe
echo.
echo  下一步：
echo    1. 双击「启动GVFI.cmd」
echo    2. 或运行「创建桌面快捷方式.bat」
echo  需已安装 Python，ECCV2022-RIFE 保持在项目根目录
echo ========================================
pause
