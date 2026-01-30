# Wealth Management - Quick Deployment Guide

## 🎯 What You Have

A fully independent React + Vite + Carbon 11 app ready to deploy to **wealth-management.innovationdesign.io**

## 🚀 Local Development (DONE ✅)

The app is running at: **http://localhost:3001**

```bash
cd wealth-management
npm run dev
```

## 📦 Project Features

- ✅ IBM Carbon Design System v11
- ✅ Vite 5 build system
- ✅ React 18 + React Router
- ✅ SCSS with Carbon tokens
- ✅ Dark/Light theme toggle
- ✅ Responsive Carbon Grid
- ✅ Production Docker setup
- ✅ SSL-ready nginx config
- ✅ Completely independent from parent project

## 🌐 Deploy to Production

### Step 1: Set up DNS
Add A record for `wealth-management.innovationdesign.io` → `104.248.170.26`

### Step 2: Deploy to droplet

```bash
cd wealth-management
./deploy.sh
```

This script will:
- SSH into your droplet (104.248.170.26)
- Clone/pull the repo
- Build Docker container
- Start on ports 3001 (HTTP) and 4431 (HTTPS)

### Step 3: Set up SSL certificate

SSH into droplet and run:
```bash
cd /root/wealth-management
chmod +x setup-ssl.sh
./setup-ssl.sh
```

This will:
- Install certbot
- Get SSL certificate from Let's Encrypt
- Configure auto-renewal
- Restart containers with SSL

## 🐳 Container Info

- **Container name**: `wealth-management-frontend`
- **HTTP Port**: 3001
- **HTTPS Port**: 4431
- **Domain**: wealth-management.innovationdesign.io
- **Network**: `wealth-management-network` (isolated from parent)

## 📁 Build for Production

```bash
npm run build
```

Outputs to `dist/` directory

## 🎨 Customization

The app uses the same UI patterns as the parent:
- Header with Carbon components
- Page layouts with Carbon Grid
- SCSS styling with Carbon tokens
- Theme switching (g100 dark / white light)

Start building your wealth management features in:
- `src/pages/` - Add new pages
- `src/components/` - Add new components
- `src/styles/` - Add custom styles

## 🔧 Useful Commands

```bash
npm run dev      # Start dev server (port 3001)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 📝 Next Steps

1. ✅ Local development is ready
2. ⏳ Deploy to droplet
3. ⏳ Set up SSL
4. ⏳ Start building your wealth management features!
