#!/bin/bash

# Deployment script for innovationdesign.io
# Run on Digital Ocean droplet at 104.248.170.26

set -e

echo "🚀 Starting deployment for innovationdesign.io..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main || echo "Warning: Git pull failed. Using local code."

# Build and start containers
echo "🏗️  Building containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "▶️  Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Show status
echo "✅ Deployment complete!"
echo ""
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 Site should be available at:"
echo "   http://innovationdesign.io"
echo "   http://104.248.170.26"
