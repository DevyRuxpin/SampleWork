#!/bin/bash

echo "🛑 Stopping Phone Scheduler Bot Demo..."
echo "======================================"

# Stop the containers
echo "⏹️  Stopping containers..."
docker-compose -f docker-compose.mock.yml down

# Remove the volume to clean up data
echo "🧹 Cleaning up data..."
docker volume rm pythonbot_mongodb_data 2>/dev/null

echo "✅ Demo stopped successfully!"
echo ""
echo "💡 To start the demo again, run: ./start-demo.sh" 