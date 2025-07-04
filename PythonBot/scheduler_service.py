import asyncio
import schedule
import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from database import db
from twilio_service import twilio_service
from ai_service import ai_service

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.running = False
        self.reminder_task = None
    
    async def start(self):
        """Start the scheduler service"""
        if self.running:
            return
        
        self.running = True
        logger.info("Starting scheduler service...")
        
        # Schedule reminder checks
        schedule.every(1).minutes.do(self.check_reminders)
        
        # Start the scheduler loop
        self.reminder_task = asyncio.create_task(self._run_scheduler())
        
        logger.info("Scheduler service started")
    
    async def stop(self):
        """Stop the scheduler service"""
        if not self.running:
            return
        
        self.running = False
        if self.reminder_task:
            self.reminder_task.cancel()
        
        logger.info("Scheduler service stopped")
    
    async def _run_scheduler(self):
        """Run the scheduler loop"""
        while self.running:
            try:
                schedule.run_pending()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(60)
    
    async def check_reminders(self):
        """Check for calls that need reminders"""
        try:
            # Get calls scheduled in the next 15-20 minutes
            now = datetime.utcnow()
            reminder_start = now + timedelta(minutes=15)
            reminder_end = now + timedelta(minutes=20)
            
            upcoming_calls = await db.get_upcoming_calls(limit=50)
            
            for call in upcoming_calls:
                scheduled_time = call.get('scheduled_time')
                if isinstance(scheduled_time, str):
                    scheduled_time = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
                
                if reminder_start <= scheduled_time <= reminder_end:
                    # Check if reminder already sent
                    if not call.get('reminder_sent'):
                        await self.send_reminder(call)
            
        except Exception as e:
            logger.error(f"Error checking reminders: {e}")
    
    async def send_reminder(self, call_data: Dict[str, Any]):
        """Send reminder for a specific call"""
        try:
            user_phone = call_data.get('user_phone')
            if not user_phone:
                logger.error("No user phone number found for call")
                return
            
            # Generate reminder message
            reminder_message = ai_service.generate_reminder_message(call_data)
            
            # Send SMS reminder
            result = await twilio_service.send_sms(user_phone, reminder_message)
            
            if result.get('success'):
                # Mark reminder as sent
                await db.update_call(call_data.get('_id'), {'reminder_sent': True})
                logger.info(f"Reminder sent for call {call_data.get('_id')}")
            else:
                logger.error(f"Failed to send reminder: {result.get('error')}")
                
        except Exception as e:
            logger.error(f"Error sending reminder: {e}")
    
    async def schedule_call(self, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule a new call"""
        try:
            # Validate call data
            if not call_data.get('user_phone'):
                return {"success": False, "error": "Phone number is required"}
            
            if not call_data.get('scheduled_time'):
                return {"success": False, "error": "Scheduled time is required"}
            
            # Create call in database
            call_id = await db.create_call(call_data)
            
            # Send confirmation SMS
            confirmation_result = await twilio_service.send_confirmation_sms(
                call_data['user_phone'], 
                call_data
            )
            
            if confirmation_result.get('success'):
                logger.info(f"Call scheduled successfully: {call_id}")
                return {
                    "success": True,
                    "call_id": call_id,
                    "message": "Call scheduled successfully"
                }
            else:
                # Call was created but SMS failed
                logger.warning(f"Call scheduled but SMS failed: {confirmation_result.get('error')}")
                return {
                    "success": True,
                    "call_id": call_id,
                    "message": "Call scheduled but confirmation message failed to send"
                }
                
        except Exception as e:
            logger.error(f"Error scheduling call: {e}")
            return {"success": False, "error": str(e)}
    
    async def reschedule_call(self, call_id: str, new_time: datetime) -> Dict[str, Any]:
        """Reschedule an existing call"""
        try:
            # Get current call data
            call_data = await db.get_call(call_id)
            if not call_data:
                return {"success": False, "error": "Call not found"}
            
            old_time = call_data.get('scheduled_time')
            
            # Update call with new time
            update_data = {
                'scheduled_time': new_time,
                'status': 'rescheduled',
                'reminder_sent': False  # Reset reminder flag
            }
            
            success = await db.update_call(call_id, update_data)
            if not success:
                return {"success": False, "error": "Failed to update call"}
            
            # Send reschedule confirmation
            reschedule_result = await twilio_service.send_reschedule_sms(
                call_data['user_phone'],
                str(old_time),
                str(new_time)
            )
            
            if reschedule_result.get('success'):
                logger.info(f"Call rescheduled successfully: {call_id}")
                return {
                    "success": True,
                    "message": "Call rescheduled successfully"
                }
            else:
                logger.warning(f"Call rescheduled but SMS failed: {reschedule_result.get('error')}")
                return {
                    "success": True,
                    "message": "Call rescheduled but confirmation message failed to send"
                }
                
        except Exception as e:
            logger.error(f"Error rescheduling call: {e}")
            return {"success": False, "error": str(e)}
    
    async def cancel_call(self, call_id: str) -> Dict[str, Any]:
        """Cancel an existing call"""
        try:
            # Get call data
            call_data = await db.get_call(call_id)
            if not call_data:
                return {"success": False, "error": "Call not found"}
            
            # Update call status
            success = await db.update_call(call_id, {'status': 'cancelled'})
            if not success:
                return {"success": False, "error": "Failed to update call"}
            
            # Send cancellation confirmation
            cancellation_result = await twilio_service.send_cancellation_sms(
                call_data['user_phone'],
                call_data
            )
            
            if cancellation_result.get('success'):
                logger.info(f"Call cancelled successfully: {call_id}")
                return {
                    "success": True,
                    "message": "Call cancelled successfully"
                }
            else:
                logger.warning(f"Call cancelled but SMS failed: {cancellation_result.get('error')}")
                return {
                    "success": True,
                    "message": "Call cancelled but confirmation message failed to send"
                }
                
        except Exception as e:
            logger.error(f"Error cancelling call: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_user_calls(self, user_phone: str) -> List[Dict[str, Any]]:
        """Get all calls for a user"""
        try:
            calls = await db.get_calls_by_user(user_phone)
            return calls
        except Exception as e:
            logger.error(f"Error getting user calls: {e}")
            return []

# Global scheduler service instance
scheduler_service = SchedulerService() 