# 🚂 Railway Deployment Setup Guide

## 📋 **Required Environment Variables**

### **Backend Service Variables**
```bash
# Required
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
FRONTEND_URL=https://your-frontend-url.railway.app
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 🔧 **Railway Setup Steps**

### **Step 1: Create PostgreSQL Database**
1. Go to Railway Dashboard
2. Click "New Service" → "Database" → "PostgreSQL"
3. Note the connection details

### **Step 2: Deploy Backend**
1. Click "New Service" → "GitHub Repo"
2. Select your repository
3. Railway will auto-detect the Dockerfile

### **Step 3: Configure Environment Variables**
1. Go to your backend service settings
2. Add these variables:

```bash
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgresql://postgres:password@host:port/database
```

### **Step 4: Link Database**
1. Go to your backend service
2. Click "Variables" tab
3. Add the `DATABASE_URL` from your PostgreSQL service

## 🚨 **Common Issues & Solutions**

### **Issue 1: Port Mismatch**
- **Problem**: Health check fails
- **Solution**: Use `PORT=5000` environment variable

### **Issue 2: Database Connection**
- **Problem**: "Database initialization failed"
- **Solution**: Set correct `DATABASE_URL`

### **Issue 3: JWT Errors**
- **Problem**: Authentication fails
- **Solution**: Set `JWT_SECRET` environment variable

### **Issue 4: CORS Errors**
- **Problem**: Frontend can't connect
- **Solution**: Set `FRONTEND_URL` environment variable

## 🔍 **Testing Your Deployment**

### **Health Check**
```bash
curl https://your-backend.railway.app/health
```

### **API Info**
```bash
curl https://your-backend.railway.app/api
```

### **Database Test**
```bash
curl https://your-backend.railway.app/api/health
```

## 📊 **Monitoring**

### **Railway Dashboard**
- Check service logs
- Monitor resource usage
- View deployment status

### **Health Checks**
- Automatic health monitoring
- Restart on failure
- Performance metrics

## 🎯 **Next Steps**

1. **Deploy Frontend** (separate service)
2. **Set up Custom Domain**
3. **Configure SSL**
4. **Set up Monitoring**

---

**Need help?** Check Railway logs and ensure all environment variables are set correctly! 