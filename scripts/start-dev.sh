#!/bin/bash

# Development Startup Script for Epistemic Drift Research Platform
# This script starts both frontend and backend in development mode

set -e

echo "🔬 Epistemic Drift Research Platform - Development Mode"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Check if ports are available
echo -e "\n${YELLOW}📡 Checking ports...${NC}"

if check_port 3000; then
    echo -e "${RED}❌ Port 3000 is already in use. Please free it or stop the existing process.${NC}"
    exit 1
fi

if check_port 8000; then
    echo -e "${RED}❌ Port 8000 is already in use. Please free it or stop the existing process.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ports 3000 and 8000 are available${NC}"

# Setup frontend
echo -e "\n${YELLOW}📦 Setting up frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

cd ..

# Setup backend
echo -e "\n${YELLOW}🐍 Setting up backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

if [ ! -f "venv/installed.flag" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
    touch venv/installed.flag
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Create necessary directories
mkdir -p logs/sessions

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from template...${NC}"
    cp .env.template .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration${NC}"
fi

cd ..

# Create log files for output
FRONTEND_LOG="logs/frontend-dev.log"
BACKEND_LOG="logs/backend-dev.log"
mkdir -p logs

# Function to cleanup on exit
cleanup() {
    echo -e "\n\n${YELLOW}🛑 Shutting down services...${NC}"
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "\n${YELLOW}🚀 Starting backend server...${NC}"
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../$BACKEND_LOG 2>&1 &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}✅ Backend starting on http://localhost:8000${NC}"
echo -e "   API Docs: http://localhost:8000/docs"

# Wait a moment for backend to start
sleep 2

# Start frontend
echo -e "\n${YELLOW}🚀 Starting frontend server...${NC}"
cd frontend
npm run dev > ../$FRONTEND_LOG 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✅ Frontend starting on http://localhost:3000${NC}"

# Wait for services to start
echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 3

# Check if services are running
if ! check_port 8000; then
    echo -e "${RED}❌ Backend failed to start. Check logs/backend-dev.log${NC}"
    cleanup
    exit 1
fi

if ! check_port 3000; then
    echo -e "${RED}❌ Frontend failed to start. Check logs/frontend-dev.log${NC}"
    cleanup
    exit 1
fi

echo -e "\n${GREEN}✅ All services running!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Epistemic Drift Research Platform is ready!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Access points:"
echo -e "  ${GREEN}Frontend:${NC}  http://localhost:3000"
echo -e "  ${GREEN}Backend:${NC}   http://localhost:8000"
echo -e "  ${GREEN}API Docs:${NC}  http://localhost:8000/docs"
echo ""
echo "Logs:"
echo -e "  Frontend: tail -f $FRONTEND_LOG"
echo -e "  Backend:  tail -f $BACKEND_LOG"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running and show logs
tail -f $FRONTEND_LOG $BACKEND_LOG
