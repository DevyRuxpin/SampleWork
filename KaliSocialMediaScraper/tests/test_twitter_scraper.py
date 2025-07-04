"""
Tests for Twitter scraper.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch

from scraper.platforms.twitter import TwitterScraper
from scraper.utils.validators import validate_username

class TestTwitterScraper:
    """Test cases for Twitter scraper."""
    
    @pytest.fixture
    def scraper(self):
        """Create a Twitter scraper instance for testing."""
        return TwitterScraper(use_proxies=False, use_rate_limiting=False)
    
    @pytest.mark.asyncio
    async def test_scraper_initialization(self, scraper):
        """Test scraper initialization."""
        assert scraper.platform == "twitter"
        assert scraper.base_url == "https://twitter.com"
        assert scraper.api_base_url == "https://api.twitter.com"
    
    def test_username_validation(self):
        """Test username validation."""
        # Valid usernames
        assert validate_username("elonmusk", "twitter") == True
        assert validate_username("test_user", "twitter") == True
        assert validate_username("user123", "twitter") == True
        
        # Invalid usernames
        assert validate_username("", "twitter") == False
        assert validate_username("a" * 16, "twitter") == False  # Too long
        assert validate_username("user@name", "twitter") == False  # Invalid character
    
    @pytest.mark.asyncio
    async def test_scrape_user_empty_result(self, scraper):
        """Test scraping user with empty result."""
        with patch.object(scraper, '_get_user_profile', return_value=None):
            result = await scraper.scrape_user("testuser", 10)
            assert result == []
    
    @pytest.mark.asyncio
    async def test_scrape_hashtag_empty_result(self, scraper):
        """Test scraping hashtag with empty result."""
        with patch.object(scraper, '_search_tweets', return_value=[]):
            result = await scraper.scrape_hashtag("test", 10)
            assert result == []
    
    @pytest.mark.asyncio
    async def test_scrape_keyword_empty_result(self, scraper):
        """Test scraping keyword with empty result."""
        with patch.object(scraper, '_search_tweets', return_value=[]):
            result = await scraper.scrape_keyword("test", 10)
            assert result == []
    
    def test_process_tweet_data_valid(self, scraper):
        """Test processing valid tweet data."""
        tweet_data = {
            "id": "123456789",
            "text": "This is a test tweet #test @user",
            "created_at": "2023-01-01T12:00:00Z",
            "public_metrics": {
                "like_count": 10,
                "reply_count": 5,
                "retweet_count": 3,
                "impression_count": 100
            },
            "author_id": "987654321",
            "entities": {
                "urls": [
                    {"expanded_url": "https://example.com"}
                ]
            }
        }
        
        user_profile = {
            "username": "testuser",
            "verified": True
        }
        
        result = scraper._process_tweet_data(tweet_data, user_profile)
        
        assert result is not None
        assert result["post_id"] == "123456789"
        assert result["author"] == "testuser"
        assert result["content"] == "This is a test tweet #test @user"
        assert result["likes"] == 10
        assert result["comments"] == 5
        assert result["shares"] == 3
        assert result["views"] == 100
        assert result["is_verified"] == True
        assert "#test" in result["hashtags"]
        assert "@user" in result["mentions"]
    
    def test_process_tweet_data_invalid(self, scraper):
        """Test processing invalid tweet data."""
        # Missing required fields
        tweet_data = {
            "text": "This is a test tweet"
            # Missing id
        }
        
        result = scraper._process_tweet_data(tweet_data)
        assert result is None
    
    def test_extract_user_data_from_page(self, scraper):
        """Test extracting user data from page content."""
        # Mock page content with user data
        page_content = '''
        <script>
        window.__INITIAL_STATE__ = {
            "entities": {
                "users": {
                    "entities": {
                        "123456": {
                            "id_str": "123456",
                            "screen_name": "testuser",
                            "name": "Test User",
                            "description": "Test bio",
                            "followers_count": 1000,
                            "friends_count": 500,
                            "statuses_count": 200,
                            "verified": true,
                            "profile_image_url_https": "https://example.com/image.jpg",
                            "location": "Test City",
                            "url": "https://example.com"
                        }
                    }
                }
            }
        };
        </script>
        '''
        
        result = scraper._extract_user_data_from_page(page_content, "testuser")
        
        assert result is not None
        assert result["id"] == "123456"
        assert result["username"] == "testuser"
        assert result["display_name"] == "Test User"
        assert result["bio"] == "Test bio"
        assert result["followers_count"] == 1000
        assert result["verified"] == True 