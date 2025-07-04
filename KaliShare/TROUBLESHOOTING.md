# KaliShare Troubleshooting Guide

## Common Issues and Solutions

### 1. "Network error. Please try again." on Signup/Login

**Symptoms:**
- Page loads initially but shows network error when trying to signup or login
- Console shows fetch errors or CORS issues

**Solutions:**
1. **Check if services are running:**
   ```bash
   ./start-services.sh
   ```

2. **Verify backend is healthy:**
   ```bash
   curl http://localhost:5001/health
   ```

3. **Test API endpoints:**
   ```bash
   ./test-auth.sh
   ```

4. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

### 2. Port Conflicts

**Symptoms:**
- Services fail to start
- "Address already in use" errors

**Solutions:**
1. **Stop all services:**
   ```bash
   ./stop-services.sh
   ```

2. **Check what's using the ports:**
   ```bash
   lsof -i :3000 -i :5001
   ```

3. **Kill conflicting processes:**
   ```bash
   pkill -f "node server.js"
   pkill -f "react-scripts start"
   ```

### 3. Database Connection Issues

**Symptoms:**
- Backend fails to start
- "Database initialization failed" errors

**Solutions:**
1. **Check if PostgreSQL is running:**
   ```bash
   brew services list | grep postgres
   ```

2. **Start PostgreSQL if needed:**
   ```bash
   brew services start postgresql@15
   ```

3. **Create database if missing:**
   ```bash
   createdb kalishare
   ```

### 4. Frontend Not Loading

**Symptoms:**
- Browser shows "This site can't be reached"
- Frontend doesn't respond

**Solutions:**
1. **Check if frontend is running:**
   ```bash
   curl -I http://localhost:3000
   ```

2. **Restart frontend:**
   ```bash
   cd frontend && npm start
   ```

3. **Check frontend logs:**
   ```bash
   tail -f frontend.log
   ```

### 5. CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- API calls fail with "Access-Control-Allow-Origin" errors

**Solutions:**
1. **Restart backend with updated CORS config:**
   ```bash
   ./stop-services.sh
   ./start-services.sh
   ```

2. **Check CORS configuration in backend/server.js**

### 6. Authentication Issues

**Symptoms:**
- Login/signup fails
- Users can't stay logged in

**Solutions:**
1. **Test authentication endpoints:**
   ```bash
   ./test-auth.sh
   ```

2. **Check JWT token in localStorage:**
   - Open Developer Tools
   - Go to Application tab
   - Check Local Storage for 'token'

3. **Clear browser data:**
   - Clear localStorage and cookies
   - Try again

## Quick Commands

### Start Everything
```bash
./start-services.sh
```

### Stop Everything
```bash
./stop-services.sh
```

### Test Authentication
```bash
./test-auth.sh
```

### View Logs
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

### Check Service Status
```bash
# Check if processes are running
ps aux | grep -E "(node server.js|react-scripts start)" | grep -v grep

# Check ports
lsof -i :3000 -i :5001
```

## Environment Variables

Make sure your `backend/.env` file contains:
```
DATABASE_URL=postgresql://marcharriman@localhost:5432/kalishare
NODE_ENV=development
PORT=5001
```

## Browser Debugging

1. **Open Developer Tools** (F12)
2. **Check Console** for JavaScript errors
3. **Check Network tab** for failed API requests
4. **Check Application tab** for localStorage issues

## Common Error Messages

- **"User already exists"** - Normal for duplicate signup attempts
- **"Invalid credentials"** - Wrong email/password combination
- **"Network error"** - Check if services are running
- **"CORS error"** - Restart services with updated CORS config 