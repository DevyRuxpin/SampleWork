from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from config import Config
from models import CallRequest, CallUpdate, User
from database import db
from ai_service import ai_service
from twilio_service import twilio_service
from scheduler_service import scheduler_service

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Phone Scheduler Bot",
    description="AI-powered phone call scheduling and management system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        # Validate configuration
        Config.validate()
        logger.info("Configuration validated successfully")
        
        # Start scheduler service
        await scheduler_service.start()
        logger.info("Application started successfully")
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await scheduler_service.stop()
        db.close()
        logger.info("Application shutdown successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Phone Scheduler Bot is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test database connection
        await db.get_collection("calls").find_one()
        
        return {
            "status": "healthy",
            "database": "connected",
            "scheduler": "running" if scheduler_service.running else "stopped",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/webhook/sms")
async def sms_webhook(request: Request):
    """Handle incoming SMS webhook from Twilio"""
    try:
        # Parse form data from Twilio
        form_data = await request.form()
        
        # Extract message details
        from_number = form_data.get("From")
        to_number = form_data.get("To")
        message_body = form_data.get("Body", "")
        
        logger.info(f"Received SMS from {from_number}: {message_body}")
        
        # Process message asynchronously
        background_tasks = BackgroundTasks()
        background_tasks.add_task(process_sms_message, from_number, message_body)
        
        # Return immediate response to Twilio
        return JSONResponse(
            content={"message": "Message received"},
            status_code=200
        )
        
    except Exception as e:
        logger.error(f"Error processing SMS webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def process_sms_message(user_phone: str, message: str):
    """Process incoming SMS message"""
    try:
        # Get or create user
        user = await db.get_user(user_phone)
        if not user:
            user_data = {
                "phone_number": user_phone,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.create_user(user_data)
            user = await db.get_user(user_phone)
        
        # Get user's calls for context
        user_calls = await scheduler_service.get_user_calls(user_phone)
        
        # Get or create conversation session
        session_id = f"{user_phone}_{datetime.utcnow().strftime('%Y%m%d')}"
        conversation = await db.get_conversation(session_id)
        
        if not conversation:
            conversation_data = {
                "user_phone": user_phone,
                "session_id": session_id,
                "messages": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.create_conversation(conversation_data)
            conversation = await db.get_conversation(session_id)
        
        # Add user message to conversation
        user_message = {
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        await db.add_message_to_conversation(session_id, user_message)
        
        # Process message with AI
        ai_response = await ai_service.process_message(
            message, user_phone, user_calls, conversation.get("messages", [])
        )
        
        # Add AI response to conversation
        ai_message = {
            "role": "assistant",
            "content": ai_response.get("response", ""),
            "timestamp": datetime.utcnow().isoformat(),
            "intent": ai_response.get("intent"),
            "confidence": ai_response.get("confidence")
        }
        await db.add_message_to_conversation(session_id, ai_message)
        
        # Handle different intents
        intent = ai_response.get("intent")
        extracted_data = ai_response.get("extracted_data", {})
        
        if intent == "SCHEDULE_CALL":
            await handle_schedule_call(user_phone, extracted_data, ai_response)
        elif intent == "RESCHEDULE_CALL":
            await handle_reschedule_call(user_phone, extracted_data, ai_response)
        elif intent == "CANCEL_CALL":
            await handle_cancel_call(user_phone, ai_response)
        elif intent == "CHECK_CALLS":
            await handle_check_calls(user_phone, ai_response)
        else:
            # Send AI response as SMS
            await twilio_service.send_sms(user_phone, ai_response.get("response", ""))
            
    except Exception as e:
        logger.error(f"Error processing SMS message: {e}")
        # Send error message to user
        await twilio_service.send_sms(
            user_phone, 
            "I'm experiencing technical difficulties. Please try again in a moment."
        )

async def handle_schedule_call(user_phone: str, extracted_data: Dict[str, Any], ai_response: Dict[str, Any]):
    """Handle call scheduling"""
    try:
        # Extract date and time
        date_str = extracted_data.get("date")
        time_str = extracted_data.get("time")
        duration = extracted_data.get("duration_minutes", 30)
        notes = extracted_data.get("notes", "")
        
        if date_str and time_str:
            # Combine date and time
            datetime_str = f"{date_str}T{time_str}:00"
            scheduled_time = datetime.fromisoformat(datetime_str)
            
            # Create call data
            call_data = {
                "user_phone": user_phone,
                "scheduled_time": scheduled_time,
                "duration_minutes": duration,
                "notes": notes,
                "status": "scheduled",
                "call_type": "outgoing"
            }
            
            # Schedule the call
            result = await scheduler_service.schedule_call(call_data)
            
            if result.get("success"):
                success_message = ai_service.generate_success_message("SCHEDULE_CALL", extracted_data)
                await twilio_service.send_sms(user_phone, success_message)
            else:
                error_message = f"Sorry, I couldn't schedule your call: {result.get('error')}"
                await twilio_service.send_sms(user_phone, error_message)
        else:
            # Send confirmation request
            confirmation_message = ai_service.generate_confirmation_message("SCHEDULE_CALL", extracted_data)
            await twilio_service.send_sms(user_phone, confirmation_message)
            
    except Exception as e:
        logger.error(f"Error handling schedule call: {e}")
        await twilio_service.send_sms(user_phone, "Sorry, there was an error scheduling your call. Please try again.")

async def handle_reschedule_call(user_phone: str, extracted_data: Dict[str, Any], ai_response: Dict[str, Any]):
    """Handle call rescheduling"""
    try:
        # Get user's upcoming calls
        user_calls = await scheduler_service.get_user_calls(user_phone)
        upcoming_calls = [call for call in user_calls if call.get("status") == "scheduled"]
        
        if not upcoming_calls:
            await twilio_service.send_sms(user_phone, "You don't have any upcoming calls to reschedule.")
            return
        
        # For now, reschedule the most recent upcoming call
        call_to_reschedule = upcoming_calls[0]
        
        # Extract new date and time
        date_str = extracted_data.get("date")
        time_str = extracted_data.get("time")
        
        if date_str and time_str:
            datetime_str = f"{date_str}T{time_str}:00"
            new_time = datetime.fromisoformat(datetime_str)
            
            result = await scheduler_service.reschedule_call(call_to_reschedule["_id"], new_time)
            
            if result.get("success"):
                success_message = ai_service.generate_success_message("RESCHEDULE_CALL", extracted_data)
                await twilio_service.send_sms(user_phone, success_message)
            else:
                error_message = f"Sorry, I couldn't reschedule your call: {result.get('error')}"
                await twilio_service.send_sms(user_phone, error_message)
        else:
            confirmation_message = ai_service.generate_confirmation_message("RESCHEDULE_CALL", extracted_data)
            await twilio_service.send_sms(user_phone, confirmation_message)
            
    except Exception as e:
        logger.error(f"Error handling reschedule call: {e}")
        await twilio_service.send_sms(user_phone, "Sorry, there was an error rescheduling your call. Please try again.")

async def handle_cancel_call(user_phone: str, ai_response: Dict[str, Any]):
    """Handle call cancellation"""
    try:
        # Get user's upcoming calls
        user_calls = await scheduler_service.get_user_calls(user_phone)
        upcoming_calls = [call for call in user_calls if call.get("status") == "scheduled"]
        
        if not upcoming_calls:
            await twilio_service.send_sms(user_phone, "You don't have any upcoming calls to cancel.")
            return
        
        # For now, cancel the most recent upcoming call
        call_to_cancel = upcoming_calls[0]
        
        result = await scheduler_service.cancel_call(call_to_cancel["_id"])
        
        if result.get("success"):
            success_message = ai_service.generate_success_message("CANCEL_CALL", {})
            await twilio_service.send_sms(user_phone, success_message)
        else:
            error_message = f"Sorry, I couldn't cancel your call: {result.get('error')}"
            await twilio_service.send_sms(user_phone, error_message)
            
    except Exception as e:
        logger.error(f"Error handling cancel call: {e}")
        await twilio_service.send_sms(user_phone, "Sorry, there was an error cancelling your call. Please try again.")

async def handle_check_calls(user_phone: str, ai_response: Dict[str, Any]):
    """Handle call checking"""
    try:
        user_calls = await scheduler_service.get_user_calls(user_phone)
        upcoming_calls = [call for call in user_calls if call.get("status") == "scheduled"]
        
        if not upcoming_calls:
            await twilio_service.send_sms(user_phone, "You don't have any upcoming calls scheduled.")
            return
        
        # Format call information
        call_info = "Your upcoming calls:\n"
        for i, call in enumerate(upcoming_calls[:3], 1):  # Show up to 3 calls
            scheduled_time = call.get("scheduled_time", "")
            if isinstance(scheduled_time, str):
                scheduled_time = scheduled_time[:16]  # Format datetime
            duration = call.get("duration_minutes", 30)
            call_info += f"{i}. {scheduled_time} ({duration} min)\n"
        
        await twilio_service.send_sms(user_phone, call_info)
        
    except Exception as e:
        logger.error(f"Error handling check calls: {e}")
        await twilio_service.send_sms(user_phone, "Sorry, there was an error checking your calls. Please try again.")

# REST API endpoints for direct access

@app.post("/api/calls")
async def create_call(call_request: CallRequest):
    """Create a new call via REST API"""
    try:
        call_data = call_request.dict()
        
        # If no preferred time, use current time + 1 hour
        if not call_data.get("scheduled_time"):
            call_data["scheduled_time"] = datetime.utcnow() + timedelta(hours=1)
        
        result = await scheduler_service.schedule_call(call_data)
        
        if result.get("success"):
            return {"success": True, "call_id": result.get("call_id")}
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
            
    except Exception as e:
        logger.error(f"Error creating call: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/calls/{user_phone}")
async def get_user_calls(user_phone: str):
    """Get all calls for a user"""
    try:
        calls = await scheduler_service.get_user_calls(user_phone)
        return {"calls": calls}
    except Exception as e:
        logger.error(f"Error getting user calls: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/api/calls/{call_id}")
async def update_call(call_id: str, call_update: CallUpdate):
    """Update a call"""
    try:
        update_data = call_update.dict(exclude_unset=True)
        
        if update_data.get("scheduled_time"):
            result = await scheduler_service.reschedule_call(call_id, update_data["scheduled_time"])
        else:
            success = await db.update_call(call_id, update_data)
            result = {"success": success, "message": "Call updated successfully"}
        
        if result.get("success"):
            return {"success": True, "message": result.get("message")}
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
            
    except Exception as e:
        logger.error(f"Error updating call: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/api/calls/{call_id}")
async def delete_call(call_id: str):
    """Cancel a call"""
    try:
        result = await scheduler_service.cancel_call(call_id)
        
        if result.get("success"):
            return {"success": True, "message": result.get("message")}
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
            
    except Exception as e:
        logger.error(f"Error cancelling call: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/users")
async def create_user(user: User):
    """Create a new user"""
    try:
        user_data = user.dict()
        user_id = await db.create_user(user_data)
        return {"success": True, "user_id": user_id}
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/users/{phone_number}")
async def get_user(phone_number: str):
    """Get user by phone number"""
    try:
        user = await db.get_user(phone_number)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"user": user}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 