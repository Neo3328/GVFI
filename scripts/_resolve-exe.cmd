@echo off
REM GVFI — 解析已打包 GVFI.exe 路径
REM 优先级: dist-gvfi-fresh > dist-gvfi-build > dist-gvfi

set "GVFI_EXE="
set "GVFI_DIST="
set "GVFI_ROOT=%~dp0.."

if exist "%GVFI_ROOT%\web-ui\dist-gvfi-fresh\win-unpacked\GVFI.exe" (
    set "GVFI_EXE=%GVFI_ROOT%\web-ui\dist-gvfi-fresh\win-unpacked\GVFI.exe"
    set "GVFI_DIST=dist-gvfi-fresh"
    exit /b 0
)

if exist "%GVFI_ROOT%\web-ui\dist-gvfi-build\win-unpacked\GVFI.exe" (
    set "GVFI_EXE=%GVFI_ROOT%\web-ui\dist-gvfi-build\win-unpacked\GVFI.exe"
    set "GVFI_DIST=dist-gvfi-build"
    exit /b 0
)

if exist "%GVFI_ROOT%\web-ui\dist-gvfi\win-unpacked\GVFI.exe" (
    set "GVFI_EXE=%GVFI_ROOT%\web-ui\dist-gvfi\win-unpacked\GVFI.exe"
    set "GVFI_DIST=dist-gvfi"
    exit /b 0
)

exit /b 1
