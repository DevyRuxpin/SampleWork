import openai
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from config import Config

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        openai.api_key = Config.OPENAI_API_KEY
        self.client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the phone scheduler bot"""
        return """You are a helpful phone scheduling assistant. Your role is to help users schedule, reschedule, and cancel phone calls.

Key responsibilities:
1. Understand user intent (schedule, reschedule, cancel, check calls)
2. Extract relevant information (date, time, duration, notes)
3. Provide clear, helpful responses
4. Confirm details before scheduling

Available actions:
- SCHEDULE_CALL: Schedule a new call
- RESCHEDULE_CALL: Reschedule an existing call
- CANCEL_CALL: Cancel an existing call
- CHECK_CALLS: List user's calls
- CLARIFY: Ask for more information

Response format:
{
    "intent": "SCHEDULE_CALL|RESCHEDULE_CALL|CANCEL_CALL|CHECK_CALLS|CLARIFY",
    "confidence": 0.0-1.0,
    "extracted_data": {
        "date": "YYYY-MM-DD",
        "time": "HH:MM",
        "duration_minutes": 30,
        "notes": "optional notes"
    },
    "response": "Your response to the user",
    "requires_confirmation": true/false
}

Be friendly, professional, and helpful. Always confirm important details before scheduling."""
    
    def _get_context_prompt(self, user_calls: List[Dict], conversation_history: List[Dict]) -> str:
        """Generate context prompt with user's call history and conversation"""
        context = "User's scheduled calls:\n"
        
        if user_calls:
            for call in user_calls[:5]:  # Show last 5 calls
                scheduled_time = call.get('scheduled_time', '')
                if isinstance(scheduled_time, str):
                    scheduled_time = scheduled_time[:16]  # Format datetime string
                context += f"- {scheduled_time} ({call.get('duration_minutes', 30)}min) - {call.get('status', 'scheduled')}\n"
        else:
            context += "- No calls scheduled\n"
        
        if conversation_history:
            context += "\nRecent conversation:\n"
            for msg in conversation_history[-3:]:  # Last 3 messages
                context += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
        
        return context
    
    async def process_message(self, user_message: str, user_phone: str, 
                            user_calls: List[Dict], conversation_history: List[Dict]) -> Dict[str, Any]:
        """Process user message and return structured response"""
        try:
            system_prompt = self._get_system_prompt()
            context_prompt = self._get_context_prompt(user_calls, conversation_history)
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{context_prompt}\n\nUser message: {user_message}"}
            ]
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON response
            try:
                parsed_response = json.loads(content)
                return parsed_response
            except json.JSONDecodeError:
                # Fallback response if JSON parsing fails
                return {
                    "intent": "CLARIFY",
                    "confidence": 0.5,
                    "extracted_data": {},
                    "response": "I'm having trouble understanding. Could you please rephrase that?",
                    "requires_confirmation": False
                }
                
        except Exception as e:
            logger.error(f"Error processing message with AI: {e}")
            return {
                "intent": "CLARIFY",
                "confidence": 0.0,
                "extracted_data": {},
                "response": "I'm experiencing technical difficulties. Please try again in a moment.",
                "requires_confirmation": False
            }
    
    def generate_confirmation_message(self, intent: str, extracted_data: Dict[str, Any]) -> str:
        """Generate a confirmation message for the user"""
        if intent == "SCHEDULE_CALL":
            date = extracted_data.get('date', '')
            time = extracted_data.get('time', '')
            duration = extracted_data.get('duration_minutes', 30)
            notes = extracted_data.get('notes', '')
            
            message = f"Perfect! I'll schedule a call for {date} at {time} for {duration} minutes."
            if notes:
                message += f" Notes: {notes}"
            message += "\n\nPlease confirm: 'yes' to schedule or 'no' to cancel."
            
        elif intent == "RESCHEDULE_CALL":
            date = extracted_data.get('date', '')
            time = extracted_data.get('time', '')
            message = f"I'll reschedule your call to {date} at {time}. Please confirm: 'yes' to reschedule or 'no' to keep the original time."
            
        elif intent == "CANCEL_CALL":
            message = "I'll cancel your upcoming call. Please confirm: 'yes' to cancel or 'no' to keep it scheduled."
            
        else:
            message = "Please confirm this action."
            
        return message
    
    def generate_success_message(self, intent: str, extracted_data: Dict[str, Any]) -> str:
        """Generate a success message after action completion"""
        if intent == "SCHEDULE_CALL":
            date = extracted_data.get('date', '')
            time = extracted_data.get('time', '')
            duration = extracted_data.get('duration_minutes', 30)
            return f"Great! Your call has been scheduled for {date} at {time} for {duration} minutes. You'll receive a reminder 15 minutes before the call."
            
        elif intent == "RESCHEDULE_CALL":
            date = extracted_data.get('date', '')
            time = extracted_data.get('time', '')
            return f"Perfect! Your call has been rescheduled to {date} at {time}. You'll receive an updated reminder."
            
        elif intent == "CANCEL_CALL":
            return "Your call has been cancelled successfully. Feel free to schedule a new call anytime!"
            
        else:
            return "Action completed successfully!"
    
    def extract_datetime(self, text: str) -> Optional[Dict[str, str]]:
        """Extract date and time from text using AI"""
        try:
            prompt = f"""Extract date and time from this text: "{text}"
            
            Return only a JSON object with:
            {{
                "date": "YYYY-MM-DD",
                "time": "HH:MM"
            }}
            
            If no specific date/time found, return null."""
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=100
            )
            
            content = response.choices[0].message.content.strip()
            if content.lower() == "null":
                return None
                
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Error extracting datetime: {e}")
            return None
    
    def generate_reminder_message(self, call_data: Dict[str, Any]) -> str:
        """Generate a reminder message for upcoming calls"""
        scheduled_time = call_data.get('scheduled_time', '')
        duration = call_data.get('duration_minutes', 30)
        
        return f"Reminder: You have a {duration}-minute call scheduled in 15 minutes at {scheduled_time}. Please be ready!"

# Global AI service instance
ai_service = AIService() 