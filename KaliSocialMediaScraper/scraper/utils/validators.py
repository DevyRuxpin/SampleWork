"""
Validation utilities for the social media scraper.
"""

import re
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse

def validate_url(url: str) -> bool:
    """
    Validate if a string is a valid URL.
    
    Args:
        url: URL string to validate
        
    Returns:
        True if valid URL, False otherwise
    """
    if not url or not isinstance(url, str):
        return False
    
    try:
        parsed = urlparse(url)
        return all([parsed.scheme, parsed.netloc])
    except Exception:
        return False

def validate_username(username: str, platform: str = "general") -> bool:
    """
    Validate username format for different platforms.
    
    Args:
        username: Username to validate
        platform: Platform name for specific validation rules
        
    Returns:
        True if valid username, False otherwise
    """
    if not username or not isinstance(username, str):
        return False
    
    # Remove @ if present
    username = username.lstrip('@')
    
    # Platform-specific validation rules
    rules = {
        "twitter": {
            "min_length": 1,
            "max_length": 15,
            "pattern": r'^[a-zA-Z0-9_]+$'
        },
        "instagram": {
            "min_length": 1,
            "max_length": 30,
            "pattern": r'^[a-zA-Z0-9._]+$'
        },
        "facebook": {
            "min_length": 5,
            "max_length": 50,
            "pattern": r'^[a-zA-Z0-9.]+$'
        },
        "linkedin": {
            "min_length": 3,
            "max_length": 100,
            "pattern": r'^[a-zA-Z0-9\-_.]+$'
        },
        "tiktok": {
            "min_length": 1,
            "max_length": 24,
            "pattern": r'^[a-zA-Z0-9._]+$'
        },
        "general": {
            "min_length": 1,
            "max_length": 50,
            "pattern": r'^[a-zA-Z0-9._-]+$'
        }
    }
    
    rule = rules.get(platform.lower(), rules["general"])
    
    # Check length
    if not (rule["min_length"] <= len(username) <= rule["max_length"]):
        return False
    
    # Check pattern
    if not re.match(rule["pattern"], username):
        return False
    
    return True

def validate_hashtag(hashtag: str) -> bool:
    """
    Validate hashtag format.
    
    Args:
        hashtag: Hashtag to validate
        
    Returns:
        True if valid hashtag, False otherwise
    """
    if not hashtag or not isinstance(hashtag, str):
        return False
    
    # Remove # if present
    hashtag = hashtag.lstrip('#')
    
    # Hashtag rules
    if len(hashtag) < 1 or len(hashtag) > 50:
        return False
    
    # Must start with letter or number, can contain letters, numbers, and underscores
    if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9_]*$', hashtag):
        return False
    
    return True

def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email to validate
        
    Returns:
        True if valid email, False otherwise
    """
    if not email or not isinstance(email, str):
        return False
    
    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    """
    Validate phone number format.
    
    Args:
        phone: Phone number to validate
        
    Returns:
        True if valid phone number, False otherwise
    """
    if not phone or not isinstance(phone, str):
        return False
    
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)
    
    # Check if it's a reasonable length (7-15 digits)
    return 7 <= len(digits_only) <= 15

def validate_date_range(start_date: str, end_date: str) -> bool:
    """
    Validate date range.
    
    Args:
        start_date: Start date string
        end_date: End date string
        
    Returns:
        True if valid date range, False otherwise
    """
    try:
        from datetime import datetime
        from .helpers import parse_date
        
        start = parse_date(start_date)
        end = parse_date(end_date)
        
        if not start or not end:
            return False
        
        return start <= end
    except Exception:
        return False

def validate_limit(limit: int, max_limit: int = 10000) -> bool:
    """
    Validate limit parameter.
    
    Args:
        limit: Limit value to validate
        max_limit: Maximum allowed limit
        
    Returns:
        True if valid limit, False otherwise
    """
    if not isinstance(limit, int):
        return False
    
    return 1 <= limit <= max_limit

def validate_platform(platform: str) -> bool:
    """
    Validate platform name.
    
    Args:
        platform: Platform name to validate
        
    Returns:
        True if valid platform, False otherwise
    """
    valid_platforms = {
        "twitter", "x", "instagram", "facebook", 
        "linkedin", "tiktok", "reddit", "youtube"
    }
    
    return platform.lower() in valid_platforms

def validate_output_format(format_name: str) -> bool:
    """
    Validate output format.
    
    Args:
        format_name: Format name to validate
        
    Returns:
        True if valid format, False otherwise
    """
    valid_formats = {"csv", "json", "xml", "txt"}
    return format_name.lower() in valid_formats

def validate_proxy(proxy: str) -> bool:
    """
    Validate proxy URL format.
    
    Args:
        proxy: Proxy URL to validate
        
    Returns:
        True if valid proxy URL, False otherwise
    """
    if not proxy or not isinstance(proxy, str):
        return False
    
    # Check if it's a valid URL
    if not validate_url(proxy):
        return False
    
    # Check if it's a supported proxy protocol
    supported_protocols = {"http", "https", "socks4", "socks5"}
    parsed = urlparse(proxy)
    
    return parsed.scheme in supported_protocols

def validate_config(config: Dict[str, Any]) -> List[str]:
    """
    Validate configuration dictionary and return list of errors.
    
    Args:
        config: Configuration dictionary to validate
        
    Returns:
        List of validation error messages
    """
    errors = []
    
    # Required fields
    required_fields = ["platform", "target"]
    
    for field in required_fields:
        if field not in config or not config[field]:
            errors.append(f"Missing required field: {field}")
    
    # Validate platform
    if "platform" in config and not validate_platform(config["platform"]):
        errors.append(f"Invalid platform: {config['platform']}")
    
    # Validate limit
    if "limit" in config and not validate_limit(config["limit"]):
        errors.append(f"Invalid limit: {config['limit']}")
    
    # Validate proxy
    if "proxy" in config and config["proxy"] and not validate_proxy(config["proxy"]):
        errors.append(f"Invalid proxy: {config['proxy']}")
    
    # Validate output format
    if "output_format" in config and not validate_output_format(config["output_format"]):
        errors.append(f"Invalid output format: {config['output_format']}")
    
    return errors

def sanitize_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user input to prevent injection attacks.
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Remove null bytes and control characters
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    return text

def validate_file_path(file_path: str) -> bool:
    """
    Validate file path for security.
    
    Args:
        file_path: File path to validate
        
    Returns:
        True if valid file path, False otherwise
    """
    if not file_path or not isinstance(file_path, str):
        return False
    
    # Check for path traversal attempts
    if ".." in file_path or "//" in file_path:
        return False
    
    # Check for absolute paths (optional security measure)
    if file_path.startswith("/") or ":" in file_path:
        return False
    
    return True 