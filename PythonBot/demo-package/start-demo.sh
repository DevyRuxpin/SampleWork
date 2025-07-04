#!/bin/bash

echo "🤖 Starting Phone Scheduler Bot Demo..."
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose.mock.yml down 2>/dev/null

# Remove old volumes to start fresh
echo "🧹 Cleaning up old data..."
docker volume rm pythonbot_mongodb_data 2>/dev/null

# Start the services
echo "🚀 Starting Phone Scheduler Bot..."
docker-compose -f docker-compose.mock.yml up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if the service is healthy
echo "🔍 Checking service health..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Service is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Service failed to start properly. Check logs with: docker-compose -f docker-compose.mock.yml logs app"
        exit 1
    fi
    echo "⏳ Waiting for service to be ready... ($i/30)"
    sleep 2
done

echo ""
echo "🎉 Phone Scheduler Bot Demo is ready!"
echo "======================================"
echo "🌐 Service URL: http://localhost:8000"
echo "📱 Demo SMS: http://localhost:8000/demo/sms/simulate"
echo "📋 API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Quick Test Commands:"
echo "----------------------"
echo "Health Check:"
echo "  curl http://localhost:8000/health"
echo ""
echo "Schedule a Call:"
echo "  curl -X POST http://localhost:8000/demo/sms/simulate \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"from\": \"+1234567890\", \"body\": \"Schedule a call for tomorrow at 2pm\"}'"
echo ""
echo "View Messages:"
echo "  curl http://localhost:8000/demo/messages"
echo ""
echo "Check Calls:"
echo "  curl http://localhost:8000/api/calls/+1234567890"
echo ""
echo "📖 For more examples, see README.md"
echo ""
echo "🛑 To stop the demo: ./stop-demo.sh"
echo "📊 To view logs: docker-compose -f docker-compose.mock.yml logs app" 