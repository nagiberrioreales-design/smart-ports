@echo off
title Smart Ports v0.6
cd /d "%~dp0backend"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado.
  pause
  exit /b
)

if not exist ".env" (
  echo ERROR: Primero ejecuta 1-CONFIGURAR-POSTGRESQL.bat
  pause
  exit /b
)

if not exist "node_modules" (
  echo Instalando dependencias del backend...
  call npm install
  if errorlevel 1 (
    echo Error durante npm install.
    pause
    exit /b
  )
)

echo Preparando base de datos PostgreSQL...
call npm run setup
if errorlevel 1 (
  echo.
  echo No fue posible preparar PostgreSQL.
  echo Revisa la clave escrita en backend\.env.
  pause
  exit /b
)

echo.
echo Iniciando Smart Ports...
start "Smart Ports Backend" cmd /k "npm start"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"

echo Smart Ports se abrira en http://localhost:3000
echo No cierres la ventana Smart Ports Backend mientras uses el sistema.
timeout /t 3 /nobreak >nul
