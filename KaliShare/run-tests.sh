#!/bin/bash

# KaliShare Test Runner
# This script provides comprehensive testing options for the KaliShare application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
        print_error "Please run this script from the KaliShare root directory"
        exit 1
    fi
}

# Function to install dependencies if needed
install_dependencies() {
    print_status "Checking dependencies..."
    
    if [ ! -d "backend/node_modules" ]; then
        print_status "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
}

# Function to run backend tests
run_backend_tests() {
    local test_type=$1
    local coverage=$2
    
    print_status "Running backend tests..."
    cd backend
    
    case $test_type in
        "unit")
            print_status "Running unit tests..."
            npm run test:unit
            ;;
        "integration")
            print_status "Running integration tests..."
            npm run test:integration
            ;;
        "e2e")
            print_status "Running end-to-end tests..."
            npm run test:e2e
            ;;
        "all")
            if [ "$coverage" = "true" ]; then
                print_status "Running all backend tests with coverage..."
                npm run test:coverage
            else
                print_status "Running all backend tests..."
                npm test
            fi
            ;;
        *)
            print_error "Invalid backend test type: $test_type"
            exit 1
            ;;
    esac
    
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    local coverage=$1
    
    print_status "Running frontend tests..."
    cd frontend
    
    if [ "$coverage" = "true" ]; then
        print_status "Running frontend tests with coverage..."
        npm run test:coverage
    else
        print_status "Running frontend tests..."
        npm test
    fi
    
    cd ..
}

# Function to run linting
run_linting() {
    print_status "Running linting checks..."
    
    cd backend
    print_status "Backend linting..."
    if npm run lint; then
        print_success "Backend linting passed"
    else
        print_error "Backend linting failed"
        cd ..
        return 1
    fi
    cd ..
    
    cd frontend
    print_status "Frontend linting..."
    if npm run lint; then
        print_success "Frontend linting passed"
    else
        print_error "Frontend linting failed"
        cd ..
        return 1
    fi
    cd ..
}

# Function to show test coverage summary
show_coverage_summary() {
    print_status "Coverage Summary:"
    
    if [ -f "backend/coverage/lcov-report/index.html" ]; then
        print_success "Backend coverage report generated: backend/coverage/lcov-report/index.html"
    fi
    
    if [ -f "frontend/coverage/lcov-report/index.html" ]; then
        print_success "Frontend coverage report generated: frontend/coverage/lcov-report/index.html"
    fi
}

# Function to run all tests
run_all_tests() {
    local coverage=$1
    local lint=$2
    
    print_status "Starting comprehensive test suite..."
    
    # Install dependencies
    install_dependencies
    
    # Run linting if requested
    if [ "$lint" = "true" ]; then
        if ! run_linting; then
            print_error "Linting failed. Exiting."
            exit 1
        fi
    fi
    
    # Run backend tests
    if run_backend_tests "all" "$coverage"; then
        print_success "Backend tests passed"
    else
        print_error "Backend tests failed"
        exit 1
    fi
    
    # Run frontend tests
    if run_frontend_tests "$coverage"; then
        print_success "Frontend tests passed"
    else
        print_error "Frontend tests failed"
        exit 1
    fi
    
    # Show coverage summary
    if [ "$coverage" = "true" ]; then
        show_coverage_summary
    fi
    
    print_success "All tests completed successfully!"
}

# Function to show help
show_help() {
    echo "KaliShare Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  all              Run all tests (default)"
    echo "  backend          Run backend tests only"
    echo "  frontend         Run frontend tests only"
    echo "  lint             Run linting only"
    echo "  unit             Run backend unit tests only"
    echo "  integration      Run backend integration tests only"
    echo "  e2e              Run backend end-to-end tests only"
    echo ""
    echo "Options:"
    echo "  -c, --coverage   Include coverage reporting"
    echo "  -l, --lint       Include linting checks"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests without coverage"
    echo "  $0 -c                 # Run all tests with coverage"
    echo "  $0 -c -l              # Run all tests with coverage and linting"
    echo "  $0 backend -c         # Run backend tests with coverage"
    echo "  $0 frontend           # Run frontend tests only"
    echo "  $0 unit               # Run backend unit tests only"
    echo "  $0 lint               # Run linting only"
}

# Main script logic
main() {
    local command="all"
    local coverage="false"
    local lint="false"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--coverage)
                coverage="true"
                shift
                ;;
            -l|--lint)
                lint="true"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            all|backend|frontend|lint|unit|integration|e2e)
                command="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Check if we're in the right directory
    check_directory
    
    # Run the appropriate command
    case $command in
        "all")
            run_all_tests "$coverage" "$lint"
            ;;
        "backend")
            install_dependencies
            run_backend_tests "all" "$coverage"
            ;;
        "frontend")
            install_dependencies
            run_frontend_tests "$coverage"
            ;;
        "lint")
            install_dependencies
            run_linting
            ;;
        "unit")
            install_dependencies
            run_backend_tests "unit" "$coverage"
            ;;
        "integration")
            install_dependencies
            run_backend_tests "integration" "$coverage"
            ;;
        "e2e")
            install_dependencies
            run_backend_tests "e2e" "$coverage"
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run the main function with all arguments
main "$@" 