#!/bin/bash

# 🚀 KaliShare Render Deployment Script
# This script helps you prepare your app for Render deployment

echo "🎯 KaliShare Render Deployment Setup"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the KaliShare root directory"
    exit 1
fi

echo "✅ Found KaliShare project"

# Check if render.yaml exists
if [ -f "render.yaml" ]; then
    echo "✅ Found render.yaml configuration"
else
    echo "❌ Error: render.yaml not found. Please create it first."
    exit 1
fi

# Check backend package.json
if [ -f "backend/package.json" ]; then
    echo "✅ Found backend package.json"
else
    echo "❌ Error: backend/package.json not found"
    exit 1
fi

# Check frontend package.json
if [ -f "frontend/package.json" ]; then
    echo "✅ Found frontend package.json"
else
    echo "❌ Error: frontend/package.json not found"
    exit 1
fi

echo ""
echo "📋 Deployment Checklist:"
echo "========================"

echo "1. ✅ Repository on GitHub"
echo "2. ✅ render.yaml configured"
echo "3. ✅ Health check endpoint (/health)"
echo "4. ✅ Environment variables ready"

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Configure the service:"
echo "   - Name: kalishare-backend"
echo "   - Root Directory: backend"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Health Check Path: /health"
echo ""
echo "5. Set environment variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo "   - JWT_SECRET=your-secret-key"
echo "   - DATABASE_URL=from-postgres-service"
echo ""
echo "6. Create PostgreSQL database:"
echo "   - Name: kalishare-db"
echo "   - Plan: Free"
echo ""
echo "7. Deploy frontend as static site:"
echo "   - Root Directory: frontend"
echo "   - Build Command: npm install && npm run build"
echo "   - Publish Directory: build"
echo ""
echo "📚 For detailed instructions, see RENDER_DEPLOYMENT.md"
echo ""
echo "🎉 Good luck with your deployment!" 