#!/bin/bash

echo "=========================================="
echo "  MCMiniBots Tournament Platform"
echo "  Docker Setup - Linux/macOS"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed!${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not running!${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}ERROR: Docker Compose is not available!${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed and running${NC}"
echo

echo -e "${BLUE}🔧 Starting MCMiniBots Tournament Platform...${NC}"
echo "This may take a few minutes on first run (downloading images)"
echo

# Build and start all services
if ! docker compose up --build -d; then
    echo
    echo -e "${RED}❌ Failed to start services!${NC}"
    echo "Check the error messages above and try again."
    exit 1
fi

echo
echo -e "${GREEN}🎉 MCMiniBots Tournament Platform is starting up!${NC}"
echo
echo "Please wait 30-60 seconds for all services to initialize..."
echo

# Wait for services to start
sleep 30

echo "=========================================="
echo -e "   ${BLUE}🌐 Your platform is now available at:${NC}"
echo "=========================================="
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Admin Panel: http://localhost:3000/admin"
echo "   Token Counter: http://localhost:3000/token-counter"
echo "=========================================="
echo

echo -e "${YELLOW}🔑 To create an admin account, run:${NC}"
echo "   docker compose exec backend python create_admin.py"
echo

echo -e "${YELLOW}📊 To view logs, run:${NC}"
echo "   docker compose logs -f"
echo

echo -e "${YELLOW}🛑 To stop the platform, run:${NC}"
echo "   docker compose down"
echo

# Try to open browser (works on most Linux distros and macOS)
if command -v xdg-open &> /dev/null; then
    echo "Opening browser..."
    sleep 5
    xdg-open http://localhost:3000 &
elif command -v open &> /dev/null; then
    echo "Opening browser..."
    sleep 5
    open http://localhost:3000 &
else
    echo "Please open your browser and go to: http://localhost:3000"
fi

echo
echo -e "${GREEN}Setup complete! Your MCMiniBots Tournament Platform is ready! 🎮${NC}"