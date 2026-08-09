@echo off
REM Build gvfi_native (C++20). Requires CMake + MSVC or MinGW.
setlocal
cd /d "%~dp0"

if not exist build mkdir build
cd build

cmake -G "Ninja" -DCMAKE_BUILD_TYPE=Release .. 2>nul
if errorlevel 1 cmake -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release .. 2>nul
if errorlevel 1 cmake -A x64 -DCMAKE_BUILD_TYPE=Release ..
if errorlevel 1 (
  echo [gvfi_native] CMake configure failed. Install Visual Studio Build Tools or MinGW + CMake.
  exit /b 1
)

cmake --build . --config Release
if errorlevel 1 exit /b 1

ctest -C Release --output-on-failure
exit /b %ERRORLEVEL%
