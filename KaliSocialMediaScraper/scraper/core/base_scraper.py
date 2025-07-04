"""
Base scraper class for social media platforms.
Provides common functionality for HTTP requests, error handling, and data processing.
"""

import asyncio
import aiohttp
import time
import random
from typing import List, Dict, Any, Optional, Union, Callable
from datetime import datetime
from abc import ABC, abstractmethod
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .proxy_manager import ProxyManager
from .user_agent import UserAgentRotator
from .rate_limiter import RateLimiter
from .database import DatabaseManager
from ..utils.logger import get_logger, log_scraping_start, log_scraping_complete, log_error
from ..utils.helpers import clean_text, extract_hashtags, extract_mentions, extract_urls, parse_date
from ..utils.validators import validate_url

logger = get_logger("base_scraper")

class BaseScraper(ABC):
    """
    Base class for all social media scrapers.
    Provides common functionality and abstract methods for platform-specific implementation.
    """
    
    def __init__(
        self,
        platform: str,
        use_proxies: bool = True,
        use_rate_limiting: bool = True,
        use_user_agent_rotation: bool = True,
        database_url: str = None,
        max_retries: int = 3,
        timeout: int = 30,
        max_concurrent_requests: int = 5
    ):
        """
        Initialize base scraper.
        
        Args:
            platform: Platform name
            use_proxies: Whether to use proxy rotation
            use_rate_limiting: Whether to use rate limiting
            use_user_agent_rotation: Whether to rotate user agents
            database_url: Database connection URL
            max_retries: Maximum number of retries for failed requests
            timeout: Request timeout in seconds
            max_concurrent_requests: Maximum concurrent requests
        """
        self.platform = platform
        self.use_proxies = use_proxies
        self.use_rate_limiting = use_rate_limiting
        self.use_user_agent_rotation = use_user_agent_rotation
        self.max_retries = max_retries
        self.timeout = timeout
        self.max_concurrent_requests = max_concurrent_requests
        
        # Initialize components
        self.proxy_manager = ProxyManager(use_proxies=use_proxies) if use_proxies else None
        self.user_agent_rotator = UserAgentRotator(rotation_enabled=use_user_agent_rotation) if use_user_agent_rotation else None
        self.rate_limiter = RateLimiter() if use_rate_limiting else None
        self.database = DatabaseManager(database_url) if database_url else None
        
        # Session management
        self.session: Optional[aiohttp.ClientSession] = None
        self.semaphore = asyncio.Semaphore(max_concurrent_requests)
        
        # Data storage
        self.scraped_data: List[Dict[str, Any]] = []
        self.errors: List[Dict[str, Any]] = []
        
        # Session tracking
        self.session_id: Optional[int] = None
        self.start_time: Optional[datetime] = None
        
        logger.info(f"Initialized {platform} scraper")
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.cleanup()
    
    async def initialize(self):
        """Initialize the scraper and its components."""
        try:
            # Initialize proxy manager
            if self.proxy_manager:
                await self.proxy_manager.initialize()
            
            # Create HTTP session
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout),
                connector=aiohttp.TCPConnector(limit=self.max_concurrent_requests)
            )
            
            logger.info(f"{self.platform} scraper initialized successfully")
        except Exception as e:
            log_error(self.platform, e, {"action": "initialization"})
            raise
    
    async def cleanup(self):
        """Clean up resources."""
        try:
            if self.session:
                await self.session.close()
            
            # Update session status
            if self.session_id and self.database:
                self.database.update_session(
                    self.session_id,
                    end_time=datetime.utcnow(),
                    status="completed",
                    posts_scraped=len(self.scraped_data),
                    errors_count=len(self.errors)
                )
            
            logger.info(f"{self.platform} scraper cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    @abstractmethod
    async def scrape_user(self, username: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape posts from a specific user.
        
        Args:
            username: Username to scrape
            limit: Maximum number of posts to scrape
            
        Returns:
            List of scraped posts
        """
        pass
    
    @abstractmethod
    async def scrape_hashtag(self, hashtag: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape posts with a specific hashtag.
        
        Args:
            hashtag: Hashtag to scrape
            limit: Maximum number of posts to scrape
            
        Returns:
            List of scraped posts
        """
        pass
    
    @abstractmethod
    async def scrape_keyword(self, keyword: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape posts containing a specific keyword.
        
        Args:
            keyword: Keyword to search for
            limit: Maximum number of posts to scrape
            
        Returns:
            List of scraped posts
        """
        pass
    
    async def make_request(
        self,
        url: str,
        method: str = "GET",
        headers: Dict[str, str] = None,
        data: Dict[str, Any] = None,
        params: Dict[str, Any] = None,
        proxy: str = None
    ) -> Optional[aiohttp.ClientResponse]:
        """
        Make an HTTP request with retry logic and error handling.
        
        Args:
            url: Request URL
            method: HTTP method
            headers: Request headers
            data: Request data
            params: Query parameters
            proxy: Proxy to use
            
        Returns:
            HTTP response or None if failed
        """
        async with self.semaphore:
            return await self._make_request_with_retry(
                url, method, headers, data, params, proxy
            )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError))
    )
    async def _make_request_with_retry(
        self,
        url: str,
        method: str = "GET",
        headers: Dict[str, str] = None,
        data: Dict[str, Any] = None,
        params: Dict[str, Any] = None,
        proxy: str = None
    ) -> Optional[aiohttp.ClientResponse]:
        """Make HTTP request with retry logic."""
        try:
            # Rate limiting
            if self.rate_limiter:
                await self.rate_limiter.wait_if_needed(self.platform)
            
            # Get proxy
            if self.use_proxies and not proxy:
                proxy = await self.proxy_manager.get_proxy()
            
            # Get user agent
            user_agent = None
            if self.user_agent_rotator:
                user_agent = self.user_agent_rotator.get_user_agent(self.platform)
            
            # Prepare headers
            request_headers = headers or {}
            if user_agent:
                request_headers["User-Agent"] = user_agent
            
            # Add common headers
            request_headers.update({
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            })
            
            # Make request
            async with self.session.request(
                method=method,
                url=url,
                headers=request_headers,
                data=data,
                params=params,
                proxy=proxy
            ) as response:
                # Handle rate limiting
                if response.status == 429:
                    if self.rate_limiter:
                        self.rate_limiter.mark_request_failed(self.platform, "rate_limit")
                    if proxy and self.proxy_manager:
                        await self.proxy_manager.mark_proxy_failed(proxy)
                    raise aiohttp.ClientResponseError(
                        response.request_info,
                        response.history,
                        status=429,
                        message="Rate limited"
                    )
                
                # Handle other errors
                if response.status >= 400:
                    if proxy and self.proxy_manager:
                        await self.proxy_manager.mark_proxy_failed(proxy)
                    raise aiohttp.ClientResponseError(
                        response.request_info,
                        response.history,
                        status=response.status,
                        message=f"HTTP {response.status}"
                    )
                
                # Mark success
                if self.rate_limiter:
                    self.rate_limiter.mark_request_success(self.platform)
                if proxy and self.proxy_manager:
                    await self.proxy_manager.mark_proxy_success(proxy)
                
                return response
                
        except Exception as e:
            log_error(self.platform, e, {
                "url": url,
                "method": method,
                "proxy": proxy
            })
            raise
    
    async def get_page_content(self, url: str, proxy: str = None) -> Optional[str]:
        """
        Get page content from URL.
        
        Args:
            url: URL to fetch
            proxy: Proxy to use
            
        Returns:
            Page content or None if failed
        """
        try:
            response = await self.make_request(url, proxy=proxy)
            if response:
                return await response.text()
        except Exception as e:
            log_error(self.platform, e, {"url": url})
        
        return None
    
    def process_post_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and clean raw post data.
        
        Args:
            raw_data: Raw post data
            
        Returns:
            Processed post data
        """
        try:
            # Extract basic fields
            post_data = {
                "platform": self.platform,
                "post_id": str(raw_data.get("id", "")),
                "author": raw_data.get("author", ""),
                "content": clean_text(raw_data.get("content", "")),
                "timestamp": parse_date(raw_data.get("timestamp", "")),
                "likes": raw_data.get("likes", 0),
                "comments": raw_data.get("comments", 0),
                "shares": raw_data.get("shares", 0),
                "views": raw_data.get("views", 0),
                "url": raw_data.get("url", ""),
                "media_urls": raw_data.get("media_urls", []),
                "hashtags": extract_hashtags(raw_data.get("content", "")),
                "mentions": extract_mentions(raw_data.get("content", "")),
                "location": raw_data.get("location", ""),
                "language": raw_data.get("language", ""),
                "sentiment": raw_data.get("sentiment"),
                "is_verified": raw_data.get("is_verified", False),
                "is_retweet": raw_data.get("is_retweet", False),
                "is_reply": raw_data.get("is_reply", False),
                "parent_post_id": raw_data.get("parent_post_id"),
                "raw_data": raw_data
            }
            
            # Validate required fields
            if not post_data["post_id"] or not post_data["author"]:
                return None
            
            return post_data
            
        except Exception as e:
            log_error(self.platform, e, {"action": "process_post_data"})
            return None
    
    def save_post(self, post_data: Dict[str, Any]) -> bool:
        """
        Save post data to database and local storage.
        
        Args:
            post_data: Processed post data
            
        Returns:
            True if saved successfully, False otherwise
        """
        try:
            # Add to local storage
            self.scraped_data.append(post_data)
            
            # Save to database
            if self.database:
                return self.database.save_post(post_data)
            
            return True
            
        except Exception as e:
            log_error(self.platform, e, {"action": "save_post"})
            return False
    
    async def scrape_with_session(
        self,
        target: str,
        target_type: str,
        limit: int = 100,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Scrape data with session tracking.
        
        Args:
            target: Target to scrape (username, hashtag, etc.)
            target_type: Type of target
            limit: Maximum number of items to scrape
            **kwargs: Additional arguments
            
        Returns:
            List of scraped data
        """
        try:
            # Create session
            if self.database:
                session_data = {
                    "platform": self.platform,
                    "target": target,
                    "target_type": target_type,
                    "config": kwargs
                }
                self.session_id = self.database.create_session(session_data)
            
            self.start_time = datetime.utcnow()
            log_scraping_start(self.platform, target, {"limit": limit, **kwargs})
            
            # Perform scraping based on target type
            if target_type == "user":
                data = await self.scrape_user(target, limit)
            elif target_type == "hashtag":
                data = await self.scrape_hashtag(target, limit)
            elif target_type == "keyword":
                data = await self.scrape_keyword(target, limit)
            else:
                raise ValueError(f"Unknown target type: {target_type}")
            
            # Log completion
            log_scraping_complete(self.platform, target, len(data))
            
            return data
            
        except Exception as e:
            log_error(self.platform, e, {
                "target": target,
                "target_type": target_type,
                "limit": limit
            })
            
            # Update session status
            if self.session_id and self.database:
                self.database.update_session(
                    self.session_id,
                    end_time=datetime.utcnow(),
                    status="failed",
                    errors_count=len(self.errors) + 1
                )
            
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get scraper statistics.
        
        Returns:
            Statistics dictionary
        """
        stats = {
            "platform": self.platform,
            "scraped_data_count": len(self.scraped_data),
            "errors_count": len(self.errors),
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "session_id": self.session_id
        }
        
        # Add component stats
        if self.proxy_manager:
            stats["proxy_stats"] = self.proxy_manager.get_stats()
        
        if self.user_agent_rotator:
            stats["user_agent_stats"] = self.user_agent_rotator.get_stats()
        
        if self.rate_limiter:
            stats["rate_limiter_stats"] = self.rate_limiter.get_stats(self.platform)
        
        return stats
    
    def export_data(self, format: str = "json", output_file: str = None) -> bool:
        """
        Export scraped data to file.
        
        Args:
            format: Export format (json, csv)
            output_file: Output file path
            
        Returns:
            True if exported successfully, False otherwise
        """
        try:
            if not self.scraped_data:
                logger.warning("No data to export")
                return False
            
            if output_file is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = f"data/{self.platform}_{timestamp}.{format}"
            
            # Ensure output directory exists
            import os
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            
            if format.lower() == "json":
                import json
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(self.scraped_data, f, indent=2, ensure_ascii=False, default=str)
            
            elif format.lower() == "csv":
                import pandas as pd
                df = pd.DataFrame(self.scraped_data)
                df.to_csv(output_file, index=False)
            
            logger.info(f"Data exported to {output_file}")
            return True
            
        except Exception as e:
            log_error(self.platform, e, {"action": "export_data"})
            return False
    
    def clear_data(self):
        """Clear scraped data from memory."""
        self.scraped_data.clear()
        self.errors.clear()
        logger.info(f"Cleared {self.platform} scraper data") 