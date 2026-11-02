@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Windows PowerShell was not found.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\zip-source.ps1"
if errorlevel 1 (
  echo.
  echo Source archive creation failed.
  pause
  exit /b 1
)

echo.
echo Done. Archives are saved under source-archives\
pause
endlocal
