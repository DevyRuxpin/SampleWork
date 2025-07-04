#!/bin/bash

# Phone Scheduler Bot - Mock Demo Script
# This script starts the demo without requiring any API keys

set -e

echo "🚀 Phone Scheduler Bot - Mock Demo Setup"
echo "========================================"
echo "📝 No API keys required - using mock services"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose.mock.yml down 2>/dev/null || true

# Build and start the application
echo "🔨 Building and starting the mock application..."
docker-compose -f docker-compose.mock.yml up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."

# Wait for the application to be ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Application is ready!"
        break
    fi
    echo "⏳ Waiting for application to start... (attempt $((attempt + 1))/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Application failed to start within expected time"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.mock.yml logs app
    exit 1
fi

# Display health status
echo ""
echo "🏥 Health Check:"
curl -s http://localhost:8000/health | python3 -m json.tool

echo ""
echo "🎉 Mock Demo is ready!"
echo "====================="
echo ""
echo "📱 Application URLs:"
echo "   • Main App: http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo "   • Health Check: http://localhost:8000/health"
echo "   • Demo SMS: http://localhost:8000/demo/sms"
echo "   • View Messages: http://localhost:8000/demo/messages"
echo ""
echo "📋 Demo Test Commands:"
echo ""
echo "1. Test SMS Simulation:"
echo "   curl -X POST http://localhost:8000/demo/sms/simulate \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"from\": \"+1234567890\", \"body\": \"Schedule a call for tomorrow at 2pm\"}'"
echo ""
echo "2. View Sent Messages:"
echo "   curl http://localhost:8000/demo/messages"
echo ""
echo "3. Test REST API:"
echo "   curl http://localhost:8000/api/calls/+1234567890"
echo ""
echo "4. View Logs:"
echo "   docker-compose -f docker-compose.mock.yml logs -f"
echo ""
echo "5. Stop Demo:"
echo "   docker-compose -f docker-compose.mock.yml down"
echo ""
echo "📖 Demo Scenarios to Try:"
echo "   • \"Schedule a call for tomorrow at 2pm\""
echo "   • \"What calls do I have scheduled?\""
echo "   • \"Cancel my upcoming call\""
echo "   • \"Reschedule my call to 3pm tomorrow\""
echo ""
echo "🚀 Happy demoing!" 