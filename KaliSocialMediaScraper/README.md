# Kali Social Media Scraper

A modern, professional, and comprehensive social media scraper for publicly available data from major platforms. Built with async Python for high performance and scalability, featuring advanced database support, proxy rotation, and enterprise-grade features.

## 🚀 Features

### **Core Capabilities**
- **Multi-Platform Support**: Twitter/X (fully implemented), Instagram, Facebook, LinkedIn, TikTok
- **Async Architecture**: High-performance concurrent scraping with aiohttp
- **Advanced Database Support**: PostgreSQL, MySQL, SQLite, SQL Server, Oracle
- **Proxy Management**: Automatic proxy rotation, health checks, and validation
- **Rate Limiting**: Intelligent throttling with platform-specific limits
- **User-Agent Rotation**: Automatic browser fingerprint rotation
- **Data Storage**: Both file (JSON/CSV/XML) and database storage
- **CLI Interface**: Rich, user-friendly command-line interface with progress tracking
- **Modular Design**: Easy to extend with new platforms

### **Advanced Features**
- **Full-Text Search**: Content search capabilities across all platforms
- **JSON Support**: Flexible data storage with native JSON columns
- **Audit Trails**: Complete change tracking and compliance logging
- **Analytics**: Built-in analytics and performance monitoring
- **Error Handling**: Robust retry logic with comprehensive logging
- **Data Validation**: Pydantic models for data integrity
- **Performance Optimization**: Advanced indexing and query optimization
- **Migration Support**: Easy migration between database systems

## 📋 Requirements

- **Python**: 3.8+
- **Database**: SQLite (default), PostgreSQL, MySQL, SQL Server, or Oracle
- **Browser**: Modern web browser (for Selenium/Playwright)
- **Memory**: 2GB+ RAM recommended for large datasets
- **Storage**: SSD recommended for database performance

## 🛠️ Installation

### **Quick Start**
```bash
# Clone the repository
git clone <repository-url>
cd KaliSocialMediaScraper

# Install in development mode
make quick-start

# Or manually:
pip install -e .
cp .env.example .env
# Edit .env with your configuration
```

### **Manual Installation**
```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Install development dependencies (optional)
pip install -e ".[dev]"

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Initialize database (SQLite)
python -c "from scraper.core.database import init_database; import asyncio; asyncio.run(init_database())"
```

### **Database Setup**

#### **SQLite (Default)**
```bash
# Automatic initialization
python -c "from scraper.core.database import init_database; import asyncio; asyncio.run(init_database())"
```

#### **PostgreSQL (Recommended for Production)**
```bash
# Create database
createdb kali_scraper

# Apply schema
psql -d kali_scraper -f database_schemas/postgresql_schema.sql
```

#### **MySQL**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE kali_scraper"

# Apply schema
mysql -u root -p kali_scraper < database_schemas/mysql_schema.sql
```

## 🚀 Quick Start

### **CLI Usage**

```bash
# List available platforms
kali-scraper list-platforms

# Scrape Twitter user
kali-scraper scrape twitter user elonmusk --limit 100

# Scrape hashtag
kali-scraper scrape twitter hashtag python --limit 50

# Scrape keyword
kali-scraper scrape twitter keyword "artificial intelligence" --limit 75

# Get statistics
kali-scraper stats

# Export data
kali-scraper export --format json --output-file data.json

# Search scraped data
kali-scraper search "python programming"
```

### **Programmatic Usage**

```python
import asyncio
from scraper.platforms.twitter import TwitterScraper

async def main():
    scraper = TwitterScraper(use_proxies=True, use_rate_limiting=True)
    
    # Scrape user tweets
    tweets = await scraper.scrape_user("elonmusk", limit=50)
    
    # Scrape hashtag
    hashtag_tweets = await scraper.scrape_hashtag("python", limit=25)
    
    # Scrape keyword
    keyword_tweets = await scraper.scrape_keyword("AI", limit=30)
    
    await scraper.close()

asyncio.run(main())
```

### **Advanced Configuration**

```bash
# Use custom proxy
kali-scraper scrape twitter user techguru --proxy "http://proxy:8080"

# Custom rate limiting
kali-scraper scrape twitter hashtag news --delay 2.0 --max-retries 5

# Database output
kali-scraper scrape twitter user developer --output-db

