# Pibby's Requirements Converter API


A comprehensive API for managing Python package requirements, including:
1. Convert requirements.txt files to JSON format
2. Check package compatibility and version updates
3. Check for known vulnerabilities
4. Check Python version compatibility
5. Analyze package dependencies
6. Generate detailed package statistics
7. Export comprehensive analysis reports

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with your API key:
```bash
API_KEY=your_secret_key_here
```

3. Run the API:
```bash
python main.py
```

The API will start on `http://localhost:8000`

## Testing

The API includes a test mode that can be enabled by setting the `TEST_MODE` environment variable:
```bash
TEST_MODE=true python main.py
```

In test mode:
- Rate limiting is increased to 100 requests per minute (vs 5/minute in production)
- All endpoints are accessible for testing purposes
- Test API key is accepted: `test_api_key_123`

To run the test suite:
```bash
TEST_MODE=true python -m pytest test_api.py -v
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Production mode: 5 requests per minute
- Test mode: 100 requests per minute

Rate limits are enforced per IP address. When the limit is exceeded, the API will return a 429 (Too Many Requests) status code.

## API Endpoints

All endpoints require an API key in the `X-API-Key` header.

### 1. Convert Requirements to JSON
- **Endpoint**: `/convert`
- **Method**: POST
- **Input**: requirements.txt file
- **Output**: JSON representation of requirements

Example response:
```json
{
    "requirements": [
        {
            "name": "fastapi",
            "version": ">=0.104.1",
            "extras": null,
            "marker": null
        }
    ]
}
```

### 2. Check Compatibility
- **Endpoint**: `/check-compatibility`
- **Method**: POST
- **Input**: requirements.txt file
- **Output**: Compatibility report

Example response:
```json
{
    "compatibility_report": [
        {
            "package": "fastapi",
            "current_version": "0.104.1",
            "latest_version": "0.104.1",
            "status": "ok",
            "message": "Up to date"
        }
    ],
    "summary": {
        "total_packages": 1,
        "up_to_date": 1,
        "needs_update": 0,
        "unknown": 0
    }
}
```

### 3. Check Vulnerabilities
- **Endpoint**: `/check-vulnerabilities`
- **Method**: POST
- **Input**: requirements.txt file
- **Output**: Vulnerability report

Example response:
```json
{
    "vulnerability_report": [
        {
            "package": "django",
            "version": "3.2.0",
            "vulnerabilities": [
                {
                    "id": "CVE-2023-1234",
                    "severity": "high",
                    "description": "Example vulnerability description",
                    "fixed_version": "2.0.0"
                }
            ]
        }
    ],
    "summary": {
        "total_packages": 1,
        "vulnerable_packages": 1,
        "total_vulnerabilities": 1
    }
}
```

### 4. Check Python Compatibility
- **Endpoint**: `/check-python-compatibility`
- **Method**: POST
- **Input**: requirements.txt file
- **Query Parameter**: `python_version` (default: "3.8")
- **Output**: Python version compatibility report

Example response:
```json
{
    "compatibility_report": [
        {
            "package": "fastapi",
            "python_version": "3.8",
            "supported_versions": ["3.7", "3.8", "3.9"],
            "is_compatible": true
        }
    ],
    "summary": {
        "total_packages": 1,
        "compatible_packages": 1,
        "incompatible_packages": 0,
        "unknown_compatibility": 0
    }
}
```

### 5. Generate Requirements
- **Endpoint**: `/generate-requirements`
- **Method**: POST
- **Input**: JSON representation of requirements
- **Output**: requirements.txt content

Example response:
```json
{
    "requirements_txt": "fastapi>=0.104.1\nuvicorn>=0.24.0"
}
```

### 6. Analyze Dependencies
- **Endpoint**: `/analyze-dependencies`
- **Method**: POST
- **Input**: requirements.txt file
- **Output**: Dependency analysis report

Example response:
```json
{
    "dependencies": [
        {
            "from": "fastapi",
            "to": "pydantic"
        }
    ],
    "metrics": {
        "total_packages": 2,
        "total_dependencies": 1,
        "most_dependent": "pydantic",
        "most_dependencies": "fastapi"
    }
}
```

### 7. Get Package Statistics
- **Endpoint**: `/package-stats/{package_name}`
- **Method**: GET
- **Output**: Detailed package statistics

Example response:
```json
{
    "name": "fastapi",
    "current_version": "0.104.1",
    "author": "tiangolo",
    "license": "MIT",
    "project_urls": {
        "Homepage": "https://github.com/tiangolo/fastapi"
    },
    "requires_python": ">=3.7",
    "total_releases": 100,
    "first_release": "2018-12-05T00:00:00",
    "latest_release": "2023-11-15T00:00:00",
    "avg_days_between_releases": 18.5,
    "download_stats": {
        "last_month": 1000000,
        "last_week": 250000,
        "last_day": 35000
    }
}
```

### 8. Export Report
- **Endpoint**: `/export-report`
- **Method**: POST
- **Input**: requirements.txt file
- **Query Parameter**: `format` (default: "pdf")
- **Output**: Report generation status

Example response:
```json
{
    "message": "Report generation started",
    "report_id": "report_20231115_123456"
}
```

## Error Handling

The API returns appropriate HTTP status codes for different scenarios:
- 200: Success
- 400: Bad Request (invalid input)
- 403: Forbidden (invalid API key)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

## Security

- All endpoints require a valid API key
- Rate limiting is enforced to prevent abuse
- Input validation is performed on all requests
- Sensitive information is not logged

## Performance Features
- Caching of PyPI responses
- Asynchronous version checking
- Background task processing for reports
- Batch processing for multiple packages

## Logging
- All API operations are logged to `api.log`
- Includes timestamp, operation type, and status
- Error logging with stack traces
- Request/response logging for debugging

## Testing
Run the test suite:
```bash
pytest test_api.py
```

The test suite includes:
- Unit tests for all endpoints
- Authentication testing
- Rate limiting testing
- Error handling testing
- Input validation testing

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the test suite
5. Submit a pull request 