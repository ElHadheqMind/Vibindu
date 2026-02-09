@echo off
echo ========================================
echo GRAFCET & GEMMA Editor Setup Script
echo ========================================
echo.

echo Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Installing Backend Dependencies...
cd grafcet-backend
if not exist "node_modules" (
    echo Running npm install for backend...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed
)

echo.
echo Installing Frontend Dependencies...
cd ..\grafcet-editor
if not exist "node_modules" (
    echo Running npm install for frontend...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)

cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start development:
echo   Windows: start-dev.bat
echo   Unix/Linux: ./start-dev.sh
echo.
echo Frontend will be available at: http://localhost:5174
echo Backend API will be available at: http://localhost:3001
echo.
pause
