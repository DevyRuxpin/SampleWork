import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta

from main import app

client = TestClient(app)

@pytest.fixture
def mock_db():
    """Mock database operations"""
    with patch('main.db') as mock:
        yield mock

@pytest.fixture
def mock_ai_service():
    """Mock AI service"""
    with patch('main.ai_service') as mock:
        yield mock

@pytest.fixture
def mock_twilio_service():
    """Mock Twilio service"""
    with patch('main.twilio_service') as mock:
        yield mock

def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Phone Scheduler Bot is running"
    assert data["version"] == "1.0.0"
    assert data["status"] == "healthy"

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "scheduler" in data
    assert "timestamp" in data

def test_create_call_api(mock_db):
    """Test creating a call via REST API"""
    # Mock database response
    mock_db.create_call.return_value = "test_call_id"
    
    call_data = {
        "user_phone": "+1234567890",
        "preferred_time": "2024-01-15T14:00:00",
        "duration_minutes": 30,
        "notes": "Test call"
    }
    
    response = client.post("/api/calls", json=call_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "call_id" in data

def test_get_user_calls_api(mock_db):
    """Test getting user calls via REST API"""
    # Mock database response
    mock_calls = [
        {
            "_id": "call1",
            "user_phone": "+1234567890",
            "scheduled_time": "2024-01-15T14:00:00",
            "duration_minutes": 30,
            "status": "scheduled"
        }
    ]
    mock_db.get_calls_by_user.return_value = mock_calls
    
    response = client.get("/api/calls/+1234567890")
    assert response.status_code == 200
    data = response.json()
    assert "calls" in data
    assert len(data["calls"]) == 1

def test_create_user_api(mock_db):
    """Test creating a user via REST API"""
    # Mock database response
    mock_db.create_user.return_value = "test_user_id"
    
    user_data = {
        "phone_number": "+1234567890",
        "name": "Test User",
        "timezone": "UTC"
    }
    
    response = client.post("/api/users", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "user_id" in data

def test_get_user_api(mock_db):
    """Test getting a user via REST API"""
    # Mock database response
    mock_user = {
        "_id": "user1",
        "phone_number": "+1234567890",
        "name": "Test User",
        "timezone": "UTC"
    }
    mock_db.get_user.return_value = mock_user
    
    response = client.get("/api/users/+1234567890")
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert data["user"]["phone_number"] == "+1234567890"

def test_get_user_not_found(mock_db):
    """Test getting a non-existent user"""
    # Mock database response
    mock_db.get_user.return_value = None
    
    response = client.get("/api/users/+9999999999")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_process_sms_message():
    """Test SMS message processing"""
    from main import process_sms_message
    
    # Mock dependencies
    with patch('main.db') as mock_db, \
         patch('main.scheduler_service') as mock_scheduler, \
         patch('main.ai_service') as mock_ai, \
         patch('main.twilio_service') as mock_twilio:
        
        # Setup mocks
        mock_db.get_user.return_value = {"phone_number": "+1234567890"}
        mock_db.create_user.return_value = "user_id"
        mock_db.get_conversation.return_value = None
        mock_db.create_conversation.return_value = "conv_id"
        mock_scheduler.get_user_calls.return_value = []
        mock_ai.process_message.return_value = {
            "intent": "SCHEDULE_CALL",
            "response": "Test response",
            "extracted_data": {"date": "2024-01-15", "time": "14:00"}
        }
        mock_twilio.send_sms.return_value = {"success": True}
        
        # Test the function
        await process_sms_message("+1234567890", "Schedule a call for tomorrow at 2pm")
        
        # Verify mocks were called
        mock_db.get_user.assert_called_once()
        mock_ai.process_message.assert_called_once()
        mock_twilio.send_sms.assert_called()

def test_sms_webhook():
    """Test SMS webhook endpoint"""
    # Mock form data
    with patch('main.process_sms_message') as mock_process:
        response = client.post(
            "/webhook/sms",
            data={
                "From": "+1234567890",
                "To": "+0987654321",
                "Body": "Test message"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Message received"

def test_update_call_api(mock_db):
    """Test updating a call via REST API"""
    # Mock database response
    mock_db.update_call.return_value = True
    
    update_data = {
        "duration_minutes": 45,
        "notes": "Updated notes"
    }
    
    response = client.put("/api/calls/test_call_id", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

def test_delete_call_api(mock_db):
    """Test deleting a call via REST API"""
    # Mock database response
    mock_db.delete_call.return_value = True
    
    response = client.delete("/api/calls/test_call_id")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True 