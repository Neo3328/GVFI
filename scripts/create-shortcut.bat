@echo off
chcp 65001 >nul
title GVFI - 创建桌面快捷方式
cd /d "%~dp0.."

set "ROOT=%CD%"
set "DESKTOP=%USERPROFILE%\Desktop"
set "LNK=%DESKTOP%\GVFI.lnk"
set "VBS_LNK=%DESKTOP%\GVFI 静默启动.lnk"
set "ICON=%ROOT%\web-ui\src\app\favicon.ico"

call "%~dp0_resolve-exe.cmd"
if not errorlevel 1 (
    set "TARGET=%GVFI_EXE%"
    set "DESC=GVFI AI 视频工作站"
    set "MODE=desktop"
) else (
    set "TARGET=%ROOT%\启动GVFI.cmd"
    set "DESC=GVFI AI 视频工作站（开发/打包入口）"
    set "MODE=dev"
)

echo [GVFI] 创建快捷方式...
echo        模式: %MODE%
echo        目标: %TARGET%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$s = New-Object -ComObject WScript.Shell;" ^
    "$l = $s.CreateShortcut('%LNK%');" ^
    "$l.TargetPath = '%TARGET%';" ^
    "$l.WorkingDirectory = '%ROOT%';" ^
    "$l.WindowStyle = 1;" ^
    "$l.Description = '%DESC%';" ^
    "if (Test-Path '%ICON%') { $l.IconLocation = '%ICON%,0' };" ^
    "$l.Save();" ^
    "Write-Host ('[OK] %LNK%')"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$s = New-Object -ComObject WScript.Shell;" ^
    "$l = $s.CreateShortcut('%VBS_LNK%');" ^
    "$l.TargetPath = '%ROOT%\GVFI.vbs';" ^
    "$l.WorkingDirectory = '%ROOT%';" ^
    "$l.WindowStyle = 7;" ^
    "$l.Description = 'GVFI 静默启动（无窗口）';" ^
    "if (Test-Path '%ICON%') { $l.IconLocation = '%ICON%,0' };" ^
    "$l.Save();" ^
    "Write-Host ('[OK] %VBS_LNK%')"

echo.
echo ========================================
echo   完成
echo     - GVFI.lnk           主快捷方式
echo     - GVFI 静默启动.lnk   无黑窗口启动
echo ========================================
pause
