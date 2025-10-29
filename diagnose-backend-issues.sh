#!/bin/bash

echo "🔍 DIAGNOSING .NET BACKEND SERVICES ISSUES"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ISSUES_FOUND=0

echo -e "\n${BLUE}Step 1: Checking Docker status${NC}"

if docker ps >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "  Issue: Docker Desktop needs to be started"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo -e "\n${BLUE}Step 2: Analyzing service directories${NC}"

# Check if services exist
SERVICES=(
    "onboarding-api"
    "document-service"
    "risk-service"
    "notification-service"
    "checklist-service"
    "messaging-service"
    "auditlog-service"
    "webhook-dispatcher"
    "projections-api"
    "work-queue-service"
)

for service in "${SERVICES[@]}"; do
    if [ -d "services/$service" ]; then
        echo -e "  ✓ Found: services/$service"
        
        # Check for Dockerfile
        if [ -f "services/$service/Dockerfile" ]; then
            echo "    ✓ Dockerfile exists"
        else
            echo -e "    ${RED}✗ Missing Dockerfile${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
        
        # Check for .csproj file
        if find "services/$service" -name "*.csproj" | grep -q .; then
            echo "    ✓ .NET project file exists"
        else
            echo -e "    ${RED}✗ Missing .csproj file${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    else
        echo -e "  ${RED}✗ Missing: services/$service${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

echo -e "\n${BLUE}Step 3: Checking docker-compose.yml configuration${NC}"

if [ -f "docker-compose.yml" ]; then
    echo "✓ docker-compose.yml exists"
    
    # Check for service definitions
    echo "Checking service definitions..."
    for service in "${SERVICES[@]}"; do
        if grep -q "$service:" docker-compose.yml; then
            echo "  ✓ $service defined"
        else
            echo -e "  ${RED}✗ $service not defined in docker-compose.yml${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    done
else
    echo -e "${RED}✗ docker-compose.yml missing${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo -e "\n${BLUE}Step 4: Checking running containers${NC}"

if docker ps >/dev/null 2>&1; then
    RUNNING_COUNT=$(docker ps --format "{{.Names}}" | wc -l | tr -d ' ')
    echo "Running containers: $RUNNING_COUNT"
    
    if [ "$RUNNING_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠ No containers are running${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
    fi
fi

echo -e "\n${BLUE}Step 5: Checking failed containers${NC}"

FAILED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}" | head -5)
if [ ! -z "$FAILED_CONTAINERS" ]; then
    echo -e "${RED}Failed containers found:${NC}"
    for container in $FAILED_CONTAINERS; do
        echo -e "  ${RED}✗ $container${NC}"
        echo "    Last error:"
        docker logs $container 2>&1 | grep -E "error|Error|ERROR|Fatal|Exception" | tail -1 | head -c 100
        echo ""
    done
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo -e "\n${BLUE}Step 6: Analyzing .NET project structure${NC}"

# Check a sample service for proper structure
SAMPLE_SERVICE="services/onboarding-api"
if [ -d "$SAMPLE_SERVICE" ]; then
    echo "Analyzing $SAMPLE_SERVICE structure:"
    
    # Check for solution file
    if find "$SAMPLE_SERVICE" -name "*.sln" | grep -q .; then
        echo "  ✓ Solution file found"
    else
        echo -e "  ${YELLOW}⚠ No solution file${NC}"
    fi
    
    # Check for source structure
    if [ -d "$SAMPLE_SERVICE/src" ]; then
        echo "  ✓ src directory exists"
        
        # Check for layers
        LAYERS=("Domain" "Application" "Infrastructure" "Presentation")
        for layer in "${LAYERS[@]}"; do
            if [ -d "$SAMPLE_SERVICE/src/$layer" ]; then
                echo "    ✓ $layer layer exists"
            else
                echo -e "    ${YELLOW}⚠ $layer layer missing${NC}"
            fi
        done
    else
        echo -e "  ${RED}✗ No src directory${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

echo -e "\n${BLUE}Step 7: Checking database connectivity${NC}"

if docker ps | grep -q postgres; then
    echo "✓ PostgreSQL container is running"
    
    # Check if databases exist
    DBS=("onboarding" "documents" "risk")
    for db in "${DBS[@]}"; do
        if docker exec postgres psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $db; then
            echo "  ✓ Database '$db' exists"
        else
            echo -e "  ${RED}✗ Database '$db' missing${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    done
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo -e "\n${BLUE}Step 8: Checking port availability${NC}"

PORTS=(8080 8081 8082 8083 8084 8085 8086 8087 8088 8089 8090 8091)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Port $port is in use${NC}"
    else
        echo "  ○ Port $port is available"
    fi
done

echo -e "\n${BLUE}Step 9: Analyzing Dockerfile issues${NC}"

SAMPLE_DOCKERFILE="services/onboarding-api/Dockerfile"
if [ -f "$SAMPLE_DOCKERFILE" ]; then
    echo "Checking $SAMPLE_DOCKERFILE:"
    
    # Check for .NET SDK image
    if grep -q "mcr.microsoft.com/dotnet/sdk" "$SAMPLE_DOCKERFILE"; then
        echo "  ✓ Using official .NET SDK image"
    else
        echo -e "  ${RED}✗ Not using official .NET SDK image${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check for proper build stages
    if grep -q "FROM.*AS build" "$SAMPLE_DOCKERFILE"; then
        echo "  ✓ Multi-stage build configured"
    else
        echo -e "  ${YELLOW}⚠ Single-stage build (less efficient)${NC}"
    fi
    
    # Check for restore, build, publish commands
    if grep -q "dotnet restore" "$SAMPLE_DOCKERFILE"; then
        echo "  ✓ dotnet restore present"
    else
        echo -e "  ${RED}✗ Missing dotnet restore${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if grep -q "dotnet publish" "$SAMPLE_DOCKERFILE"; then
        echo "  ✓ dotnet publish present"
    else
        echo -e "  ${RED}✗ Missing dotnet publish${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}DIAGNOSIS COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Summary:${NC}"
echo "Total issues found: $ISSUES_FOUND"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No critical issues found!${NC}"
else
    echo -e "\n${RED}Main issues identified:${NC}"
    
    # Provide specific diagnosis
    if ! docker ps >/dev/null 2>&1; then
        echo "1. Docker is not running - start Docker Desktop"
    fi
    
    if [ "$RUNNING_COUNT" -eq 0 ]; then
        echo "2. No services are running - need to build and start services"
    fi
    
    if [ ! -z "$FAILED_CONTAINERS" ]; then
        echo "3. Some containers have failed - check logs for details"
    fi
    
    echo -e "\n${YELLOW}Recommended actions:${NC}"
    echo "1. Start Docker Desktop if not running"
    echo "2. Build services: docker-compose build"
    echo "3. Start services: docker-compose up -d"
    echo "4. Check logs: docker-compose logs [service-name]"
fi

echo -e "\n${BLUE}Next step: Run fix-backend-services.sh to resolve issues${NC}"
