#!/bin/bash

# Palmer Living Reality - Full Stack Startup Script
# This script starts both the backend and frontend servers

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🏠 Palmer Living Reality - Full Stack${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is required but not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Setup backend
echo ""
echo -e "${YELLOW}🔧 Setting up backend...${NC}"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate

# Install backend dependencies if needed
echo "Installing backend dependencies..."
pip install -q -r server/requirements.txt 2>/dev/null || echo "Dependencies may already be installed"

# Initialize database
echo ""
echo -e "${YELLOW}📊 Setting up database...${NC}"
cd server
python setup_db.py
cd ..

# Seed demo data (optional)
echo ""
echo -e "${YELLOW}🌱 Seeding demo data...${NC}"
cd server
python seed.py 2>/dev/null || echo "Demo data already exists or seeding failed"
cd ..

# Setup frontend
echo ""
echo -e "${YELLOW}🔧 Setting up frontend...${NC}"

cd client
echo "Installing frontend dependencies..."
npm install 2>/dev/null || echo "Dependencies may already be installed"
cd ..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""

# Kill any existing servers on our ports
echo -e "${YELLOW}🧹 Cleaning up existing servers...${NC}"
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Start backend server in background
echo ""
echo -e "${YELLOW}🚀 Starting backend server on port 5555...${NC}"
source venv/bin/activate
nohup python -m server.main > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend server failed to start. Check backend.log for details.${NC}"
    exit 1
fi

# Start frontend server
echo ""
echo -e "${YELLOW}🚀 Starting frontend server on port 5173...${NC}"
cd client
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "Waiting for frontend to initialize..."
sleep 5

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start. Check frontend.log for details.${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 All servers are running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "  🌐  Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "  🔌  Backend API: ${GREEN}http://localhost:5555${NC}"
echo ""
echo -e "${YELLOW}📝 Demo Accounts:${NC}"
echo ""
echo -e "  👤  Admin:  ${GREEN}admin / admin123${NC}"
echo -e "  🏢  Owner:  ${GREEN}owner / owner123${NC}"
echo -e "  👥  Tenant: ${GREEN}tenant / tenant123${NC}  (requires admin verification)"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "To stop the servers, run: ${YELLOW}pkill -f 'python.*main.py\|vite'${NC}"
echo -e "${BLUE}========================================${NC}"

# Save PIDs for later use
echo "$BACKEND_PID $FRONTEND_PID" > .server_pids

# Tail logs in real-time (optional)
echo ""
echo -e "${YELLOW}📜 Server logs (Ctrl+C to exit tail, servers will keep running):${NC}"
echo ""
tail -f backend.log frontend.log 2>/dev/null || true

