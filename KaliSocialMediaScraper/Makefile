.PHONY: help install install-dev clean test test-coverage lint format check-deps run-example build dist publish

# Default target
help:
	@echo "Kali Social Media Scraper - Available commands:"
	@echo ""
	@echo "Installation:"
	@echo "  install      - Install the package in development mode"
	@echo "  install-dev  - Install the package with development dependencies"
	@echo "  clean        - Clean build artifacts and cache"
	@echo ""
	@echo "Testing:"
	@echo "  test         - Run tests"
	@echo "  test-coverage - Run tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint         - Run linting checks"
	@echo "  format       - Format code with black and isort"
	@echo "  check-deps   - Check for outdated dependencies"
	@echo ""
	@echo "Development:"
	@echo "  run-example  - Run the example script"
	@echo ""
	@echo "Build & Distribution:"
	@echo "  build        - Build the package"
	@echo "  dist         - Create distribution files"
	@echo "  publish      - Publish to PyPI (requires authentication)"

# Installation
install:
	pip install -e .

install-dev:
	pip install -e ".[dev]"

# Cleaning
clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .mypy_cache/
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete

# Testing
test:
	pytest tests/ -v

test-coverage:
	pytest tests/ --cov=scraper --cov-report=html --cov-report=term-missing

# Code Quality
lint:
	flake8 scraper/ tests/
	mypy scraper/

format:
	black scraper/ tests/
	isort scraper/ tests/

check-deps:
	pip list --outdated

# Development
run-example:
	python example.py

# Build & Distribution
build:
	python -m build

dist: build
	@echo "Distribution files created in dist/"

publish: dist
	twine upload dist/*

# Database operations
init-db:
	python -c "from scraper.core.database import init_database; import asyncio; asyncio.run(init_database())"

# CLI examples
cli-help:
	kali-scraper --help

cli-platforms:
	kali-scraper list-platforms

# Docker (if needed)
docker-build:
	docker build -t kali-social-media-scraper .

docker-run:
	docker run -it --rm kali-social-media-scraper

# Security
security-check:
	safety check
	bandit -r scraper/

# Documentation
docs-serve:
	mkdocs serve

docs-build:
	mkdocs build

# Pre-commit
pre-commit-install:
	pre-commit install

pre-commit-run:
	pre-commit run --all-files

# Environment setup
setup-env:
	cp .env.example .env
	@echo "Environment file created. Please edit .env with your configuration."

# Quick start
quick-start: setup-env install-dev
	@echo "Quick start completed!"
	@echo "Next steps:"
	@echo "1. Edit .env file with your configuration"
	@echo "2. Run 'make run-example' to test the scraper"
	@echo "3. Run 'make cli-help' to see available CLI commands" 