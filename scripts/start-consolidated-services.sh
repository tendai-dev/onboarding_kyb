#!/bin/bash

# Startup Script for Consolidated Services
# This script starts all required infrastructure and unified services

set -e

echo "=========================================="
echo "Starting Consolidated Services"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "Step 1: Starting infrastructure services..."
docker-compose up -d postgres redis kafka minio

echo ""
echo "Waiting for infrastructure to be ready..."
sleep 10

echo ""
echo "Step 2: Starting onboarding services..."
docker-compose up -d onboarding-api onboarding-workers onboarding-gateway

echo ""
echo "Waiting for services to initialize..."
sleep 15

echo ""
echo "Step 3: Verifying services..."

# Check API
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} onboarding-api is running (http://localhost:8001)"
else
    echo -e "${YELLOW}⚠${NC} onboarding-api may still be starting..."
fi

# Check Gateway
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} onboarding-gateway is running (http://localhost:8000)"
else
    echo -e "${YELLOW}⚠${NC} onboarding-gateway may still be starting..."
fi

# Check Workers
if docker ps | grep -q "onboarding-workers"; then
    echo -e "${GREEN}✓${NC} onboarding-workers is running"
else
    echo -e "${YELLOW}⚠${NC} onboarding-workers may still be starting..."
fi

echo ""
echo "=========================================="
echo "Services Started!"
echo "=========================================="
echo ""
echo "Access Points:"
echo "  - API:        http://localhost:8001"
echo "  - Gateway:    http://localhost:8000"
echo "  - Swagger:    http://localhost:8001/swagger"
echo ""
echo "View Logs:"
echo "  - API:        docker-compose logs -f onboarding-api"
echo "  - Workers:    docker-compose logs -f onboarding-workers"
echo "  - Gateway:    docker-compose logs -f onboarding-gateway"
echo ""
echo "Run verification:"
echo "  ./scripts/verify-consolidation.sh"
echo ""

