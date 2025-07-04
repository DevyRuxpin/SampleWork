# Railway-compatible Dockerfile for KaliShare Backend
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy all source code
COPY . .

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Create a startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Set working directory to backend for running the app
WORKDIR /app/backend

# Expose backend port (use PORT environment variable)
EXPOSE ${PORT:-5000}

# Health check (use PORT environment variable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Start backend service using the script
CMD ["/app/start.sh"] 