#!/bin/bash

# Docker Hub Push Script for Monipx v1.1.0
# This script builds and pushes the Docker image to Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USERNAME="amwanzamwz"
IMAGE_NAME="monipx"
VERSION="1.1.0"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Monipx Docker Build & Push Script${NC}"
echo -e "${GREEN}Version: ${VERSION}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if logged in to Docker Hub
echo -e "${YELLOW}Checking Docker Hub login...${NC}"
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}Not logged in to Docker Hub. Please log in:${NC}"
    docker login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Docker login failed. Exiting.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Docker Hub login verified${NC}"
echo ""

# Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"
docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} .

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker build failed. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo ""

# Tag as latest
echo -e "${YELLOW}Tagging as latest...${NC}"
docker tag ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

echo -e "${GREEN}✓ Tagged as latest${NC}"
echo ""

# Push version tag
echo -e "${YELLOW}Pushing version ${VERSION} to Docker Hub...${NC}"
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker push failed for version tag. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Version ${VERSION} pushed successfully${NC}"
echo ""

# Push latest tag
echo -e "${YELLOW}Pushing latest tag to Docker Hub...${NC}"
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker push failed for latest tag. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Latest tag pushed successfully${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Docker images pushed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Images available on Docker Hub:"
echo -e "  • ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo -e "  • ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo -e "Pull with:"
echo -e "  ${YELLOW}docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:latest${NC}"
echo -e "  ${YELLOW}docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}${NC}"
echo ""
echo -e "Run with:"
echo -e "  ${YELLOW}docker run -d -p 3001:3001 -v monipx-data:/app/data ${DOCKER_USERNAME}/${IMAGE_NAME}:latest${NC}"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"

