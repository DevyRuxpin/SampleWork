# Local Demo Setup Guide

This guide will help you set up and demo the Phone Scheduler Bot locally.

## Prerequisites

- Docker and Docker Compose installed
- A Twilio account (free trial available)
- An OpenAI API key
- ngrok (for exposing local server to internet)

## Step 1: Get Required API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free trial
3. Get your Account SID and Auth Token
4. Get a Twilio phone number (free with trial)

## Step 2: Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your credentials
nano .env
```

Fill in your `.env` file:
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# MongoDB Configuration
MONGODB_URI=mongodb://admin:password@mongo:27017/phone_scheduler

# Application Configuration
DEBUG=True
LOG_LEVEL=INFO
```

## Step 3: Start the Application

```bash
# Build and start the application
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

Wait for all services to start (you'll see logs indicating successful startup).

## Step 4: Test the Application

### Check Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "scheduler": "running",
  "timestamp": "2024-01-15T10:00:00"
}
```

### Test REST API
```bash
# Create a test call
curl -X POST "http://localhost:8000/api/calls" \
  -H "Content-Type: application/json" \
  -d '{
    "user_phone": "+1234567890",
    "preferred_time": "2024-01-15T14:00:00",
    "duration_minutes": 30,
    "notes": "Demo call"
  }'

# Get user calls
curl "http://localhost:8000/api/calls/+1234567890"
```

## Step 5: Set Up SMS Testing (Optional)

### Option A: Using ngrok (Recommended for Demo)

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/
   # Or install via package manager
   ```

2. **Expose your local server:**
   ```bash
   ngrok http 8000
   ```

3. **Configure Twilio Webhook:**
   - Go to Twilio Console → Phone Numbers → Manage → Active numbers
   - Click on your phone number
   - Under "Messaging", set webhook URL to:
     ```
     https://your-ngrok-url.ngrok.io/webhook/sms
     ```
   - Set HTTP method to POST

4. **Test SMS:**
   - Send SMS to your Twilio number
   - Try: "Schedule a call for tomorrow at 2pm"

### Option B: Using Twilio CLI (Alternative)

1. **Install Twilio CLI:**
   ```bash
   npm install -g twilio-cli
   ```

2. **Login to Twilio:**
   ```bash
   twilio login
   ```

3. **Send test SMS:**
   ```bash
   twilio api:core:messages:create \
     --from "+1234567890" \
     --to "+your-phone-number" \
     --body "Test message"
   ```

## Step 6: Demo Scenarios

### Scenario 1: Schedule a Call
```
User SMS: "Schedule a call for tomorrow at 2pm for 30 minutes"
Expected Bot Response: "Perfect! I'll schedule a call for 2024-01-15 at 14:00 for 30 minutes. Please confirm: 'yes' to schedule or 'no' to cancel."
```

### Scenario 2: Check Calls
```
User SMS: "What calls do I have scheduled?"
Expected Bot Response: "Your upcoming calls: 1. 2024-01-15T14:00:00 (30 min)"
```

### Scenario 3: Reschedule Call
```
User SMS: "Can you reschedule my call to 3pm tomorrow?"
Expected Bot Response: "I'll reschedule your call to 2024-01-15 at 15:00. Please confirm: 'yes' to reschedule or 'no' to keep the original time."
```

### Scenario 4: Cancel Call
```
User SMS: "Cancel my upcoming call"
Expected Bot Response: "I'll cancel your upcoming call. Please confirm: 'yes' to cancel or 'no' to keep it scheduled."
```

## Step 7: Monitor and Debug

### View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f mongo
```

### Check Database
```bash
# Connect to MongoDB
docker-compose exec mongo mongosh

# List databases
show dbs

# Use phone_scheduler database
use phone_scheduler

# View collections
show collections

# View calls
db.calls.find()

# View users
db.users.find()

# View conversations
db.conversations.find()
```

### API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

## Step 8: Demo Presentation Tips

### 1. Start with Architecture Overview
- Show the system diagram from README.md
- Explain the flow: SMS → AI Processing → Database → Response

### 2. Demonstrate Core Features
- **SMS Interaction**: Show natural language processing
- **REST API**: Demonstrate programmatic access
- **Database**: Show stored data
- **Scheduling**: Show automated reminders

### 3. Highlight Technical Features
- **AI Integration**: Explain prompt engineering
- **Async Processing**: Show background tasks
- **Error Handling**: Demonstrate graceful failures
- **Scalability**: Discuss Docker and AWS deployment

### 4. Show Real-time Monitoring
- **Logs**: Show application logs in real-time
- **Health Checks**: Demonstrate monitoring endpoints
- **Database**: Show data persistence

## Troubleshooting

### Common Issues

1. **Docker Compose Fails to Start**
   ```bash
   # Check if ports are in use
   lsof -i :8000
   lsof -i :27017
   
   # Stop conflicting services
   sudo systemctl stop mongod  # if running locally
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongo
   
   # Restart MongoDB
   docker-compose restart mongo
   ```

3. **Twilio Webhook Not Working**
   - Verify ngrok URL is accessible
   - Check Twilio webhook configuration
   - Review application logs for errors

4. **OpenAI API Errors**
   - Verify API key is correct
   - Check API usage limits
   - Ensure sufficient credits

### Debug Commands

```bash
# Test database connection
docker-compose exec app python -c "from database import db; print(db.client.admin.command('ping'))"

# Test Twilio connection
docker-compose exec app python -c "from twilio_service import twilio_service; print(twilio_service.client.api.accounts.list())"

# Test OpenAI connection
docker-compose exec app python -c "from ai_service import ai_service; print('OpenAI client initialized')"

# Check environment variables
docker-compose exec app python -c "from config import Config; print('Config loaded successfully')"
```

## Cleanup

```bash
# Stop the application
docker-compose down

# Remove volumes (will delete all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Next Steps

After the demo, you can:
1. Deploy to AWS using the `aws-deployment.md` guide
2. Add more features like voice calls
3. Integrate with calendar systems
4. Add web dashboard for management
5. Implement advanced analytics 