-- SQLite Schema for Kali Social Media Scraper
-- Version: 1.0.0
-- Description: Advanced SQLite schema with JSON support and performance optimizations
-- Compatible with: SQLite 3.35+

-- Enable foreign keys and other features
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;

-- Schema version tracking table
CREATE TABLE IF NOT EXISTS schema_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum TEXT
);

-- Insert current schema version
INSERT INTO schema_versions (version, description) VALUES ('1.0.0', 'Initial SQLite schema');

-- Platforms table
CREATE TABLE platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL CHECK (name IN ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok')),
    display_name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    api_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table with advanced features
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL,
    platform_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT,
    bio TEXT,
    profile_image_url TEXT,
    banner_image_url TEXT,
    verified BOOLEAN DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    location TEXT,
    website TEXT,
    joined_date DATETIME,
    last_scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT DEFAULT '{}', -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform_id, platform_user_id),
    UNIQUE(platform_id, username),
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Posts table with JSON support
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL,
    platform_post_id TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    post_type TEXT DEFAULT 'post' CHECK (post_type IN ('post', 'tweet', 'video', 'story', 'article', 'comment')),
    content TEXT,
    url TEXT,
    media_urls TEXT DEFAULT '[]', -- JSON string
    hashtags TEXT DEFAULT '[]', -- JSON string
    mentions TEXT DEFAULT '[]', -- JSON string
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT 0,
    is_retweet BOOLEAN DEFAULT 0,
    is_reply BOOLEAN DEFAULT 0,
    parent_post_id TEXT,
    language TEXT,
    sentiment_score REAL,
    engagement_score REAL,
    published_at DATETIME,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_data TEXT DEFAULT '{}', -- JSON string
    metadata TEXT DEFAULT '{}', -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform_id, platform_post_id),
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Scraping sessions table
CREATE TABLE scraping_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_uuid TEXT NOT NULL,
    platform_id INTEGER NOT NULL,
    session_type TEXT NOT NULL, -- 'user', 'hashtag', 'keyword'
    target TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
    total_posts INTEGER DEFAULT 0,
    successful_posts INTEGER DEFAULT 0,
    failed_posts INTEGER DEFAULT 0,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    duration_seconds INTEGER,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata TEXT DEFAULT '{}', -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Errors table for comprehensive error tracking
CREATE TABLE errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_code TEXT,
    stack_trace TEXT,
    context TEXT DEFAULT '{}', -- JSON string
    occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES scraping_sessions(id) ON DELETE CASCADE
);

-- Proxies table with health tracking
CREATE TABLE proxies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proxy_url TEXT UNIQUE NOT NULL,
    proxy_type TEXT DEFAULT 'http' CHECK (proxy_type IN ('http', 'https', 'socks4', 'socks5')),
    username TEXT,
    password TEXT,
    country TEXT,
    city TEXT,
    isp TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed', 'testing')),
    last_used_at DATETIME,
    last_tested_at DATETIME,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    uptime_percentage REAL DEFAULT 100.0,
    metadata TEXT DEFAULT '{}', -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rate limits tracking table
CREATE TABLE rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL,
    proxy_id INTEGER,
    endpoint TEXT NOT NULL,
    requests_made INTEGER DEFAULT 0,
    requests_allowed INTEGER NOT NULL,
    reset_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE SET NULL
);

-- User agents table
CREATE TABLE user_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_agent_string TEXT UNIQUE NOT NULL,
    browser TEXT,
    version TEXT,
    os TEXT,
    device_type TEXT,
    is_mobile BOOLEAN DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    last_used_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and metrics table
CREATE TABLE analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    platform_id INTEGER NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metadata TEXT DEFAULT '{}', -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, platform_id, metric_name),
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Audit trail table
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values TEXT, -- JSON string
    new_values TEXT, -- JSON string
    changed_by TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization

