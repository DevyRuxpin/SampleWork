# Python Phone Scheduler Bot

An AI-powered phone call scheduling and management system built with Python, FastAPI, OpenAI, Twilio, and MongoDB.

## Features

- 🤖 **AI-Powered Conversations**: Natural language processing for scheduling calls via SMS
- 📅 **Smart Scheduling**: Schedule, reschedule, and cancel calls with intelligent date/time parsing
- 🔔 **Automated Reminders**: SMS reminders sent 15 minutes before scheduled calls
- 📱 **SMS Integration**: Full SMS conversation flow via Twilio
- 🗄️ **MongoDB Storage**: Persistent storage for calls, users, and conversations
- 🐳 **Docker Ready**: Containerized application for easy deployment
- ☁️ **AWS Compatible**: Ready for deployment on AWS Lambda, EC2, or ECS
- 🔌 **REST API**: Full REST API for programmatic access

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Twilio SMS    │    │   FastAPI App   │    │   OpenAI GPT    │
│   Webhook       │───▶│   (main.py)     │───▶│   (ai_service)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   (database)    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Scheduler     │
                       │   (scheduler)   │
                       └─────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Docker and Docker Compose
- Twilio Account (for SMS functionality)
- OpenAI API Key
- MongoDB (included in Docker setup)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd PythonBot
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/phone_scheduler

# Application Configuration
DEBUG=True
LOG_LEVEL=INFO
```

### 3. Run with Docker

```bash
# Start the application with MongoDB
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

The application will be available at `http://localhost:8000`

### 4. Run Locally (Alternative)

```bash
# Install dependencies
pip install -r requirements.txt

# Start MongoDB (if not using Docker)
# You can use MongoDB Atlas or local MongoDB

# Run the application
python main.py
```

## Usage

### SMS Conversations

Users can interact with the bot via SMS using natural language:

**Schedule a call:**
```
User: "Schedule a call for tomorrow at 2pm for 30 minutes"
Bot: "Perfect! I'll schedule a call for 2024-01-15 at 14:00 for 30 minutes. Please confirm: 'yes' to schedule or 'no' to cancel."
```

**Check calls:**
```
User: "What calls do I have scheduled?"
Bot: "Your upcoming calls:
1. 2024-01-15T14:00:00 (30 min)
2. 2024-01-16T10:00:00 (45 min)"
```

**Reschedule a call:**
```
User: "Can you reschedule my call to 3pm tomorrow?"
Bot: "I'll reschedule your call to 2024-01-15 at 15:00. Please confirm: 'yes' to reschedule or 'no' to keep the original time."
```

**Cancel a call:**
```
User: "Cancel my upcoming call"
Bot: "I'll cancel your upcoming call. Please confirm: 'yes' to cancel or 'no' to keep it scheduled."
```

### REST API

The application also provides a REST API for programmatic access:

#### Create a Call
```bash
curl -X POST "http://localhost:8000/api/calls" \
  -H "Content-Type: application/json" \
  -d '{
    "user_phone": "+1234567890",
    "preferred_time": "2024-01-15T14:00:00",
    "duration_minutes": 30,
    "notes": "Follow-up call"
  }'
```

#### Get User Calls
```bash
curl "http://localhost:8000/api/calls/+1234567890"
```

#### Update a Call
```bash
curl -X PUT "http://localhost:8000/api/calls/{call_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduled_time": "2024-01-15T15:00:00",
    "duration_minutes": 45
  }'
```

#### Cancel a Call
```bash
curl -X DELETE "http://localhost:8000/api/calls/{call_id}"
```

## Twilio Webhook Setup

To enable SMS functionality, configure your Twilio webhook:

1. Go to your Twilio Console
2. Navigate to Phone Numbers → Manage → Active numbers
3. Select your phone number
4. Under "Messaging", set the webhook URL to:
   ```
   https://your-domain.com/webhook/sms
   ```
5. Set the HTTP method to POST

## API Documentation

Once the application is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Deployment

### AWS Lambda Deployment

1. **Create Lambda Function:**
   ```bash
   # Package the application
   pip install -r requirements.txt -t ./package
   cp *.py ./package/
   cd package
   zip -r ../lambda-deployment.zip .
   ```

2. **Upload to AWS Lambda** with the following configuration:
   - Runtime: Python 3.11
   - Handler: `main.handler`
   - Environment variables: Set all variables from `.env`

3. **Configure API Gateway** to route requests to your Lambda function

### AWS EC2 Deployment

1. **Launch EC2 Instance** with Ubuntu/Debian
2. **Install Docker:**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

3. **Deploy Application:**
   ```bash
   git clone <repository-url>
   cd PythonBot
   # Configure .env file
   docker-compose up -d
   ```

4. **Configure Security Groups** to allow traffic on port 8000

### AWS ECS Deployment

1. **Create ECR Repository** and push Docker image
2. **Create ECS Cluster** and Task Definition
3. **Configure Environment Variables** in task definition
4. **Create Service** with Application Load Balancer

## Monitoring and Logging

The application includes comprehensive logging:

- **Application Logs**: Structured logging with configurable levels
- **Health Check**: `/health` endpoint for monitoring
- **Database Monitoring**: Connection status and query performance
- **Twilio Integration**: SMS delivery status and error tracking

## Development

### Project Structure

```
PythonBot/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration management
├── models.py              # Pydantic data models
├── database.py            # MongoDB operations
├── ai_service.py          # OpenAI integration and prompt engineering
├── twilio_service.py      # Twilio SMS and call services
├── scheduler_service.py   # Call scheduling and reminders
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker container configuration
├── docker-compose.yml    # Local development setup
├── .env.example          # Environment variables template
└── README.md             # This file
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest
```

### Code Quality

The project follows Python best practices:
- Type hints throughout
- Comprehensive error handling
- Async/await for I/O operations
- Structured logging
- Environment-based configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the logs for debugging information

## Roadmap

- [ ] Voice call integration
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Web dashboard for call management
- [ ] Integration with CRM systems 