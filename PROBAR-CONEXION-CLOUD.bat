@echo off
title Probar PostgreSQL Cloud
cd /d "%~dp0backend"

if not exist ".env" (
  echo No existe backend\.env
  echo Copia .env.cloud.example como .env y completa DATABASE_URL.
  pause
  exit /b
)

if not exist "node_modules" (
  call npm install
)

call npm run test:cloud
pause
