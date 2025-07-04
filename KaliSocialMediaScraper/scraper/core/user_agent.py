"""
User agent rotation for the social media scraper.
Handles user agent generation, rotation, and caching.
"""

import random
import json
import os
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from fake_useragent import UserAgent

from ..utils.logger import get_logger

logger = get_logger("user_agent")

class UserAgentRotator:
    """
    Manages user agent rotation to avoid detection.
    Uses fake-useragent library and custom user agents.
    """
    
    def __init__(
        self,
        rotation_enabled: bool = True,
        rotation_interval: int = 100,
        cache_file: str = "data/user_agents.json"
    ):
        """
        Initialize user agent rotator.
        
        Args:
            rotation_enabled: Whether to enable user agent rotation
            rotation_interval: Number of requests before rotation
            cache_file: File to cache user agents
        """
        self.rotation_enabled = rotation_enabled
        self.rotation_interval = rotation_interval
        self.cache_file = cache_file
        
        self.user_agents: List[str] = []
        self.current_user_agent: Optional[str] = None
        self.request_count = 0
        self.last_rotation = datetime.now()
        
        # Custom user agents for different platforms
        self.custom_user_agents = {
            "twitter": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0"
            ],
            "instagram": [
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1",
                "Mozilla/5.0 (iPad; CPU OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1",
                "Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ],
            "facebook": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1"
            ],
            "linkedin": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0"
            ],
            "tiktok": [
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1",
                "Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                "Mozilla/5.0 (iPad; CPU OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ],
            "general": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1",
                "Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            ]
        }
        
        # Ensure cache directory exists
        os.makedirs(os.path.dirname(cache_file), exist_ok=True)
        
        # Initialize user agents
        self._initialize_user_agents()
    
    def _initialize_user_agents(self):
        """Initialize user agents from cache or generate new ones."""
        if self._load_cached_user_agents():
            logger.info(f"Loaded {len(self.user_agents)} cached user agents")
        else:
            self._generate_user_agents()
            self._save_cached_user_agents()
            logger.info(f"Generated {len(self.user_agents)} new user agents")
        
        # Set initial user agent
        if self.user_agents:
            self.current_user_agent = random.choice(self.user_agents)
    
    def _generate_user_agents(self):
        """Generate user agents using fake-useragent and custom ones."""
        self.user_agents = []
        
        try:
            # Use fake-useragent library
            ua = UserAgent()
            
            # Generate different types of user agents
            browsers = ['chrome', 'firefox', 'safari', 'edge']
            for browser in browsers:
                try:
                    for _ in range(5):  # 5 user agents per browser
                        user_agent = getattr(ua, browser)
                        if user_agent and user_agent not in self.user_agents:
                            self.user_agents.append(user_agent)
                except Exception as e:
                    logger.warning(f"Error generating {browser} user agent: {e}")
        except Exception as e:
            logger.warning(f"Error using fake-useragent: {e}")
        
        # Add custom user agents
        for platform_agents in self.custom_user_agents.values():
            self.user_agents.extend(platform_agents)
        
        # Remove duplicates and ensure we have enough
        self.user_agents = list(set(self.user_agents))
        
        # If we still don't have enough, add some fallback ones
        if len(self.user_agents) < 10:
            fallback_agents = [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0"
            ]
            for agent in fallback_agents:
                if agent not in self.user_agents:
                    self.user_agents.append(agent)
    
    def get_user_agent(self, platform: str = "general") -> str:
        """
        Get a user agent for the specified platform.
        
        Args:
            platform: Platform name for platform-specific user agents
            
        Returns:
            User agent string
        """
        if not self.rotation_enabled:
            return self.current_user_agent or self.user_agents[0] if self.user_agents else ""
        
        # Check if we should rotate
        if self._should_rotate():
            self._rotate_user_agent()
        
        # Increment request count
        self.request_count += 1
        
        # Return platform-specific user agent if available
        if platform in self.custom_user_agents:
            return random.choice(self.custom_user_agents[platform])
        
        return self.current_user_agent or random.choice(self.user_agents)
    
    def get_platform_user_agent(self, platform: str) -> str:
        """
        Get a platform-specific user agent.
        
        Args:
            platform: Platform name
            
        Returns:
            Platform-specific user agent
        """
        if platform in self.custom_user_agents:
            return random.choice(self.custom_user_agents[platform])
        
        return self.get_user_agent()
    
    def _should_rotate(self) -> bool:
        """Check if user agent should be rotated."""
        return (
            self.request_count >= self.rotation_interval or
            datetime.now() - self.last_rotation > timedelta(minutes=30)
        )
    
    def _rotate_user_agent(self):
        """Rotate to a new user agent."""
        if not self.user_agents:
            return
        
        old_user_agent = self.current_user_agent
        self.current_user_agent = random.choice(self.user_agents)
        
        # Ensure we don't get the same user agent
        while self.current_user_agent == old_user_agent and len(self.user_agents) > 1:
            self.current_user_agent = random.choice(self.user_agents)
        
        self.request_count = 0
        self.last_rotation = datetime.now()
        
        logger.debug(f"Rotated user agent: {self.current_user_agent[:50]}...")
    
    def add_custom_user_agent(self, user_agent: str, platform: str = "general"):
        """
        Add a custom user agent.
        
        Args:
            user_agent: User agent string
            platform: Platform to associate with
        """
        if user_agent not in self.user_agents:
            self.user_agents.append(user_agent)
        
        if platform not in self.custom_user_agents:
            self.custom_user_agents[platform] = []
        
        if user_agent not in self.custom_user_agents[platform]:
            self.custom_user_agents[platform].append(user_agent)
        
        logger.info(f"Added custom user agent for {platform}")
    
    def remove_user_agent(self, user_agent: str):
        """
        Remove a user agent.
        
        Args:
            user_agent: User agent to remove
        """
        if user_agent in self.user_agents:
            self.user_agents.remove(user_agent)
        
        for platform_agents in self.custom_user_agents.values():
            if user_agent in platform_agents:
                platform_agents.remove(user_agent)
        
        # If we removed the current user agent, get a new one
        if self.current_user_agent == user_agent:
            self._rotate_user_agent()
        
        logger.info(f"Removed user agent: {user_agent[:50]}...")
    
    def _load_cached_user_agents(self) -> bool:
        """Load user agents from cache file."""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    data = json.load(f)
                
                self.user_agents = data.get("user_agents", [])
                self.custom_user_agents = data.get("custom_user_agents", self.custom_user_agents)
                
                # Check if cache is recent (less than 7 days old)
                cache_time = datetime.fromisoformat(data.get("timestamp", "2000-01-01"))
                if datetime.now() - cache_time < timedelta(days=7):
                    return True
        except Exception as e:
            logger.error(f"Error loading cached user agents: {e}")
        
        return False
    
    def _save_cached_user_agents(self):
        """Save user agents to cache file."""
        try:
            data = {
                "timestamp": datetime.now().isoformat(),
                "user_agents": self.user_agents,
                "custom_user_agents": self.custom_user_agents
            }
            
            with open(self.cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved {len(self.user_agents)} user agents to cache")
        except Exception as e:
            logger.error(f"Error saving cached user agents: {e}")
    
    def get_stats(self) -> Dict:
        """Get user agent rotator statistics."""
        return {
            "total_user_agents": len(self.user_agents),
            "current_user_agent": self.current_user_agent[:50] + "..." if self.current_user_agent else None,
            "request_count": self.request_count,
            "rotation_interval": self.rotation_interval,
            "last_rotation": self.last_rotation.isoformat(),
            "rotation_enabled": self.rotation_enabled,
            "platforms": list(self.custom_user_agents.keys())
        }
    
    def reset(self):
        """Reset the user agent rotator."""
        self.request_count = 0
        self.last_rotation = datetime.now()
        self._rotate_user_agent()
        logger.info("User agent rotator reset") 