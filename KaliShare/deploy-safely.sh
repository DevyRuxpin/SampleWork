#!/bin/bash

# 🚀 Safe Railway Deployment Script
# This script deploys to Railway using GitHub integration (no CLI)

echo "🚀 Safe Railway Deployment - Using GitHub Integration"
echo "======================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the KaliShare root directory"
    exit 1
fi

echo "✅ Found KaliShare project"

# Check git status
if ! git status --porcelain | grep -q .; then
    echo "✅ Working directory is clean"
else
    echo "⚠️  Working directory has uncommitted changes"
    echo "📝 Changes found:"
    git status --short
    
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Committing changes..."
        git add .
        read -p "Enter commit message: " commit_message
        git commit -m "${commit_message:-Update for Railway deployment}"
    else
        echo "❌ Please commit or stash your changes before deploying"
        exit 1
    fi
fi

# Check if we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  You're on branch '$current_branch', not 'main'"
    read -p "Do you want to switch to main branch? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
    else
        echo "❌ Please switch to main branch before deploying"
        exit 1
    fi
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
if git push origin main; then
    echo "✅ Successfully pushed to GitHub"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi

echo ""
echo "🎉 Deployment initiated!"
echo "========================"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://railway.app"
echo "2. Select your KaliShare project"
echo "3. Railway will automatically deploy from GitHub"
echo "4. Monitor the deployment in the dashboard"
echo ""
echo "🔧 Environment Variables to Set:"
echo "Frontend Service:"
echo "  - REACT_APP_API_URL=https://your-backend-service.railway.app"
echo ""
echo "Backend Service:"
echo "  - DATABASE_URL=postgresql://..."
echo "  - NODE_ENV=production"
echo "  - PORT=5000"
echo "  - JWT_SECRET=your-secret-key"
echo "  - FRONTEND_URL=https://your-frontend-service.railway.app"
echo ""
echo "📊 Monitor Deployment:"
echo "- Check Railway dashboard for build logs"
echo "- Verify services are healthy"
echo "- Test your application URLs"
echo ""
echo "🚨 If you encounter issues:"
echo "- Check Railway status: https://status.railway.app"
echo "- Review deployment logs in Railway dashboard"
echo "- Verify environment variables are set correctly"
echo ""
echo "✅ This method is much safer than using 'railway up'"
echo "   No terminal locking issues!" 