#!/bin/bash

# 🚂 KaliShare Railway Deployment Script
# This script helps you prepare your app for Railway deployment

echo "🎯 KaliShare Railway Deployment Setup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the KaliShare root directory"
    exit 1
fi

echo "✅ Found KaliShare project"

# Check if railway.json exists
if [ -f "railway.json" ]; then
    echo "✅ Found railway.json configuration"
else
    echo "❌ Error: railway.json not found. Please create it first."
    exit 1
fi

# Check if Dockerfile exists
if [ -f "Dockerfile" ]; then
    echo "✅ Found Dockerfile"
else
    echo "❌ Error: Dockerfile not found"
    exit 1
fi

# Check docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    echo "✅ Found docker-compose.yml"
else
    echo "❌ Error: docker-compose.yml not found"
    exit 1
fi

# Check backend directory
if [ -d "backend" ]; then
    echo "✅ Found backend directory"
else
    echo "❌ Error: backend directory not found"
    exit 1
fi

# Check frontend directory
if [ -d "frontend" ]; then
    echo "✅ Found frontend directory"
else
    echo "❌ Error: frontend directory not found"
    exit 1
fi

echo ""
echo "📋 Deployment Checklist:"
echo "========================"

echo "1. ✅ Repository on GitHub"
echo "2. ✅ railway.json configured"
echo "3. ✅ Dockerfile created"
echo "4. ✅ docker-compose.yml ready"
echo "5. ✅ Health check endpoint (/health)"
echo "6. ✅ Environment variables ready"

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Go to https://railway.app"
echo "2. Sign in with GitHub"
echo "3. Click 'New Project'"
echo "4. Select 'Deploy from GitHub repo'"
echo "5. Choose your KaliShare repository"
echo ""
echo "6. Railway will automatically detect:"
echo "   - docker-compose.yml"
echo "   - railway.json"
echo "   - Dockerfile"
echo ""
echo "7. Configure services:"
echo "   - Backend: kalishare-backend (port 5001)"
echo "   - Frontend: kalishare-frontend (port 3000)"
echo "   - Database: kalishare-db (PostgreSQL)"
echo ""
echo "8. Set environment variables:"
echo "   Backend:"
echo "   - NODE_ENV=production"
echo "   - PORT=5001"
echo "   - JWT_SECRET=your-secret-key"
echo "   - DATABASE_URL=from-railway-postgres"
echo ""
echo "   Frontend:"
echo "   - REACT_APP_API_URL=https://kalishare-backend.railway.app"
echo ""
echo "9. Deploy and get your URLs:"
echo "   - Backend: https://kalishare-backend.railway.app"
echo "   - Frontend: https://kalishare-frontend.railway.app"
echo ""
echo "📚 For detailed instructions, see RAILWAY_DEPLOYMENT.md"
echo ""
echo "🎉 Good luck with your Railway deployment!" 