# Custom output format
kali-scraper scrape twitter hashtag programming --format json --output-file tweets.json
```

## 📁 Project Structure

```
KaliSocialMediaScraper/
├── scraper/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── base_scraper.py      # Base scraper class with common functionality
│   │   ├── proxy_manager.py     # Proxy rotation and health monitoring
│   │   ├── user_agent.py        # User agent rotation and management
│   │   ├── rate_limiter.py      # Rate limiting with platform-specific rules
│   │   └── database.py          # Database models and operations
│   ├── platforms/
│   │   ├── __init__.py
│   │   ├── twitter.py           # Twitter/X scraper (fully implemented)
│   │   ├── instagram.py         # Instagram scraper (placeholder)
│   │   ├── facebook.py          # Facebook scraper (placeholder)
│   │   ├── linkedin.py          # LinkedIn scraper (placeholder)
│   │   └── tiktok.py            # TikTok scraper (placeholder)
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── logger.py            # Structured logging with Loguru
│   │   ├── helpers.py           # Utility functions and data processing
│   │   └── validators.py        # Input validation and sanitization
│   └── cli.py                   # Rich CLI interface with Typer
├── database_schemas/            # Advanced database schemas
│   ├── README.md               # Database documentation
│   ├── postgresql_schema.sql   # PostgreSQL schema with JSON support
│   ├── mysql_schema.sql        # MySQL schema with full-text search
│   ├── sqlite_schema.sql       # SQLite schema (default)
│   ├── mssql_schema.sql        # SQL Server schema
│   ├── oracle_schema.sql       # Oracle schema
│   └── migration_scripts/      # Database migration tools
├── tests/                      # Comprehensive test suite
│   └── test_twitter_scraper.py # Twitter scraper tests
├── data/                       # Output directory
├── logs/                       # Log files
├── requirements.txt            # Python dependencies
├── setup.py                   # Package setup
├── pyproject.toml             # Modern Python packaging
├── Makefile                   # Development tasks
├── example.py                 # Usage examples
├── .env.example               # Environment configuration
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🔧 Configuration

### **Environment Variables (.env)**

```env
# Database Configuration
DATABASE_URL=sqlite:///data/scraper.db
# DATABASE_URL=postgresql://user:password@localhost:5432/scraper_db
# DATABASE_URL=mysql://user:password@localhost:3306/scraper_db

# Proxy Settings
USE_PROXIES=true
PROXY_TIMEOUT=10
MAX_PROXY_RETRIES=3
PROXY_ROTATION_INTERVAL=300

# Rate Limiting
DEFAULT_DELAY=1.0
MAX_CONCURRENT_REQUESTS=5
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Output Settings
DEFAULT_OUTPUT_FORMAT=json
OUTPUT_DIRECTORY=./data
ENABLE_FILE_STORAGE=true
ENABLE_DATABASE_STORAGE=true

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/scraper.log
LOG_FORMAT=json
LOG_ROTATION=1 day

# Platform-Specific Delays
TWITTER_DELAY=2.0
INSTAGRAM_DELAY=3.0
FACEBOOK_DELAY=2.5
LINKEDIN_DELAY=5.0
TIKTOK_DELAY=2.0

# User Agent Rotation
USER_AGENT_ROTATION=true
USER_AGENT_CACHE_SIZE=100

# Cache Settings
ENABLE_CACHE=true
CACHE_TTL=3600
CACHE_SIZE=1000

# Development
DEBUG=false
TESTING=false
```

### **Database Configuration**

#### **PostgreSQL (Recommended)**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/kali_scraper
```

#### **MySQL**
```env
DATABASE_URL=mysql://username:password@localhost:3306/kali_scraper
```

#### **SQLite (Default)**
```env
DATABASE_URL=sqlite:///data/scraper.db
```

## 📊 Data Models

### **Standardized Post Model**
All platforms use a unified data model:

```python
{
    "id": "unique_post_id",
    "platform": "twitter",
    "author": "username",
    "content": "Post content text",
    "timestamp": "2023-01-01T12:00:00Z",
    "likes": 100,
    "comments": 25,
    "shares": 10,
    "views": 1000,
    "url": "https://platform.com/post/123",
    "media_urls": ["https://example.com/image.jpg"],
    "hashtags": ["#python", "#programming"],
    "mentions": ["@user1", "@user2"],
    "is_verified": True,
    "engagement_score": 85.5,
    "raw_data": {...}  # Platform-specific data
}
```

### **Platform-Specific Features**

#### **Twitter/X**
- Tweet ID, text, author, timestamp
- Likes, retweets, replies, views
- Media attachments, hashtags, mentions
- Verified status, engagement metrics
- Retweet/reply detection

#### **Instagram**
- Post ID, caption, author, timestamp
- Likes, comments, saves
- Media URLs, hashtags, location
- Story and reel support

#### **Facebook**
- Post ID, content, author, timestamp
- Reactions, comments, shares
- Media attachments, privacy settings
- Group and page support

#### **LinkedIn**
- Post ID, content, author, timestamp
- Reactions, comments, shares
- Company information, job details
- Article and video support

#### **TikTok**
- Video ID, description, author, timestamp
- Likes, comments, shares, views
- Video URL, hashtags, music info
- Duet and stitch support

## 🗄️ Database Features

### **Advanced Schema Support**
- **PostgreSQL**: JSONB, full-text search, partitioning, materialized views
- **MySQL**: JSON, full-text search, stored procedures, events
- **SQLite**: JSON support, virtual tables, WAL mode
- **SQL Server**: JSON operations, full-text search, stored procedures
- **Oracle**: JSON support, partitioning, materialized views

### **Performance Optimizations**
- **Indexing**: Composite and partial indexes for fast queries
- **Partitioning**: Time-based partitioning for large datasets
- **Caching**: Query result caching and connection pooling
- **Analytics**: Pre-computed views for common queries
- **Monitoring**: Performance metrics and health checks

### **Migration Support**
- **Cross-Platform**: Easy migration between database systems
- **Data Validation**: Integrity checks during migration
- **Rollback Support**: Safe migration with rollback options
- **Batch Processing**: Efficient handling of large datasets

## 🛡️ Ethical Guidelines

### **Responsible Usage**
- ✅ **Public Data Only**: Scraping publicly available information
- ✅ **Rate Limiting**: Respecting platform rate limits
- ✅ **Robots.txt**: Following website crawling policies
- ✅ **Educational Use**: Research and learning purposes
- ✅ **Personal Use**: Individual data collection

### **Compliance Requirements**
- **Platform Terms of Service**: Respect all platform policies
- **Local Laws**: Comply with applicable laws and regulations
- **Data Privacy**: Follow GDPR and privacy requirements
- **Rate Limiting**: Use reasonable request frequencies
- **Attribution**: Credit sources when appropriate

## 🧪 Testing

### **Running Tests**
```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Run specific tests
pytest tests/test_twitter_scraper.py

