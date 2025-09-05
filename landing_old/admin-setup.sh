#!/bin/bash

echo "=========================================="
echo "  MCMiniBots Tournament Platform"
echo "  Admin Account Setup"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if services are running
if ! docker compose ps | grep "mcminibots-backend" | grep -q "Up"; then
    echo -e "${RED}ERROR: Backend service is not running!${NC}"
    echo "Please run ./start.sh first to start the platform."
    echo
    exit 1
fi

echo -e "${GREEN}✅ Backend service is running${NC}"
echo

echo -e "${BLUE}🔑 Creating admin account...${NC}"
echo "Please follow the prompts to create your admin credentials:"
echo

if ! docker compose exec backend python create_admin.py; then
    echo
    echo -e "${RED}❌ Failed to create admin account!${NC}"
    echo "Please check the error messages and try again."
    exit 1
fi

echo
echo -e "${GREEN}🎉 Admin account created successfully!${NC}"
echo
echo "You can now log in to the admin panel at:"
echo -e "${BLUE}http://localhost:3000/admin${NC}"
echo

# Try to open browser
if command -v xdg-open &> /dev/null; then
    echo "Opening admin login page..."
    sleep 3
    xdg-open http://localhost:3000/login &
elif command -v open &> /dev/null; then
    echo "Opening admin login page..."
    sleep 3
    open http://localhost:3000/login &
else
    echo "Please open your browser and go to: http://localhost:3000/login"
fi

echo
echo -e "${GREEN}Admin setup complete! 🎮${NC}"