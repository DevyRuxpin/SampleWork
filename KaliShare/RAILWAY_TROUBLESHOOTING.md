# Railway Deployment Troubleshooting Guide

## Issue: "Network error. Please try again." on Login/Signup

### Problem Description
When deployed on Railway, the frontend shows "Network error. Please try again." when trying to login or signup, even though the page loads initially.

### Root Cause
The frontend is trying to make API calls to relative URLs (e.g., `/api/auth/login`) which work locally due to the proxy configuration, but fail on Railway because:
1. Frontend and backend are separate services
2. Proxy only works in development, not in production builds
3. Frontend needs to call the backend's full URL

### Solution Steps

#### 1. Check Your Railway Service URLs
1. Go to your Railway dashboard
2. Note the URLs for both services:
   - Backend: `https://your-backend-service.railway.app`
   - Frontend: `https://your-frontend-service.railway.app`

#### 2. Set Frontend Environment Variable
In your Railway frontend service:
1. Go to Settings → Variables
2. Add this environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-service.railway.app
   ```
   Replace `your-backend-service` with your actual backend service name.

#### 3. Set Backend Environment Variable
In your Railway backend service:
1. Go to Settings → Variables
2. Add this environment variable:
   ```
   FRONTEND_URL=https://your-frontend-service.railway.app
   ```
   Replace `your-frontend-service` with your actual frontend service name.

#### 4. Redeploy Your Services
1. Push the updated code to GitHub
2. Railway will automatically redeploy
3. Or manually trigger a redeploy from the Railway dashboard

### Verification Steps

#### 1. Test Backend Health
```bash
curl https://your-backend-service.railway.app/health
```
Should return: `{"status":"healthy",...}`

#### 2. Test API Endpoint
```bash
curl -X POST https://your-backend-service.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```
Should return a user object with a token.

#### 3. Check Frontend Console
1. Open your frontend URL in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try to login/signup
5. Look for console logs showing the API endpoint being used

### Common Issues and Fixes

#### Issue 1: CORS Errors
**Symptoms**: Browser console shows CORS errors
**Fix**: Ensure backend has proper CORS configuration:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
```

#### Issue 2: Wrong Backend URL
**Symptoms**: Network errors or 404s
**Fix**: Double-check the `REACT_APP_API_URL` environment variable

#### Issue 3: Environment Variables Not Set
**Symptoms**: Frontend still uses relative URLs
**Fix**: Ensure environment variables are set in Railway dashboard

#### Issue 4: Database Connection Issues
**Symptoms**: Backend health check fails
**Fix**: Check `DATABASE_URL` environment variable in backend service

### Debugging Commands

#### Check Service Status
```bash
# Backend health
curl https://your-backend-service.railway.app/health

# API info
curl https://your-backend-service.railway.app/api
```

#### Test Authentication
```bash
# Signup
curl -X POST https://your-backend-service.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Login
curl -X POST https://your-backend-service.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Environment Variables Checklist

#### Frontend Service
- [ ] `REACT_APP_API_URL=https://your-backend-service.railway.app`
- [ ] `NODE_ENV=production`

#### Backend Service
- [ ] `DATABASE_URL=postgresql://...`
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `JWT_SECRET=your-secret-key`
- [ ] `FRONTEND_URL=https://your-frontend-service.railway.app`

### Quick Fix Script
If you need to quickly test the fix:

1. **Update environment variables in Railway dashboard**
2. **Redeploy services**
3. **Test the endpoints above**
4. **Check browser console for any remaining errors**

### Still Having Issues?

1. **Check Railway logs** in the dashboard
2. **Verify all environment variables** are set correctly
3. **Test API endpoints directly** using curl
4. **Check browser network tab** for failed requests
5. **Ensure services are healthy** in Railway dashboard 