"""
Proxy management for the social media scraper.
Handles proxy fetching, rotation, validation, and caching.
"""

import asyncio
import aiohttp
import time
import random
from typing import List, Dict, Optional, Set
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import os

from ..utils.logger import get_logger, log_proxy_rotation
from ..utils.validators import validate_proxy

logger = get_logger("proxy_manager")

@dataclass
class Proxy:
    """Proxy information container."""
    url: str
    protocol: str
    ip: str
    port: int
    country: Optional[str] = None
    anonymity: Optional[str] = None
    speed: Optional[float] = None
    last_checked: Optional[datetime] = None
    is_working: bool = True
    fail_count: int = 0
    success_count: int = 0

class ProxyManager:
    """
    Manages proxy rotation, validation, and caching.
    Fetches free proxies from multiple sources and validates them.
    """
    
    def __init__(
        self,
        use_proxies: bool = True,
        proxy_timeout: int = 10,
        max_proxy_retries: int = 3,
        rotation_interval: int = 300,
        cache_file: str = "data/proxy_cache.json"
    ):
        """
        Initialize proxy manager.
        
        Args:
            use_proxies: Whether to use proxies
            proxy_timeout: Timeout for proxy validation
            max_proxy_retries: Maximum retries for failed proxies
            rotation_interval: Interval for proxy rotation (seconds)
            cache_file: File to cache proxy list
        """
        self.use_proxies = use_proxies
        self.proxy_timeout = proxy_timeout
        self.max_proxy_retries = max_proxy_retries
        self.rotation_interval = rotation_interval
        self.cache_file = cache_file
        
        self.proxies: List[Proxy] = []
        self.working_proxies: List[Proxy] = []
        self.failed_proxies: Set[str] = set()
        self.last_rotation = datetime.now()
        self.current_proxy: Optional[Proxy] = None
        
        # Ensure cache directory exists
        os.makedirs(os.path.dirname(cache_file), exist_ok=True)
        
        # Load cached proxies
        self._load_cached_proxies()
    
    async def initialize(self):
        """Initialize proxy manager and fetch initial proxies."""
        if not self.use_proxies:
            logger.info("Proxy usage disabled")
            return
        
        logger.info("Initializing proxy manager")
        await self._fetch_proxies()
        await self._validate_proxies()
        self._save_cached_proxies()
    
    async def get_proxy(self) -> Optional[str]:
        """
        Get a working proxy URL.
        
        Returns:
            Proxy URL or None if no working proxies available
        """
        if not self.use_proxies:
            return None
        
        # Check if we need to rotate proxies
        if self._should_rotate():
            await self._rotate_proxies()
        
        # Get a working proxy
        if self.working_proxies:
            proxy = random.choice(self.working_proxies)
            self.current_proxy = proxy
            return proxy.url
        
        logger.warning("No working proxies available")
        return None
    
    async def mark_proxy_failed(self, proxy_url: str):
        """
        Mark a proxy as failed.
        
        Args:
            proxy_url: URL of the failed proxy
        """
        if not self.use_proxies:
            return
        
        for proxy in self.proxies:
            if proxy.url == proxy_url:
                proxy.fail_count += 1
                proxy.is_working = False
                
                if proxy.fail_count >= self.max_proxy_retries:
                    self.failed_proxies.add(proxy_url)
                    self.working_proxies = [p for p in self.working_proxies if p.url != proxy_url]
                
                log_proxy_rotation(proxy_url, False)
                logger.warning(f"Proxy failed: {proxy_url} (fail count: {proxy.fail_count})")
                break
    
    async def mark_proxy_success(self, proxy_url: str):
        """
        Mark a proxy as successful.
        
        Args:
            proxy_url: URL of the successful proxy
        """
        if not self.use_proxies:
            return
        
        for proxy in self.proxies:
            if proxy.url == proxy_url:
                proxy.success_count += 1
                proxy.is_working = True
                proxy.last_checked = datetime.now()
                
                if proxy_url not in [p.url for p in self.working_proxies]:
                    self.working_proxies.append(proxy)
                
                log_proxy_rotation(proxy_url, True)
                break
    
    async def _fetch_proxies(self):
        """Fetch proxies from multiple free sources."""
        logger.info("Fetching proxies from multiple sources")
        
        tasks = [
            self._fetch_from_proxylist(),
            self._fetch_from_free_proxy_list(),
            self._fetch_from_proxynova(),
            self._fetch_from_geonode(),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                self.proxies.extend(result)
        
        # Remove duplicates
        seen_urls = set()
        unique_proxies = []
        for proxy in self.proxies:
            if proxy.url not in seen_urls:
                seen_urls.add(proxy.url)
                unique_proxies.append(proxy)
        
        self.proxies = unique_proxies
        logger.info(f"Fetched {len(self.proxies)} unique proxies")
    
    async def _fetch_from_proxylist(self) -> List[Proxy]:
        """Fetch proxies from proxylist.geonode.com."""
        proxies = []
        try:
            async with aiohttp.ClientSession() as session:
                url = "https://proxylist.geonode.com/api/proxy-list"
                params = {
                    "limit": 100,
                    "page": 1,
                    "sort_by": "lastChecked",
                    "sort_type": "desc",
                    "protocols": "http,https"
                }
                
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        for item in data.get("data", []):
                            proxy = Proxy(
                                url=f"{item['protocol']}://{item['ip']}:{item['port']}",
                                protocol=item["protocol"],
                                ip=item["ip"],
                                port=item["port"],
                                country=item.get("country"),
                                anonymity=item.get("anonymity"),
                                speed=item.get("speed")
                            )
                            proxies.append(proxy)
        except Exception as e:
            logger.error(f"Error fetching from proxylist: {e}")
        
        return proxies
    
    async def _fetch_from_free_proxy_list(self) -> List[Proxy]:
        """Fetch proxies from free-proxy-list.net."""
        proxies = []
        try:
            async with aiohttp.ClientSession() as session:
                url = "https://free-proxy-list.net/"
                async with session.get(url, timeout=30) as response:
                    if response.status == 200:
                        text = await response.text()
                        
                        # Extract proxy table
                        import re
                        pattern = r'(\d+\.\d+\.\d+\.\d+):(\d+)'
                        matches = re.findall(pattern, text)
                        
                        for ip, port in matches:
                            proxy = Proxy(
                                url=f"http://{ip}:{port}",
                                protocol="http",
                                ip=ip,
                                port=int(port)
                            )
                            proxies.append(proxy)
        except Exception as e:
            logger.error(f"Error fetching from free-proxy-list: {e}")
        
        return proxies
    
    async def _fetch_from_proxynova(self) -> List[Proxy]:
        """Fetch proxies from proxynova.com."""
        proxies = []
        try:
            async with aiohttp.ClientSession() as session:
                url = "https://api.proxynova.com/proxy"
                async with session.get(url, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        for item in data:
                            proxy = Proxy(
                                url=f"{item['protocol']}://{item['ip']}:{item['port']}",
                                protocol=item["protocol"],
                                ip=item["ip"],
                                port=item["port"]
                            )
                            proxies.append(proxy)
        except Exception as e:
            logger.error(f"Error fetching from proxynova: {e}")
        
        return proxies
    
    async def _fetch_from_geonode(self) -> List[Proxy]:
        """Fetch proxies from geonode.com."""
        proxies = []
        try:
            async with aiohttp.ClientSession() as session:
                url = "https://proxylist.geonode.com/api/proxy-list"
                params = {
                    "limit": 50,
                    "page": 1,
                    "sort_by": "speed",
                    "sort_type": "asc",
                    "protocols": "http,https"
                }
                
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        for item in data.get("data", []):
                            proxy = Proxy(
                                url=f"{item['protocol']}://{item['ip']}:{item['port']}",
                                protocol=item["protocol"],
                                ip=item["ip"],
                                port=item["port"],
                                country=item.get("country"),
                                speed=item.get("speed")
                            )
                            proxies.append(proxy)
        except Exception as e:
            logger.error(f"Error fetching from geonode: {e}")
        
        return proxies
    
    async def _validate_proxies(self):
        """Validate all fetched proxies."""
        logger.info(f"Validating {len(self.proxies)} proxies")
        
        # Test URLs for validation
        test_urls = [
            "http://httpbin.org/ip",
            "https://httpbin.org/ip",
            "http://ip-api.com/json"
        ]
        
        semaphore = asyncio.Semaphore(10)  # Limit concurrent requests
        
        async def validate_proxy(proxy: Proxy):
            async with semaphore:
                for test_url in test_urls:
                    try:
                        async with aiohttp.ClientSession() as session:
                            async with session.get(
                                test_url,
                                proxy=proxy.url,
                                timeout=self.proxy_timeout
                            ) as response:
                                if response.status == 200:
                                    proxy.is_working = True
                                    proxy.last_checked = datetime.now()
                                    self.working_proxies.append(proxy)
                                    log_proxy_rotation(proxy.url, True)
                                    return
                    except Exception:
                        continue
                
                proxy.is_working = False
                log_proxy_rotation(proxy.url, False)
        
        tasks = [validate_proxy(proxy) for proxy in self.proxies]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info(f"Validation complete: {len(self.working_proxies)} working proxies")
    
    def _should_rotate(self) -> bool:
        """Check if proxies should be rotated."""
        return (
            datetime.now() - self.last_rotation > timedelta(seconds=self.rotation_interval)
            or len(self.working_proxies) < 5
        )
    
    async def _rotate_proxies(self):
        """Rotate proxies and revalidate if needed."""
        logger.info("Rotating proxies")
        self.last_rotation = datetime.now()
        
        # If we have enough working proxies, just shuffle them
        if len(self.working_proxies) >= 10:
            random.shuffle(self.working_proxies)
        else:
            # Re-fetch and revalidate if we're running low
            await self._fetch_proxies()
            await self._validate_proxies()
            self._save_cached_proxies()
    
    def _load_cached_proxies(self):
        """Load proxies from cache file."""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    data = json.load(f)
                
                for item in data.get("proxies", []):
                    proxy = Proxy(
                        url=item["url"],
                        protocol=item["protocol"],
                        ip=item["ip"],
                        port=item["port"],
                        country=item.get("country"),
                        anonymity=item.get("anonymity"),
                        speed=item.get("speed"),
                        is_working=item.get("is_working", False),
                        fail_count=item.get("fail_count", 0),
                        success_count=item.get("success_count", 0)
                    )
                    
                    if proxy.is_working:
                        self.working_proxies.append(proxy)
                    
                    self.proxies.append(proxy)
                
                logger.info(f"Loaded {len(self.proxies)} cached proxies")
        except Exception as e:
            logger.error(f"Error loading cached proxies: {e}")
    
    def _save_cached_proxies(self):
        """Save proxies to cache file."""
        try:
            data = {
                "timestamp": datetime.now().isoformat(),
                "proxies": []
            }
            
            for proxy in self.proxies:
                data["proxies"].append({
                    "url": proxy.url,
                    "protocol": proxy.protocol,
                    "ip": proxy.ip,
                    "port": proxy.port,
                    "country": proxy.country,
                    "anonymity": proxy.anonymity,
                    "speed": proxy.speed,
                    "is_working": proxy.is_working,
                    "fail_count": proxy.fail_count,
                    "success_count": proxy.success_count
                })
            
            with open(self.cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved {len(self.proxies)} proxies to cache")
        except Exception as e:
            logger.error(f"Error saving cached proxies: {e}")
    
    def get_stats(self) -> Dict:
        """Get proxy manager statistics."""
        return {
            "total_proxies": len(self.proxies),
            "working_proxies": len(self.working_proxies),
            "failed_proxies": len(self.failed_proxies),
            "current_proxy": self.current_proxy.url if self.current_proxy else None,
            "last_rotation": self.last_rotation.isoformat(),
            "use_proxies": self.use_proxies
        } 