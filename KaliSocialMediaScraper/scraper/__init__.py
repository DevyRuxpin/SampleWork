"""
Kali Social Media Scraper

A modern, professional, and comprehensive social media scraper
for publicly available data from major platforms.
"""

__version__ = "1.0.0"
__author__ = "Kali Social Media Scraper Team"
__description__ = "Professional social media scraper with async support"

from .core.base_scraper import BaseScraper
from .core.proxy_manager import ProxyManager
from .core.user_agent import UserAgentRotator
from .core.rate_limiter import RateLimiter
from .core.database import DatabaseManager

__all__ = [
    "BaseScraper",
    "ProxyManager", 
    "UserAgentRotator",
    "RateLimiter",
    "DatabaseManager",
] 