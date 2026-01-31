#!/bin/bash

# Secure firewall configuration for production server
# Only allow necessary ports: SSH, HTTP, HTTPS

set -e

echo "🔥 Configuring UFW firewall..."

# Enable UFW
echo "y" | ufw enable

# Default policies: deny incoming, allow outgoing
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (port 22) - CRITICAL: don't lock yourself out
ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS (ports 80, 443)
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Deny all other ports explicitly (including database ports)
ufw deny 5432/tcp comment 'Block PostgreSQL'
ufw deny 8000/tcp comment 'Block direct backend access'
ufw deny 9000/tcp comment 'Block MinIO (should use nginx proxy if needed)'

# Reload firewall
ufw reload

echo "✅ Firewall configured!"
echo ""
echo "📊 Current firewall status:"
ufw status verbose
