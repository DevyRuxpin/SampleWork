"""
Rate limiting for the social media scraper.
Handles platform-specific rate limits and intelligent throttling.
"""

import asyncio
import time
import random
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from collections import defaultdict, deque

from ..utils.logger import get_logger, log_rate_limit

logger = get_logger("rate_limiter")

@dataclass
class RateLimit:
    """Rate limit configuration for a platform."""
    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    burst_limit: int
    cooldown_period: float
    jitter_range: float = 0.1

class RateLimiter:
    """
    Manages rate limiting for different platforms.
    Implements token bucket algorithm with platform-specific limits.
    """
    
    def __init__(self):
        """Initialize rate limiter with platform-specific configurations."""
        # Platform-specific rate limits
        self.rate_limits = {
            "twitter": RateLimit(
                requests_per_minute=15,
                requests_per_hour=300,
                requests_per_day=1000,
                burst_limit=5,
                cooldown_period=2.0
            ),
            "instagram": RateLimit(
                requests_per_minute=10,
                requests_per_hour=200,
                requests_per_day=500,
                burst_limit=3,
                cooldown_period=3.0
            ),
            "facebook": RateLimit(
                requests_per_minute=20,
                requests_per_hour=400,
                requests_per_day=1000,
                burst_limit=8,
                cooldown_period=2.5
            ),
            "linkedin": RateLimit(
                requests_per_minute=8,
                requests_per_hour=150,
                requests_per_day=300,
                burst_limit=2,
                cooldown_period=3.0
            ),
            "tiktok": RateLimit(
                requests_per_minute=12,
                requests_per_hour=250,
                requests_per_day=600,
                burst_limit=4,
                cooldown_period=2.5
            ),
            "general": RateLimit(
                requests_per_minute=30,
                requests_per_hour=500,
                requests_per_day=2000,
                burst_limit=10,
                cooldown_period=1.0
            )
        }
        
        # Request tracking
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.last_request_time: Dict[str, datetime] = defaultdict(lambda: datetime.min)
        self.burst_count: Dict[str, int] = defaultdict(int)
        self.backoff_multiplier: Dict[str, float] = defaultdict(lambda: 1.0)
        
        # Global settings
        self.enabled = True
        self.default_delay = 1.0
        self.max_backoff = 60.0
        self.backoff_reset_time = timedelta(minutes=5)
    
    async def acquire(self, platform: str = "general") -> bool:
        """
        Acquire permission to make a request.
        
        Args:
            platform: Platform name for rate limiting
            
        Returns:
            True if request is allowed, False otherwise
        """
        if not self.enabled:
            return True
        
        platform = platform.lower()
        rate_limit = self.rate_limits.get(platform, self.rate_limits["general"])
        
        # Check if we're in a backoff period
        if self._is_in_backoff(platform):
            return False
        
        # Check rate limits
        if not self._check_rate_limits(platform, rate_limit):
            return False
        
        # Record the request
        self._record_request(platform)
        
        return True
    
    async def wait_if_needed(self, platform: str = "general"):
        """
        Wait if rate limiting is needed.
        
        Args:
            platform: Platform name
        """
        if not self.enabled:
            return
        
        platform = platform.lower()
        rate_limit = self.rate_limits.get(platform, self.rate_limits["general"])
        
        # Calculate delay
        delay = self._calculate_delay(platform, rate_limit)
        
        if delay > 0:
            log_rate_limit(platform, delay)
            await asyncio.sleep(delay)
    
    def mark_request_success(self, platform: str):
        """
        Mark a request as successful.
        
        Args:
            platform: Platform name
        """
        platform = platform.lower()
        
        # Reset backoff on success
        if self.backoff_multiplier[platform] > 1.0:
            self.backoff_multiplier[platform] = max(1.0, self.backoff_multiplier[platform] * 0.8)
            logger.info(f"Reduced backoff for {platform}: {self.backoff_multiplier[platform]:.2f}")
    
    def mark_request_failed(self, platform: str, error_type: str = "rate_limit"):
        """
        Mark a request as failed and adjust rate limiting.
        
        Args:
            platform: Platform name
            error_type: Type of error (rate_limit, timeout, etc.)
        """
        platform = platform.lower()
        
        if error_type in ["rate_limit", "429", "too_many_requests"]:
            # Increase backoff multiplier
            self.backoff_multiplier[platform] = min(
                self.max_backoff,
                self.backoff_multiplier[platform] * 2.0
            )
            
            # Set backoff period
            self.last_request_time[platform] = datetime.now()
            
            logger.warning(f"Rate limit hit for {platform}, backoff: {self.backoff_multiplier[platform]:.2f}")
        
        elif error_type in ["timeout", "connection_error"]:
            # Moderate backoff for connection issues
            self.backoff_multiplier[platform] = min(
                self.max_backoff,
                self.backoff_multiplier[platform] * 1.5
            )
    
    def _check_rate_limits(self, platform: str, rate_limit: RateLimit) -> bool:
        """
        Check if request is within rate limits.
        
        Args:
            platform: Platform name
            rate_limit: Rate limit configuration
            
        Returns:
            True if within limits, False otherwise
        """
        now = datetime.now()
        history = self.request_history[platform]
        
        # Remove old requests
        cutoff_minute = now - timedelta(minutes=1)
        cutoff_hour = now - timedelta(hours=1)
        cutoff_day = now - timedelta(days=1)
        
        # Count recent requests
        requests_last_minute = sum(1 for req_time in history if req_time > cutoff_minute)
        requests_last_hour = sum(1 for req_time in history if req_time > cutoff_hour)
        requests_last_day = sum(1 for req_time in history if req_time > cutoff_day)
        
        # Check limits
        if requests_last_minute >= rate_limit.requests_per_minute:
            logger.debug(f"Minute limit exceeded for {platform}: {requests_last_minute}/{rate_limit.requests_per_minute}")
            return False
        
        if requests_last_hour >= rate_limit.requests_per_hour:
            logger.debug(f"Hour limit exceeded for {platform}: {requests_last_hour}/{rate_limit.requests_per_hour}")
            return False
        
        if requests_last_day >= rate_limit.requests_per_day:
            logger.debug(f"Day limit exceeded for {platform}: {requests_last_day}/{rate_limit.requests_per_day}")
            return False
        
        # Check burst limit
        if self.burst_count[platform] >= rate_limit.burst_limit:
            logger.debug(f"Burst limit exceeded for {platform}: {self.burst_count[platform]}/{rate_limit.burst_limit}")
            return False
        
        return True
    
    def _calculate_delay(self, platform: str, rate_limit: RateLimit) -> float:
        """
        Calculate delay needed before next request.
        
        Args:
            platform: Platform name
            rate_limit: Rate limit configuration
            
        Returns:
            Delay in seconds
        """
        now = datetime.now()
        last_request = self.last_request_time[platform]
        
        # Base delay from rate limit
        base_delay = rate_limit.cooldown_period
        
        # Add backoff multiplier
        delay = base_delay * self.backoff_multiplier[platform]
        
        # Add jitter to avoid thundering herd
        jitter = random.uniform(-rate_limit.jitter_range, rate_limit.jitter_range)
        delay = max(0, delay * (1 + jitter))
        
        # Ensure minimum delay between requests
        time_since_last = (now - last_request).total_seconds()
        if time_since_last < delay:
            return delay - time_since_last
        
        return 0.0
    
    def _record_request(self, platform: str):
        """Record a request in the history."""
        now = datetime.now()
        self.request_history[platform].append(now)
        self.last_request_time[platform] = now
        self.burst_count[platform] += 1
        
        # Reset burst count after cooldown period
        rate_limit = self.rate_limits.get(platform, self.rate_limits["general"])
        asyncio.create_task(self._reset_burst_count(platform, rate_limit.cooldown_period))
    
    async def _reset_burst_count(self, platform: str, delay: float):
        """Reset burst count after delay."""
        await asyncio.sleep(delay)
        self.burst_count[platform] = max(0, self.burst_count[platform] - 1)
    
    def _is_in_backoff(self, platform: str) -> bool:
        """
        Check if platform is in backoff period.
        
        Args:
            platform: Platform name
            
        Returns:
            True if in backoff, False otherwise
        """
        if self.backoff_multiplier[platform] <= 1.0:
            return False
        
        last_request = self.last_request_time[platform]
        backoff_duration = timedelta(seconds=self.rate_limits[platform].cooldown_period * self.backoff_multiplier[platform])
        
        return datetime.now() - last_request < backoff_duration
    
    def set_rate_limit(self, platform: str, rate_limit: RateLimit):
        """
        Set custom rate limit for a platform.
        
        Args:
            platform: Platform name
            rate_limit: Rate limit configuration
        """
        self.rate_limits[platform.lower()] = rate_limit
        logger.info(f"Set custom rate limit for {platform}")
    
    def get_rate_limit(self, platform: str) -> RateLimit:
        """
        Get rate limit for a platform.
        
        Args:
            platform: Platform name
            
        Returns:
            Rate limit configuration
        """
        return self.rate_limits.get(platform.lower(), self.rate_limits["general"])
    
    def get_stats(self, platform: str = None) -> Dict:
        """
        Get rate limiter statistics.
        
        Args:
            platform: Platform name (None for all platforms)
            
        Returns:
            Statistics dictionary
        """
        if platform:
            platform = platform.lower()
            history = self.request_history[platform]
            now = datetime.now()
            
            return {
                "platform": platform,
                "requests_last_minute": sum(1 for req_time in history if req_time > now - timedelta(minutes=1)),
                "requests_last_hour": sum(1 for req_time in history if req_time > now - timedelta(hours=1)),
                "requests_last_day": sum(1 for req_time in history if req_time > now - timedelta(days=1)),
                "burst_count": self.burst_count[platform],
                "backoff_multiplier": self.backoff_multiplier[platform],
                "last_request": self.last_request_time[platform].isoformat(),
                "rate_limit": {
                    "requests_per_minute": self.rate_limits[platform].requests_per_minute,
                    "requests_per_hour": self.rate_limits[platform].requests_per_hour,
                    "requests_per_day": self.rate_limits[platform].requests_per_day,
                    "burst_limit": self.rate_limits[platform].burst_limit,
                    "cooldown_period": self.rate_limits[platform].cooldown_period
                }
            }
        else:
            return {
                "enabled": self.enabled,
                "platforms": list(self.rate_limits.keys()),
                "total_requests": sum(len(history) for history in self.request_history.values()),
                "backoff_multipliers": dict(self.backoff_multiplier)
            }
    
    def reset(self, platform: str = None):
        """
        Reset rate limiter state.
        
        Args:
            platform: Platform name (None for all platforms)
        """
        if platform:
            platform = platform.lower()
            self.request_history[platform].clear()
            self.burst_count[platform] = 0
            self.backoff_multiplier[platform] = 1.0
            self.last_request_time[platform] = datetime.min
            logger.info(f"Reset rate limiter for {platform}")
        else:
            self.request_history.clear()
            self.burst_count.clear()
            self.backoff_multiplier.clear()
            self.last_request_time.clear()
            logger.info("Reset all rate limiters")
    
    def enable(self):
        """Enable rate limiting."""
        self.enabled = True
        logger.info("Rate limiting enabled")
    
    def disable(self):
        """Disable rate limiting."""
        self.enabled = False
        logger.info("Rate limiting disabled") 