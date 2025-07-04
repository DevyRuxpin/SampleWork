#!/bin/bash

# Phone Scheduler Bot - Demo Start Script
# This script helps you quickly set up and start the demo

set -e

echo "🚀 Phone Scheduler Bot - Demo Setup"
echo "=================================="

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

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before continuing."
    echo "   Required: OPENAI_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
    echo ""
    echo "Press Enter when you've updated the .env file..."
    read -r
fi

# Check if required environment variables are set
source .env

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    echo "❌ OPENAI_API_KEY not set in .env file"
    exit 1
fi

if [ -z "$TWILIO_ACCOUNT_SID" ] || [ "$TWILIO_ACCOUNT_SID" = "your_twilio_account_sid_here" ]; then
    echo "❌ TWILIO_ACCOUNT_SID not set in .env file"
    exit 1
fi

if [ -z "$TWILIO_AUTH_TOKEN" ] || [ "$TWILIO_AUTH_TOKEN" = "your_twilio_auth_token_here" ]; then
    echo "❌ TWILIO_AUTH_TOKEN not set in .env file"
    exit 1
fi

if [ -z "$TWILIO_PHONE_NUMBER" ] || [ "$TWILIO_PHONE_NUMBER" = "+1234567890" ]; then
    echo "❌ TWILIO_PHONE_NUMBER not set in .env file"
    exit 1
fi

echo "✅ Environment variables configured"

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up --build -d

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
    docker-compose logs app
    exit 1
fi

# Display health status
echo ""
echo "🏥 Health Check:"
curl -s http://localhost:8000/health | python3 -m json.tool

echo ""
echo "🎉 Demo is ready!"
echo "=================="
echo ""
echo "📱 Application URLs:"
echo "   • Main App: http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo "   • Health Check: http://localhost:8000/health"
echo ""
echo "📋 Quick Test Commands:"
echo "   • Test API: curl http://localhost:8000/api/calls/+1234567890"
echo "   • View Logs: docker-compose logs -f"
echo "   • Stop Demo: docker-compose down"
echo ""
echo "📖 For SMS testing setup, see demo-setup.md"
echo ""
echo "🚀 Happy demoing!" 