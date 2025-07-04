from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from config import Config

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self._connected = False
    
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(Config.MONGODB_URI)
            # Test the connection
            self.client.admin.command('ping')
            self.db = self.client.phone_scheduler
            self._connected = True
            logger.info("Successfully connected to MongoDB")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self._connected = False
            # Don't raise the exception, just log it
    
    def is_connected(self) -> bool:
        """Check if database is connected"""
        return self._connected and self.client is not None and self.db is not None
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def get_collection(self, collection_name: str):
        """Get a MongoDB collection"""
        if not self.is_connected():
            raise Exception("Database not connected")
        return self.db[collection_name]
    
    # Call operations
    async def create_call(self, call_data: Dict[str, Any]) -> str:
        """Create a new call record"""
        collection = self.get_collection("calls")
        call_data["created_at"] = datetime.utcnow()
        call_data["updated_at"] = datetime.utcnow()
        result = collection.insert_one(call_data)
        return str(result.inserted_id)
    
    async def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        """Get a call by ID"""
        collection = self.get_collection("calls")
        from bson import ObjectId
        call = collection.find_one({"_id": ObjectId(call_id)})
        if call and "_id" in call:
            call["_id"] = str(call["_id"])
        return call
    
    async def get_calls_by_user(self, user_phone: str) -> List[Dict[str, Any]]:
        """Get all calls for a user"""
        collection = self.get_collection("calls")
        calls = list(collection.find({"user_phone": user_phone}).sort("scheduled_time", -1))
        # Convert ObjectId to string for JSON serialization
        for call in calls:
            if "_id" in call:
                call["_id"] = str(call["_id"])
        return calls
    
    async def update_call(self, call_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a call record"""
        collection = self.get_collection("calls")
        from bson import ObjectId
        update_data["updated_at"] = datetime.utcnow()
        result = collection.update_one(
            {"_id": ObjectId(call_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_call(self, call_id: str) -> bool:
        """Delete a call record"""
        collection = self.get_collection("calls")
        from bson import ObjectId
        result = collection.delete_one({"_id": ObjectId(call_id)})
        return result.deleted_count > 0
    
    async def get_upcoming_calls(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get upcoming calls"""
        collection = self.get_collection("calls")
        calls = list(collection.find({
            "scheduled_time": {"$gte": datetime.utcnow()},
            "status": "scheduled"
        }).sort("scheduled_time", 1).limit(limit))
        # Convert ObjectId to string for JSON serialization
        for call in calls:
            if "_id" in call:
                call["_id"] = str(call["_id"])
        return calls
    
    # User operations
    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """Create a new user record"""
        collection = self.get_collection("users")
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        result = collection.insert_one(user_data)
        return str(result.inserted_id)
    
    async def get_user(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Get a user by phone number"""
        collection = self.get_collection("users")
        user = collection.find_one({"phone_number": phone_number})
        if user and "_id" in user:
            user["_id"] = str(user["_id"])
        return user
    
    async def update_user(self, phone_number: str, update_data: Dict[str, Any]) -> bool:
        """Update a user record"""
        collection = self.get_collection("users")
        update_data["updated_at"] = datetime.utcnow()
        result = collection.update_one(
            {"phone_number": phone_number},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    # Conversation operations
    async def create_conversation(self, conversation_data: Dict[str, Any]) -> str:
        """Create a new conversation record"""
        collection = self.get_collection("conversations")
        conversation_data["created_at"] = datetime.utcnow()
        conversation_data["updated_at"] = datetime.utcnow()
        result = collection.insert_one(conversation_data)
        return str(result.inserted_id)
    
    async def get_conversation(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by session ID"""
        collection = self.get_collection("conversations")
        return collection.find_one({"session_id": session_id})
    
    async def update_conversation(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a conversation record"""
        collection = self.get_collection("conversations")
        update_data["updated_at"] = datetime.utcnow()
        result = collection.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def add_message_to_conversation(self, session_id: str, message: Dict[str, Any]) -> bool:
        """Add a message to a conversation"""
        collection = self.get_collection("conversations")
        result = collection.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0

# Global database instance
db = Database() 