#!/bin/bash

# Wealth Management Deployment Script
# Deploys to wealth-management.innovationdesign.io

set -e

echo "🚀 Starting Wealth Management deployment..."

# Configuration
DROPLET_IP="104.248.170.26"
DROPLET_USER="root"
REMOTE_DIR="/root/wealth-management"
DOMAIN="wealth-management.innovationdesign.io"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📦 Building and deploying to ${DOMAIN}..."

# Create remote directory
ssh -o StrictHostKeyChecking=no ${DROPLET_USER}@${DROPLET_IP} "mkdir -p ${REMOTE_DIR}"

# Sync files to droplet (excluding node_modules and dist)
echo "📤 Syncing files to droplet..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    "${LOCAL_DIR}/" \
    ${DROPLET_USER}@${DROPLET_IP}:${REMOTE_DIR}/

# SSH into droplet and deploy
ssh -o StrictHostKeyChecking=no ${DROPLET_USER}@${DROPLET_IP} << ENDSSH
    set -e
    cd ${REMOTE_DIR}
    
    echo "🔨 Building and starting containers..."
    docker compose -f docker-compose.prod.yml down
    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d
    
    echo "🧹 Cleaning up old images..."
    docker image prune -f
    
    echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "✅ Wealth Management deployed successfully!"
echo "🌐 Access at: https://${DOMAIN}"
echo ""
