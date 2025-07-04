#!/usr/bin/env python3
"""
Web Interface Demo for Kali Social Media Scraper

This demonstrates how easy it would be to add web interface capability
to our existing CLI-based scraper.
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

# FastAPI imports (would be added to requirements.txt)
try:
    from fastapi import FastAPI, HTTPException, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from starlette.websockets import WebSocket
    import uvicorn
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    print("FastAPI not available. Install with: pip install fastapi uvicorn")

# Our existing scraper imports
from scraper.platforms.twitter import TwitterScraper
from scraper.core.database import DatabaseManager
from scraper.utils.logger import get_logger

# Pydantic models for API
class ScrapingRequest(BaseModel):
    platform: str
    target: str
    target_type: str = "user"
    limit: int = 100
    use_proxies: bool = True
    use_rate_limiting: bool = True

class ScrapingJob(BaseModel):
    id: str
    platform: str
    target: str
    target_type: str
    status: str
    progress: int = 0
    total_items: int = 0
    created_at: datetime
    completed_at: Optional[datetime] = None

class ScrapingResult(BaseModel):
    job_id: str
    platform: str
    target: str
    data_count: int
    data: List[Dict]
    stats: Dict

# Web interface demo
class WebInterfaceDemo:
    def __init__(self):
        self.app = FastAPI(
            title="Kali Social Media Scraper Web Interface",
            description="Web interface for the social media scraper",
            version="1.0.0"
        )
        self.logger = get_logger("web_interface")
        self.active_jobs: Dict[str, ScrapingJob] = {}
        self.job_results: Dict[str, ScrapingResult] = {}
        
        # Setup CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup routes
        self._setup_routes()
    
    def _setup_routes(self):
        """Setup API routes"""
        
        @self.app.get("/")
        async def root():
            return {
                "message": "Kali Social Media Scraper Web Interface",
                "version": "1.0.0",
                "status": "running"
            }
        
        @self.app.get("/api/platforms")
        async def get_platforms():
            """Get supported platforms"""
            return {
                "platforms": [
                    {"id": "twitter", "name": "Twitter/X", "status": "fully_implemented"},
                    {"id": "instagram", "name": "Instagram", "status": "placeholder"},
                    {"id": "facebook", "name": "Facebook", "status": "placeholder"},
                    {"id": "linkedin", "name": "LinkedIn", "status": "placeholder"},
                    {"id": "tiktok", "name": "TikTok", "status": "placeholder"}
                ]
            }
        
        @self.app.post("/api/scraping/start")
        async def start_scraping(request: ScrapingRequest, background_tasks: BackgroundTasks):
            """Start a scraping job"""
            job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Create job
            job = ScrapingJob(
                id=job_id,
                platform=request.platform,
                target=request.target,
                target_type=request.target_type,
                status="starting",
                created_at=datetime.now()
            )
            
            self.active_jobs[job_id] = job
            
            # Start background task
            background_tasks.add_task(
                self._run_scraping_job,
                job_id,
                request
            )
            
            return {"job_id": job_id, "status": "started"}
        
        @self.app.get("/api/scraping/jobs")
        async def get_jobs():
            """Get all scraping jobs"""
            return {
                "jobs": list(self.active_jobs.values()),
                "completed": list(self.job_results.keys())
            }
        
        @self.app.get("/api/scraping/jobs/{job_id}")
        async def get_job(job_id: str):
            """Get specific job details"""
            if job_id in self.active_jobs:
                return self.active_jobs[job_id]
            elif job_id in self.job_results:
                return self.job_results[job_id]
            else:
                raise HTTPException(status_code=404, detail="Job not found")
        
        @self.app.get("/api/scraping/jobs/{job_id}/progress")
        async def get_job_progress(job_id: str):
            """Get job progress (WebSocket compatible)"""
            if job_id in self.active_jobs:
                job = self.active_jobs[job_id]
                return {
                    "job_id": job_id,
                    "status": job.status,
                    "progress": job.progress,
                    "total_items": job.total_items
                }
            else:
                raise HTTPException(status_code=404, detail="Job not found")
        
        @self.app.get("/api/data/stats")
        async def get_stats():
            """Get scraping statistics"""
            try:
                db = DatabaseManager()
                stats = db.get_stats()
                return stats
            except Exception as e:
                self.logger.error(f"Error getting stats: {e}")
                return {"error": str(e)}
        
        @self.app.websocket("/ws/{job_id}")
        async def websocket_endpoint(websocket: WebSocket, job_id: str):
            """WebSocket endpoint for real-time progress updates"""
            await websocket.accept()
            
            try:
                while True:
                    if job_id in self.active_jobs:
                        job = self.active_jobs[job_id]
                        await websocket.send_text(json.dumps({
                            "job_id": job_id,
                            "status": job.status,
                            "progress": job.progress,
                            "total_items": job.total_items
                        }))
                    elif job_id in self.job_results:
                        result = self.job_results[job_id]
                        await websocket.send_text(json.dumps({
                            "job_id": job_id,
                            "status": "completed",
                            "data_count": result.data_count,
                            "completed_at": result.stats.get("completed_at")
                        }))
                        break
                    else:
                        await websocket.send_text(json.dumps({
                            "error": "Job not found"
                        }))
                        break
                    
                    await asyncio.sleep(1)  # Update every second
                    
            except Exception as e:
                self.logger.error(f"WebSocket error: {e}")
    
    async def _run_scraping_job(self, job_id: str, request: ScrapingRequest):
        """Run scraping job in background"""
        job = self.active_jobs[job_id]
        
        try:
            # Update job status
            job.status = "running"
            
            # Initialize scraper (reusing existing logic)
            if request.platform.lower() == "twitter":
                scraper = TwitterScraper(
                    use_proxies=request.use_proxies,
                    use_rate_limiting=request.use_rate_limiting
                )
            else:
                # For other platforms, we'd implement similar logic
                job.status = "error"
                job.completed_at = datetime.now()
                return
            
            # Initialize scraper
            await scraper.initialize()
            
            # Perform scraping
            data = await scraper.scrape_with_session(
                target=request.target,
                target_type=request.target_type,
                limit=request.limit
            )
            
            # Update job with results
            job.status = "completed"
            job.progress = 100
            job.total_items = len(data)
            job.completed_at = datetime.now()
            
            # Store results
            result = ScrapingResult(
                job_id=job_id,
                platform=request.platform,
                target=request.target,
                data_count=len(data),
                data=data,
                stats=scraper.get_stats()
            )
            
            self.job_results[job_id] = result
            
            # Cleanup
            await scraper.cleanup()
            
        except Exception as e:
            self.logger.error(f"Scraping job error: {e}")
            job.status = "error"
            job.completed_at = datetime.now()
    
    def run(self, host: str = "127.0.0.1", port: int = 8000):
        """Run the web interface"""
        if not FASTAPI_AVAILABLE:
            print("FastAPI not available. Install with: pip install fastapi uvicorn")
            return
        
        print(f"Starting web interface at http://{host}:{port}")
        print("Available endpoints:")
        print("  GET  /                    - API info")
        print("  GET  /api/platforms       - List platforms")
        print("  POST /api/scraping/start  - Start scraping job")
        print("  GET  /api/scraping/jobs   - List jobs")
        print("  GET  /api/data/stats      - Get statistics")
        print("  WS   /ws/{job_id}         - Real-time progress")
        print("\nTry: curl http://localhost:8000/api/platforms")
        
        uvicorn.run(self.app, host=host, port=port)

def main():
    """Main entry point"""
    if not FASTAPI_AVAILABLE:
        print("FastAPI not available. Install with:")
        print("pip install fastapi uvicorn")
        return
    
    # Create and run web interface
    web_interface = WebInterfaceDemo()
    web_interface.run()

if __name__ == "__main__":
    main() 