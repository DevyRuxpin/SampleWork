#!/bin/bash

echo "🛑 Stopping KaliShare Services..."

# Stop backend
echo "🔧 Stopping backend server..."
pkill -f "node server.js" 2>/dev/null

# Stop frontend
echo "🎨 Stopping frontend..."
pkill -f "react-scripts start" 2>/dev/null

# Wait a moment for processes to stop
sleep 2

# Check if processes are still running
if pgrep -f "node server.js" > /dev/null; then
    echo "⚠️  Backend is still running. You may need to stop it manually."
else
    echo "✅ Backend stopped successfully."
fi

if pgrep -f "react-scripts start" > /dev/null; then
    echo "⚠️  Frontend is still running. You may need to stop it manually."
else
    echo "✅ Frontend stopped successfully."
fi

echo "🎉 All services stopped!" 