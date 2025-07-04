# 🚂 Railway Deployment Guide - KaliShare App (Docker)

## Overview
This guide walks you through deploying your KaliShare app to Railway using Docker Desktop for local development and Railway's cloud platform for production deployment.

## 🎯 **Why Railway + Docker Desktop?**

### **✅ Benefits**
- **Local Development**: Use Docker Desktop for development
- **Cloud Deployment**: Railway handles production Docker builds
- **Easy Setup**: One-click deployment from GitHub
- **Free Tier**: $5/month credit available
- **PostgreSQL**: Built-in database support
- **Custom Domains**: Free SSL certificates

### **✅ Perfect for KaliShare**
- **Docker Support**: Uses your existing docker-compose.yml
- **Multi-Container**: Backend, frontend, and database
- **Real-time Features**: WebSocket support
- **Environment Variables**: Secure configuration

## 📋 **Prerequisites**

1. **Docker Desktop**: Installed and running locally
2. **GitHub Repository**: Your code must be on GitHub
3. **Railway Account**: Sign up at [railway.app](https://railway.app)

## 🚀 **Deployment Steps**

### **Step 1: Prepare Your Repository**

Your repository should have these files:
- `docker-compose.yml` ✅ (already exists)
- `railway.json` ✅ (created)
- `Dockerfile` ✅ (created)
- `backend/` directory ✅
- `frontend/` directory ✅

### **Step 2: Deploy to Railway**

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your KaliShare repository

3. **Railway Auto-Detection**
   - Railway will automatically detect your `docker-compose.yml`
   - It will create services for each container

4. **Configure Services**

#### **Backend Service**
```
Name: kalishare-backend
Port: 5001
Environment Variables:
  - NODE_ENV=production
  - PORT=5001
  - JWT_SECRET=your-super-secret-jwt-key
  - GA_MEASUREMENT_ID=G-XXXXXXXXXX (optional)
```

#### **Frontend Service**
```
Name: kalishare-frontend
Port: 3000
Environment Variables:
  - REACT_APP_API_URL=https://kalishare-backend.railway.app
  - REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX (optional)
```

#### **Database Service**
```
Name: kalishare-db
Type: PostgreSQL
Plan: Free
```

### **Step 3: Set Environment Variables**

1. **Go to each service settings**
2. **Add environment variables**:

#### **Backend Variables**
```bash
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-here
GA_MEASUREMENT_ID=G-XXXXXXXXXX
DATABASE_URL=postgresql://user:password@host:port/database
```

#### **Frontend Variables**
```bash
REACT_APP_API_URL=https://kalishare-backend.railway.app
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Step 4: Deploy**

1. **Railway will automatically build and deploy**
2. **Monitor the build logs**
3. **Wait for deployment to complete**

## 🔧 **Configuration Files**

### **railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "docker-compose up -d",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Dockerfile**
```dockerfile
FROM node:18-alpine as base
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY . .
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci && npm run build
EXPOSE 3000 5001 5432
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1
CMD ["docker-compose", "up", "-d"]
```

## 🌐 **Your URLs**

After deployment, you'll get:
- **Backend API**: `https://kalishare-backend.railway.app`
- **Frontend**: `https://kalishare-frontend.railway.app`
- **Health Check**: `https://kalishare-backend.railway.app/health`

## 🔄 **Local Development with Docker Desktop**

### **Development Workflow**
1. **Local Development**: Use Docker Desktop
   ```bash
   docker-compose up -d
   ```

2. **Testing**: Test locally
   ```bash
   # Frontend: http://localhost:3000
   # Backend: http://localhost:5001
   ```

3. **Deploy**: Push to GitHub
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```

4. **Automatic Deployment**: Railway deploys automatically

## 📊 **Monitoring & Logs**

### **Railway Dashboard**
- **Real-time Logs**: View application logs
- **Metrics**: CPU, memory, response times
- **Deployments**: Build and deployment history
- **Health Checks**: Automatic monitoring

### **Local Monitoring**
- **Docker Desktop**: Container status and logs
- **Health Check**: `curl http://localhost:5001/health`

## 🔒 **Security**

### **Environment Variables**
- **Railway Secrets**: Secure environment variable storage
- **No Local Secrets**: Never commit secrets to Git
- **Automatic Encryption**: Railway encrypts all secrets

### **Database Security**
- **Railway PostgreSQL**: Managed database with backups
- **Connection Security**: SSL connections by default
- **Access Control**: Railway manages database access

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Failures**
   ```bash
   # Check Railway build logs
   # Verify Dockerfile syntax
   # Check for missing files
   ```

2. **Container Startup Issues**
   ```bash
   # Check Railway service logs
   # Verify environment variables
   # Check health check endpoint
   ```

3. **Database Connection Issues**
   ```bash
   # Verify DATABASE_URL format
   # Check database service status
   # Test connection locally first
   ```

### **Debug Steps**

1. **Check Railway Logs**
   - Go to service dashboard
   - Click "Logs" tab
   - Look for error messages

2. **Test Locally First**
   ```bash
   docker-compose up -d
   curl http://localhost:5001/health
   ```

3. **Verify Environment Variables**
   - Check all required variables are set
   - Verify no typos in variable names

## 📈 **Performance**

### **Railway Free Tier**
- **$5/month credit**: Sufficient for development
- **Automatic scaling**: Based on usage
- **Global CDN**: Fast loading worldwide

### **Optimization Tips**
- **Use production builds**: `npm run build`
- **Optimize Docker images**: Multi-stage builds
- **Enable caching**: Leverage Railway's caching

## 🎉 **Deployment Complete!**

### **Your App is Live**
- **Frontend**: `https://kalishare-frontend.railway.app`
- **Backend**: `https://kalishare-backend.railway.app`
- **Database**: Managed PostgreSQL

### **Next Steps**
1. **Test all features**: Verify everything works
2. **Set up monitoring**: Configure alerts
3. **Add custom domain**: Point your domain to Railway
4. **Monitor usage**: Track performance and costs

## 📞 **Support**

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Community Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Status Page**: [status.railway.app](https://status.railway.app)

---

**🎯 Your KaliShare app is now live on Railway with Docker!** 🚂 