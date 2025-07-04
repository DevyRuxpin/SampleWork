"""
Database management for the social media scraper.
Handles data storage, retrieval, and database operations.
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Union
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager

from ..utils.logger import get_logger
from ..utils.helpers import parse_date

logger = get_logger("database")

Base = declarative_base()

class ScrapedPost(Base):
    """Base model for scraped social media posts."""
    __tablename__ = "scraped_posts"
    
    id = Column(Integer, primary_key=True)
    platform = Column(String(50), nullable=False, index=True)
    post_id = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    content = Column(Text)
    timestamp = Column(DateTime, index=True)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    views = Column(Integer, default=0)
    url = Column(String(500))
    media_urls = Column(JSON)
    hashtags = Column(JSON)
    mentions = Column(JSON)
    location = Column(String(255))
    language = Column(String(10))
    sentiment = Column(Float)
    is_verified = Column(Boolean, default=False)
    is_retweet = Column(Boolean, default=False)
    is_reply = Column(Boolean, default=False)
    parent_post_id = Column(String(255))
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ScrapedUser(Base):
    """Model for scraped user profiles."""
    __tablename__ = "scraped_users"
    
    id = Column(Integer, primary_key=True)
    platform = Column(String(50), nullable=False, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    username = Column(String(255), nullable=False, index=True)
    display_name = Column(String(255))
    bio = Column(Text)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    private = Column(Boolean, default=False)
    location = Column(String(255))
    website = Column(String(500))
    joined_date = Column(DateTime)
    profile_image_url = Column(String(500))
    banner_image_url = Column(String(500))
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ScrapingSession(Base):
    """Model for tracking scraping sessions."""
    __tablename__ = "scraping_sessions"
    
    id = Column(Integer, primary_key=True)
    platform = Column(String(50), nullable=False, index=True)
    target = Column(String(255), nullable=False, index=True)
    target_type = Column(String(50))  # user, hashtag, keyword, etc.
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    posts_scraped = Column(Integer, default=0)
    users_scraped = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    status = Column(String(50), default="running")  # running, completed, failed
    config = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class DatabaseManager:
    """
    Manages database operations for the social media scraper.
    Handles data storage, retrieval, and database maintenance.
    """
    
    def __init__(self, database_url: str = None):
        """
        Initialize database manager.
        
        Args:
            database_url: Database connection URL
        """
        if database_url is None:
            # Default to SQLite
            database_url = "sqlite:///./data/scraper.db"
        
        self.database_url = database_url
        self.engine = create_engine(database_url, echo=False)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Create tables
        self._create_tables()
        
        logger.info(f"Database initialized: {database_url}")
    
    def _create_tables(self):
        """Create database tables if they don't exist."""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created/verified")
        except SQLAlchemyError as e:
            logger.error(f"Error creating database tables: {e}")
            raise
    
    @contextmanager
    def get_session(self):
        """Get a database session with automatic cleanup."""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    def save_post(self, post_data: Dict[str, Any]) -> bool:
        """
        Save a scraped post to the database.
        
        Args:
            post_data: Post data dictionary
            
        Returns:
            True if saved successfully, False otherwise
        """
        try:
            with self.get_session() as session:
                # Check if post already exists
                existing_post = session.query(ScrapedPost).filter_by(
                    platform=post_data["platform"],
                    post_id=post_data["post_id"]
                ).first()
                
                if existing_post:
                    # Update existing post
                    for key, value in post_data.items():
                        if hasattr(existing_post, key):
                            setattr(existing_post, key, value)
                    existing_post.updated_at = datetime.utcnow()
                else:
                    # Create new post
                    post = ScrapedPost(**post_data)
                    session.add(post)
                
                return True
        except Exception as e:
            logger.error(f"Error saving post: {e}")
            return False
    
    def save_user(self, user_data: Dict[str, Any]) -> bool:
        """
        Save a scraped user to the database.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            True if saved successfully, False otherwise
        """
        try:
            with self.get_session() as session:
                # Check if user already exists
                existing_user = session.query(ScrapedUser).filter_by(
                    platform=user_data["platform"],
                    user_id=user_data["user_id"]
                ).first()
                
                if existing_user:
                    # Update existing user
                    for key, value in user_data.items():
                        if hasattr(existing_user, key):
                            setattr(existing_user, key, value)
                    existing_user.updated_at = datetime.utcnow()
                else:
                    # Create new user
                    user = ScrapedUser(**user_data)
                    session.add(user)
                
                return True
        except Exception as e:
            logger.error(f"Error saving user: {e}")
            return False
    
    def create_session(self, session_data: Dict[str, Any]) -> int:
        """
        Create a new scraping session.
        
        Args:
            session_data: Session data dictionary
            
        Returns:
            Session ID
        """
        try:
            with self.get_session() as session:
                scraping_session = ScrapingSession(**session_data)
                session.add(scraping_session)
                session.flush()  # Get the ID
                return scraping_session.id
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return None
    
    def update_session(self, session_id: int, **kwargs) -> bool:
        """
        Update a scraping session.
        
        Args:
            session_id: Session ID
            **kwargs: Fields to update
            
        Returns:
            True if updated successfully, False otherwise
        """
        try:
            with self.get_session() as session:
                scraping_session = session.query(ScrapingSession).filter_by(id=session_id).first()
                if scraping_session:
                    for key, value in kwargs.items():
                        if hasattr(scraping_session, key):
                            setattr(scraping_session, key, value)
                    return True
                return False
        except Exception as e:
            logger.error(f"Error updating session: {e}")
            return False
    
    def get_posts(
        self,
        platform: str = None,
        author: str = None,
        limit: int = 100,
        offset: int = 0,
        order_by: str = "timestamp",
        order_desc: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get posts from the database.
        
        Args:
            platform: Filter by platform
            author: Filter by author
            limit: Number of posts to return
            offset: Number of posts to skip
            order_by: Field to order by
            order_desc: Order descending if True
            
        Returns:
            List of post dictionaries
        """
        try:
            with self.get_session() as session:
                query = session.query(ScrapedPost)
                
                if platform:
                    query = query.filter(ScrapedPost.platform == platform)
                
                if author:
                    query = query.filter(ScrapedPost.author == author)
                
                # Order by
                if hasattr(ScrapedPost, order_by):
                    order_field = getattr(ScrapedPost, order_by)
                    if order_desc:
                        query = query.order_by(order_field.desc())
                    else:
                        query = query.order_by(order_field.asc())
                
                # Limit and offset
                query = query.limit(limit).offset(offset)
                
                posts = query.all()
                return [self._post_to_dict(post) for post in posts]
        except Exception as e:
            logger.error(f"Error getting posts: {e}")
            return []
    
    def get_users(
        self,
        platform: str = None,
        limit: int = 100,
        offset: int = 0,
        order_by: str = "followers_count",
        order_desc: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get users from the database.
        
        Args:
            platform: Filter by platform
            limit: Number of users to return
            offset: Number of users to skip
            order_by: Field to order by
            order_desc: Order descending if True
            
        Returns:
            List of user dictionaries
        """
        try:
            with self.get_session() as session:
                query = session.query(ScrapedUser)
                
                if platform:
                    query = query.filter(ScrapedUser.platform == platform)
                
                # Order by
                if hasattr(ScrapedUser, order_by):
                    order_field = getattr(ScrapedUser, order_by)
                    if order_desc:
                        query = query.order_by(order_field.desc())
                    else:
                        query = query.order_by(order_field.asc())
                
                # Limit and offset
                query = query.limit(limit).offset(offset)
                
                users = query.all()
                return [self._user_to_dict(user) for user in users]
        except Exception as e:
            logger.error(f"Error getting users: {e}")
            return []
    
    def get_sessions(
        self,
        platform: str = None,
        status: str = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get scraping sessions from the database.
        
        Args:
            platform: Filter by platform
            status: Filter by status
            limit: Number of sessions to return
            
        Returns:
            List of session dictionaries
        """
        try:
            with self.get_session() as session:
                query = session.query(ScrapingSession)
                
                if platform:
                    query = query.filter(ScrapingSession.platform == platform)
                
                if status:
                    query = query.filter(ScrapingSession.status == status)
                
                query = query.order_by(ScrapingSession.created_at.desc()).limit(limit)
                
                sessions = query.all()
                return [self._session_to_dict(session) for session in sessions]
        except Exception as e:
            logger.error(f"Error getting sessions: {e}")
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get database statistics.
        
        Returns:
            Statistics dictionary
        """
        try:
            with self.get_session() as session:
                total_posts = session.query(ScrapedPost).count()
                total_users = session.query(ScrapedUser).count()
                total_sessions = session.query(ScrapingSession).count()
                
                # Posts by platform
                posts_by_platform = {}
                for platform in session.query(ScrapedPost.platform).distinct():
                    count = session.query(ScrapedPost).filter_by(platform=platform[0]).count()
                    posts_by_platform[platform[0]] = count
                
                # Recent activity
                recent_posts = session.query(ScrapedPost).filter(
                    ScrapedPost.created_at >= datetime.utcnow() - timedelta(days=7)
                ).count()
                
                return {
                    "total_posts": total_posts,
                    "total_users": total_users,
                    "total_sessions": total_sessions,
                    "posts_by_platform": posts_by_platform,
                    "recent_posts": recent_posts
                }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {}
    
    def search_posts(
        self,
        query: str,
        platform: str = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search posts by content.
        
        Args:
            query: Search query
            platform: Filter by platform
            limit: Number of results to return
            
        Returns:
            List of matching posts
        """
        try:
            with self.get_session() as session:
                db_query = session.query(ScrapedPost).filter(
                    ScrapedPost.content.contains(query)
                )
                
                if platform:
                    db_query = db_query.filter(ScrapedPost.platform == platform)
                
                posts = db_query.order_by(ScrapedPost.timestamp.desc()).limit(limit).all()
                return [self._post_to_dict(post) for post in posts]
        except Exception as e:
            logger.error(f"Error searching posts: {e}")
            return []
    
    def delete_old_data(self, days: int = 30) -> int:
        """
        Delete old data from the database.
        
        Args:
            days: Number of days to keep
            
        Returns:
            Number of records deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            with self.get_session() as session:
                # Delete old posts
                old_posts = session.query(ScrapedPost).filter(
                    ScrapedPost.created_at < cutoff_date
                ).delete()
                
                # Delete old users (keep verified ones)
                old_users = session.query(ScrapedUser).filter(
                    ScrapedUser.created_at < cutoff_date,
                    ScrapedUser.verified == False
                ).delete()
                
                # Delete old sessions
                old_sessions = session.query(ScrapingSession).filter(
                    ScrapingSession.created_at < cutoff_date
                ).delete()
                
                total_deleted = old_posts + old_users + old_sessions
                logger.info(f"Deleted {total_deleted} old records")
                return total_deleted
        except Exception as e:
            logger.error(f"Error deleting old data: {e}")
            return 0
    
    def export_data(
        self,
        platform: str = None,
        format: str = "json",
        output_file: str = None
    ) -> bool:
        """
        Export data from the database.
        
        Args:
            platform: Filter by platform
            format: Export format (json, csv)
            output_file: Output file path
            
        Returns:
            True if exported successfully, False otherwise
        """
        try:
            posts = self.get_posts(platform=platform, limit=10000)
            users = self.get_users(platform=platform, limit=10000)
            
            data = {
                "posts": posts,
                "users": users,
                "export_date": datetime.utcnow().isoformat(),
                "platform": platform or "all"
            }
            
            if output_file is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                platform_suffix = f"_{platform}" if platform else ""
                output_file = f"data/export_{timestamp}{platform_suffix}.{format}"
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            
            if format.lower() == "json":
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            elif format.lower() == "csv":
                import pandas as pd
                
                # Convert to DataFrames
                posts_df = pd.DataFrame(posts)
                users_df = pd.DataFrame(users)
                
                # Save to CSV
                posts_df.to_csv(f"{output_file}_posts.csv", index=False)
                users_df.to_csv(f"{output_file}_users.csv", index=False)
            
            logger.info(f"Data exported to {output_file}")
            return True
        except Exception as e:
            logger.error(f"Error exporting data: {e}")
            return False
    
    def _post_to_dict(self, post: ScrapedPost) -> Dict[str, Any]:
        """Convert post object to dictionary."""
        return {
            "id": post.id,
            "platform": post.platform,
            "post_id": post.post_id,
            "author": post.author,
            "content": post.content,
            "timestamp": post.timestamp.isoformat() if post.timestamp else None,
            "likes": post.likes,
            "comments": post.comments,
            "shares": post.shares,
            "views": post.views,
            "url": post.url,
            "media_urls": post.media_urls,
            "hashtags": post.hashtags,
            "mentions": post.mentions,
            "location": post.location,
            "language": post.language,
            "sentiment": post.sentiment,
            "is_verified": post.is_verified,
            "is_retweet": post.is_retweet,
            "is_reply": post.is_reply,
            "parent_post_id": post.parent_post_id,
            "created_at": post.created_at.isoformat(),
            "updated_at": post.updated_at.isoformat()
        }
    
    def _user_to_dict(self, user: ScrapedUser) -> Dict[str, Any]:
        """Convert user object to dictionary."""
        return {
            "id": user.id,
            "platform": user.platform,
            "user_id": user.user_id,
            "username": user.username,
            "display_name": user.display_name,
            "bio": user.bio,
            "followers_count": user.followers_count,
            "following_count": user.following_count,
            "posts_count": user.posts_count,
            "verified": user.verified,
            "private": user.private,
            "location": user.location,
            "website": user.website,
            "joined_date": user.joined_date.isoformat() if user.joined_date else None,
            "profile_image_url": user.profile_image_url,
            "banner_image_url": user.banner_image_url,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat()
        }
    
    def _session_to_dict(self, session: ScrapingSession) -> Dict[str, Any]:
        """Convert session object to dictionary."""
        return {
            "id": session.id,
            "platform": session.platform,
            "target": session.target,
            "target_type": session.target_type,
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat() if session.end_time else None,
            "posts_scraped": session.posts_scraped,
            "users_scraped": session.users_scraped,
            "errors_count": session.errors_count,
            "status": session.status,
            "config": session.config,
            "created_at": session.created_at.isoformat()
        } 