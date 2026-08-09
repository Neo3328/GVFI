@echo off
chcp 65001 >nul
cd /d "%~dp0.."

set "ROOT=%CD%"
set "DESKTOP=%USERPROFILE%\Desktop"
set "LNK=%DESKTOP%\GVFI.lnk"
set "ICON=%ROOT%\ECCV2022-RIFE\web\favicon.ico"

call "%~dp0_resolve-exe.cmd"
if not errorlevel 1 (
  set "TARGET=%GVFI_EXE%"
  set "DESC=GVFI AI 视频工作站"
) else (
  set "TARGET=%ROOT%\启动GVFI.cmd"
  set "DESC=GVFI AI 视频工作站（开发/打包入口）"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s = New-Object -ComObject WScript.Shell;" ^
  "$l = $s.CreateShortcut('%LNK%');" ^
  "$l.TargetPath = '%TARGET%';" ^
  "$l.WorkingDirectory = '%ROOT%';" ^
  "$l.WindowStyle = 1;" ^
  "$l.Description = '%DESC%';" ^
  "if (Test-Path '%ICON%') { $l.IconLocation = '%ICON%,0' };" ^
  "$l.Save();" ^
  "Write-Host ('已创建: %LNK%')"

REM 额外创建无窗口启动脚本快捷方式（VBS）
set "VBS_LNK=%DESKTOP%\GVFI 静默启动.lnk"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s = New-Object -ComObject WScript.Shell;" ^
  "$l = $s.CreateShortcut('%VBS_LNK%');" ^
  "$l.TargetPath = '%ROOT%\GVFI.vbs';" ^
  "$l.WorkingDirectory = '%ROOT%';" ^
  "$l.WindowStyle = 7;" ^
  "$l.Description = 'GVFI 静默启动';" ^
  "if (Test-Path '%ICON%') { $l.IconLocation = '%ICON%,0' };" ^
  "$l.Save();" ^
  "Write-Host ('已创建: %VBS_LNK%')"

echo.
echo 完成。
echo   - GVFI.lnk          主快捷方式
echo   - GVFI 静默启动.lnk  无黑窗口启动（需已打包）
echo.
pause
