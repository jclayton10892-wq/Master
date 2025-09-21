@echo off
cd /d "%~dp0mobile\field-ready-app"
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is required. Install LTS from https://nodejs.org/
  exit /b 1
)
npm install
npm run start
