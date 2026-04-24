#!/bin/bash

# AI Strategic Sourcing & Negotiation Platform - Startup Script
# =============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       AI Strategic Sourcing & Negotiation Platform      ║"
echo "║                    Starting Services                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Function to kill processes on ports
cleanup_ports() {
  echo -e "${YELLOW}Cleaning up ports...${NC}"
  for PORT in $BACKEND_PORT $FRONTEND_PORT; do
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
      echo -e "  Killing process on port $PORT (PID: $PID)"
      kill -9 $PID 2>/dev/null || true
      sleep 1
    fi
  done
  echo -e "${GREEN}✓ Ports cleaned${NC}"
}

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  cleanup_ports
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Clean up ports
cleanup_ports

# Check PostgreSQL
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
  fi
fi

# Create database if not exists
echo -e "${BLUE}Setting up database...${NC}"
createdb ${DB_NAME:-strategic_sourcing} 2>/dev/null || echo -e "  Database already exists"
echo -e "${GREEN}✓ Database ready${NC}"

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Run database seed
echo -e "${BLUE}Seeding database...${NC}"
node seeds/seed.js
echo -e "${GREEN}✓ Database seeded${NC}"

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Start backend with nodemon (auto-reload)
echo -e "${BLUE}Starting backend server on port $BACKEND_PORT...${NC}"
cd "$PROJECT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!
sleep 2
echo -e "${GREEN}✓ Backend running (PID: $BACKEND_PID)${NC}"

# Start frontend with auto-reload (built into react-scripts)
echo -e "${BLUE}Starting frontend on port $FRONTEND_PORT...${NC}"
cd "$PROJECT_DIR/frontend"
PORT=$FRONTEND_PORT BROWSER=none npx react-scripts start &
FRONTEND_PID=$!
sleep 3
echo -e "${GREEN}✓ Frontend running (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗"
echo -e "║                   All Services Running!                  ║"
echo -e "╠══════════════════════════════════════════════════════════╣"
echo -e "║  Frontend:  http://localhost:$FRONTEND_PORT                     ║"
echo -e "║  Backend:   http://localhost:$BACKEND_PORT/api/health           ║"
echo -e "║                                                        ║"
echo -e "║  Demo Login:                                           ║"
echo -e "║    Email:    admin@company.com                         ║"
echo -e "║    Password: password123                               ║"
echo -e "║                                                        ║"
echo -e "║  Press Ctrl+C to stop all services                    ║"
echo -e "╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for processes
wait
