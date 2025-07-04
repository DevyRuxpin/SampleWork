from twilio.rest import Client
from twilio.base.exceptions import TwilioException
import logging
from typing import Optional, Dict, Any
from config import Config

logger = logging.getLogger(__name__)

class TwilioService:
    def __init__(self):
        self.client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
        self.from_number = Config.TWILIO_PHONE_NUMBER
    
    async def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """Send SMS message via Twilio"""
        try:
            message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"SMS sent successfully to {to_number}: {message.sid}")
            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status
            }
            
        except TwilioException as e:
            logger.error(f"Twilio SMS error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error sending SMS: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def make_call(self, to_number: str, twiml_url: str) -> Dict[str, Any]:
        """Make a phone call via Twilio"""
        try:
            call = self.client.calls.create(
                url=twiml_url,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"Call initiated successfully to {to_number}: {call.sid}")
            return {
                "success": True,
                "call_sid": call.sid,
                "status": call.status
            }
            
        except TwilioException as e:
            logger.error(f"Twilio call error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error making call: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_reminder_sms(self, to_number: str, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send reminder SMS for upcoming call"""
        scheduled_time = call_data.get('scheduled_time', '')
        duration = call_data.get('duration_minutes', 30)
        
        message = f"Reminder: You have a {duration}-minute call scheduled in 15 minutes at {scheduled_time}. Please be ready!"
        
        return await self.send_sms(to_number, message)
    
    async def send_confirmation_sms(self, to_number: str, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send confirmation SMS for scheduled call"""
        scheduled_time = call_data.get('scheduled_time', '')
        duration = call_data.get('duration_minutes', 30)
        notes = call_data.get('notes', '')
        
        message = f"Call confirmed for {scheduled_time} ({duration} minutes)."
        if notes:
            message += f" Notes: {notes}"
        message += " You'll receive a reminder 15 minutes before."
        
        return await self.send_sms(to_number, message)
    
    async def send_cancellation_sms(self, to_number: str, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send cancellation confirmation SMS"""
        scheduled_time = call_data.get('scheduled_time', '')
        
        message = f"Your call scheduled for {scheduled_time} has been cancelled. Feel free to schedule a new call anytime!"
        
        return await self.send_sms(to_number, message)
    
    async def send_reschedule_sms(self, to_number: str, old_time: str, new_time: str) -> Dict[str, Any]:
        """Send reschedule confirmation SMS"""
        message = f"Your call has been rescheduled from {old_time} to {new_time}. You'll receive an updated reminder."
        
        return await self.send_sms(to_number, message)
    
    def validate_phone_number(self, phone_number: str) -> bool:
        """Validate phone number format"""
        # Basic validation - can be enhanced with more sophisticated logic
        if not phone_number:
            return False
        
        # Remove common separators
        cleaned = ''.join(filter(str.isdigit, phone_number))
        
        # Check if it's a valid length (10-15 digits)
        return 10 <= len(cleaned) <= 15
    
    def format_phone_number(self, phone_number: str) -> str:
        """Format phone number for Twilio"""
        # Remove all non-digit characters
        cleaned = ''.join(filter(str.isdigit, phone_number))
        
        # Add +1 prefix if it's a 10-digit US number
        if len(cleaned) == 10:
            return f"+1{cleaned}"
        elif len(cleaned) == 11 and cleaned.startswith('1'):
            return f"+{cleaned}"
        else:
            return f"+{cleaned}"

# Global Twilio service instance
twilio_service = TwilioService() 