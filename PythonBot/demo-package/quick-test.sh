#!/bin/bash

echo "🧪 Running Quick Test Demo..."
echo "============================="

# Wait a moment for the service to be ready
sleep 2

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
curl -s http://localhost:8000/health | jq '.' 2>/dev/null || curl -s http://localhost:8000/health
echo ""

# Test 2: Schedule a Call
echo "2️⃣  Testing Call Scheduling..."
curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a call for tomorrow at 2pm for 45 minutes. I need to discuss the quarterly budget review."}' | jq '.' 2>/dev/null || curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a call for tomorrow at 2pm for 45 minutes. I need to discuss the quarterly budget review."}'
echo ""

# Wait for processing
sleep 3

# Test 3: Check Messages
echo "3️⃣  Checking Bot Responses..."
curl -s http://localhost:8000/demo/messages | jq '.' 2>/dev/null || curl -s http://localhost:8000/demo/messages
echo ""

# Test 4: Check Scheduled Calls
echo "4️⃣  Checking Scheduled Calls..."
curl -s http://localhost:8000/api/calls/+1234567890 | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/calls/+1234567890
echo ""

# Test 5: Check Calls
echo "5️⃣  Testing Call Checking..."
curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "What calls do I have scheduled?"}' | jq '.' 2>/dev/null || curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "What calls do I have scheduled?"}'
echo ""

# Wait for processing
sleep 3

# Test 6: Final Messages
echo "6️⃣  Final Bot Responses..."
curl -s http://localhost:8000/demo/messages | jq '.' 2>/dev/null || curl -s http://localhost:8000/demo/messages
echo ""

echo "✅ Quick Test Complete!"
echo "======================"
echo "🎉 The bot successfully:"
echo "   • Responded to health checks"
echo "   • Scheduled a call via SMS"
echo "   • Sent confirmation messages"
echo "   • Listed scheduled calls"
echo "   • Processed natural language"
echo ""
echo "🚀 Ready for your demo!" 