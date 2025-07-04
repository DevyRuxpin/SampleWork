"""
Twitter/X scraper implementation.
Handles scraping of tweets, user profiles, and search results.
"""

import re
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from urllib.parse import urljoin, quote

from ..core.base_scraper import BaseScraper
from ..utils.logger import get_logger
from ..utils.helpers import clean_text, extract_hashtags, extract_mentions, parse_date, parse_number
from ..utils.validators import validate_username

logger = get_logger("twitter_scraper")

class TwitterScraper(BaseScraper):
    """
    Twitter/X scraper implementation.
    Scrapes tweets, user profiles, and search results using public endpoints.
    """
    
    def __init__(self, **kwargs):
        """Initialize Twitter scraper."""
        super().__init__(platform="twitter", **kwargs)
        
        # Twitter-specific settings
        self.base_url = "https://twitter.com"
        self.api_base_url = "https://api.twitter.com"
        self.search_url = "https://twitter.com/search"
        
        # Headers for Twitter
        self.twitter_headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
        }
    
    async def scrape_user(self, username: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape tweets from a specific user.
        
        Args:
            username: Twitter username (without @)
            limit: Maximum number of tweets to scrape
            
        Returns:
            List of scraped tweets
        """
        try:
            # Clean username
            username = username.lstrip('@')
            
            if not validate_username(username, "twitter"):
                logger.error(f"Invalid Twitter username: {username}")
                return []
            
            logger.info(f"Scraping tweets from user: {username}")
            
            # Get user profile first
            user_profile = await self._get_user_profile(username)
            if not user_profile:
                logger.error(f"Could not get profile for user: {username}")
                return []
            
            # Scrape tweets
            tweets = await self._scrape_user_tweets(username, limit)
            
            # Process and save tweets
            processed_tweets = []
            for tweet in tweets:
                processed_tweet = self._process_tweet_data(tweet, user_profile)
                if processed_tweet:
                    self.save_post(processed_tweet)
                    processed_tweets.append(processed_tweet)
            
            logger.info(f"Scraped {len(processed_tweets)} tweets from {username}")
            return processed_tweets
            
        except Exception as e:
            logger.error(f"Error scraping user {username}: {e}")
            return []
    
    async def scrape_hashtag(self, hashtag: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape tweets with a specific hashtag.
        
        Args:
            hashtag: Hashtag to search for (without #)
            limit: Maximum number of tweets to scrape
            
        Returns:
            List of scraped tweets
        """
        try:
            # Clean hashtag
            hashtag = hashtag.lstrip('#')
            
            logger.info(f"Scraping tweets with hashtag: #{hashtag}")
            
            # Search for hashtag
            tweets = await self._search_tweets(f"#{hashtag}", limit)
            
            # Process and save tweets
            processed_tweets = []
            for tweet in tweets:
                processed_tweet = self._process_tweet_data(tweet)
                if processed_tweet:
                    self.save_post(processed_tweet)
                    processed_tweets.append(processed_tweet)
            
            logger.info(f"Scraped {len(processed_tweets)} tweets with hashtag #{hashtag}")
            return processed_tweets
            
        except Exception as e:
            logger.error(f"Error scraping hashtag #{hashtag}: {e}")
            return []
    
    async def scrape_keyword(self, keyword: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape tweets containing a specific keyword.
        
        Args:
            keyword: Keyword to search for
            limit: Maximum number of tweets to scrape
            
        Returns:
            List of scraped tweets
        """
        try:
            logger.info(f"Scraping tweets with keyword: {keyword}")
            
            # Search for keyword
            tweets = await self._search_tweets(keyword, limit)
            
            # Process and save tweets
            processed_tweets = []
            for tweet in tweets:
                processed_tweet = self._process_tweet_data(tweet)
                if processed_tweet:
                    self.save_post(processed_tweet)
                    processed_tweets.append(processed_tweet)
            
            logger.info(f"Scraped {len(processed_tweets)} tweets with keyword '{keyword}'")
            return processed_tweets
            
        except Exception as e:
            logger.error(f"Error scraping keyword '{keyword}': {e}")
            return []
    
    async def _get_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile information.
        
        Args:
            username: Twitter username
            
        Returns:
            User profile data or None
        """
        try:
            profile_url = f"{self.base_url}/{username}"
            
            response = await self.make_request(
                url=profile_url,
                headers=self.twitter_headers
            )
            
            if not response:
                return None
            
            content = await response.text()
            
            # Extract user data from page
            user_data = self._extract_user_data_from_page(content, username)
            
            return user_data
            
        except Exception as e:
            logger.error(f"Error getting user profile for {username}: {e}")
            return None
    
    async def _scrape_user_tweets(self, username: str, limit: int) -> List[Dict[str, Any]]:
        """
        Scrape tweets from user timeline.
        
        Args:
            username: Twitter username
            limit: Maximum number of tweets
            
        Returns:
            List of tweet data
        """
        try:
            tweets = []
            cursor = None
            count = 0
            
            while count < limit:
                # Get tweets batch
                batch = await self._get_user_tweets_batch(username, cursor)
                
                if not batch or not batch.get("tweets"):
                    break
                
                tweets.extend(batch["tweets"])
                count = len(tweets)
                
                # Get next cursor
                cursor = batch.get("next_cursor")
                if not cursor:
                    break
                
                # Rate limiting
                await asyncio.sleep(2)
            
            return tweets[:limit]
            
        except Exception as e:
            logger.error(f"Error scraping user tweets for {username}: {e}")
            return []
    
    async def _get_user_tweets_batch(self, username: str, cursor: str = None) -> Optional[Dict[str, Any]]:
        """
        Get a batch of user tweets.
        
        Args:
            username: Twitter username
            cursor: Pagination cursor
            
        Returns:
            Batch data with tweets and next cursor
        """
        try:
            # Use Twitter's public API endpoint
            api_url = f"{self.api_base_url}/2/users/by/username/{username}/tweets"
            
            params = {
                "max_results": 100,
                "tweet.fields": "created_at,public_metrics,entities,author_id,referenced_tweets",
                "user.fields": "username,name,verified,profile_image_url",
                "expansions": "author_id,referenced_tweets.id"
            }
            
            if cursor:
                params["pagination_token"] = cursor
            
            response = await self.make_request(
                url=api_url,
                params=params,
                headers=self.twitter_headers
            )
            
            if not response:
                return None
            
            data = await response.json()
            
            # Extract tweets and next cursor
            tweets = data.get("data", [])
            next_cursor = data.get("meta", {}).get("next_token")
            
            return {
                "tweets": tweets,
                "next_cursor": next_cursor
            }
            
        except Exception as e:
            logger.error(f"Error getting tweets batch for {username}: {e}")
            return None
    
    async def _search_tweets(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """
        Search for tweets.
        
        Args:
            query: Search query
            limit: Maximum number of tweets
            
        Returns:
            List of tweet data
        """
        try:
            tweets = []
            cursor = None
            count = 0
            
            while count < limit:
                # Get search results batch
                batch = await self._get_search_batch(query, cursor)
                
                if not batch or not batch.get("tweets"):
                    break
                
                tweets.extend(batch["tweets"])
                count = len(tweets)
                
                # Get next cursor
                cursor = batch.get("next_cursor")
                if not cursor:
                    break
                
                # Rate limiting
                await asyncio.sleep(2)
            
            return tweets[:limit]
            
        except Exception as e:
            logger.error(f"Error searching tweets for '{query}': {e}")
            return []
    
    async def _get_search_batch(self, query: str, cursor: str = None) -> Optional[Dict[str, Any]]:
        """
        Get a batch of search results.
        
        Args:
            query: Search query
            cursor: Pagination cursor
            
        Returns:
            Batch data with tweets and next cursor
        """
        try:
            # Use Twitter's search API
            api_url = f"{self.api_base_url}/2/tweets/search/recent"
            
            params = {
                "query": query,
                "max_results": 100,
                "tweet.fields": "created_at,public_metrics,entities,author_id,referenced_tweets",
                "user.fields": "username,name,verified,profile_image_url",
                "expansions": "author_id,referenced_tweets.id"
            }
            
            if cursor:
                params["next_token"] = cursor
            
            response = await self.make_request(
                url=api_url,
                params=params,
                headers=self.twitter_headers
            )
            
            if not response:
                return None
            
            data = await response.json()
            
            # Extract tweets and next cursor
            tweets = data.get("data", [])
            next_cursor = data.get("meta", {}).get("next_token")
            
            return {
                "tweets": tweets,
                "next_cursor": next_cursor
            }
            
        except Exception as e:
            logger.error(f"Error getting search batch for '{query}': {e}")
            return None
    
    def _extract_user_data_from_page(self, content: str, username: str) -> Optional[Dict[str, Any]]:
        """
        Extract user data from Twitter profile page.
        
        Args:
            content: Page HTML content
            username: Twitter username
            
        Returns:
            User profile data
        """
        try:
            # Look for user data in page
            user_data_pattern = r'window\.__INITIAL_STATE__\s*=\s*({.*?});'
            match = re.search(user_data_pattern, content, re.DOTALL)
            
            if match:
                data = json.loads(match.group(1))
                
                # Extract user info from various possible locations
                user_info = None
                
                # Try different paths to find user data
                possible_paths = [
                    ["entities", "users", "entities"],
                    ["user", "userInfo"],
                    ["profile", "user"]
                ]
                
                for path in possible_paths:
                    try:
                        current = data
                        for key in path:
                            current = current[key]
                        
                        if current and isinstance(current, dict):
                            user_info = current
                            break
                    except (KeyError, TypeError):
                        continue
                
                if user_info:
                    return {
                        "id": user_info.get("id_str"),
                        "username": user_info.get("screen_name") or username,
                        "display_name": user_info.get("name"),
                        "bio": user_info.get("description"),
                        "followers_count": user_info.get("followers_count", 0),
                        "following_count": user_info.get("friends_count", 0),
                        "posts_count": user_info.get("statuses_count", 0),
                        "verified": user_info.get("verified", False),
                        "profile_image_url": user_info.get("profile_image_url_https"),
                        "banner_image_url": user_info.get("profile_banner_url"),
                        "location": user_info.get("location"),
                        "website": user_info.get("url"),
                        "joined_date": user_info.get("created_at")
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting user data: {e}")
            return None
    
    def _process_tweet_data(self, tweet_data: Dict[str, Any], user_profile: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """
        Process raw tweet data into standardized format.
        
        Args:
            tweet_data: Raw tweet data from API
            user_profile: User profile data
            
        Returns:
            Processed tweet data
        """
        try:
            # Extract basic tweet info
            tweet_id = tweet_data.get("id")
            text = tweet_data.get("text", "")
            
            if not tweet_id or not text:
                return None
            
            # Get metrics
            metrics = tweet_data.get("public_metrics", {})
            
            # Get author info
            author_id = tweet_data.get("author_id")
            author_username = user_profile.get("username") if user_profile else None
            
            # Determine tweet type
            referenced_tweets = tweet_data.get("referenced_tweets", [])
            is_retweet = any(ref.get("type") == "retweeted" for ref in referenced_tweets)
            is_reply = any(ref.get("type") == "replied_to" for ref in referenced_tweets)
            parent_tweet_id = referenced_tweets[0].get("id") if referenced_tweets else None
            
            # Extract entities
            entities = tweet_data.get("entities", {})
            urls = entities.get("urls", [])
            media_urls = []
            
            for url_entity in urls:
                if url_entity.get("expanded_url"):
                    media_urls.append(url_entity["expanded_url"])
            
            # Process tweet data
            processed_tweet = {
                "id": str(tweet_id),
                "author": author_username or f"user_{author_id}",
                "content": clean_text(text),
                "timestamp": parse_date(tweet_data.get("created_at")),
                "likes": metrics.get("like_count", 0),
                "comments": metrics.get("reply_count", 0),
                "shares": metrics.get("retweet_count", 0),
                "views": metrics.get("impression_count", 0),
                "url": f"https://twitter.com/{author_username}/status/{tweet_id}" if author_username else None,
                "media_urls": media_urls,
                "hashtags": extract_hashtags(text),
                "mentions": extract_mentions(text),
                "is_verified": user_profile.get("verified", False) if user_profile else False,
                "is_retweet": is_retweet,
                "is_reply": is_reply,
                "parent_post_id": str(parent_tweet_id) if parent_tweet_id else None,
                "raw_data": tweet_data
            }
            
            return processed_tweet
            
        except Exception as e:
            logger.error(f"Error processing tweet data: {e}")
            return None
    
    async def get_trending_topics(self) -> List[str]:
        """
        Get trending topics on Twitter.
        
        Returns:
            List of trending topics
        """
        try:
            # This would require additional implementation
            # For now, return empty list
            logger.info("Getting trending topics (not implemented)")
            return []
            
        except Exception as e:
            logger.error(f"Error getting trending topics: {e}")
            return []
    
    async def get_user_followers(self, username: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get user followers.
        
        Args:
            username: Twitter username
            limit: Maximum number of followers
            
        Returns:
            List of follower data
        """
        try:
            # This would require additional implementation
            # For now, return empty list
            logger.info(f"Getting followers for {username} (not implemented)")
            return []
            
        except Exception as e:
            logger.error(f"Error getting followers for {username}: {e}")
            return [] 