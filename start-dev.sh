#!/bin/bash

echo "Starting GRAFCET & GEMMA Editor Development Environment..."
echo

echo "Starting Backend Server..."
cd grafcet-backend
npm run dev &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

echo "Starting Frontend Development Server..."
cd ../grafcet-editor
npm run dev &
FRONTEND_PID=$!

echo
echo "Both servers are starting..."
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5174"
echo
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
