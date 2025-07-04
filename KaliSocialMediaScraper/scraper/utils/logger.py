"""
Logging configuration for the social media scraper.
"""

import os
import sys
from pathlib import Path
from typing import Optional

from loguru import logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_logger(
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    rotation: str = "1 day",
    retention: str = "30 days",
    format_string: Optional[str] = None
) -> None:
    """
    Setup the logger with custom configuration.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file
        rotation: Log rotation interval
        retention: Log retention period
        format_string: Custom log format string
    """
    # Remove default logger
    logger.remove()
    
    # Default format
    if format_string is None:
        format_string = (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        )
    
    # Console handler
    logger.add(
        sys.stderr,
        format=format_string,
        level=log_level,
        colorize=True,
        backtrace=True,
        diagnose=True
    )
    
    # File handler
    if log_file:
        # Ensure log directory exists
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.add(
            log_file,
            format=format_string,
            level=log_level,
            rotation=rotation,
            retention=retention,
            compression="zip",
            backtrace=True,
            diagnose=True
        )
    
    # Add structured logging for JSON format
    logger.add(
        "logs/structured.json",
        format="{time} | {level} | {extra}",
        level="DEBUG",
        rotation="1 day",
        retention="7 days",
        serialize=True,
        backtrace=True,
        diagnose=True
    )

def get_logger(name: str = "scraper"):
    """
    Get a logger instance with the specified name.
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance
    """
    return logger.bind(name=name)

def log_scraping_start(platform: str, target: str, **kwargs):
    """
    Log the start of a scraping operation.
    
    Args:
        platform: Platform being scraped
        target: Target being scraped
        **kwargs: Additional context
    """
    logger.info(
        f"Starting {platform} scraping",
        extra={
            "platform": platform,
            "target": target,
            "action": "scraping_start",
            **kwargs
        }
    )

def log_scraping_complete(platform: str, target: str, count: int, **kwargs):
    """
    Log the completion of a scraping operation.
    
    Args:
        platform: Platform being scraped
        target: Target being scraped
        count: Number of items scraped
        **kwargs: Additional context
    """
    logger.info(
        f"Completed {platform} scraping: {count} items",
        extra={
            "platform": platform,
            "target": target,
            "count": count,
            "action": "scraping_complete",
            **kwargs
        }
    )

def log_error(platform: str, error: Exception, context: dict = None):
    """
    Log an error with context.
    
    Args:
        platform: Platform where error occurred
        error: Exception that occurred
        context: Additional context
    """
    logger.error(
        f"Error in {platform}: {str(error)}",
        extra={
            "platform": platform,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "action": "error",
            **(context or {})
        }
    )

def log_rate_limit(platform: str, delay: float):
    """
    Log rate limiting.
    
    Args:
        platform: Platform being rate limited
        delay: Delay in seconds
    """
    logger.warning(
        f"Rate limited on {platform}, waiting {delay}s",
        extra={
            "platform": platform,
            "delay": delay,
            "action": "rate_limit"
        }
    )

def log_proxy_rotation(proxy: str, success: bool):
    """
    Log proxy rotation.
    
    Args:
        proxy: Proxy being used
        success: Whether proxy is working
    """
    level = "info" if success else "warning"
    message = f"Proxy rotation: {proxy} {'working' if success else 'failed'}"
    
    logger.log(
        level.upper(),
        message,
        extra={
            "proxy": proxy,
            "success": success,
            "action": "proxy_rotation"
        }
    )

# Initialize logger with environment variables
setup_logger(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    log_file=os.getenv("LOG_FILE", "logs/scraper.log"),
    rotation=os.getenv("LOG_ROTATION", "1 day"),
    retention=os.getenv("LOG_RETENTION", "30 days")
) 