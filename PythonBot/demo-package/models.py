from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

class CallStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"

class CallType(str, Enum):
    INCOMING = "incoming"
    OUTGOING = "outgoing"

class Call(BaseModel):
    id: Optional[str] = None
    user_phone: str = Field(..., description="User's phone number")
    scheduled_time: datetime = Field(..., description="Scheduled call time")
    duration_minutes: int = Field(default=30, ge=5, le=120, description="Call duration in minutes")
    status: CallStatus = Field(default=CallStatus.SCHEDULED)
    call_type: CallType = Field(default=CallType.OUTGOING)
    notes: Optional[str] = Field(default=None, description="Additional notes about the call")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('scheduled_time')
    def validate_scheduled_time(cls, v):
        if v < datetime.utcnow():
            raise ValueError('Scheduled time must be in the future')
        return v
    
    @validator('user_phone')
    def validate_phone_number(cls, v):
        # Basic phone number validation (can be enhanced)
        if not v or len(v) < 10:
            raise ValueError('Invalid phone number')
        return v

class CallRequest(BaseModel):
    user_phone: str
    preferred_time: Optional[datetime] = None
    duration_minutes: Optional[int] = 30
    notes: Optional[str] = None

class CallUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[CallStatus] = None

class User(BaseModel):
    id: Optional[str] = None
    phone_number: str = Field(..., description="User's phone number")
    name: Optional[str] = None
    timezone: str = Field(default="UTC", description="User's timezone")
    preferences: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Conversation(BaseModel):
    id: Optional[str] = None
    user_phone: str
    session_id: str
    messages: List[dict] = Field(default_factory=list)
    current_intent: Optional[str] = None
    context: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow) 