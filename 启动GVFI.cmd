@echo off
chcp 65001 >nul
cd /d "%~dp0"

call "%~dp0scripts\_resolve-exe.cmd"
if not errorlevel 1 (
  call "%~dp0scripts\launch-desktop.cmd"
  exit /b %ERRORLEVEL%
)

echo [GVFI] 未检测到打包版 GVFI.exe，进入开发模式...
echo       提示：打包完成后可直接双击 web-ui\dist-gvfi\win-unpacked\GVFI.exe
echo.
call "%~dp0scripts\launch-dev.cmd"
exit /b %ERRORLEVEL%
