# Development Server Startup Script
# This script starts both the Django backend and React frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ministry Agri Pulse - Dev Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$BackendPath = "c:\Users\HP\Desktop\Planning-Performance-System\agri_project-main"
$FrontendPath = "c:\Users\HP\Desktop\Planning-Performance-System\ministry-agri-pulse"

# Check if paths exist
if (-not (Test-Path $BackendPath)) {
    Write-Host "ERROR: Backend path not found: $BackendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FrontendPath)) {
    Write-Host "ERROR: Frontend path not found: $FrontendPath" -ForegroundColor Red
    exit 1
}

# Function to check if port is in use
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Check if ports are already in use
Write-Host "Checking ports..." -ForegroundColor Yellow

if (Test-Port 8000) {
    Write-Host "WARNING: Port 8000 is already in use (Backend)" -ForegroundColor Yellow
    $response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($response -ne 'y') {
        exit 0
    }
}

if (Test-Port 8080) {
    Write-Host "WARNING: Port 8080 is already in use (Frontend)" -ForegroundColor Yellow
    $response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($response -ne 'y') {
        exit 0
    }
}

Write-Host ""
Write-Host "Starting Backend Server (Django)..." -ForegroundColor Green
Write-Host "Location: $BackendPath" -ForegroundColor Gray
Write-Host "Port: 8000" -ForegroundColor Gray

# Start Backend in new PowerShell window
$backendScript = @"
Write-Host 'Django Backend Server' -ForegroundColor Cyan
Write-Host '=====================' -ForegroundColor Cyan
Write-Host ''
Set-Location '$BackendPath'
python manage.py runserver 8000
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

Write-Host "Backend server starting..." -ForegroundColor Green
Write-Host ""

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Starting Frontend Server (React + Vite)..." -ForegroundColor Green
Write-Host "Location: $FrontendPath" -ForegroundColor Gray
Write-Host "Port: 8080" -ForegroundColor Gray

# Start Frontend in new PowerShell window
$frontendScript = @"
Write-Host 'React Frontend Server' -ForegroundColor Cyan
Write-Host '=====================' -ForegroundColor Cyan
Write-Host ''
Set-Location '$FrontendPath'
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

Write-Host "Frontend server starting..." -ForegroundColor Green
Write-Host ""

# Wait for frontend to start
Write-Host "Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API:  http://localhost:8000/api/" -ForegroundColor White
Write-Host "Admin Panel:  http://localhost:8000/admin/" -ForegroundColor White
Write-Host "Frontend App: http://localhost:8080/" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow

# Open browser to frontend
Start-Sleep -Seconds 2
Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Development servers are running!" -ForegroundColor Green
Write-Host "Press Ctrl+C in each window to stop." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This window can be closed." -ForegroundColor Gray
Write-Host ""
