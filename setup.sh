#!/bin/bash

echo "========================================"
echo "GRAFCET & GEMMA Editor Setup Script"
echo "========================================"
echo

# Check if Node.js is installed
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

node --version
echo

# Install backend dependencies
echo "Installing Backend Dependencies..."
cd grafcet-backend
if [ ! -d "node_modules" ]; then
    echo "Running npm install for backend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install backend dependencies"
        exit 1
    fi
else
    echo "Backend dependencies already installed"
fi

echo

# Install frontend dependencies
echo "Installing Frontend Dependencies..."
cd ../grafcet-editor
if [ ! -d "node_modules" ]; then
    echo "Running npm install for frontend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "Frontend dependencies already installed"
fi

cd ..

echo
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo
echo "To start development:"
echo "  Windows: start-dev.bat"
echo "  Unix/Linux: ./start-dev.sh"
echo
echo "Frontend will be available at: http://localhost:5174"
echo "Backend API will be available at: http://localhost:3001"
echo

# Make the start script executable
chmod +x start-dev.sh
