@echo off
title Configurar Smart Ports
cd /d "%~dp0backend"

if not exist ".env" (
  copy ".env.example" ".env" >nul
)

echo.
echo Se abrira el archivo backend\.env.
echo Busca esta linea:
echo DB_PASSWORD=CAMBIA_AQUI_TU_CLAVE_DE_POSTGRES
echo.
echo Reemplaza el texto por la clave que elegiste al instalar PostgreSQL.
echo Guarda el archivo y cierra Bloc de notas.
echo.
start /wait notepad ".env"

echo.
echo Configuracion guardada.
echo Ahora ejecuta: 2-INICIAR-SMART-PORTS.bat
pause
