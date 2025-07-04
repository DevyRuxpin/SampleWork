# 🎨 Railway Frontend Deployment Guide

## 🚀 **Create Frontend Service on Railway**

### **Step 1: Create New Service**
1. Go to your Railway project dashboard
2. Click **"New Service"**
3. Select **"GitHub Repo"**
4. Choose your repository: `DevyRuxpin/Kali-Skill-Share-App`

### **Step 2: Configure Service**
1. **Service Name**: `kalishare-frontend`
2. **Branch**: `main`
3. **Root Directory**: Leave blank (uses root)
4. **Railway will auto-detect**: `railway-frontend.json`

### **Step 3: Set Environment Variables**
Go to the **"Variables"** tab and add:

```bash
# Required
REACT_APP_API_URL=https://kalishare-backend-production.up.railway.app
PORT=3000

# Optional
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Step 4: Deploy**
1. Railway will automatically start building
2. Monitor the build logs
3. Wait for deployment to complete

## 🔧 **Configuration Files**

### **Dockerfile.frontend**
```dockerfile
FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:3000 || exit 1
CMD ["serve", "-s", "build", "-l", "3000"]
```

### **railway-frontend.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.frontend"
  },
  "deploy": {
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🌐 **Your URLs**

After deployment, you'll get:
- **Frontend**: `https://kalishare-frontend-production.up.railway.app`
- **Backend**: `https://kalishare-backend-production.up.railway.app`

## 🔗 **Connect Frontend to Backend**

The frontend will automatically connect to your backend via the `REACT_APP_API_URL` environment variable.

## 🧪 **Testing**

1. **Visit your frontend URL**
2. **Test navigation** - Home, Timeline, Search, Contact
3. **Test authentication** - Signup/Login
4. **Test real-time features** - Posts and comments
5. **Test search functionality**

## 🚨 **Troubleshooting**

### **Build Failures**
- Check that `frontend/package.json` exists
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### **API Connection Issues**
- Verify `REACT_APP_API_URL` is set correctly
- Check that backend is running and accessible
- Test backend health endpoint

### **Runtime Errors**
- Check browser console for JavaScript errors
- Verify environment variables are loaded
- Check Railway service logs

## 📊 **Monitoring**

### **Railway Dashboard**
- Monitor frontend service health
- Check resource usage
- View deployment logs

### **Health Checks**
- Automatic health monitoring
- Restart on failure
- Performance metrics

## 🎯 **Next Steps**

1. **Test all features** thoroughly
2. **Set up custom domain** (optional)
3. **Configure SSL** (automatic with Railway)
4. **Set up monitoring** and alerts

---

**🎉 Your full-stack app will be live on Railway!** 