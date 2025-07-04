# 🤖 Phone Scheduler Bot - Demo Package

## Overview

This is a **fully functional AI-powered phone call scheduling bot** that can:
- 📅 Schedule calls via natural language SMS
- 🔄 Reschedule existing appointments  
- ❌ Cancel upcoming calls
- 📋 Check scheduled appointments
- 💬 Handle conversations intelligently
- 📱 Send SMS confirmations and reminders

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- No API keys required (fully mocked for demo)

### 1. Start the Demo
```bash
# Clone or download this demo package
cd demo-package

# Start the bot (includes MongoDB)
./start-demo.sh
```

### 2. Test the Bot
The bot will be available at `http://localhost:8000`

## 📱 Demo Commands

### Schedule a Call
```bash
curl -X POST http://localhost:8000/demo/sms/simulate \
  -H 'Content-Type: application/json' \
  -d '{"from": "+1234567890", "body": "Schedule a call for tomorrow at 2pm for 45 minutes. I need to discuss the quarterly budget."}'
```

### Check Your Calls
```bash
curl http://localhost:8000/api/calls/+1234567890
```

### View Bot Responses
```bash
curl http://localhost:8000/demo/messages
```

### Health Check
```bash
curl http://localhost:8000/health
```

## 🎯 Example Conversations

### Schedule a Meeting
```
User: "Can you book a meeting for Friday at 3pm? I want to discuss the new project timeline."
Bot: "Great! Your call has been scheduled for Friday at 15:00 for 30 minutes. You'll receive a reminder 15 minutes before the call."
```

### Check Appointments
```
User: "What calls do I have scheduled?"
Bot: "Your upcoming calls:
1. 2024-07-05T15:00:00 (30 min)
2. 2024-07-06T14:00:00 (45 min)"
```

### Reschedule
```
User: "Reschedule my call to 4pm tomorrow"
Bot: "Perfect! Your call has been rescheduled to tomorrow at 16:00."
```

### Cancel
```
User: "Cancel my upcoming call"
Bot: "Your call has been cancelled successfully."
```

## 🏗️ Architecture

- **FastAPI Backend**: RESTful API and SMS webhook handling
- **OpenAI Integration**: Natural language processing and intent extraction
- **MongoDB**: Persistent storage for calls, users, and conversations
- **Twilio Integration**: SMS sending and receiving (mocked for demo)
- **Background Scheduler**: Automated reminders and notifications

## 📊 Features

### AI-Powered Understanding
- Natural language processing
- Intent recognition (schedule, reschedule, cancel, check)
- Date/time extraction from text
- Context-aware responses

### Smart Scheduling
- Conflict detection
- Duration customization
- Notes and descriptions
- Automatic reminders

### Multi-Channel Support
- SMS interface (primary)
- REST API for integrations
- Webhook support for real Twilio

### Data Management
- User profiles
- Call history
- Conversation logs
- Analytics ready

## 🔧 Technical Details

### Environment
- **Python 3.11**
- **FastAPI** for web framework
- **MongoDB** for database
- **Docker** for containerization

### API Endpoints
- `POST /demo/sms/simulate` - Simulate SMS
- `GET /demo/messages` - View sent messages
- `GET /api/calls/{phone}` - Get user's calls
- `POST /api/calls` - Create call via API
- `GET /health` - Service health check

### Mock Services
- **Mock AI Service**: Simulates OpenAI responses
- **Mock Twilio Service**: Simulates SMS sending
- **Mock Scheduler**: Handles reminders and notifications

## 🚀 Production Deployment

This demo can be easily converted to production by:
1. Adding real API keys (OpenAI, Twilio)
2. Configuring production MongoDB
3. Setting up proper authentication
4. Deploying to cloud infrastructure

## 📞 Support

For questions about this demo or production deployment:
- Check the logs: `docker-compose logs app`
- View health status: `curl http://localhost:8000/health`
- Restart services: `./restart-demo.sh`

---

**Ready to revolutionize your appointment scheduling?** 🚀 