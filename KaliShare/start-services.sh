#!/bin/bash

echo "🚀 Starting KaliShare Services..."

# Kill any existing processes on the ports
echo "🔄 Stopping any existing services..."
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

# Start backend
echo "🔧 Starting backend server..."
cd backend
node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5001"
else
    echo "❌ Backend failed to start. Check backend.log for details."
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 15

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend failed to start. Check frontend.log for details."
    exit 1
fi

echo ""
echo "🎉 KaliShare is now running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5001"
echo "📊 Health:   http://localhost:5001/health"
echo ""
echo "To stop the services, run: pkill -f 'node server.js' && pkill -f 'react-scripts start'"
echo "To view logs: tail -f backend.log or tail -f frontend.log" 