#!/bin/bash

echo "🐳 Starting Monipx in Docker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running!"
    echo ""
    echo "Please:"
    echo "1. Open Docker Desktop application"
    echo "2. Wait until it shows 'Docker Desktop is running'"
    echo "3. Run this script again: ./START_DOCKER.sh"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Stop any existing containers
echo "🧹 Cleaning up..."
docker-compose down 2>/dev/null || true

# Build and start
echo "🔨 Building and starting Monipx..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Monipx is starting!"
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
    echo ""
    echo "📝 Recent Logs:"
    docker-compose logs --tail=20
    echo ""
    echo "🌐 Access Monipx at: http://localhost:3001"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
else
    echo ""
    echo "❌ Failed to start. Check logs: docker-compose logs"
    exit 1
fi

