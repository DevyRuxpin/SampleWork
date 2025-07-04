-- MySQL Schema for Kali Social Media Scraper
-- Version: 1.0.0
-- Description: Advanced MySQL schema with JSON support, full-text search, and performance optimizations
-- Compatible with: MySQL 8.0+ or MariaDB 10.5+

-- Set character set and collation
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create database if not exists
-- CREATE DATABASE IF NOT EXISTS kali_scraper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE kali_scraper;

-- Schema version tracking table
CREATE TABLE IF NOT EXISTS schema_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum VARCHAR(64),
    INDEX idx_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert current schema version
INSERT INTO schema_versions (version, description) VALUES ('1.0.0', 'Initial MySQL schema');

-- Platforms table
CREATE TABLE platforms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok') UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    api_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INT DEFAULT 60,
    rate_limit_per_hour INT DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table with advanced features
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform_id INT NOT NULL,
    platform_user_id VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    profile_image_url VARCHAR(500),
    banner_image_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    location VARCHAR(255),
    website VARCHAR(255),
    joined_date TIMESTAMP NULL,
    last_scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_platform_user (platform_id, platform_user_id),
    UNIQUE KEY uk_platform_username (platform_id, username),
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    INDEX idx_platform_id (platform_id),
    INDEX idx_username (username),
    INDEX idx_verified (verified),
    INDEX idx_followers_count (followers_count DESC),
    INDEX idx_last_scraped_at (last_scraped_at),
    INDEX idx_metadata ((CAST(metadata AS CHAR(1000))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posts table with JSON support and full-text search
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform_id INT NOT NULL,
    platform_post_id VARCHAR(255) NOT NULL,
    author_id INT NOT NULL,
    post_type ENUM('post', 'tweet', 'video', 'story', 'article', 'comment') DEFAULT 'post',
    content TEXT,
    url VARCHAR(500),
    media_urls JSON,
    hashtags JSON,
    mentions JSON,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    views INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_retweet BOOLEAN DEFAULT FALSE,
    is_reply BOOLEAN DEFAULT FALSE,
    parent_post_id VARCHAR(255),
    language VARCHAR(10),
    sentiment_score DECIMAL(3,2),
    engagement_score DECIMAL(5,2),
    published_at TIMESTAMP NULL,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    raw_data JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_platform_post (platform_id, platform_post_id),
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_platform_id (platform_id),
    INDEX idx_author_id (author_id),
    INDEX idx_published_at (published_at),
    INDEX idx_scraped_at (scraped_at),
    INDEX idx_likes (likes DESC),
    INDEX idx_engagement_score (engagement_score DESC),
    INDEX idx_verified (is_verified),
    INDEX idx_media_urls ((CAST(media_urls AS CHAR(1000)))),
    INDEX idx_hashtags ((CAST(hashtags AS CHAR(1000)))),
    INDEX idx_mentions ((CAST(mentions AS CHAR(1000)))),
    INDEX idx_raw_data ((CAST(raw_data AS CHAR(1000)))),
    INDEX idx_metadata ((CAST(metadata AS CHAR(1000)))),
    FULLTEXT KEY ft_content (content),
    INDEX idx_composite_platform_date (platform_id, published_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scraping sessions table
CREATE TABLE scraping_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid CHAR(36) NOT NULL,
    platform_id INT NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- 'user', 'hashtag', 'keyword'
    target VARCHAR(255) NOT NULL,
    status ENUM('active', 'completed', 'failed', 'cancelled') DEFAULT 'active',
    total_posts INT DEFAULT 0,
    successful_posts INT DEFAULT 0,
    failed_posts INT DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_seconds INT,
    error_count INT DEFAULT 0,
    last_error TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    INDEX idx_platform_id (platform_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_metadata ((CAST(metadata AS CHAR(1000))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Errors table for comprehensive error tracking
CREATE TABLE errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_code VARCHAR(50),
    stack_trace TEXT,
    context JSON,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_error_type (error_type),
    INDEX idx_occurred_at (occurred_at),
    INDEX idx_context ((CAST(context AS CHAR(1000))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Proxies table with health tracking
CREATE TABLE proxies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proxy_url VARCHAR(255) UNIQUE NOT NULL,
    proxy_type ENUM('http', 'https', 'socks4', 'socks5') DEFAULT 'http',
    username VARCHAR(100),
    password VARCHAR(100),
    country VARCHAR(2),
    city VARCHAR(100),
    isp VARCHAR(255),
    status ENUM('active', 'inactive', 'failed', 'testing') DEFAULT 'active',
    last_used_at TIMESTAMP NULL,
    last_tested_at TIMESTAMP NULL,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    response_time_ms INT,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_country (country),
    INDEX idx_last_tested_at (last_tested_at),
    INDEX idx_uptime_percentage (uptime_percentage DESC),
    INDEX idx_metadata ((CAST(metadata AS CHAR(1000))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limits tracking table
CREATE TABLE rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform_id INT NOT NULL,
    proxy_id INT,
    endpoint VARCHAR(255) NOT NULL,
    requests_made INT DEFAULT 0,
    requests_allowed INT NOT NULL,
    reset_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE SET NULL,
    INDEX idx_platform_endpoint (platform_id, endpoint),
    INDEX idx_reset_time (reset_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User agents table
CREATE TABLE user_agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_agent_string TEXT NOT NULL,
    browser VARCHAR(50),
    version VARCHAR(20),
    os VARCHAR(50),
    device_type VARCHAR(20),
    is_mobile BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_agent (user_agent_string(255)),
    INDEX idx_is_active (is_active),
    INDEX idx_usage_count (usage_count DESC),
    INDEX idx_last_used_at (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics and metrics table
CREATE TABLE analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    platform_id INT NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_date_platform_metric (date, platform_id, metric_name),
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    INDEX idx_date_platform (date, platform_id),
    INDEX idx_metric_name (metric_name),
    INDEX idx_metadata ((CAST(metadata AS CHAR(1000))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit trail table
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_action (action),
    INDEX idx_changed_at (changed_at),
    INDEX idx_old_values ((CAST(old_values AS CHAR(1000)))),
    INDEX idx_new_values ((CAST(new_values AS CHAR(1000))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create partitioned tables for large datasets (optional)
-- This requires MySQL 8.0+ with partitioning support

-- Posts table partitioned by date (example)
-- CREATE TABLE posts_partitioned (
--     id INT AUTO_INCREMENT,
--     platform_id INT NOT NULL,
--     platform_post_id VARCHAR(255) NOT NULL,
--     author_id INT NOT NULL,
--     post_type ENUM('post', 'tweet', 'video', 'story', 'article', 'comment') DEFAULT 'post',
--     content TEXT,
--     url VARCHAR(500),
--     media_urls JSON,
--     hashtags JSON,
--     mentions JSON,
--     likes INT DEFAULT 0,
--     comments INT DEFAULT 0,
--     shares INT DEFAULT 0,
--     views INT DEFAULT 0,
--     is_verified BOOLEAN DEFAULT FALSE,
--     is_retweet BOOLEAN DEFAULT FALSE,
--     is_reply BOOLEAN DEFAULT FALSE,
--     parent_post_id VARCHAR(255),
--     language VARCHAR(10),
--     sentiment_score DECIMAL(3,2),
--     engagement_score DECIMAL(5,2),
--     published_at TIMESTAMP NULL,
--     scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     raw_data JSON,
--     metadata JSON,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     PRIMARY KEY (id, published_at),
--     UNIQUE KEY uk_platform_post (platform_id, platform_post_id, published_at),
--     FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
--     FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
--     INDEX idx_platform_id (platform_id),
--     INDEX idx_author_id (author_id),
--     INDEX idx_published_at (published_at),
--     INDEX idx_likes (likes DESC),
--     INDEX idx_engagement_score (engagement_score DESC),
--     FULLTEXT KEY ft_content (content)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
-- PARTITION BY RANGE (YEAR(published_at)) (
--     PARTITION p2020 VALUES LESS THAN (2021),
--     PARTITION p2021 VALUES LESS THAN (2022),
--     PARTITION p2022 VALUES LESS THAN (2023),
--     PARTITION p2023 VALUES LESS THAN (2024),
--     PARTITION p2024 VALUES LESS THAN (2025),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- Create triggers for automatic timestamp updates
DELIMITER //

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON scraping_sessions
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_proxies_updated_at
    BEFORE UPDATE ON proxies
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON rate_limits
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

-- Create audit trigger function
CREATE TRIGGER audit_posts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values)
        VALUES ('posts', NEW.id, 'INSERT', JSON_OBJECT(
            'id', NEW.id,
            'platform_id', NEW.platform_id,
            'platform_post_id', NEW.platform_post_id,
            'author_id', NEW.author_id,
            'content', NEW.content
        ));
    ELSEIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
        VALUES ('posts', NEW.id, 'UPDATE', JSON_OBJECT(
            'id', OLD.id,
            'platform_id', OLD.platform_id,
            'platform_post_id', OLD.platform_post_id,
            'author_id', OLD.author_id,
            'content', OLD.content
        ), JSON_OBJECT(
            'id', NEW.id,
            'platform_id', NEW.platform_id,
            'platform_post_id', NEW.platform_post_id,
            'author_id', NEW.author_id,
            'content', NEW.content
        ));
    ELSEIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values)
        VALUES ('posts', OLD.id, 'DELETE', JSON_OBJECT(
            'id', OLD.id,
            'platform_id', OLD.platform_id,
            'platform_post_id', OLD.platform_post_id,
            'author_id', OLD.author_id,
            'content', OLD.content
        ));
    END IF;
END//

DELIMITER ;

-- Create views for analytics
CREATE VIEW daily_platform_stats AS
SELECT 
    DATE(published_at) as date,
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
GROUP BY DATE(published_at), platform_id
ORDER BY date DESC, platform_id;

-- Performance monitoring view
CREATE VIEW performance_metrics AS
SELECT 
    'posts' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7d
FROM posts
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7d
FROM users
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7d
FROM scraping_sessions;

-- Insert default platform data
INSERT INTO platforms (name, display_name, base_url, api_url, rate_limit_per_minute, rate_limit_per_hour) VALUES
('twitter', 'Twitter/X', 'https://twitter.com', 'https://api.twitter.com', 300, 300000),
('instagram', 'Instagram', 'https://www.instagram.com', 'https://www.instagram.com/api/v1', 200, 100000),
('facebook', 'Facebook', 'https://www.facebook.com', 'https://graph.facebook.com', 200, 100000),
('linkedin', 'LinkedIn', 'https://www.linkedin.com', 'https://www.linkedin.com/api', 100, 50000),
('tiktok', 'TikTok', 'https://www.tiktok.com', 'https://www.tiktok.com/api', 300, 150000)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    base_url = VALUES(base_url),
    api_url = VALUES(api_url),
    rate_limit_per_minute = VALUES(rate_limit_per_minute),
    rate_limit_per_hour = VALUES(rate_limit_per_hour);

-- Create stored procedures for common operations

-- Procedure to get platform statistics
DELIMITER //
CREATE PROCEDURE GetPlatformStats(IN platform_name VARCHAR(50))
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
    WHERE p.name = platform_name OR platform_name IS NULL
    GROUP BY p.id, p.name;
END//
DELIMITER ;

-- Procedure to clean old data
DELIMITER //
CREATE PROCEDURE CleanOldData(IN days_to_keep INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Delete old posts
    DELETE FROM posts WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- Delete old sessions
    DELETE FROM scraping_sessions WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- Delete old errors
    DELETE FROM errors WHERE occurred_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- Delete old audit logs
    DELETE FROM audit_log WHERE changed_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    COMMIT;
END//
DELIMITER ;

-- Create events for maintenance
-- Enable event scheduler: SET GLOBAL event_scheduler = ON;

-- Event to clean old data weekly
-- CREATE EVENT IF NOT EXISTS weekly_cleanup
-- ON SCHEDULE EVERY 1 WEEK
-- STARTS CURRENT_TIMESTAMP
-- DO CALL CleanOldData(90);

-- Event to update analytics daily
-- CREATE EVENT IF NOT EXISTS daily_analytics
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO
-- BEGIN
--     INSERT INTO analytics (date, platform_id, metric_name, metric_value)
--     SELECT 
--         CURDATE(),
--         platform_id,
--         'daily_posts',
--         COUNT(*)
--     FROM posts 
--     WHERE DATE(created_at) = CURDATE()
--     GROUP BY platform_id
--     ON DUPLICATE KEY UPDATE metric_value = VALUES(metric_value);
-- END;

SET FOREIGN_KEY_CHECKS = 1; 