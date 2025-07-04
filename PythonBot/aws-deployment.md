# AWS Deployment Guide

This guide provides detailed instructions for deploying the Python Phone Scheduler Bot on various AWS services.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Docker installed (for ECS deployment)
- Domain name (optional, for custom domain)

## Option 1: AWS Lambda + API Gateway

### Step 1: Prepare Lambda Package

```bash
# Create deployment package
mkdir lambda-package
pip install -r requirements.txt -t lambda-package/
cp *.py lambda-package/
cd lambda-package
zip -r ../lambda-deployment.zip .
cd ..
```

### Step 2: Create Lambda Function

1. **Go to AWS Lambda Console**
2. **Create Function**:
   - Function name: `phone-scheduler-bot`
   - Runtime: Python 3.11
   - Architecture: x86_64
   - Execution role: Create new role with basic Lambda permissions

3. **Upload Code**:
   - Upload the `lambda-deployment.zip` file
   - Handler: `main.handler`

4. **Configure Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   MONGODB_URI=your_mongodb_connection_string
   DEBUG=False
   LOG_LEVEL=INFO
   ```

5. **Configure Basic Settings**:
   - Memory: 512 MB
   - Timeout: 30 seconds

### Step 3: Create API Gateway

1. **Create REST API**:
   - API name: `phone-scheduler-api`
   - Endpoint type: Regional

2. **Create Resources and Methods**:
   ```
   / (GET) - Health check
   /webhook/sms (POST) - Twilio webhook
   /api/calls (POST) - Create call
   /api/calls/{user_phone} (GET) - Get user calls
   /api/calls/{call_id} (PUT) - Update call
   /api/calls/{call_id} (DELETE) - Delete call
   /api/users (POST) - Create user
   /api/users/{phone_number} (GET) - Get user
   ```

3. **Deploy API**:
   - Stage name: `prod`
   - Deploy to stage

### Step 4: Configure Twilio Webhook

Update your Twilio webhook URL to:
```
https://your-api-gateway-url.amazonaws.com/prod/webhook/sms
```

## Option 2: AWS EC2

### Step 1: Launch EC2 Instance

1. **Launch Instance**:
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: t3.medium (or larger for production)
   - Storage: 20 GB GP3
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (App)

2. **Configure Security Group**:
   ```
   SSH (22): 0.0.0.0/0
   HTTP (80): 0.0.0.0/0
   HTTPS (443): 0.0.0.0/0
   Custom TCP (8000): 0.0.0.0/0
   ```

### Step 2: Install Dependencies

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
newgrp docker

# Install Git
sudo apt install git -y
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd PythonBot

# Create environment file
cp .env.example .env
nano .env  # Edit with your credentials

# Start application
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 4: Configure Nginx (Optional)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/phone-scheduler

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/phone-scheduler /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Option 3: AWS ECS with Fargate

### Step 1: Create ECR Repository

```bash
# Create repository
aws ecr create-repository --repository-name phone-scheduler-bot

