@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo SiYuan Copilot - build and install
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Please install Node.js 18 or later.
  pause
  exit /b 1
)

node scripts\build-install.js
if errorlevel 1 (
  echo.
  echo Build/install failed. Check the message above.
  pause
  exit /b 1
)

echo.
echo Finished. Refresh the plugin list in SiYuan and enable the plugin if needed.
pause
endlocal
