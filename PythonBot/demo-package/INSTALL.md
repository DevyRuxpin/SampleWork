# 📦 Installation Guide

## Prerequisites

Before running the demo, ensure you have the following installed:

### 1. Docker Desktop
- **macOS**: Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Windows**: Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow [Docker installation guide](https://docs.docker.com/engine/install/)

### 2. Docker Compose
- Usually included with Docker Desktop
- Verify installation: `docker-compose --version`

### 3. curl (for testing)
- **macOS**: Usually pre-installed
- **Windows**: Download from [curl.se](https://curl.se/windows/)
- **Linux**: `sudo apt-get install curl` (Ubuntu/Debian) or `sudo yum install curl` (CentOS/RHEL)

## Quick Installation

### Step 1: Download the Demo Package
```bash
# If you received this as a zip file, extract it
unzip phone-scheduler-bot-demo.zip
cd phone-scheduler-bot-demo
```

### Step 2: Start the Demo
```bash
# Make scripts executable (Linux/macOS only)
chmod +x *.sh

# Start the demo
./start-demo.sh
```

### Step 3: Test the Demo
```bash
# Run the quick test
./quick-test.sh
```

## Troubleshooting

### Docker Issues
```bash
# Check if Docker is running
docker info

# Restart Docker Desktop if needed
# Then try again:
./start-demo.sh
```

### Port Conflicts
If port 8000 is already in use:
```bash
# Find what's using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Stop the conflicting service, then restart:
./stop-demo.sh
./start-demo.sh
```

### Permission Issues (Linux/macOS)
```bash
# Make scripts executable
chmod +x *.sh

# If you get permission denied errors
sudo chmod +x *.sh
```

### Memory Issues
If Docker runs out of memory:
1. Increase Docker Desktop memory limit (8GB recommended)
2. Restart Docker Desktop
3. Try again: `./start-demo.sh`

## Verification

After installation, verify everything is working:

```bash
# Check health
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","database":"connected","scheduler":"running","mode":"mock"}
```

## Next Steps

1. **Read the README.md** for detailed usage instructions
2. **Try the examples** in demo-examples.md
3. **Run the quick test** with `./quick-test.sh`
4. **Explore the API** at http://localhost:8000/docs

## Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.mock.yml logs app`
2. Restart the demo: `./stop-demo.sh && ./start-demo.sh`
3. Contact support with the error details

---

**Ready to demo! 🚀** 