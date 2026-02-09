@echo off
echo Starting GRAFCET & GEMMA Editor Development Environment...
echo.

echo Starting Backend Server...
start "GRAFCET Backend" cmd /k "cd grafcet-backend && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Development Server...
start "GRAFCET Frontend" cmd /k "cd grafcet-editor && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5174
echo.
echo Press any key to exit...
pause > nul
