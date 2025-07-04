"""
Command-line interface for the social media scraper.
Provides easy-to-use commands for scraping different platforms.
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import Optional, List
from datetime import datetime

import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel
from rich.text import Text
from dotenv import load_dotenv

from .platforms.twitter import TwitterScraper
from .platforms.instagram import InstagramScraper
from .platforms.facebook import FacebookScraper
from .platforms.linkedin import LinkedInScraper
from .platforms.tiktok import TikTokScraper
from .utils.logger import setup_logger, get_logger
from .utils.validators import validate_platform, validate_username, validate_hashtag
from .core.database import DatabaseManager

# Load environment variables
load_dotenv()

# Initialize Typer app
app = typer.Typer(
    name="kali-scraper",
    help="Professional social media scraper for publicly available data",
    add_completion=False
)

# Initialize Rich console
console = Console()
logger = get_logger("cli")

# Platform mapping
PLATFORM_SCRAPERS = {
    "twitter": TwitterScraper,
    "x": TwitterScraper,  # Alias for Twitter/X
    "instagram": InstagramScraper,
    "facebook": FacebookScraper,
    "linkedin": LinkedInScraper,
    "tiktok": TikTokScraper,
}

@app.command()
def scrape(
    platform: str = typer.Argument(..., help="Platform to scrape (twitter, instagram, facebook, linkedin, tiktok)"),
    target: str = typer.Argument(..., help="Target to scrape (username, hashtag, keyword)"),
    target_type: str = typer.Option("user", "--type", "-t", help="Type of target (user, hashtag, keyword)"),
    limit: int = typer.Option(100, "--limit", "-l", help="Maximum number of posts to scrape"),
    output_format: str = typer.Option("json", "--format", "-f", help="Output format (json, csv)"),
    output_file: Optional[str] = typer.Option(None, "--output", "-o", help="Output file path"),
    proxy: Optional[str] = typer.Option(None, "--proxy", help="Custom proxy URL"),
    no_proxies: bool = typer.Option(False, "--no-proxies", help="Disable proxy usage"),
    no_rate_limit: bool = typer.Option(False, "--no-rate-limit", help="Disable rate limiting"),
    database: bool = typer.Option(False, "--database", "-db", help="Save to database"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable verbose logging"),
    quiet: bool = typer.Option(False, "--quiet", "-q", help="Suppress output")
):
    """
    Scrape data from social media platforms.
    
    Examples:
        kali-scraper scrape twitter elonmusk --limit 50
        kali-scraper scrape instagram python --type hashtag --limit 100
        kali-scraper scrape facebook microsoft --type keyword --format csv
    """
    
    # Validate platform
    if platform.lower() not in PLATFORM_SCRAPERS:
        console.print(f"[red]Error: Unsupported platform '{platform}'[/red]")
        console.print(f"Supported platforms: {', '.join(PLATFORM_SCRAPERS.keys())}")
        raise typer.Exit(1)
    
    # Validate target type
    if target_type not in ["user", "hashtag", "keyword"]:
        console.print(f"[red]Error: Invalid target type '{target_type}'[/red]")
        console.print("Valid target types: user, hashtag, keyword")
        raise typer.Exit(1)
    
    # Validate target based on type
    if target_type == "user" and not validate_username(target, platform):
        console.print(f"[red]Error: Invalid username '{target}' for platform '{platform}'[/red]")
        raise typer.Exit(1)
    elif target_type == "hashtag" and not validate_hashtag(target):
        console.print(f"[red]Error: Invalid hashtag '{target}'[/red]")
        raise typer.Exit(1)
    
    # Setup logging
    log_level = "DEBUG" if verbose else "INFO"
    if quiet:
        log_level = "WARNING"
    
    setup_logger(log_level=log_level)
    
    # Run scraping
    asyncio.run(_run_scraping(
        platform=platform,
        target=target,
        target_type=target_type,
        limit=limit,
        output_format=output_format,
        output_file=output_file,
        proxy=proxy,
        use_proxies=not no_proxies,
        use_rate_limiting=not no_rate_limit,
        save_to_database=database,
        quiet=quiet
    ))

@app.command()
def list_platforms():
    """List all supported platforms."""
    table = Table(title="Supported Platforms")
    table.add_column("Platform", style="cyan")
    table.add_column("Description", style="green")
    table.add_column("Features", style="yellow")
    
    platforms_info = {
        "twitter": ("Twitter/X", "Tweets, retweets, replies, media"),
        "instagram": ("Instagram", "Posts, stories, reels, IGTV"),
        "facebook": ("Facebook", "Posts, comments, reactions, groups"),
        "linkedin": ("LinkedIn", "Posts, articles, company updates"),
        "tiktok": ("TikTok", "Videos, comments, user profiles")
    }
    
    for platform, (description, features) in platforms_info.items():
        table.add_row(platform, description, features)
    
    console.print(table)

@app.command()
def stats(
    platform: Optional[str] = typer.Option(None, "--platform", "-p", help="Platform to get stats for"),
    database_url: Optional[str] = typer.Option(None, "--database", "-db", help="Database URL")
):
    """Show scraping statistics."""
    
    try:
        db = DatabaseManager(database_url)
        stats_data = db.get_stats()
        
        if platform:
            platform_stats = db.get_stats()
            if platform_stats:
                _display_platform_stats(platform, platform_stats)
            else:
                console.print(f"[yellow]No data found for platform '{platform}'[/yellow]")
        else:
            _display_overall_stats(stats_data)
            
    except Exception as e:
        console.print(f"[red]Error getting stats: {e}[/red]")
        raise typer.Exit(1)

@app.command()
def export(
    platform: Optional[str] = typer.Option(None, "--platform", "-p", help="Platform to export"),
    format: str = typer.Option("json", "--format", "-f", help="Export format (json, csv)"),
    output_file: Optional[str] = typer.Option(None, "--output", "-o", help="Output file path"),
    database_url: Optional[str] = typer.Option(None, "--database", "-db", help="Database URL")
):
    """Export scraped data from database."""
    
    try:
        db = DatabaseManager(database_url)
        
        if db.export_data(platform=platform, format=format, output_file=output_file):
            console.print(f"[green]Data exported successfully[/green]")
        else:
            console.print(f"[red]Failed to export data[/red]")
            raise typer.Exit(1)
            
    except Exception as e:
        console.print(f"[red]Error exporting data: {e}[/red]")
        raise typer.Exit(1)

@app.command()
def clean(
    days: int = typer.Option(30, "--days", "-d", help="Keep data for this many days"),
    database_url: Optional[str] = typer.Option(None, "--database", "-db", help="Database URL")
):
    """Clean old data from database."""
    
    try:
        db = DatabaseManager(database_url)
        deleted_count = db.delete_old_data(days)
        
        console.print(f"[green]Deleted {deleted_count} old records[/green]")
        
    except Exception as e:
        console.print(f"[red]Error cleaning data: {e}[/red]")
        raise typer.Exit(1)

@app.command()
def search(
    query: str = typer.Argument(..., help="Search query"),
    platform: Optional[str] = typer.Option(None, "--platform", "-p", help="Platform to search"),
    limit: int = typer.Option(100, "--limit", "-l", help="Maximum number of results"),
    database_url: Optional[str] = typer.Option(None, "--database", "-db", help="Database URL")
):
    """Search scraped data."""
    
    try:
        db = DatabaseManager(database_url)
        results = db.search_posts(query=query, platform=platform, limit=limit)
        
        if results:
            _display_search_results(results)
        else:
            console.print(f"[yellow]No results found for query '{query}'[/yellow]")
            
    except Exception as e:
        console.print(f"[red]Error searching data: {e}[/red]")
        raise typer.Exit(1)

async def _run_scraping(
    platform: str,
    target: str,
    target_type: str,
    limit: int,
    output_format: str,
    output_file: Optional[str],
    proxy: Optional[str],
    use_proxies: bool,
    use_rate_limiting: bool,
    save_to_database: bool,
    quiet: bool
):
    """Run the scraping operation."""
    
    # Get scraper class
    scraper_class = PLATFORM_SCRAPERS[platform.lower()]
    
    # Determine database URL
    database_url = os.getenv("DATABASE_URL") if save_to_database else None
    
    # Create scraper instance
    scraper = scraper_class(
        use_proxies=use_proxies,
        use_rate_limiting=use_rate_limiting,
        database_url=database_url
    )
    
    try:
        # Initialize scraper
        await scraper.initialize()
        
        # Show progress
        if not quiet:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task(f"Scraping {platform}...", total=None)
                
                # Perform scraping
                data = await scraper.scrape_with_session(
                    target=target,
                    target_type=target_type,
                    limit=limit
                )
                
                progress.update(task, description=f"Scraped {len(data)} items")
        
        # Display results
        if not quiet:
            _display_scraping_results(platform, target, len(data))
        
        # Export data
        if data:
            if output_file is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = f"data/{platform}_{target}_{timestamp}.{output_format}"
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            
            if scraper.export_data(format=output_format, output_file=output_file):
                if not quiet:
                    console.print(f"[green]Data exported to: {output_file}[/green]")
            else:
                console.print(f"[red]Failed to export data[/red]")
        
        # Show stats
        if not quiet:
            stats = scraper.get_stats()
            _display_scraper_stats(stats)
        
    except Exception as e:
        console.print(f"[red]Error during scraping: {e}[/red]")
        logger.error(f"Scraping error: {e}")
        raise typer.Exit(1)
    
    finally:
        await scraper.cleanup()

def _display_scraping_results(platform: str, target: str, count: int):
    """Display scraping results."""
    panel = Panel(
        Text(f"Successfully scraped {count} items from {platform} for '{target}'", justify="center"),
        title="Scraping Complete",
        border_style="green"
    )
    console.print(panel)

def _display_scraper_stats(stats: dict):
    """Display scraper statistics."""
    table = Table(title="Scraper Statistics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")
    
    table.add_row("Platform", stats.get("platform", "N/A"))
    table.add_row("Data Count", str(stats.get("scraped_data_count", 0)))
    table.add_row("Errors", str(stats.get("errors_count", 0)))
    table.add_row("Session ID", str(stats.get("session_id", "N/A")))
    
    console.print(table)

def _display_overall_stats(stats: dict):
    """Display overall statistics."""
    table = Table(title="Overall Statistics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")
    
    table.add_row("Total Posts", str(stats.get("total_posts", 0)))
    table.add_row("Total Users", str(stats.get("total_users", 0)))
    table.add_row("Total Sessions", str(stats.get("total_sessions", 0)))
    table.add_row("Recent Posts (7 days)", str(stats.get("recent_posts", 0)))
    
    # Posts by platform
    posts_by_platform = stats.get("posts_by_platform", {})
    if posts_by_platform:
        table.add_row("", "")  # Empty row for spacing
        table.add_row("Posts by Platform", "")
        for platform, count in posts_by_platform.items():
            table.add_row(f"  {platform}", str(count))
    
    console.print(table)

def _display_platform_stats(platform: str, stats: dict):
    """Display platform-specific statistics."""
    table = Table(title=f"{platform.title()} Statistics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")
    
    for key, value in stats.items():
        if isinstance(value, dict):
            table.add_row(key, "")
            for sub_key, sub_value in value.items():
                table.add_row(f"  {sub_key}", str(sub_value))
        else:
            table.add_row(key, str(value))
    
    console.print(table)

def _display_search_results(results: List[dict]):
    """Display search results."""
    table = Table(title="Search Results")
    table.add_column("Platform", style="cyan")
    table.add_column("Author", style="green")
    table.add_column("Content", style="yellow", max_width=50)
    table.add_column("Timestamp", style="blue")
    
    for result in results[:10]:  # Show first 10 results
        content = result.get("content", "")[:47] + "..." if len(result.get("content", "")) > 50 else result.get("content", "")
        timestamp = result.get("timestamp", "")[:10] if result.get("timestamp") else "N/A"
        
        table.add_row(
            result.get("platform", "N/A"),
            result.get("author", "N/A"),
            content,
            timestamp
        )
    
    console.print(table)
    if len(results) > 10:
        console.print(f"[yellow]Showing first 10 of {len(results)} results[/yellow]")

def main():
    """Main entry point."""
    app()

if __name__ == "__main__":
    main() 