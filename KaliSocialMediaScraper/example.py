#!/usr/bin/env python3
"""
Example usage of Kali Social Media Scraper.
This script demonstrates how to use the scraper programmatically.
"""

import asyncio
import os
from dotenv import load_dotenv

from scraper.platforms.twitter import TwitterScraper
from scraper.utils.logger import get_logger

# Load environment variables
load_dotenv()

logger = get_logger("example")

async def main():
    """Main example function."""
    logger.info("Starting Kali Social Media Scraper example")
    
    # Initialize Twitter scraper
    # Note: In a real scenario, you'd need to handle authentication
    scraper = TwitterScraper(
        use_proxies=False,  # Set to True if you have proxies configured
        use_rate_limiting=True,
        max_retries=3
    )
    
    try:
        # Example 1: Scrape tweets from a user
        logger.info("Example 1: Scraping tweets from a user")
        # Note: This is a placeholder - real implementation would require proper authentication
        # tweets = await scraper.scrape_user("elonmusk", limit=10)
        # logger.info(f"Scraped {len(tweets)} tweets from elonmusk")
        
        # Example 2: Scrape tweets with a hashtag
        logger.info("Example 2: Scraping tweets with hashtag")
        # hashtag_tweets = await scraper.scrape_hashtag("python", limit=5)
        # logger.info(f"Scraped {len(hashtag_tweets)} tweets with #python")
        
        # Example 3: Scrape tweets with a keyword
        logger.info("Example 3: Scraping tweets with keyword")
        # keyword_tweets = await scraper.scrape_keyword("artificial intelligence", limit=5)
        # logger.info(f"Scraped {len(keyword_tweets)} tweets with 'artificial intelligence'")
        
        logger.info("Examples completed successfully!")
        
    except Exception as e:
        logger.error(f"Error in example: {e}")
    
    finally:
        # Clean up
        await scraper.close()

def cli_example():
    """Example of using the CLI interface."""
    logger.info("CLI Example:")
    logger.info("To use the scraper via command line:")
    logger.info("")
    logger.info("1. Install the package:")
    logger.info("   pip install -e .")
    logger.info("")
    logger.info("2. Run the CLI:")
    logger.info("   kali-scraper --help")
    logger.info("")
    logger.info("3. Example commands:")
    logger.info("   kali-scraper scrape twitter user elonmusk --limit 10")
    logger.info("   kali-scraper scrape twitter hashtag python --limit 20")
    logger.info("   kali-scraper scrape twitter keyword 'AI' --limit 15")
    logger.info("")
    logger.info("4. List available platforms:")
    logger.info("   kali-scraper list-platforms")
    logger.info("")
    logger.info("5. Get scraping statistics:")
    logger.info("   kali-scraper stats")

if __name__ == "__main__":
    # Run the async example
    asyncio.run(main())
    
    # Show CLI example
    cli_example() 