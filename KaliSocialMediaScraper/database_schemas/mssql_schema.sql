-- Microsoft SQL Server Schema for Kali Social Media Scraper
-- Version: 1.0.0
-- Description: Advanced SQL Server schema with JSON support, full-text search, and performance optimizations
-- Compatible with: SQL Server 2016+

-- Create database if not exists
-- CREATE DATABASE kali_scraper;
-- GO
-- USE kali_scraper;
-- GO

-- Schema version tracking table
CREATE TABLE schema_versions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    version NVARCHAR(20) NOT NULL,
    applied_at DATETIME2 DEFAULT GETDATE(),
    description NVARCHAR(MAX),
    checksum NVARCHAR(64)
);

-- Insert current schema version
INSERT INTO schema_versions (version, description) VALUES ('1.0.0', 'Initial SQL Server schema');

-- Platforms table
CREATE TABLE platforms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(20) UNIQUE NOT NULL CHECK (name IN ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok')),
    display_name NVARCHAR(100) NOT NULL,
    base_url NVARCHAR(255) NOT NULL,
    api_url NVARCHAR(255),
    is_active BIT DEFAULT 1,
    rate_limit_per_minute INT DEFAULT 60,
    rate_limit_per_hour INT DEFAULT 1000,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Users table with advanced features
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    platform_id INT NOT NULL,
    platform_user_id NVARCHAR(255) NOT NULL,
    username NVARCHAR(100) NOT NULL,
    display_name NVARCHAR(255),
    bio NVARCHAR(MAX),
    profile_image_url NVARCHAR(500),
    banner_image_url NVARCHAR(500),
    verified BIT DEFAULT 0,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    location NVARCHAR(255),
    website NVARCHAR(255),
    joined_date DATETIME2,
    last_scraped_at DATETIME2 DEFAULT GETDATE(),
    metadata NVARCHAR(MAX) DEFAULT '{}', -- JSON string
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uk_platform_user UNIQUE (platform_id, platform_user_id),
    CONSTRAINT uk_platform_username UNIQUE (platform_id, username),
    CONSTRAINT fk_users_platform FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Posts table with JSON support
CREATE TABLE posts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    platform_id INT NOT NULL,
    platform_post_id NVARCHAR(255) NOT NULL,
    author_id INT NOT NULL,
    post_type NVARCHAR(20) DEFAULT 'post' CHECK (post_type IN ('post', 'tweet', 'video', 'story', 'article', 'comment')),
    content NVARCHAR(MAX),
    url NVARCHAR(500),
    media_urls NVARCHAR(MAX) DEFAULT '[]', -- JSON string
    hashtags NVARCHAR(MAX) DEFAULT '[]', -- JSON string
    mentions NVARCHAR(MAX) DEFAULT '[]', -- JSON string
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    views INT DEFAULT 0,
    is_verified BIT DEFAULT 0,
    is_retweet BIT DEFAULT 0,
    is_reply BIT DEFAULT 0,
    parent_post_id NVARCHAR(255),
    language NVARCHAR(10),
    sentiment_score DECIMAL(3,2),
    engagement_score DECIMAL(5,2),
    published_at DATETIME2,
    scraped_at DATETIME2 DEFAULT GETDATE(),
    raw_data NVARCHAR(MAX) DEFAULT '{}', -- JSON string
    metadata NVARCHAR(MAX) DEFAULT '{}', -- JSON string
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uk_platform_post UNIQUE (platform_id, platform_post_id),
    CONSTRAINT fk_posts_platform FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Scraping sessions table
CREATE TABLE scraping_sessions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_uuid NVARCHAR(36) NOT NULL,
    platform_id INT NOT NULL,
    session_type NVARCHAR(50) NOT NULL, -- 'user', 'hashtag', 'keyword'
    target NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
    total_posts INT DEFAULT 0,
    successful_posts INT DEFAULT 0,
    failed_posts INT DEFAULT 0,
    start_time DATETIME2 DEFAULT GETDATE(),
    end_time DATETIME2,
    duration_seconds INT,
    error_count INT DEFAULT 0,
    last_error NVARCHAR(MAX),
    metadata NVARCHAR(MAX) DEFAULT '{}', -- JSON string
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_sessions_platform FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Errors table for comprehensive error tracking
CREATE TABLE errors (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT,
    error_type NVARCHAR(100) NOT NULL,
    error_message NVARCHAR(MAX) NOT NULL,
    error_code NVARCHAR(50),
    stack_trace NVARCHAR(MAX),
    context NVARCHAR(MAX) DEFAULT '{}', -- JSON string
    occurred_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_errors_session FOREIGN KEY (session_id) REFERENCES scraping_sessions(id) ON DELETE CASCADE
);

-- Proxies table with health tracking
CREATE TABLE proxies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    proxy_url NVARCHAR(255) UNIQUE NOT NULL,
    proxy_type NVARCHAR(20) DEFAULT 'http' CHECK (proxy_type IN ('http', 'https', 'socks4', 'socks5')),
    username NVARCHAR(100),
    password NVARCHAR(100),
    country NVARCHAR(2),
    city NVARCHAR(100),
    isp NVARCHAR(255),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed', 'testing')),
    last_used_at DATETIME2,
    last_tested_at DATETIME2,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    response_time_ms INT,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    metadata NVARCHAR(MAX) DEFAULT '{}', -- JSON string
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Rate limits tracking table
CREATE TABLE rate_limits (
    id INT IDENTITY(1,1) PRIMARY KEY,
    platform_id INT NOT NULL,
    proxy_id INT,
    endpoint NVARCHAR(255) NOT NULL,
    requests_made INT DEFAULT 0,
    requests_allowed INT NOT NULL,
    reset_time DATETIME2 NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_rate_limits_platform FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    CONSTRAINT fk_rate_limits_proxy FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE SET NULL
);

-- User agents table
CREATE TABLE user_agents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_agent_string NVARCHAR(MAX) NOT NULL,
    browser NVARCHAR(50),
    version NVARCHAR(20),
    os NVARCHAR(50),
    device_type NVARCHAR(20),
    is_mobile BIT DEFAULT 0,
    usage_count INT DEFAULT 0,
    last_used_at DATETIME2,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uk_user_agent UNIQUE (user_agent_string)
);

