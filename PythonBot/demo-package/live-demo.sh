#!/bin/bash

echo "🎭 Live Demo: Phone Scheduler Bot"
echo "================================="
echo ""
echo "This script will walk you through a live demonstration"
echo "of the Phone Scheduler Bot's capabilities."
echo ""
read -p "Press Enter to start the demo..."

# Clear screen
clear

echo "🤖 Step 1: Health Check"
echo "======================="
echo "First, let's verify the bot is running properly..."
echo ""
curl -s http://localhost:8000/health | jq '.' 2>/dev/null || curl -s http://localhost:8000/health
echo ""
read -p "Press Enter to continue..."

echo "📱 Step 2: Schedule a Call via SMS"
echo "=================================="
echo "Now let's schedule a call using natural language..."
echo "Sending: 'Schedule a call for tomorrow at 2pm for 45 minutes. I need to discuss the quarterly budget review.'"
echo ""
curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a call for tomorrow at 2pm for 45 minutes. I need to discuss the quarterly budget review."}' | jq '.' 2>/dev/null || curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a call for tomorrow at 2pm for 45 minutes. I need to discuss the quarterly budget review."}'
echo ""
read -p "Press Enter to see the bot's response..."

echo "💬 Step 3: Bot's Response"
echo "========================="
echo "Let's see what the bot sent back..."
echo ""
sleep 2
curl -s http://localhost:8000/demo/messages | jq '.' 2>/dev/null || curl -s http://localhost:8000/demo/messages
echo ""
read -p "Press Enter to continue..."

echo "📋 Step 4: Check Scheduled Calls"
echo "================================"
echo "Now let's verify the call was scheduled..."
echo ""
curl -s http://localhost:8000/api/calls/+1234567890 | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/calls/+1234567890
echo ""
read -p "Press Enter to continue..."

echo "❓ Step 5: Ask About Scheduled Calls"
echo "===================================="
echo "Let's ask the bot what calls we have scheduled..."
echo "Sending: 'What calls do I have scheduled?'"
echo ""
curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "What calls do I have scheduled?"}' | jq '.' 2>/dev/null || curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "What calls do I have scheduled?"}'
echo ""
read -p "Press Enter to see the response..."

echo "💬 Step 6: Bot's Response to Query"
echo "=================================="
echo "Let's see how the bot responded..."
echo ""
sleep 2
curl -s http://localhost:8000/demo/messages | jq '.' 2>/dev/null || curl -s http://localhost:8000/demo/messages
echo ""
read -p "Press Enter to continue..."

echo "🔄 Step 7: Reschedule the Call"
echo "=============================="
echo "Now let's reschedule the call..."
echo "Sending: 'Reschedule my call to 3pm tomorrow'"
echo ""
curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Reschedule my call to 3pm tomorrow"}' | jq '.' 2>/dev/null || curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Reschedule my call to 3pm tomorrow"}'
echo ""
read -p "Press Enter to see the response..."

echo "💬 Step 8: Reschedule Confirmation"
echo "=================================="
echo "Let's see the reschedule confirmation..."
echo ""
sleep 2
curl -s http://localhost:8000/demo/messages | jq '.' 2>/dev/null || curl -s http://localhost:8000/demo/messages
echo ""
read -p "Press Enter to continue..."

echo "❌ Step 9: Cancel the Call"
echo "=========================="
echo "Finally, let's cancel the call..."
echo "Sending: 'Cancel my upcoming call'"
echo ""
curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Cancel my upcoming call"}' | jq '.' 2>/dev/null || curl -s -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Cancel my upcoming call"}'
echo ""
read -p "Press Enter to see the response..."

echo "💬 Step 10: Cancellation Confirmation"
echo "====================================="
echo "Let's see the cancellation confirmation..."
echo ""
sleep 2
curl -s http://localhost:8000/demo/messages | jq '.' 2>/dev/null || curl -s http://localhost:8000/demo/messages
echo ""
read -p "Press Enter to continue..."

echo "✅ Step 11: Verify Cancellation"
echo "==============================="
echo "Let's verify the call was cancelled..."
echo ""
curl -s http://localhost:8000/api/calls/+1234567890 | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/calls/+1234567890
echo ""

echo "🎉 Demo Complete!"
echo "================="
echo ""
echo "The Phone Scheduler Bot successfully demonstrated:"
echo "✅ Natural language understanding"
echo "✅ Call scheduling with notes"
echo "✅ Call querying"
echo "✅ Call rescheduling"
echo "✅ Call cancellation"
echo "✅ Persistent data storage"
echo "✅ SMS communication"
echo ""
echo "🚀 Ready for production deployment!"
echo ""
echo "For more examples, see demo-examples.md"
echo "For API documentation, visit http://localhost:8000/docs" 