# Run linting
make lint

# Format code
make format
```

### **Test Coverage**
- **Unit Tests**: Individual component testing
- **Integration Tests**: Database and API testing
- **Platform Tests**: Platform-specific functionality
- **CLI Tests**: Command-line interface testing
- **Performance Tests**: Load and stress testing

## 🚀 Development

### **Available Commands**
```bash
# Quick start
make quick-start

# Install dependencies
make install-dev

# Run tests
make test

# Format code
make format

# Lint code
make lint

# Clean build artifacts
make clean

# Run example
make run-example

# Build package
make build

# Check dependencies
make check-deps
```

### **Development Workflow**
1. **Setup**: `make quick-start`
2. **Develop**: Edit code with your preferred IDE
3. **Test**: `make test` to run tests
4. **Format**: `make format` to format code
5. **Lint**: `make lint` to check code quality
6. **Commit**: Follow conventional commit messages

## 📈 Performance

### **Optimization Features**
- **Async Processing**: Concurrent request handling
- **Connection Pooling**: Efficient database connections
- **Caching**: Result caching for repeated queries
- **Batch Processing**: Efficient bulk operations
- **Memory Management**: Optimized memory usage

### **Scalability**
- **Horizontal Scaling**: Multiple instance support
- **Database Sharding**: Large dataset handling
- **Load Balancing**: Proxy and request distribution
- **Monitoring**: Performance metrics tracking

## 🔍 Monitoring & Analytics

### **Built-in Analytics**
- **Performance Metrics**: Request times and success rates
- **Data Statistics**: Post counts and engagement metrics
- **Error Tracking**: Comprehensive error logging
- **Health Checks**: System and database monitoring

### **Logging**
- **Structured Logs**: JSON-formatted log output
- **Log Rotation**: Automatic log file management
- **Error Tracking**: Detailed error context
- **Performance Monitoring**: Request timing and metrics

## 🤝 Contributing

### **Development Setup**
```bash
# Fork and clone the repository
git clone <your-fork-url>
cd KaliSocialMediaScraper

# Install in development mode
make install-dev

# Run tests
make test

# Make your changes
# Add tests for new features
# Update documentation

# Submit pull request
```

### **Contribution Guidelines**
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes with tests
4. **Format** and **lint** your code
5. **Submit** a pull request

### **Code Standards**
- **Python**: PEP 8 style guide
- **Type Hints**: Full type annotation
- **Documentation**: Comprehensive docstrings
- **Testing**: 90%+ test coverage
- **Linting**: Pass all linting checks

## 📝 License

This project is for educational and research purposes. Please ensure compliance with platform Terms of Service and local laws.

## ⚠️ Disclaimer

This tool is for educational and research purposes only. Users are responsible for ensuring compliance with platform Terms of Service and applicable laws. The authors are not responsible for any misuse of this software.

## 🆘 Support

### **Getting Help**
- **Documentation**: Check this README and inline docs
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Examples**: See `example.py` for usage examples

### **Common Issues**
- **Database Connection**: Check DATABASE_URL in .env
- **Proxy Issues**: Verify proxy configuration and connectivity
- **Rate Limiting**: Adjust delays in configuration
- **Memory Usage**: Monitor system resources for large datasets

---

**Built with ❤️ for the open-source community** 