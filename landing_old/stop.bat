@echo off
echo ==========================================
echo   MCMiniBots Tournament Platform
echo   Stopping Services
echo ==========================================
echo.

echo 🛑 Stopping MCMiniBots Tournament Platform...

docker compose down

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to stop services!
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ All services have been stopped.
echo.

echo To remove all data (database, uploads), run:
echo    docker compose down -v
echo.

echo Press any key to exit...
pause > nul