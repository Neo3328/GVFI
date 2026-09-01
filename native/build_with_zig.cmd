@echo off
REM Build gvfi_native.dll with Zig from pip package `ziglang`.
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "ZIG="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\Lib\site-packages\ziglang\zig.exe" (
  set "ZIG=%LOCALAPPDATA%\Programs\Python\Python312\Lib\site-packages\ziglang\zig.exe"
)
if "%ZIG%"=="" (
  for /f "delims=" %%I in ('python -c "import glob,os,ziglang; print(glob.glob(os.path.join(os.path.dirname(ziglang.__file__),'zig.exe'))[0])" 2^>nul') do set "ZIG=%%I"
)
if "%ZIG%"=="" (
  echo [gvfi_native] zig.exe not found. Run: python -m pip install ziglang
  exit /b 1
)

echo Using Zig: %ZIG%
if not exist build mkdir build

set "FLAGS=-std=c++20 -O2 -Wno-nullability-completeness -DWIN32_LEAN_AND_MEAN -DNOMINMAX -DGVFI_NATIVE_EXPORTS -Iinclude"
set "SRCS=src/work_loop.cpp src/event_source.cpp src/memory_pressure.cpp src/zone_pool.cpp"
set "ALL=%SRCS% src/gvfi_capi.cpp src/gvfi_native.cpp"

echo Building DLL...
"%ZIG%" c++ %FLAGS% -shared %ALL% -lkernel32 -Wl,--out-implib,build/gvfi_native.lib -o build/gvfi_native.dll
if errorlevel 1 exit /b 1

echo Building tests...
"%ZIG%" c++ %FLAGS% tests/test_work_loop.cpp %SRCS% -lkernel32 -o build/test_work_loop.exe
if errorlevel 1 exit /b 1
"%ZIG%" c++ %FLAGS% tests/test_zone_pool.cpp %SRCS% -lkernel32 -o build/test_zone_pool.exe
if errorlevel 1 exit /b 1
"%ZIG%" c++ %FLAGS% tests/test_memory_pressure.cpp %SRCS% -lkernel32 -o build/test_memory_pressure.exe
if errorlevel 1 exit /b 1
"%ZIG%" c++ %FLAGS% tests/test_native_cabi.cpp src/gvfi_native.cpp -o build/test_native_cabi.exe
if errorlevel 1 exit /b 1

echo Running C++ tests...
build\test_work_loop.exe || exit /b 1
build\test_zone_pool.exe || exit /b 1
build\test_memory_pressure.exe || exit /b 1
build\test_native_cabi.exe || exit /b 1

if not exist "..\ECCV2022-RIFE\gvfi_runtime\native_bin" mkdir "..\ECCV2022-RIFE\gvfi_runtime\native_bin"
copy /Y build\gvfi_native.dll "..\ECCV2022-RIFE\gvfi_runtime\native_bin\gvfi_native.dll" >nul

echo Running Python bridge tests...
python "..\ECCV2022-RIFE\gvfi_runtime\tests\test_runtime.py" -v
if errorlevel 1 exit /b 1

echo ALL PASS
exit /b 0