-- Posts table indexes
CREATE INDEX idx_posts_platform_id ON posts(platform_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_scraped_at ON posts(scraped_at);
CREATE INDEX idx_posts_likes ON posts(likes DESC);
CREATE INDEX idx_posts_engagement_score ON posts(engagement_score DESC);
CREATE INDEX idx_posts_verified ON posts(is_verified);
CREATE INDEX idx_posts_composite_platform_date ON posts(platform_id, published_at DESC);

-- Users table indexes
CREATE INDEX idx_users_platform_id ON users(platform_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_verified ON users(verified);
CREATE INDEX idx_users_followers_count ON users(followers_count DESC);
CREATE INDEX idx_users_last_scraped_at ON users(last_scraped_at);

-- Scraping sessions indexes
CREATE INDEX idx_sessions_platform_id ON scraping_sessions(platform_id);
CREATE INDEX idx_sessions_status ON scraping_sessions(status);
CREATE INDEX idx_sessions_start_time ON scraping_sessions(start_time);
CREATE INDEX idx_sessions_session_uuid ON scraping_sessions(session_uuid);

-- Errors table indexes
CREATE INDEX idx_errors_session_id ON errors(session_id);
CREATE INDEX idx_errors_error_type ON errors(error_type);
CREATE INDEX idx_errors_occurred_at ON errors(occurred_at);

-- Proxies table indexes
CREATE INDEX idx_proxies_status ON proxies(status);
CREATE INDEX idx_proxies_country ON proxies(country);
CREATE INDEX idx_proxies_last_tested_at ON proxies(last_tested_at);
CREATE INDEX idx_proxies_uptime_percentage ON proxies(uptime_percentage DESC);

-- Rate limits indexes
CREATE INDEX idx_rate_limits_platform_endpoint ON rate_limits(platform_id, endpoint);
CREATE INDEX idx_rate_limits_reset_time ON rate_limits(reset_time);

-- Analytics indexes
CREATE INDEX idx_analytics_date_platform ON analytics(date, platform_id);
CREATE INDEX idx_analytics_metric_name ON analytics(metric_name);

-- Audit log indexes
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN NEW.updated_at = OLD.updated_at THEN
            RAISE(ABORT, 'Cannot update updated_at directly')
    END;
    SELECT datetime('now') WHERE NEW.updated_at = datetime('now');
END;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN NEW.updated_at = OLD.updated_at THEN
            RAISE(ABORT, 'Cannot update updated_at directly')
    END;
    SELECT datetime('now') WHERE NEW.updated_at = datetime('now');
END;

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON scraping_sessions
    FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN NEW.updated_at = OLD.updated_at THEN
            RAISE(ABORT, 'Cannot update updated_at directly')
    END;
    SELECT datetime('now') WHERE NEW.updated_at = datetime('now');
END;

CREATE TRIGGER update_proxies_updated_at
    BEFORE UPDATE ON proxies
    FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN NEW.updated_at = OLD.updated_at THEN
            RAISE(ABORT, 'Cannot update updated_at directly')
    END;
    SELECT datetime('now') WHERE NEW.updated_at = datetime('now');
END;

CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON rate_limits
    FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN NEW.updated_at = OLD.updated_at THEN
            RAISE(ABORT, 'Cannot update updated_at directly')
    END;
    SELECT datetime('now') WHERE NEW.updated_at = datetime('now');
END;

-- Create audit trigger
CREATE TRIGGER audit_posts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW
BEGIN
    CASE
        WHEN TG_OP = 'INSERT' THEN
            INSERT INTO audit_log (table_name, record_id, action, new_values)
            VALUES ('posts', NEW.id, 'INSERT', json_object(
                'id', NEW.id,
                'platform_id', NEW.platform_id,
                'platform_post_id', NEW.platform_post_id,
                'author_id', NEW.author_id,
                'content', NEW.content
            ));
        WHEN TG_OP = 'UPDATE' THEN
            INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
            VALUES ('posts', NEW.id, 'UPDATE', json_object(
                'id', OLD.id,
                'platform_id', OLD.platform_id,
                'platform_post_id', OLD.platform_post_id,
                'author_id', OLD.author_id,
                'content', OLD.content
            ), json_object(
                'id', NEW.id,
                'platform_id', NEW.platform_id,
                'platform_post_id', NEW.platform_post_id,
                'author_id', NEW.author_id,
                'content', NEW.content
            ));
        WHEN TG_OP = 'DELETE' THEN
            INSERT INTO audit_log (table_name, record_id, action, old_values)
            VALUES ('posts', OLD.id, 'DELETE', json_object(
                'id', OLD.id,
                'platform_id', OLD.platform_id,
                'platform_post_id', OLD.platform_post_id,
                'author_id', OLD.author_id,
                'content', OLD.content
            ));
    END CASE;
END;

-- Create views for analytics
CREATE VIEW daily_platform_stats AS
SELECT 
    date(published_at) as date,
    platform_id,
    COUNT(*) as total_posts,
    COUNT(DISTINCT author_id) as unique_authors,
    SUM(likes) as total_likes,
    SUM(comments) as total_comments,
    SUM(shares) as total_shares,
    SUM(views) as total_views,
    AVG(engagement_score) as avg_engagement_score
FROM posts 
WHERE published_at IS NOT NULL
GROUP BY date(published_at), platform_id
ORDER BY date DESC, platform_id;

-- Performance monitoring view
CREATE VIEW performance_metrics AS
SELECT 
    'posts' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as last_7d
FROM posts
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as last_7d
FROM users
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as last_7d
FROM scraping_sessions;

-- Insert default platform data
INSERT INTO platforms (name, display_name, base_url, api_url, rate_limit_per_minute, rate_limit_per_hour) VALUES
('twitter', 'Twitter/X', 'https://twitter.com', 'https://api.twitter.com', 300, 300000),
('instagram', 'Instagram', 'https://www.instagram.com', 'https://www.instagram.com/api/v1', 200, 100000),
('facebook', 'Facebook', 'https://www.facebook.com', 'https://graph.facebook.com', 200, 100000),
('linkedin', 'LinkedIn', 'https://www.linkedin.com', 'https://www.linkedin.com/api', 100, 50000),
('tiktok', 'TikTok', 'https://www.tiktok.com', 'https://www.tiktok.com/api', 300, 150000);

-- Create virtual tables for full-text search (if FTS5 is available)
-- CREATE VIRTUAL TABLE posts_fts USING fts5(content, content='posts', content_rowid='id');
-- CREATE TRIGGER posts_ai AFTER INSERT ON posts BEGIN
--     INSERT INTO posts_fts(rowid, content) VALUES (new.id, new.content);
-- END;
-- CREATE TRIGGER posts_ad AFTER DELETE ON posts BEGIN
--     INSERT INTO posts_fts(posts_fts, rowid, content) VALUES('delete', old.id, old.content);
-- END;
-- CREATE TRIGGER posts_au AFTER UPDATE ON posts BEGIN
--     INSERT INTO posts_fts(posts_fts, rowid, content) VALUES('delete', old.id, old.content);
--     INSERT INTO posts_fts(rowid, content) VALUES (new.id, new.content);
-- END; 