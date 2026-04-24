#!/bin/bash

# ============================================================
# AI Music Generation - Start Script
# Cleans ports, seeds database, starts backend & frontend
# with hot-reload for both server and client
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   🎵 AI Music Generation Platform 🎵     ║${NC}"
echo -e "${PURPLE}║   Composition • Remixing • Sound Design  ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓${NC} Loaded .env configuration"
else
  echo -e "${RED}✗ .env file not found! Creating default...${NC}"
  cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_music_generation
DB_USER=postgres
DB_PASSWORD=postgres
SERVER_PORT=3001
CLIENT_PORT=3000
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
JWT_SECRET=ai-music-gen-secret-key-2024
EOF
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓${NC} Created default .env file"
fi

SERVER_PORT=${SERVER_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-3000}

# ---- Step 1: Clean used ports ----
echo ""
echo -e "${CYAN}[1/6] Cleaning ports ${SERVER_PORT} and ${CLIENT_PORT}...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}  ✓ Port $port cleared${NC}"
  else
    echo -e "${GREEN}  ✓ Port $port is free${NC}"
  fi
}

cleanup_port $SERVER_PORT
cleanup_port $CLIENT_PORT

# ---- Step 2: Install dependencies ----
echo ""
echo -e "${CYAN}[2/6] Installing dependencies...${NC}"

cd "$SCRIPT_DIR/server"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo -e "${YELLOW}  Installing server dependencies...${NC}"
  npm install --silent 2>&1 | tail -1
  echo -e "${GREEN}  ✓ Server dependencies installed${NC}"
else
  echo -e "${GREEN}  ✓ Server dependencies up to date${NC}"
fi

cd "$SCRIPT_DIR/client"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo -e "${YELLOW}  Installing client dependencies...${NC}"
  npm install --silent 2>&1 | tail -1
  echo -e "${GREEN}  ✓ Client dependencies installed${NC}"
else
  echo -e "${GREEN}  ✓ Client dependencies up to date${NC}"
fi

cd "$SCRIPT_DIR"

# ---- Step 3: Setup PostgreSQL database ----
echo ""
echo -e "${CYAN}[3/6] Setting up PostgreSQL database...${NC}"

DB_NAME=${DB_NAME:-ai_music_generation}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT -q 2>/dev/null; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  if command -v brew &>/dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  fi
  sleep 2
fi

# Create database if it doesn't exist
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo -e "${GREEN}  ✓ Database '$DB_NAME' exists${NC}"
else
  echo -e "${YELLOW}  Creating database '$DB_NAME'...${NC}"
  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null
  echo -e "${GREEN}  ✓ Database created${NC}"
fi

# ---- Step 4: Seed database ----
echo ""
echo -e "${CYAN}[4/6] Seeding database with sample data (15 items per feature)...${NC}"

cd "$SCRIPT_DIR/server"
node seed.js 2>&1 | while IFS= read -r line; do
  echo -e "  $line"
done

# ---- Step 5: Start backend with hot-reload ----
echo ""
echo -e "${CYAN}[5/6] Starting backend server on port ${SERVER_PORT} (with nodemon)...${NC}"

cd "$SCRIPT_DIR/server"
npx nodemon --watch . --ext js,json --ignore node_modules index.js &
SERVER_PID=$!
echo -e "${GREEN}  ✓ Backend server starting (PID: $SERVER_PID)${NC}"

sleep 2

# ---- Step 6: Start frontend with hot-reload ----
echo ""
echo -e "${CYAN}[6/6] Starting frontend on port ${CLIENT_PORT} (with hot-reload)...${NC}"

cd "$SCRIPT_DIR/client"
BROWSER=none PORT=$CLIENT_PORT npm start &
CLIENT_PID=$!
echo -e "${GREEN}  ✓ Frontend starting (PID: $CLIENT_PID)${NC}"

# ---- Ready! ----
echo ""
echo -e "${PURPLE}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎵 AI Music Generation is starting!${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:${CLIENT_PORT}"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:${SERVER_PORT}"
echo -e "  ${CYAN}API Health:${NC} http://localhost:${SERVER_PORT}/api/health"
echo ""
echo -e "  ${YELLOW}Login:${NC} admin@aimusic.com / password123"
echo ""
echo -e "  ${YELLOW}Hot-reload is active:${NC}"
echo -e "    • Server: nodemon watches for .js changes"
echo -e "    • Client: React dev server watches for changes"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services"
echo -e "${PURPLE}══════════════════════════════════════════${NC}"
echo ""

# Trap to cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $SERVER_PID 2>/dev/null || true
  kill $CLIENT_PID 2>/dev/null || true
  cleanup_port $SERVER_PORT
  cleanup_port $CLIENT_PORT
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
