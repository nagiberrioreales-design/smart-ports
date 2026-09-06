@echo off
title Migrar Smart Ports local a Cloud
cd /d "%~dp0backend"

if not exist ".env.migration" (
  copy ".env.migration.example" ".env.migration" >nul
  echo.
  echo Se creo backend\.env.migration
  echo Editalo con tus datos LOCAL y CLOUD.
  echo Cambia CONFIRM_REPLACE_CLOUD=NO por SI solo cuando estes seguro.
  echo.
  start notepad ".env.migration"
  pause
  exit /b
)

call npm run migrate:cloud
pause
