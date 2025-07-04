#!/bin/bash

echo "🧪 Testing KaliShare Authentication Endpoints"
echo "=============================================="

# Test backend health
echo "1. Testing backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:5001/health)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Test signup endpoint directly
echo "2. Testing signup endpoint directly..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}')

if [[ $SIGNUP_RESPONSE == *"token"* ]]; then
    echo "✅ Signup endpoint working"
    echo "   Response: $SIGNUP_RESPONSE"
else
    echo "❌ Signup endpoint failed"
    echo "   Response: $SIGNUP_RESPONSE"
fi

# Test signup through frontend proxy
echo "3. Testing signup through frontend proxy..."
PROXY_SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"test123"}')

if [[ $PROXY_SIGNUP_RESPONSE == *"token"* ]]; then
    echo "✅ Frontend proxy signup working"
    echo "   Response: $PROXY_SIGNUP_RESPONSE"
else
    echo "❌ Frontend proxy signup failed"
    echo "   Response: $PROXY_SIGNUP_RESPONSE"
fi

# Test login endpoint
echo "4. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}')

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    echo "✅ Login endpoint working"
    echo "   Response: $LOGIN_RESPONSE"
else
    echo "❌ Login endpoint failed"
    echo "   Response: $LOGIN_RESPONSE"
fi

echo ""
echo "🎉 Authentication test completed!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5001" 