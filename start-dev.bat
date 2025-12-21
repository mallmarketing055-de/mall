@echo off
echo ===================================
echo   Mall Checkout System - Dev Setup
echo   MongoDB Queue (No Redis Required)
echo ===================================
echo.

echo Checking MongoDB connection...
echo (Assuming MongoDB is running)
echo.

echo Starting services...
echo.

echo [1/2] Starting API server...
start "Mall API" cmd /k "node app.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Background Worker...
start "Checkout Worker" cmd /k "npm run worker"

echo.
echo ===================================
echo   All services started!
echo ===================================
echo.
echo API Server: http://localhost:3000
echo Worker: Processing background jobs from MongoDB
echo.
echo To check job status: node checkJobStatus.js
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
taskkill /FI "WindowTitle eq Mall API*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Checkout Worker*" /T /F >nul 2>&1

echo All services stopped.
echo.
pause
