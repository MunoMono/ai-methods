#!/bin/bash

# Stop development services

echo "🛑 Stopping development services..."

# Find and kill processes on port 3000 (frontend)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Stopping frontend (port 3000)..."
    kill $(lsof -t -i:3000) 2>/dev/null || true
fi

# Find and kill processes on port 8000 (backend)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Stopping backend (port 8000)..."
    kill $(lsof -t -i:8000) 2>/dev/null || true
fi

echo "✅ Services stopped"
