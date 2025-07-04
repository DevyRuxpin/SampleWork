# Database Migration Scripts

This directory contains migration scripts for moving data between different database systems supported by the Kali Social Media Scraper.

## Available Migrations

### 1. SQLite to PostgreSQL
- **File**: `sqlite_to_postgresql.sql`
- **Description**: Migrate data from SQLite to PostgreSQL
- **Usage**: Run the script after setting up PostgreSQL schema

### 2. SQLite to MySQL
- **File**: `sqlite_to_mysql.sql`
- **Description**: Migrate data from SQLite to MySQL
- **Usage**: Run the script after setting up MySQL schema

### 3. MySQL to PostgreSQL
- **File**: `mysql_to_postgresql.sql`
- **Description**: Migrate data from MySQL to PostgreSQL
- **Usage**: Run the script after setting up PostgreSQL schema

### 4. PostgreSQL to MySQL
- **File**: `postgresql_to_mysql.sql`
- **Description**: Migrate data from PostgreSQL to MySQL
- **Usage**: Run the script after setting up MySQL schema

## Migration Process

### Step 1: Prepare Source Database
1. Ensure your source database is running and accessible
2. Backup your data before migration
3. Verify all data integrity

### Step 2: Set Up Target Database
1. Create the target database
2. Run the appropriate schema file from `database_schemas/`
3. Verify the schema is created correctly

### Step 3: Run Migration Script
1. Update the connection details in the migration script
2. Run the migration script
3. Verify data integrity after migration

### Step 4: Update Application Configuration
1. Update your `.env` file with the new database URL
2. Test the application with the new database
3. Remove old database if migration is successful

## Migration Scripts Details

### SQLite to PostgreSQL
```bash
# Export SQLite data
sqlite3 scraper.db ".dump" > sqlite_export.sql

# Import to PostgreSQL
psql -U username -d scraper_db -f database_schemas/postgresql_schema.sql
psql -U username -d scraper_db -f database_schemas/migration_scripts/sqlite_to_postgresql.sql
```

### SQLite to MySQL
```bash
# Export SQLite data
sqlite3 scraper.db ".dump" > sqlite_export.sql

# Import to MySQL
mysql -u username -p scraper_db < database_schemas/mysql_schema.sql
mysql -u username -p scraper_db < database_schemas/migration_scripts/sqlite_to_mysql.sql
```

### MySQL to PostgreSQL
```bash
# Export MySQL data
mysqldump -u username -p scraper_db > mysql_export.sql

# Import to PostgreSQL
psql -U username -d scraper_db -f database_schemas/postgresql_schema.sql
psql -U username -d scraper_db -f database_schemas/migration_scripts/mysql_to_postgresql.sql
```

### PostgreSQL to MySQL
```bash
# Export PostgreSQL data
pg_dump -U username scraper_db > postgresql_export.sql

# Import to MySQL
mysql -u username -p scraper_db < database_schemas/mysql_schema.sql
mysql -u username -p scraper_db < database_schemas/migration_scripts/postgresql_to_mysql.sql
```

## Data Validation

After migration, validate your data:

1. **Count Records**: Ensure all tables have the expected number of records
2. **Check Relationships**: Verify foreign key relationships are intact
3. **Test Queries**: Run sample queries to ensure data is accessible
4. **Verify JSON Data**: Check that JSON fields migrated correctly
5. **Test Application**: Run the scraper application with the new database

## Troubleshooting

### Common Issues

1. **Character Encoding**: Ensure proper UTF-8 encoding during migration
2. **JSON Data**: Some databases handle JSON differently - verify JSON fields
3. **Large Datasets**: For large datasets, consider using batch processing
4. **Indexes**: Recreate indexes after migration for better performance
5. **Triggers**: Verify triggers and stored procedures work correctly

### Performance Tips

1. **Batch Processing**: For large datasets, migrate in batches
2. **Indexes**: Disable indexes during migration, recreate after
3. **Constraints**: Temporarily disable foreign key constraints during migration
4. **Monitoring**: Monitor system resources during migration
5. **Backup**: Always backup before migration

## Rollback Plan

If migration fails:

1. **Stop Migration**: Immediately stop the migration process
2. **Assess Damage**: Check what data was migrated and what wasn't
3. **Restore Backup**: Restore from your pre-migration backup
4. **Fix Issues**: Address the issues that caused the migration to fail
5. **Retry Migration**: Attempt migration again with fixes in place

## Automated Migration

For production environments, consider using automated migration tools:

1. **Database Migration Tools**: Use tools like Flyway or Liquibase
2. **ETL Tools**: Use ETL tools for complex data transformations
3. **Custom Scripts**: Write custom scripts for specific requirements
4. **Monitoring**: Implement monitoring during migration process

## Best Practices

1. **Test First**: Always test migration on a copy of production data
2. **Document Changes**: Keep detailed logs of migration process
3. **Validate Data**: Thoroughly validate data after migration
4. **Performance Test**: Test application performance with new database
5. **Rollback Plan**: Always have a rollback plan ready
6. **Backup Strategy**: Maintain multiple backups before migration
7. **Downtime Planning**: Plan for potential downtime during migration
8. **Team Communication**: Ensure team is aware of migration schedule

## Support

For migration issues:

1. Check the migration script logs for errors
2. Verify database connectivity and permissions
3. Ensure schema compatibility between source and target
4. Test with a small dataset first
5. Consult database-specific documentation
6. Review application logs for any issues 