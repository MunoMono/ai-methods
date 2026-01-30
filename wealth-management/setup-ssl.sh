#!/bin/bash

# Setup SSL for wealth-management.innovationdesign.io

set -e

DOMAIN="wealth-management.innovationdesign.io"
EMAIL="graham@innovationdesign.io"

echo "🔐 Setting up SSL certificate for ${DOMAIN}..."

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily
echo "⏸️  Stopping containers..."
cd /root/wealth-management
docker compose -f docker-compose.prod.yml down

# Get certificate
echo "📜 Obtaining SSL certificate..."
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email ${EMAIL} \
    -d ${DOMAIN}

# Restart containers
echo "🔄 Restarting containers..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ SSL certificate installed successfully!"
echo "📅 Certificate will auto-renew via certbot"
