@echo off
echo ==========================================
echo   MCMiniBots Tournament Platform
echo   Docker Setup - Windows
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available!
    echo Please update to a newer version of Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker is installed and running
echo.

echo 🔧 Starting MCMiniBots Tournament Platform...
echo This may take a few minutes on first run (downloading images)
echo.

REM Build and start all services
docker compose up --build -d

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start services!
    echo Check the error messages above and try again.
    pause
    exit /b 1
)

echo.
echo 🎉 MCMiniBots Tournament Platform is starting up!
echo.
echo Please wait 30-60 seconds for all services to initialize...
echo.

REM Wait for services to start
timeout /t 30 /nobreak > nul

echo ========================================== 
echo   🌐 Your platform is now available at:
echo ========================================== 
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000  
echo   Admin Panel: http://localhost:3000/admin
echo   Token Counter: http://localhost:3000/token-counter
echo ========================================== 
echo.

echo 🔑 To create an admin account, run:
echo    docker compose exec backend python create_admin.py
echo.

echo 📊 To view logs, run:
echo    docker compose logs -f
echo.

echo 🛑 To stop the platform, run:
echo    docker compose down
echo.

echo Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo.
echo Press any key to exit this window...
pause > nul