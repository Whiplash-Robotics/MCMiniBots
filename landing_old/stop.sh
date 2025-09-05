#!/bin/bash

echo "=========================================="
echo "  MCMiniBots Tournament Platform"
echo "  Stopping Services"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping MCMiniBots Tournament Platform...${NC}"

if ! docker compose down; then
    echo
    echo -e "${RED}❌ Failed to stop services!${NC}"
    echo "Check the error messages above."
    exit 1
fi

echo
echo -e "${GREEN}✅ All services have been stopped.${NC}"
echo

echo -e "${YELLOW}To remove all data (database, uploads), run:${NC}"
echo "   docker compose down -v"
echo

echo -e "${GREEN}Platform stopped successfully! 🎮${NC}"