-- Analytics and metrics table
CREATE TABLE analytics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL,
    platform_id INT NOT NULL,
    metric_name NVARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metadata NVARCHAR(MAX) DEFAULT '{}', -- JSON string
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uk_date_platform_metric UNIQUE (date, platform_id, metric_name),
    CONSTRAINT fk_analytics_platform FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Audit trail table
CREATE TABLE audit_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    table_name NVARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action NVARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values NVARCHAR(MAX), -- JSON string
    new_values NVARCHAR(MAX), -- JSON string
    changed_by NVARCHAR(100),
    changed_at DATETIME2 DEFAULT GETDATE()
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

-- Create full-text catalog and index for content search
-- CREATE FULLTEXT CATALOG scraper_catalog;
-- CREATE FULLTEXT INDEX ON posts(content) KEY INDEX PK_posts ON scraper_catalog;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER tr_posts_updated_at
ON posts
AFTER UPDATE
AS
BEGIN
    UPDATE posts 
    SET updated_at = GETDATE()
    FROM posts p
    INNER JOIN inserted i ON p.id = i.id;
END;

CREATE TRIGGER tr_users_updated_at
ON users
AFTER UPDATE
AS
BEGIN
    UPDATE users 
    SET updated_at = GETDATE()
    FROM users u
    INNER JOIN inserted i ON u.id = i.id;
END;

CREATE TRIGGER tr_sessions_updated_at
ON scraping_sessions
AFTER UPDATE
AS
BEGIN
    UPDATE scraping_sessions 
    SET updated_at = GETDATE()
    FROM scraping_sessions s
    INNER JOIN inserted i ON s.id = i.id;
END;

CREATE TRIGGER tr_proxies_updated_at
ON proxies
AFTER UPDATE
AS
BEGIN
    UPDATE proxies 
    SET updated_at = GETDATE()
    FROM proxies p
    INNER JOIN inserted i ON p.id = i.id;
END;

CREATE TRIGGER tr_rate_limits_updated_at
ON rate_limits
AFTER UPDATE
AS
BEGIN
    UPDATE rate_limits 
    SET updated_at = GETDATE()
    FROM rate_limits r
    INNER JOIN inserted i ON r.id = i.id;
END;

