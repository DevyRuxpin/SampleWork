-- PostgreSQL Schema for Kali Social Media Scraper
-- Version: 1.0.0
-- Description: Advanced PostgreSQL schema with JSON support, full-text search, and performance optimizations
-- Compatible with: PostgreSQL 12+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create custom types
CREATE TYPE platform_type AS ENUM ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok');
CREATE TYPE post_type AS ENUM ('post', 'tweet', 'video', 'story', 'article', 'comment');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'failed', 'cancelled');
CREATE TYPE proxy_status AS ENUM ('active', 'inactive', 'failed', 'testing');

-- Create schema version tracking table
CREATE TABLE IF NOT EXISTS schema_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum VARCHAR(64)
);

-- Insert current schema version
INSERT INTO schema_versions (version, description) VALUES ('1.0.0', 'Initial PostgreSQL schema');

-- Platforms table
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name platform_type UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    api_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table with advanced features
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    platform_user_id VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    profile_image_url VARCHAR(500),
    banner_image_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    location VARCHAR(255),
    website VARCHAR(255),
    joined_date TIMESTAMP WITH TIME ZONE,
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform_id, platform_user_id),
    UNIQUE(platform_id, username)
);

-- Posts table with JSON support and full-text search
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    platform_post_id VARCHAR(255) NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_type post_type DEFAULT 'post',
    content TEXT,
    content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', COALESCE(content, ''))) STORED,
    url VARCHAR(500),
    media_urls JSONB DEFAULT '[]',
    hashtags JSONB DEFAULT '[]',
    mentions JSONB DEFAULT '[]',
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_retweet BOOLEAN DEFAULT FALSE,
    is_reply BOOLEAN DEFAULT FALSE,
    parent_post_id VARCHAR(255),
    language VARCHAR(10),
    sentiment_score DECIMAL(3,2),
    engagement_score DECIMAL(5,2),
    published_at TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform_id, platform_post_id)
);

-- Scraping sessions table
CREATE TABLE scraping_sessions (
    id SERIAL PRIMARY KEY,
    session_uuid UUID DEFAULT uuid_generate_v4(),
    platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'user', 'hashtag', 'keyword'
    target VARCHAR(255) NOT NULL,
    status session_status DEFAULT 'active',
    total_posts INTEGER DEFAULT 0,
    successful_posts INTEGER DEFAULT 0,
    failed_posts INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Errors table for comprehensive error tracking
CREATE TABLE errors (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_code VARCHAR(50),
    stack_trace TEXT,
    context JSONB DEFAULT '{}',
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Proxies table with health tracking
CREATE TABLE proxies (
    id SERIAL PRIMARY KEY,
    proxy_url VARCHAR(255) UNIQUE NOT NULL,
    proxy_type VARCHAR(20) DEFAULT 'http', -- 'http', 'https', 'socks4', 'socks5'
    username VARCHAR(100),
    password VARCHAR(100),
    country VARCHAR(2),
    city VARCHAR(100),
    isp VARCHAR(255),
    status proxy_status DEFAULT 'active',
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rate limits tracking table
CREATE TABLE rate_limits (
    id SERIAL PRIMARY KEY,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    proxy_id INTEGER REFERENCES proxies(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    requests_made INTEGER DEFAULT 0,
    requests_allowed INTEGER NOT NULL,
    reset_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User agents table
CREATE TABLE user_agents (
    id SERIAL PRIMARY KEY,
    user_agent_string TEXT UNIQUE NOT NULL,
    browser VARCHAR(50),
    version VARCHAR(20),
    os VARCHAR(50),
    device_type VARCHAR(20),
    is_mobile BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and metrics table
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, platform_id, metric_name)
);

-- Audit trail table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization

-- Posts table indexes
CREATE INDEX idx_posts_platform_id ON posts(platform_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_scraped_at ON posts(scraped_at);
CREATE INDEX idx_posts_content_tsv ON posts USING GIN(content_tsv);
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX idx_posts_mentions ON posts USING GIN(mentions);
CREATE INDEX idx_posts_media_urls ON posts USING GIN(media_urls);
CREATE INDEX idx_posts_raw_data ON posts USING GIN(raw_data);
CREATE INDEX idx_posts_engagement_score ON posts(engagement_score DESC);
CREATE INDEX idx_posts_likes ON posts(likes DESC);
CREATE INDEX idx_posts_composite_platform_date ON posts(platform_id, published_at DESC);

-- Users table indexes
CREATE INDEX idx_users_platform_id ON users(platform_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_verified ON users(verified);
CREATE INDEX idx_users_followers_count ON users(followers_count DESC);
CREATE INDEX idx_users_last_scraped_at ON users(last_scraped_at);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);

-- Scraping sessions indexes
CREATE INDEX idx_sessions_platform_id ON sessions(platform_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_session_uuid ON sessions(session_uuid);

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

-- Create partial indexes for filtered queries
CREATE INDEX idx_posts_verified_high_engagement ON posts(engagement_score DESC) 
    WHERE is_verified = TRUE AND engagement_score > 100;

CREATE INDEX idx_posts_recent_high_engagement ON posts(engagement_score DESC) 
    WHERE published_at > CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Create full-text search indexes
CREATE INDEX idx_posts_content_fulltext ON posts USING GIN(to_tsvector('english', content));

-- Create trigram indexes for fuzzy matching
CREATE INDEX idx_users_username_trgm ON users USING GIN(username gin_trgm_ops);
CREATE INDEX idx_posts_content_trgm ON posts USING GIN(content gin_trgm_ops);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON scraping_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proxies_updated_at BEFORE UPDATE ON proxies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers for critical tables
CREATE TRIGGER audit_posts_trigger AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create materialized views for analytics
CREATE MATERIALIZED VIEW daily_platform_stats AS
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

CREATE UNIQUE INDEX idx_daily_platform_stats_date_platform ON daily_platform_stats(date, platform_id);

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_platform_stats;
END;
$$ LANGUAGE plpgsql;

-- Insert default platform data
INSERT INTO platforms (name, display_name, base_url, api_url, rate_limit_per_minute, rate_limit_per_hour) VALUES
('twitter', 'Twitter/X', 'https://twitter.com', 'https://api.twitter.com', 300, 300000),
('instagram', 'Instagram', 'https://www.instagram.com', 'https://www.instagram.com/api/v1', 200, 100000),
('facebook', 'Facebook', 'https://www.facebook.com', 'https://graph.facebook.com', 200, 100000),
('linkedin', 'LinkedIn', 'https://www.linkedin.com', 'https://www.linkedin.com/api', 100, 50000),
('tiktok', 'TikTok', 'https://www.tiktok.com', 'https://www.tiktok.com/api', 300, 150000)
ON CONFLICT (name) DO NOTHING;

-- Create performance monitoring views
CREATE VIEW performance_metrics AS
SELECT 
    'posts' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as last_7d
FROM posts
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as last_7d
FROM users
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as last_7d
FROM scraping_sessions;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scraper_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scraper_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO scraper_user; 