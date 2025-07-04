import logging
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class MockAIService:
    """Mock AI service that simulates OpenAI responses without requiring API keys"""
    
    def __init__(self):
        self.responses = {
            "schedule": [
                "Perfect! I'll schedule a call for {date} at {time} for {duration} minutes. Please confirm: 'yes' to schedule or 'no' to cancel.",
                "Great! I can schedule that call for {date} at {time} ({duration} minutes). Should I go ahead and book it?",
                "I'll schedule your {duration}-minute call for {date} at {time}. Please confirm with 'yes' or 'no'."
            ],
            "reschedule": [
                "I'll reschedule your call to {date} at {time}. Please confirm: 'yes' to reschedule or 'no' to keep the original time.",
                "Perfect! I can move your call to {date} at {time}. Should I make this change?",
                "I'll update your call to {date} at {time}. Please confirm this reschedule."
            ],
            "cancel": [
                "I'll cancel your upcoming call. Please confirm: 'yes' to cancel or 'no' to keep it scheduled.",
                "I can cancel your call for you. Please confirm with 'yes' to cancel or 'no' to keep it.",
                "I'll cancel your scheduled call. Please confirm this cancellation."
            ],
            "check": [
                "Your upcoming calls:\n{call_list}",
                "Here are your scheduled calls:\n{call_list}",
                "You have the following calls:\n{call_list}"
            ],
            "clarify": [
                "I'm not sure I understood. Could you please rephrase that?",
                "Could you clarify what you'd like me to do?",
                "I didn't catch that. Can you try again?"
            ]
        }
    
    def _extract_datetime(self, text: str) -> Optional[Dict[str, str]]:
        """Mock datetime extraction - returns tomorrow at 2pm by default"""
        tomorrow = datetime.now() + timedelta(days=1)
        return {
            "date": tomorrow.strftime("%Y-%m-%d"),
            "time": "14:00"
        }
    
    def _extract_intent(self, text: str) -> str:
        """Mock intent recognition"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["schedule", "book", "set up", "arrange"]):
            return "SCHEDULE_CALL"
        elif any(word in text_lower for word in ["reschedule", "move", "change", "postpone"]):
            return "RESCHEDULE_CALL"
        elif any(word in text_lower for word in ["cancel", "delete", "remove"]):
            return "CANCEL_CALL"
        elif any(word in text_lower for word in ["check", "show", "list", "what", "when"]):
            return "CHECK_CALLS"
        else:
            return "CLARIFY"
    
    def _extract_duration(self, text: str) -> int:
        """Mock duration extraction"""
        text_lower = text.lower()
        if "60" in text or "hour" in text:
            return 60
        elif "45" in text:
            return 45
        elif "15" in text:
            return 15
        else:
            return 30  # Default 30 minutes
    
    async def process_message(self, user_message: str, user_phone: str, 
                            user_calls: List[Dict], conversation_history: List[Dict]) -> Dict[str, Any]:
        """Process user message and return structured response"""
        try:
            intent = self._extract_intent(user_message)
            extracted_data = {}
            
            if intent == "SCHEDULE_CALL":
                datetime_info = self._extract_datetime(user_message)
                if datetime_info:
                    extracted_data.update(datetime_info)
                    extracted_data["duration_minutes"] = self._extract_duration(user_message)
                    extracted_data["notes"] = ""
                
                response_template = random.choice(self.responses["schedule"])
                response = response_template.format(
                    date=extracted_data.get("date", "tomorrow"),
                    time=extracted_data.get("time", "2:00 PM"),
                    duration=extracted_data.get("duration_minutes", 30)
                )
                
            elif intent == "RESCHEDULE_CALL":
                datetime_info = self._extract_datetime(user_message)
                if datetime_info:
                    extracted_data.update(datetime_info)
                
                response_template = random.choice(self.responses["reschedule"])
                response = response_template.format(
                    date=extracted_data.get("date", "tomorrow"),
                    time=extracted_data.get("time", "2:00 PM")
                )
                
            elif intent == "CANCEL_CALL":
                response = random.choice(self.responses["cancel"])
                
            elif intent == "CHECK_CALLS":
                if user_calls:
                    call_list = ""
                    for i, call in enumerate(user_calls[:3], 1):
                        scheduled_time = call.get("scheduled_time", "")
                        if isinstance(scheduled_time, str):
                            scheduled_time = scheduled_time[:16]
                        duration = call.get("duration_minutes", 30)
                        call_list += f"{i}. {scheduled_time} ({duration} min)\n"
                else:
                    call_list = "No calls scheduled"
                
                response_template = random.choice(self.responses["check"])
                response = response_template.format(call_list=call_list)
                
            else:
                response = random.choice(self.responses["clarify"])
            
            return {
                "intent": intent,
                "confidence": 0.85,
                "extracted_data": extracted_data,
                "response": response,
                "requires_confirmation": intent in ["SCHEDULE_CALL", "RESCHEDULE_CALL", "CANCEL_CALL"]
            }
            
        except Exception as e:
            logger.error(f"Error in mock AI processing: {e}")
            return {
                "intent": "CLARIFY",
                "confidence": 0.0,
                "extracted_data": {},
                "response": "I'm experiencing technical difficulties. Please try again.",
                "requires_confirmation": False
            }
    
    def generate_confirmation_message(self, intent: str, extracted_data: Dict[str, Any]) -> str:
        """Generate a confirmation message for the user"""
        if intent == "SCHEDULE_CALL":
            date = extracted_data.get('date', 'tomorrow')
            time = extracted_data.get('time', '2:00 PM')
            duration = extracted_data.get('duration_minutes', 30)
            return f"Perfect! I'll schedule a call for {date} at {time} for {duration} minutes. Please confirm: 'yes' to schedule or 'no' to cancel."
            
        elif intent == "RESCHEDULE_CALL":
            date = extracted_data.get('date', 'tomorrow')
            time = extracted_data.get('time', '2:00 PM')
            return f"I'll reschedule your call to {date} at {time}. Please confirm: 'yes' to reschedule or 'no' to keep the original time."
            
        elif intent == "CANCEL_CALL":
            return "I'll cancel your upcoming call. Please confirm: 'yes' to cancel or 'no' to keep it scheduled."
            
        else:
            return "Please confirm this action."
    
    def generate_success_message(self, intent: str, extracted_data: Dict[str, Any]) -> str:
        """Generate a success message after action completion"""
        if intent == "SCHEDULE_CALL":
            date = extracted_data.get('date', 'tomorrow')
            time = extracted_data.get('time', '2:00 PM')
            duration = extracted_data.get('duration_minutes', 30)
            return f"Great! Your call has been scheduled for {date} at {time} for {duration} minutes. You'll receive a reminder 15 minutes before the call."
            
        elif intent == "RESCHEDULE_CALL":
            date = extracted_data.get('date', 'tomorrow')
            time = extracted_data.get('time', '2:00 PM')
            return f"Perfect! Your call has been rescheduled to {date} at {time}. You'll receive an updated reminder."
            
        elif intent == "CANCEL_CALL":
            return "Your call has been cancelled successfully. Feel free to schedule a new call anytime!"
            
        else:
            return "Action completed successfully!"
    
    def generate_reminder_message(self, call_data: Dict[str, Any]) -> str:
        """Generate a reminder message for upcoming calls"""
        scheduled_time = call_data.get('scheduled_time', 'soon')
        duration = call_data.get('duration_minutes', 30)
        
        return f"Reminder: You have a {duration}-minute call scheduled in 15 minutes at {scheduled_time}. Please be ready!"

class MockTwilioService:
    """Mock Twilio service that simulates SMS sending without requiring API keys"""
    
    def __init__(self):
        self.sent_messages = []
        self.from_number = "+1234567890"
    
    async def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """Mock SMS sending - just logs the message"""
        message_data = {
            "to": to_number,
            "from": self.from_number,
            "body": message,
            "timestamp": datetime.utcnow().isoformat(),
            "message_sid": f"mock_msg_{len(self.sent_messages) + 1}"
        }
        
        self.sent_messages.append(message_data)
        
        logger.info(f"📱 Mock SMS sent to {to_number}: {message}")
        print(f"\n📱 SMS to {to_number}: {message}\n")
        
        return {
            "success": True,
            "message_sid": message_data["message_sid"],
            "status": "delivered"
        }
    
    async def make_call(self, to_number: str, twiml_url: str) -> Dict[str, Any]:
        """Mock call making"""
        logger.info(f"📞 Mock call to {to_number}")
        return {
            "success": True,
            "call_sid": f"mock_call_{datetime.utcnow().timestamp()}",
            "status": "initiated"
        }
    
    async def send_reminder_sms(self, to_number: str, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send reminder SMS for upcoming call"""
        scheduled_time = call_data.get('scheduled_time', 'soon')
        duration = call_data.get('duration_minutes', 30)
        
        message = f"Reminder: You have a {duration}-minute call scheduled in 15 minutes at {scheduled_time}. Please be ready!"
        
        return await self.send_sms(to_number, message)
    
    async def send_confirmation_sms(self, to_number: str, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send confirmation SMS for scheduled call"""
        scheduled_time = call_data.get('scheduled_time', 'soon')
        duration = call_data.get('duration_minutes', 30)
        notes = call_data.get('notes', '')
        
        message = f"Call confirmed for {scheduled_time} ({duration} minutes)."
        if notes:
            message += f" Notes: {notes}"
        message += " You'll receive a reminder 15 minutes before."
        
        return await self.send_sms(to_number, message)
    
    async def send_cancellation_sms(self, to_number: str, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send cancellation confirmation SMS"""
        scheduled_time = call_data.get('scheduled_time', 'soon')
        
        message = f"Your call scheduled for {scheduled_time} has been cancelled. Feel free to schedule a new call anytime!"
        
        return await self.send_sms(to_number, message)
    
    async def send_reschedule_sms(self, to_number: str, old_time: str, new_time: str) -> Dict[str, Any]:
        """Send reschedule confirmation SMS"""
        message = f"Your call has been rescheduled from {old_time} to {new_time}. You'll receive an updated reminder."
        
        return await self.send_sms(to_number, message)
    
    def validate_phone_number(self, phone_number: str) -> bool:
        """Mock phone number validation"""
        return len(phone_number) >= 10
    
    def format_phone_number(self, phone_number: str) -> str:
        """Mock phone number formatting"""
        cleaned = ''.join(filter(str.isdigit, phone_number))
        if len(cleaned) == 10:
            return f"+1{cleaned}"
        elif len(cleaned) == 11 and cleaned.startswith('1'):
            return f"+{cleaned}"
        else:
            return f"+{cleaned}"
    
    def get_sent_messages(self) -> List[Dict[str, Any]]:
        """Get all sent messages for demo purposes"""
        return self.sent_messages.copy()

# Global mock service instances
mock_ai_service = MockAIService()
mock_twilio_service = MockTwilioService() 