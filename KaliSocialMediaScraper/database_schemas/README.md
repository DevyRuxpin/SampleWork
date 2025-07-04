# Database Schemas for Kali Social Media Scraper

This directory contains advanced database schemas for all compatible database systems supported by the Kali Social Media Scraper.

## Supported Database Systems

### 1. **SQLite** (Default)
- **File**: `sqlite_schema.sql`
- **Use Case**: Development, testing, small-scale deployments
- **Features**: File-based, zero-configuration, ACID compliant
- **Performance**: Good for small to medium datasets

### 2. **PostgreSQL** (Recommended for Production)
- **File**: `postgresql_schema.sql`
- **Use Case**: Production deployments, large-scale data
- **Features**: Advanced indexing, JSON support, full-text search
- **Performance**: Excellent for large datasets and complex queries

### 3. **MySQL/MariaDB**
- **File**: `mysql_schema.sql`
- **Use Case**: Web applications, shared hosting
- **Features**: Widely supported, good performance
- **Performance**: Good for medium to large datasets

### 4. **Microsoft SQL Server**
- **File**: `mssql_schema.sql`
- **Use Case**: Enterprise environments, Windows servers
- **Features**: Advanced analytics, integration services
- **Performance**: Excellent for enterprise workloads

### 5. **Oracle Database**
- **File**: `oracle_schema.sql`
- **Use Case**: Enterprise environments, high-availability
- **Features**: Advanced security, partitioning, RAC
- **Performance**: Excellent for mission-critical applications

## Schema Features

### Core Tables
1. **posts** - Main content storage
2. **users** - User profile information
3. **platforms** - Platform metadata
4. **scraping_sessions** - Session tracking
5. **errors** - Error logging
6. **proxies** - Proxy management
7. **rate_limits** - Rate limiting tracking

### Advanced Features
- **Indexing**: Optimized indexes for common queries
- **Partitioning**: Large table partitioning strategies
- **JSON Support**: Native JSON columns for flexible data
- **Full-Text Search**: Text search capabilities
- **Audit Trails**: Change tracking and logging
- **Data Archiving**: Historical data management
- **Performance Views**: Monitoring and analytics

## Usage

### 1. Choose Your Database
Select the appropriate schema file based on your database system.

### 2. Initialize Database
```bash
# For PostgreSQL
psql -U username -d database_name -f database_schemas/postgresql_schema.sql

# For MySQL
mysql -u username -p database_name < database_schemas/mysql_schema.sql

# For SQLite (automatic)
python -c "from scraper.core.database import init_database; import asyncio; asyncio.run(init_database())"
```

### 3. Configure Connection
Update your `.env` file with the appropriate database URL:
```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/scraper_db

# MySQL
DATABASE_URL=mysql://user:password@localhost:3306/scraper_db

# SQLite
DATABASE_URL=sqlite:///data/scraper.db
```

## Migration Strategy

### Version Control
- Each schema file includes version information
- Migration scripts available for schema updates
- Backward compatibility maintained

### Data Migration
- Tools provided for migrating between databases
- Data validation during migration
- Rollback capabilities

## Performance Optimization

### Indexing Strategy
- Primary keys on all tables
- Composite indexes for common queries
- Partial indexes for filtered data
- Full-text indexes for content search

### Partitioning
- Time-based partitioning for large datasets
- Platform-based partitioning for multi-platform data
- Automatic partition management

### Query Optimization
- Optimized queries for common operations
- Materialized views for complex analytics
- Connection pooling configuration

## Security Features

### Data Protection
- Encrypted sensitive fields
- Audit logging for all changes
- Access control and permissions
- Data anonymization options

### Compliance
- GDPR compliance features
- Data retention policies
- Export and deletion capabilities
- Privacy controls

## Monitoring and Maintenance

### Health Checks
- Database connection monitoring
- Performance metrics tracking
- Storage usage monitoring
- Query performance analysis

### Backup Strategies
- Automated backup procedures
- Point-in-time recovery
- Cross-database backup compatibility
- Disaster recovery planning

## Schema Evolution

### Version Management
- Schema version tracking
- Migration scripts for updates
- Compatibility testing
- Rollback procedures

### Feature Flags
- Optional schema features
- A/B testing capabilities
- Gradual rollout support
- Feature deprecation handling

## Contributing

When adding new database support:

1. Create schema file following naming convention
2. Include all core tables and indexes
3. Add performance optimizations
4. Include migration scripts
5. Update this README
6. Add tests for the new schema

## Support

For database-specific issues:
- Check the individual schema files for comments
- Review the migration scripts
- Consult database-specific documentation
- Test with sample data before production use 