-- Create audit trigger
CREATE TRIGGER tr_audit_posts
ON posts
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF TRIGGER_NESTLEVEL() > 1
        RETURN;
    
    DECLARE @action NVARCHAR(20);
    DECLARE @record_id INT;
    DECLARE @old_values NVARCHAR(MAX);
    DECLARE @new_values NVARCHAR(MAX);
    
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        SET @action = 'UPDATE';
        SELECT @record_id = id, @new_values = (SELECT * FROM inserted FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) FROM inserted;
        SELECT @old_values = (SELECT * FROM deleted FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) FROM deleted;
    END
    ELSE IF EXISTS(SELECT * FROM inserted)
    BEGIN
        SET @action = 'INSERT';
        SELECT @record_id = id, @new_values = (SELECT * FROM inserted FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) FROM inserted;
    END
    ELSE IF EXISTS(SELECT * FROM deleted)
    BEGIN
        SET @action = 'DELETE';
        SELECT @record_id = id, @old_values = (SELECT * FROM deleted FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) FROM deleted;
    END
    
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
    VALUES ('posts', @record_id, @action, @old_values, @new_values);
END;

-- Create views for analytics
CREATE VIEW daily_platform_stats AS
SELECT 
    CAST(published_at AS DATE) as date,
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
GROUP BY CAST(published_at AS DATE), platform_id;

-- Performance monitoring view
CREATE VIEW performance_metrics AS
SELECT 
    'posts' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > DATEADD(day, -1, GETDATE()) THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > DATEADD(day, -7, GETDATE()) THEN 1 END) as last_7d
FROM posts
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > DATEADD(day, -1, GETDATE()) THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > DATEADD(day, -7, GETDATE()) THEN 1 END) as last_7d
FROM users
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > DATEADD(day, -1, GETDATE()) THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > DATEADD(day, -7, GETDATE()) THEN 1 END) as last_7d
FROM scraping_sessions;

-- Insert default platform data
INSERT INTO platforms (name, display_name, base_url, api_url, rate_limit_per_minute, rate_limit_per_hour) VALUES
('twitter', 'Twitter/X', 'https://twitter.com', 'https://api.twitter.com', 300, 300000),
('instagram', 'Instagram', 'https://www.instagram.com', 'https://www.instagram.com/api/v1', 200, 100000),
('facebook', 'Facebook', 'https://www.facebook.com', 'https://graph.facebook.com', 200, 100000),
('linkedin', 'LinkedIn', 'https://www.linkedin.com', 'https://www.linkedin.com/api', 100, 50000),
('tiktok', 'TikTok', 'https://www.tiktok.com', 'https://www.tiktok.com/api', 300, 150000);

-- Create stored procedures for common operations

-- Procedure to get platform statistics
CREATE PROCEDURE GetPlatformStats
    @platform_name NVARCHAR(50) = NULL
AS
BEGIN
    SELECT 
        p.name as platform,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(po.id) as total_posts,
        SUM(po.likes) as total_likes,
        SUM(po.comments) as total_comments,
        SUM(po.shares) as total_shares,
        AVG(po.engagement_score) as avg_engagement
    FROM platforms p
    LEFT JOIN users u ON p.id = u.platform_id
    LEFT JOIN posts po ON p.id = po.platform_id
    WHERE p.name = @platform_name OR @platform_name IS NULL
    GROUP BY p.id, p.name;
END;

-- Procedure to clean old data
CREATE PROCEDURE CleanOldData
    @days_to_keep INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete old posts
        DELETE FROM posts WHERE created_at < DATEADD(day, -@days_to_keep, GETDATE());
        
        -- Delete old sessions
        DELETE FROM scraping_sessions WHERE created_at < DATEADD(day, -@days_to_keep, GETDATE());
        
        -- Delete old errors
        DELETE FROM errors WHERE occurred_at < DATEADD(day, -@days_to_keep, GETDATE());
        
        -- Delete old audit logs
        DELETE FROM audit_log WHERE changed_at < DATEADD(day, -@days_to_keep, GETDATE());
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

-- Create functions for JSON operations (SQL Server 2016+)
-- Note: These functions require SQL Server 2016 or later for JSON support

-- Function to extract JSON value
CREATE FUNCTION ExtractJsonValue
(
    @json NVARCHAR(MAX),
    @path NVARCHAR(100)
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @result NVARCHAR(MAX);
    SET @result = JSON_VALUE(@json, @path);
    RETURN @result;
END;

-- Function to check if JSON contains value
CREATE FUNCTION JsonContains
(
    @json NVARCHAR(MAX),
    @value NVARCHAR(MAX)
)
RETURNS BIT
AS
BEGIN
    DECLARE @result BIT = 0;
    IF JSON_QUERY(@json, '$') LIKE '%' + @value + '%'
        SET @result = 1;
    RETURN @result;
END; 