# Get login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker build -t phone-scheduler-bot .
docker tag phone-scheduler-bot:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/phone-scheduler-bot:latest
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/phone-scheduler-bot:latest
```

### Step 2: Create ECS Cluster

1. **Go to ECS Console**
2. **Create Cluster**:
   - Cluster name: `phone-scheduler-cluster`
   - Infrastructure: AWS Fargate (serverless)

### Step 3: Create Task Definition

```json
{
  "family": "phone-scheduler-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::your-account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "phone-scheduler-container",
      "image": "your-account-id.dkr.ecr.us-east-1.amazonaws.com/phone-scheduler-bot:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "OPENAI_API_KEY",
          "value": "your_openai_api_key"
        },
        {
          "name": "TWILIO_ACCOUNT_SID",
          "value": "your_twilio_account_sid"
        },
        {
          "name": "TWILIO_AUTH_TOKEN",
          "value": "your_twilio_auth_token"
        },
        {
          "name": "TWILIO_PHONE_NUMBER",
          "value": "your_twilio_phone_number"
        },
        {
          "name": "MONGODB_URI",
          "value": "your_mongodb_connection_string"
        },
        {
          "name": "DEBUG",
          "value": "False"
        },
        {
          "name": "LOG_LEVEL",
          "value": "INFO"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/phone-scheduler",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 4: Create Service

1. **Create Service**:
   - Service name: `phone-scheduler-service`
   - Task definition: `phone-scheduler-task`
   - Service type: REPLICA
   - Number of tasks: 2 (for high availability)

2. **Configure Load Balancer**:
   - Load balancer type: Application Load Balancer
   - Target group: Create new
   - Health check path: `/health`

## Option 4: AWS App Runner

### Step 1: Prepare Application

1. **Ensure your repository has**:
   - `Dockerfile` (already included)
   - `requirements.txt` (already included)
   - Environment variables configured

### Step 2: Deploy to App Runner

1. **Go to AWS App Runner Console**
2. **Create Service**:
   - Source: Source code repository
   - Repository: Your GitHub repository
   - Branch: main
   - Build settings: Use Dockerfile
   - Port: 8000

3. **Configure Environment Variables**:
   - Add all required environment variables

4. **Deploy**

## MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
2. **Create Cluster**:
   - Provider: AWS
   - Region: Same as your application
   - Tier: M0 (free) or higher

3. **Configure Network Access**:
   - Allow access from anywhere (0.0.0.0/0) or specific IPs

4. **Create Database User**:
   - Username and password for application

5. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/phone_scheduler?retryWrites=true&w=majority
   ```

### Option B: MongoDB on EC2

```bash
# Install MongoDB
sudo apt update
sudo apt install mongodb -y

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
use phone_scheduler
db.createUser({
  user: "appuser",
  pwd: "securepassword",
  roles: ["readWrite"]
})
```

## Monitoring and Logging

### CloudWatch Logs

```bash
# Create log group
aws logs create-log-group --log-group-name /phone-scheduler/app

# Configure log retention
aws logs put-retention-policy --log-group-name /phone-scheduler/app --retention-in-days 30
```

### CloudWatch Alarms

Create alarms for:
- High CPU utilization
- High memory usage
- Error rate
- Response time

### Health Checks

The application provides health check endpoints:
- `/health` - Detailed health status
- `/` - Basic status

## Security Considerations

### Environment Variables

- Store sensitive data in AWS Systems Manager Parameter Store
- Use IAM roles for service-to-service authentication
- Rotate API keys regularly

### Network Security

- Use VPC for EC2/ECS deployments
- Configure security groups properly
- Use HTTPS for all external communications

### Database Security

- Use MongoDB Atlas with encryption at rest
- Configure network access restrictions
- Use strong authentication

## Cost Optimization

### Lambda
- Use provisioned concurrency for consistent workloads
- Monitor and optimize memory allocation

### EC2
- Use Spot Instances for non-critical workloads
- Right-size instances based on usage

### ECS
- Use Fargate Spot for cost savings
- Monitor task utilization

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**:
   - Check AWS Systems Manager Parameter Store
   - Verify Lambda/ECS environment configuration

2. **MongoDB Connection Issues**:
   - Check network access rules
   - Verify connection string format
   - Test connection from application server

3. **Twilio Webhook Failures**:
   - Verify webhook URL is accessible
   - Check API Gateway configuration
   - Review CloudWatch logs

4. **High Latency**:
   - Check database performance
   - Monitor OpenAI API response times
   - Review application logs

### Debug Commands

```bash
# Check application logs
docker-compose logs -f

# Test database connection
python -c "from database import db; print(db.client.admin.command('ping'))"

# Test Twilio connection
python -c "from twilio_service import twilio_service; print(twilio_service.client.api.accounts.list())"

# Check health endpoint
curl http://localhost:8000/health
```

## Backup and Recovery

### Database Backup

```bash
# MongoDB Atlas provides automatic backups
# For self-hosted MongoDB:
mongodump --uri="mongodb://localhost:27017/phone_scheduler" --out=/backup/$(date +%Y%m%d)
```

### Application Backup

- Use Git for code version control
- Store configuration in AWS Systems Manager
- Regular database backups

## Scaling Considerations

### Horizontal Scaling
- Use multiple instances behind load balancer
- Implement database connection pooling
- Use Redis for session storage (if needed)

### Vertical Scaling
- Monitor resource usage
- Upgrade instance types as needed
- Optimize application performance

## SSL/TLS Configuration

### Using AWS Certificate Manager

1. **Request Certificate**:
   - Domain name: your-domain.com
   - Validation: DNS validation

2. **Configure Load Balancer**:
   - Attach certificate to ALB
   - Redirect HTTP to HTTPS

3. **Update Twilio Webhook**:
   - Use HTTPS URL for webhook 