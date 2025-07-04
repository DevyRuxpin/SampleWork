-- SQLite to PostgreSQL Migration Script
-- Version: 1.0.0
-- Description: Migrate data from SQLite to PostgreSQL
-- Usage: Run after setting up PostgreSQL schema

-- Set session parameters
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Function to safely convert JSON strings
CREATE OR REPLACE FUNCTION safe_json_convert(input_text TEXT)
RETURNS JSONB AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN '{}'::JSONB;
    END IF;
    
    BEGIN
        RETURN input_text::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RETURN '{}'::JSONB;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to convert boolean values
CREATE OR REPLACE FUNCTION convert_boolean(input_value INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN CASE WHEN input_value = 1 THEN TRUE ELSE FALSE END;
END;
$$ LANGUAGE plpgsql;

-- Function to convert timestamp
CREATE OR REPLACE FUNCTION convert_timestamp(input_text TEXT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN NULL;
    END IF;
    
    BEGIN
        RETURN input_text::TIMESTAMP WITH TIME ZONE;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Migrate platforms data
INSERT INTO platforms (name, display_name, base_url, api_url, is_active, rate_limit_per_minute, rate_limit_per_hour, created_at, updated_at)
SELECT 
    name,
    display_name,
    base_url,
    api_url,
    convert_boolean(is_active),
    rate_limit_per_minute,
    rate_limit_per_hour,
    convert_timestamp(created_at),
    convert_timestamp(updated_at)
FROM dblink('sqlite_connection', 'SELECT * FROM platforms')
AS platforms(
    id INTEGER,
    name TEXT,
    display_name TEXT,
    base_url TEXT,
    api_url TEXT,
    is_active INTEGER,
    rate_limit_per_minute INTEGER,
    rate_limit_per_hour INTEGER,
    created_at TEXT,
    updated_at TEXT
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    base_url = EXCLUDED.base_url,
    api_url = EXCLUDED.api_url,
    is_active = EXCLUDED.is_active,
    rate_limit_per_minute = EXCLUDED.rate_limit_per_minute,
    rate_limit_per_hour = EXCLUDED.rate_limit_per_hour,
    updated_at = EXCLUDED.updated_at;

-- Migrate users data
INSERT INTO users (platform_id, platform_user_id, username, display_name, bio, profile_image_url, banner_image_url, verified, followers_count, following_count, posts_count, location, website, joined_date, last_scraped_at, metadata, created_at, updated_at)
SELECT 
    platform_id,
    platform_user_id,
    username,
    display_name,
    bio,
    profile_image_url,
    banner_image_url,
    convert_boolean(verified),
    followers_count,
    following_count,
    posts_count,
    location,
    website,
    convert_timestamp(joined_date),
    convert_timestamp(last_scraped_at),
    safe_json_convert(metadata),
    convert_timestamp(created_at),
    convert_timestamp(updated_at)
FROM dblink('sqlite_connection', 'SELECT * FROM users')
AS users(
    id INTEGER,
    platform_id INTEGER,
    platform_user_id TEXT,
    username TEXT,
    display_name TEXT,
    bio TEXT,
    profile_image_url TEXT,
    banner_image_url TEXT,
    verified INTEGER,
    followers_count INTEGER,
    following_count INTEGER,
    posts_count INTEGER,
    location TEXT,
    website TEXT,
    joined_date TEXT,
    last_scraped_at TEXT,
    metadata TEXT,
    created_at TEXT,
    updated_at TEXT
)
ON CONFLICT (platform_id, platform_user_id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    profile_image_url = EXCLUDED.profile_image_url,
    banner_image_url = EXCLUDED.banner_image_url,
    verified = EXCLUDED.verified,
    followers_count = EXCLUDED.followers_count,
    following_count = EXCLUDED.following_count,
    posts_count = EXCLUDED.posts_count,
    location = EXCLUDED.location,
    website = EXCLUDED.website,
    joined_date = EXCLUDED.joined_date,
    last_scraped_at = EXCLUDED.last_scraped_at,
    metadata = EXCLUDED.metadata,
    updated_at = EXCLUDED.updated_at;

-- Migrate posts data
INSERT INTO posts (platform_id, platform_post_id, author_id, post_type, content, url, media_urls, hashtags, mentions, likes, comments, shares, views, is_verified, is_retweet, is_reply, parent_post_id, language, sentiment_score, engagement_score, published_at, scraped_at, raw_data, metadata, created_at, updated_at)
SELECT 
    platform_id,
    platform_post_id,
    author_id,
    post_type,
    content,
    url,
    safe_json_convert(media_urls),
    safe_json_convert(hashtags),
    safe_json_convert(mentions),
    likes,
    comments,
    shares,
    views,
    convert_boolean(is_verified),
    convert_boolean(is_retweet),
    convert_boolean(is_reply),
    parent_post_id,
    language,
    sentiment_score,
    engagement_score,
    convert_timestamp(published_at),
    convert_timestamp(scraped_at),
    safe_json_convert(raw_data),
    safe_json_convert(metadata),
    convert_timestamp(created_at),
    convert_timestamp(updated_at)
FROM dblink('sqlite_connection', 'SELECT * FROM posts')
AS posts(
    id INTEGER,
    platform_id INTEGER,
    platform_post_id TEXT,
    author_id INTEGER,
    post_type TEXT,
    content TEXT,
    url TEXT,
    media_urls TEXT,
    hashtags TEXT,
    mentions TEXT,
    likes INTEGER,
    comments INTEGER,
    shares INTEGER,
    views INTEGER,
    is_verified INTEGER,
    is_retweet INTEGER,
    is_reply INTEGER,
    parent_post_id TEXT,
    language TEXT,
    sentiment_score REAL,
    engagement_score REAL,
    published_at TEXT,
    scraped_at TEXT,
    raw_data TEXT,
    metadata TEXT,
    created_at TEXT,
    updated_at TEXT
)
ON CONFLICT (platform_id, platform_post_id) DO UPDATE SET
    author_id = EXCLUDED.author_id,
    post_type = EXCLUDED.post_type,
    content = EXCLUDED.content,
    url = EXCLUDED.url,
    media_urls = EXCLUDED.media_urls,
    hashtags = EXCLUDED.hashtags,
    mentions = EXCLUDED.mentions,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    shares = EXCLUDED.shares,
    views = EXCLUDED.views,
    is_verified = EXCLUDED.is_verified,
    is_retweet = EXCLUDED.is_retweet,
    is_reply = EXCLUDED.is_reply,
    parent_post_id = EXCLUDED.parent_post_id,
    language = EXCLUDED.language,
    sentiment_score = EXCLUDED.sentiment_score,
    engagement_score = EXCLUDED.engagement_score,
    published_at = EXCLUDED.published_at,
    scraped_at = EXCLUDED.scraped_at,
    raw_data = EXCLUDED.raw_data,
    metadata = EXCLUDED.metadata,
    updated_at = EXCLUDED.updated_at;

-- Migrate scraping sessions data
INSERT INTO scraping_sessions (session_uuid, platform_id, session_type, target, status, total_posts, successful_posts, failed_posts, start_time, end_time, duration_seconds, error_count, last_error, metadata, created_at, updated_at)
SELECT 
    session_uuid,
    platform_id,
    session_type,
    target,
    status,
    total_posts,
    successful_posts,
    failed_posts,
    convert_timestamp(start_time),
    convert_timestamp(end_time),
    duration_seconds,
    error_count,
    last_error,
    safe_json_convert(metadata),
    convert_timestamp(created_at),
    convert_timestamp(updated_at)
FROM dblink('sqlite_connection', 'SELECT * FROM scraping_sessions')
AS sessions(
    id INTEGER,
    session_uuid TEXT,
    platform_id INTEGER,
    session_type TEXT,
    target TEXT,
    status TEXT,
    total_posts INTEGER,
    successful_posts INTEGER,
    failed_posts INTEGER,
    start_time TEXT,
    end_time TEXT,
    duration_seconds INTEGER,
    error_count INTEGER,
    last_error TEXT,
    metadata TEXT,
    created_at TEXT,
    updated_at TEXT
)
ON CONFLICT (session_uuid) DO UPDATE SET
    platform_id = EXCLUDED.platform_id,
    session_type = EXCLUDED.session_type,
    target = EXCLUDED.target,
    status = EXCLUDED.status,
    total_posts = EXCLUDED.total_posts,
    successful_posts = EXCLUDED.successful_posts,
    failed_posts = EXCLUDED.failed_posts,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_seconds = EXCLUDED.duration_seconds,
    error_count = EXCLUDED.error_count,
    last_error = EXCLUDED.last_error,
    metadata = EXCLUDED.metadata,
    updated_at = EXCLUDED.updated_at;

-- Migrate errors data
INSERT INTO errors (session_id, error_type, error_message, error_code, stack_trace, context, occurred_at)
SELECT 
    session_id,
    error_type,
    error_message,
    error_code,
    stack_trace,
    safe_json_convert(context),
    convert_timestamp(occurred_at)
FROM dblink('sqlite_connection', 'SELECT * FROM errors')
AS errors(
    id INTEGER,
    session_id INTEGER,
    error_type TEXT,
    error_message TEXT,
    error_code TEXT,
    stack_trace TEXT,
    context TEXT,
    occurred_at TEXT
);

-- Migrate proxies data
INSERT INTO proxies (proxy_url, proxy_type, username, password, country, city, isp, status, last_used_at, last_tested_at, success_count, failure_count, response_time_ms, uptime_percentage, metadata, created_at, updated_at)
SELECT 
    proxy_url,
    proxy_type,
    username,
    password,
    country,
    city,
    isp,
    status,
    convert_timestamp(last_used_at),
    convert_timestamp(last_tested_at),
    success_count,
    failure_count,
    response_time_ms,
    uptime_percentage,
    safe_json_convert(metadata),
    convert_timestamp(created_at),
    convert_timestamp(updated_at)
FROM dblink('sqlite_connection', 'SELECT * FROM proxies')
AS proxies(
    id INTEGER,
    proxy_url TEXT,
    proxy_type TEXT,
    username TEXT,
    password TEXT,
    country TEXT,
    city TEXT,
    isp TEXT,
    status TEXT,
    last_used_at TEXT,
    last_tested_at TEXT,
    success_count INTEGER,
    failure_count INTEGER,
    response_time_ms INTEGER,
    uptime_percentage REAL,
    metadata TEXT,
    created_at TEXT,
    updated_at TEXT
)
ON CONFLICT (proxy_url) DO UPDATE SET
    proxy_type = EXCLUDED.proxy_type,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    isp = EXCLUDED.isp,
    status = EXCLUDED.status,
    last_used_at = EXCLUDED.last_used_at,
    last_tested_at = EXCLUDED.last_tested_at,
    success_count = EXCLUDED.success_count,
    failure_count = EXCLUDED.failure_count,
    response_time_ms = EXCLUDED.response_time_ms,
    uptime_percentage = EXCLUDED.uptime_percentage,
    metadata = EXCLUDED.metadata,
    updated_at = EXCLUDED.updated_at;

-- Migrate rate limits data
INSERT INTO rate_limits (platform_id, proxy_id, endpoint, requests_made, requests_allowed, reset_time, created_at, updated_at)
SELECT 
    platform_id,
    proxy_id,
    endpoint,
    requests_made,
    requests_allowed,
    convert_timestamp(reset_time),
    convert_timestamp(created_at),
    convert_timestamp(updated_at)
FROM dblink('sqlite_connection', 'SELECT * FROM rate_limits')
AS rate_limits(
    id INTEGER,
    platform_id INTEGER,
    proxy_id INTEGER,
    endpoint TEXT,
    requests_made INTEGER,
    requests_allowed INTEGER,
    reset_time TEXT,
    created_at TEXT,
    updated_at TEXT
);

-- Migrate user agents data
INSERT INTO user_agents (user_agent_string, browser, version, os, device_type, is_mobile, usage_count, last_used_at, is_active, created_at)
SELECT 
    user_agent_string,
    browser,
    version,
    os,
    device_type,
    convert_boolean(is_mobile),
    usage_count,
    convert_timestamp(last_used_at),
    convert_boolean(is_active),
    convert_timestamp(created_at)
FROM dblink('sqlite_connection', 'SELECT * FROM user_agents')
AS user_agents(
    id INTEGER,
    user_agent_string TEXT,
    browser TEXT,
    version TEXT,
    os TEXT,
    device_type TEXT,
    is_mobile INTEGER,
    usage_count INTEGER,
    last_used_at TEXT,
    is_active INTEGER,
    created_at TEXT
)
ON CONFLICT (user_agent_string) DO UPDATE SET
    browser = EXCLUDED.browser,
    version = EXCLUDED.version,
    os = EXCLUDED.os,
    device_type = EXCLUDED.device_type,
    is_mobile = EXCLUDED.is_mobile,
    usage_count = EXCLUDED.usage_count,
    last_used_at = EXCLUDED.last_used_at,
    is_active = EXCLUDED.is_active;

-- Migrate analytics data
INSERT INTO analytics (date, platform_id, metric_name, metric_value, metadata, created_at)
SELECT 
    convert_timestamp(date)::DATE,
    platform_id,
    metric_name,
    metric_value,
    safe_json_convert(metadata),
    convert_timestamp(created_at)
FROM dblink('sqlite_connection', 'SELECT * FROM analytics')
AS analytics(
    id INTEGER,
    date TEXT,
    platform_id INTEGER,
    metric_name TEXT,
    metric_value REAL,
    metadata TEXT,
    created_at TEXT
)
ON CONFLICT (date, platform_id, metric_name) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata;

-- Migrate audit log data
INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
SELECT 
    table_name,
    record_id,
    action,
    safe_json_convert(old_values),
    safe_json_convert(new_values),
    changed_by,
    convert_timestamp(changed_at)
FROM dblink('sqlite_connection', 'SELECT * FROM audit_log')
AS audit_log(
    id INTEGER,
    table_name TEXT,
    record_id INTEGER,
    action TEXT,
    old_values TEXT,
    new_values TEXT,
    changed_by TEXT,
    changed_at TEXT
);

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Update sequences to match the highest IDs
SELECT setval('platforms_id_seq', (SELECT MAX(id) FROM platforms));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));
SELECT setval('scraping_sessions_id_seq', (SELECT MAX(id) FROM scraping_sessions));
SELECT setval('errors_id_seq', (SELECT MAX(id) FROM errors));
SELECT setval('proxies_id_seq', (SELECT MAX(id) FROM proxies));
SELECT setval('rate_limits_id_seq', (SELECT MAX(id) FROM rate_limits));
SELECT setval('user_agents_id_seq', (SELECT MAX(id) FROM user_agents));
SELECT setval('analytics_id_seq', (SELECT MAX(id) FROM analytics));
SELECT setval('audit_log_id_seq', (SELECT MAX(id) FROM audit_log));

-- Clean up temporary functions
DROP FUNCTION IF EXISTS safe_json_convert(TEXT);
DROP FUNCTION IF EXISTS convert_boolean(INTEGER);
DROP FUNCTION IF EXISTS convert_timestamp(TEXT);

-- Display migration summary
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_records_migrated
FROM (
    SELECT COUNT(*) as count FROM platforms
    UNION ALL
    SELECT COUNT(*) FROM users
    UNION ALL
    SELECT COUNT(*) FROM posts
    UNION ALL
    SELECT COUNT(*) FROM scraping_sessions
    UNION ALL
    SELECT COUNT(*) FROM errors
    UNION ALL
    SELECT COUNT(*) FROM proxies
    UNION ALL
    SELECT COUNT(*) FROM rate_limits
    UNION ALL
    SELECT COUNT(*) FROM user_agents
    UNION ALL
    SELECT COUNT(*) FROM analytics
    UNION ALL
    SELECT COUNT(*) FROM audit_log
) as counts; 