from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security, Request, BackgroundTasks
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
import json
from requirements_utils import (
    parse_requirements, 
    check_compatibility,
    generate_requirements_txt,
    check_vulnerabilities,
    check_python_compatibility,
    analyze_dependencies,
    get_package_stats,
    export_report
)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from dotenv import load_dotenv
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='api.log'
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="Requirements Converter API",
    description="API for converting requirements.txt to JSON and checking package compatibility",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# For testing purposes, increase the rate limit
TEST_MODE = os.getenv("TEST_MODE", "false").lower() == "true"
RATE_LIMIT = "100/minute" if TEST_MODE else "5/minute"

# API Key security
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == os.getenv("API_KEY"):
        return api_key_header
    raise HTTPException(
        status_code=403,
        detail="Invalid or missing API Key"
    )

@app.post("/convert")
@limiter.limit(RATE_LIMIT)
async def convert_requirements(
    request: Request,
    file: UploadFile = File(...),
    api_key: str = Depends(get_api_key)
):
    try:
        contents = await file.read()
        requirements = contents.decode('utf-8')
        result = parse_requirements(requirements)
        logger.info(f"Successfully converted requirements file: {file.filename}")
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error converting requirements: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/check-compatibility")
@limiter.limit(RATE_LIMIT)
async def check_requirements_compatibility(
    request: Request,
    file: UploadFile = File(...),
    api_key: str = Depends(get_api_key)
):
    try:
        contents = await file.read()
        requirements = contents.decode('utf-8')
        result = await check_compatibility(requirements)
        logger.info(f"Successfully checked compatibility for: {file.filename}")
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error checking compatibility: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/check-vulnerabilities")
@limiter.limit(RATE_LIMIT)
async def check_package_vulnerabilities(
    request: Request,
    file: UploadFile = File(...),
    api_key: str = Depends(get_api_key)
):
    try:
        contents = await file.read()
        requirements = contents.decode('utf-8')
        result = check_vulnerabilities(requirements)
        logger.info(f"Successfully checked vulnerabilities for: {file.filename}")
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error checking vulnerabilities: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/check-python-compatibility")
@limiter.limit(RATE_LIMIT)
async def check_python_version_compatibility(
    request: Request,
    file: UploadFile = File(...),
    python_version: str = "3.8",
    api_key: str = Depends(get_api_key)
):
    try:
        contents = await file.read()
        requirements = contents.decode('utf-8')
        result = check_python_compatibility(requirements, python_version)
        logger.info(f"Successfully checked Python compatibility for: {file.filename}")
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error checking Python compatibility: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/generate-requirements")
@limiter.limit(RATE_LIMIT)
async def generate_requirements(
    request: Request,
    requirements_json: Dict,
    api_key: str = Depends(get_api_key)
):
    try:
        result = generate_requirements_txt(requirements_json)
        logger.info("Successfully generated requirements.txt")
        return JSONResponse(content={"requirements_txt": result})
    except Exception as e:
        logger.error(f"Error generating requirements: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analyze-dependencies")
@limiter.limit(RATE_LIMIT)
async def analyze_package_dependencies(
    request: Request,
    file: UploadFile = File(...),
    api_key: str = Depends(get_api_key)
):
    """
    Analyze package dependencies and create a dependency graph.
    """
    try:
        contents = await file.read()
        requirements = contents.decode('utf-8')
        result = analyze_dependencies(requirements)
        logger.info(f"Successfully analyzed dependencies for: {file.filename}")
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error analyzing dependencies: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/package-stats/{package_name}")
@limiter.limit(RATE_LIMIT)
async def get_package_statistics(
    request: Request,
    package_name: str,
    api_key: str = Depends(get_api_key)
):
    """
    Get detailed statistics about a specific package.
    """
    try:
        result = get_package_stats(package_name)
        logger.info(f"Successfully retrieved stats for package: {package_name}")
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error getting package stats: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/export-report")
@limiter.limit(RATE_LIMIT)
async def export_analysis_report(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    format: str = "pdf",
    api_key: str = Depends(get_api_key)
):
    """
    Export a comprehensive analysis report in various formats.
    """
    try:
        contents = await file.read()
        requirements = contents.decode('utf-8')
        
        # Generate report in the background
        report_id = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        background_tasks.add_task(export_report, requirements, format, report_id)
        
        logger.info(f"Started report generation: {report_id}")
        return JSONResponse(content={
            "message": "Report generation started",
            "report_id": report_id
        })
    except Exception as e:
        logger.error(f"Error starting report generation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 