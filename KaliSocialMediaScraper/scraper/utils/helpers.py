"""
Utility helper functions for the social media scraper.
"""

import re
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Union
from urllib.parse import urlparse, parse_qs, unquote
import html

def clean_text(text: str) -> str:
    """
    Clean and normalize text content.
    
    Args:
        text: Raw text to clean
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Decode HTML entities
    text = html.unescape(text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Remove common unwanted characters
    text = re.sub(r'[\u200b\u200c\u200d\u2060]', '', text)  # Zero-width characters
    
    return text

def extract_urls(text: str) -> List[str]:
    """
    Extract URLs from text content.
    
    Args:
        text: Text to extract URLs from
        
    Returns:
        List of URLs found
    """
    if not text:
        return []
    
    # URL regex pattern
    url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?'
    
    urls = re.findall(url_pattern, text)
    return list(set(urls))  # Remove duplicates

def extract_hashtags(text: str) -> List[str]:
    """
    Extract hashtags from text content.
    
    Args:
        text: Text to extract hashtags from
        
    Returns:
        List of hashtags found
    """
    if not text:
        return []
    
    # Hashtag regex pattern
    hashtag_pattern = r'#(\w+)'
    hashtags = re.findall(hashtag_pattern, text)
    return list(set(hashtags))  # Remove duplicates

def extract_mentions(text: str) -> List[str]:
    """
    Extract mentions from text content.
    
    Args:
        text: Text to extract mentions from
        
    Returns:
        List of mentions found
    """
    if not text:
        return []
    
    # Mention regex patterns for different platforms
    patterns = [
        r'@(\w+)',  # General @username
        r'@([a-zA-Z0-9._]+)',  # More permissive
    ]
    
    mentions = []
    for pattern in patterns:
        mentions.extend(re.findall(pattern, text))
    
    return list(set(mentions))  # Remove duplicates

def parse_date(date_string: str, format_hints: List[str] = None) -> Optional[datetime]:
    """
    Parse date string with multiple format hints.
    
    Args:
        date_string: Date string to parse
        format_hints: List of format strings to try
        
    Returns:
        Parsed datetime object or None
    """
    if not date_string:
        return None
    
    # Common date formats
    default_formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%B %d, %Y",
        "%d %B %Y",
        "%Y-%m-%d %H:%M",
        "%d-%m-%Y %H:%M",
    ]
    
    formats = format_hints or default_formats
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    # Try parsing with dateutil as fallback
    try:
        from dateutil import parser
        return parser.parse(date_string)
    except (ImportError, ValueError):
        pass
    
    return None

def format_number(number: Union[int, str]) -> str:
    """
    Format numbers like social media platforms (1K, 1M, etc.).
    
    Args:
        number: Number to format
        
    Returns:
        Formatted number string
    """
    if isinstance(number, str):
        # Remove common suffixes and convert to int
        number = re.sub(r'[KMB]', '', number.upper())
        try:
            number = int(number)
        except ValueError:
            return str(number)
    
    if number < 1000:
        return str(number)
    elif number < 1000000:
        return f"{number/1000:.1f}K".replace('.0', '')
    else:
        return f"{number/1000000:.1f}M".replace('.0', '')

def parse_number(number_str: str) -> int:
    """
    Parse formatted numbers (1K, 1M, etc.) to integers.
    
    Args:
        number_str: Formatted number string
        
    Returns:
        Integer value
    """
    if not number_str:
        return 0
    
    # Remove commas and spaces
    number_str = re.sub(r'[, ]', '', number_str)
    
    # Handle K, M, B suffixes
    multipliers = {'K': 1000, 'M': 1000000, 'B': 1000000000}
    
    for suffix, multiplier in multipliers.items():
        if number_str.upper().endswith(suffix):
            try:
                base = float(number_str[:-1])
                return int(base * multiplier)
            except ValueError:
                pass
    
    # Try direct conversion
    try:
        return int(float(number_str))
    except ValueError:
        return 0

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract JSON data from text content.
    
    Args:
        text: Text containing JSON
        
    Returns:
        Parsed JSON dict or None
    """
    if not text:
        return None
    
    # Find JSON patterns
    json_patterns = [
        r'\{[^{}]*\}',
        r'\[[^\[\]]*\]',
    ]
    
    for pattern in json_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
    
    return None

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe file system usage.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Remove leading/trailing dots and spaces
    filename = filename.strip('. ')
    
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    
    return filename or "unnamed"

def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Split a list into chunks of specified size.
    
    Args:
        lst: List to chunk
        chunk_size: Size of each chunk
        
    Returns:
        List of chunks
    """
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

def merge_dicts(*dicts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge multiple dictionaries, with later dicts taking precedence.
    
    Args:
        *dicts: Dictionaries to merge
        
    Returns:
        Merged dictionary
    """
    result = {}
    for d in dicts:
        if d:
            result.update(d)
    return result

def get_domain_from_url(url: str) -> str:
    """
    Extract domain from URL.
    
    Args:
        url: URL to extract domain from
        
    Returns:
        Domain string
    """
    try:
        parsed = urlparse(url)
        return parsed.netloc.lower()
    except Exception:
        return ""

def is_valid_url(url: str) -> bool:
    """
    Check if URL is valid.
    
    Args:
        url: URL to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        parsed = urlparse(url)
        return all([parsed.scheme, parsed.netloc])
    except Exception:
        return False

def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """
    Truncate text to specified length.
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix 