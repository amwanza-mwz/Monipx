#!/bin/bash

# Monipx Docker Test Script

echo "🐳 Monipx Docker Test Script"
echo "============================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running!"
    echo ""
    echo "Please start Docker Desktop or Docker daemon first."
    echo "Then run this script again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Stop and remove existing container if it exists
echo "🧹 Cleaning up existing containers..."
docker-compose down 2>/dev/null || true
docker stop monipx 2>/dev/null || true
docker rm monipx 2>/dev/null || true

# Build the Docker image
echo ""
echo "🔨 Building Docker image..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Start the container
echo "🚀 Starting Monipx container..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container!"
    exit 1
fi

echo ""
echo "✅ Container started!"
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "📝 Logs (last 20 lines):"
docker-compose logs --tail=20

echo ""
echo "🌐 Monipx is now running!"
echo ""
echo "Access the application at: http://localhost:3001"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo ""

