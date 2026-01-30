#!/bin/bash

# Quick start script for wealth-management development

cd "$(dirname "$0")"

echo "🚀 Starting Wealth Management development server..."
echo "📍 Location: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✨ Starting Vite dev server on http://localhost:3001"
echo "💡 Press Ctrl+C to stop"
echo ""

npm run dev
