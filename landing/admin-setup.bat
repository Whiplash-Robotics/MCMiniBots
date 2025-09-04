@echo off
echo ==========================================
echo   MCMiniBots Tournament Platform
echo   Admin Account Setup
echo ==========================================
echo.

REM Check if services are running
docker compose ps | findstr "mcminibots-backend" | findstr "Up" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend service is not running!
    echo Please run start.bat first to start the platform.
    echo.
    pause
    exit /b 1
)

echo ✅ Backend service is running
echo.

echo 🔑 Creating admin account...
echo Please follow the prompts to create your admin credentials:
echo.

docker compose exec backend python create_admin.py

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to create admin account!
    echo Please check the error messages and try again.
    pause
    exit /b 1
)

echo.
echo 🎉 Admin account created successfully!
echo.
echo You can now log in to the admin panel at:
echo http://localhost:3000/admin
echo.

echo Opening admin login page...
timeout /t 3 /nobreak > nul
start http://localhost:3000/login

echo.
echo Press any key to exit...
pause > nul