# 📱 Demo Examples

Here are various examples you can try to demonstrate the bot's capabilities:

## 🎯 Basic Scheduling

### Simple Call
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a call for tomorrow at 2pm"}'
```

### Call with Duration
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Book a 60-minute meeting for Friday at 10am"}'
```

### Call with Notes
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a call for next Tuesday at 3pm. Topic: Q4 planning discussion"}'
```

## 📅 Date Variations

### Specific Date
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Can you schedule a meeting for July 15th at 2pm?"}'
```

### Relative Dates
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Book a call for next Monday at 9am"}'
```

### Today
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "I need an urgent call today at 4pm"}'
```

## 🔄 Management Commands

### Check Scheduled Calls
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "What calls do I have scheduled?"}'
```

### Reschedule
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Reschedule my call to 3pm tomorrow"}'
```

### Cancel
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Cancel my upcoming call"}'
```

## 💼 Business Scenarios

### Client Meeting
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a client meeting for Wednesday at 11am. Duration: 1 hour. Topic: Project kickoff"}'
```

### Team Standup
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Book our daily standup for tomorrow at 9am"}'
```

### Interview
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a job interview for Friday at 2pm. 45 minutes should be enough"}'
```

## 🚨 Urgent Scenarios

### Emergency Call
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "URGENT: Need a call today at 5pm. Server is down"}'
```

### Quick Check-in
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Quick 15-minute call needed for tomorrow morning"}'
```

## 🔍 API Commands

### Direct Call Creation
```bash
curl -X POST http://localhost:8000/api/calls \
  -H 'Content-Type: application/json' \
  -d '{
    "user_phone": "+1234567890",
    "preferred_time": "2024-07-05T14:00:00",
    "duration_minutes": 30,
    "notes": "Demo call via API"
  }'
```

### Check User Calls
```bash
curl http://localhost:8000/api/calls/+1234567890
```

### Health Check
```bash
curl http://localhost:8000/health
```

### View All Messages
```bash
curl http://localhost:8000/demo/messages
```

## 🎭 Demo Flow

### Complete Demo Sequence
1. **Start**: `./start-demo.sh`
2. **Health Check**: Verify service is running
3. **Schedule**: Book a call with notes
4. **Check**: View scheduled calls
5. **Reschedule**: Change the time
6. **Cancel**: Remove the call
7. **Verify**: Confirm it's gone

### Quick Demo
```bash
# Run the automated test
./quick-test.sh
```

## 💡 Tips for Demos

1. **Start Simple**: Begin with basic scheduling
2. **Show Natural Language**: Use conversational phrases
3. **Demonstrate Intelligence**: Show how it understands context
4. **Highlight Speed**: Show immediate responses
5. **Show Persistence**: Demonstrate data is saved
6. **End with API**: Show integration capabilities

## 🎯 Key Selling Points

- **No Training Required**: Works with natural language
- **Instant Setup**: No complex configuration
- **Multi-Channel**: SMS + API + Webhooks
- **Scalable**: Handles multiple users
- **Production Ready**: Easy to deploy with real APIs 