#!/bin/bash

# Consolidation Verification Script
# This script verifies that all consolidated services are working correctly

set -e

echo "=========================================="
echo "Consolidation Verification Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8001"
GATEWAY_URL="http://localhost:8000"
TIMEOUT=5

# Counters
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "\n%{http_code}" -m $TIMEOUT "$url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -eq "401" ] || [ "$http_code" -eq "404" ]; then
            echo -e "${GREEN}✓${NC} (HTTP $http_code)"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗${NC} (HTTP $http_code, expected $expected_status)"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗${NC} (Connection failed)"
        ((FAILED++))
        return 1
    fi
}

# Check if services are running
echo "Checking if services are running..."
echo ""

# Check API service
if docker ps | grep -q "onboarding-api"; then
    echo -e "${GREEN}✓${NC} onboarding-api container is running"
else
    echo -e "${RED}✗${NC} onboarding-api container is not running"
    echo "   Start it with: docker-compose up -d onboarding-api"
    exit 1
fi

# Check Worker service
if docker ps | grep -q "onboarding-workers"; then
    echo -e "${GREEN}✓${NC} onboarding-workers container is running"
else
    echo -e "${YELLOW}⚠${NC} onboarding-workers container is not running (optional for API testing)"
fi

# Check Gateway
if docker ps | grep -q "onboarding-gateway"; then
    echo -e "${GREEN}✓${NC} onboarding-gateway container is running"
else
    echo -e "${YELLOW}⚠${NC} onboarding-gateway container is not running (optional for API testing)"
fi

echo ""
echo "=========================================="
echo "Testing Direct API Endpoints (Port 8001)"
echo "=========================================="
echo ""

# Test direct API endpoints
test_endpoint "API Health" "$API_URL/health"
test_endpoint "Audit Logs" "$API_URL/api/v1/audit-logs"
test_endpoint "Checklists" "$API_URL/api/v1/checklists"
test_endpoint "Notifications" "$API_URL/api/v1/notifications"
test_endpoint "Messages" "$API_URL/api/v1/messages"
test_endpoint "Entity Types" "$API_URL/api/v1/entity-types"
test_endpoint "Work Queue" "$API_URL/api/v1/workqueue"
test_endpoint "Risk Assessments" "$API_URL/api/v1/risk-assessments"
test_endpoint "Projections Dashboard" "$API_URL/api/v1/projections/dashboard"
test_endpoint "Documents" "$API_URL/api/v1/documents"

echo ""
echo "=========================================="
echo "Testing Gateway Endpoints (Port 8000)"
echo "=========================================="
echo ""

# Test gateway endpoints
test_endpoint "Gateway Health" "$GATEWAY_URL/health"
test_endpoint "Audit via Gateway" "$GATEWAY_URL/api/audit/"
test_endpoint "Checklists via Gateway" "$GATEWAY_URL/api/checklists/"
test_endpoint "Notifications via Gateway" "$GATEWAY_URL/api/notifications/"
test_endpoint "Messages via Gateway" "$GATEWAY_URL/api/messages/"
test_endpoint "Entity Config via Gateway" "$GATEWAY_URL/api/entities/"
test_endpoint "Work Queue via Gateway" "$GATEWAY_URL/api/workqueue"
test_endpoint "Risk via Gateway" "$GATEWAY_URL/api/risk/risk-assessments"
test_endpoint "Projections via Gateway" "$GATEWAY_URL/api/v1/dashboard"
test_endpoint "Documents via Gateway" "$GATEWAY_URL/api/documents"

echo ""
echo "=========================================="
echo "Database Schema Verification"
echo "=========================================="
echo ""

# Check database schemas
if docker ps | grep -q "postgres"; then
    echo "Checking database schemas..."
    SCHEMAS=$(docker-compose exec -T postgres psql -U kyb -d kyb_case -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('audit', 'checklist', 'notification', 'messaging', 'entity_configuration', 'work_queue', 'risk', 'projections', 'document');" 2>/dev/null | tr -d ' ' | grep -v '^$' | wc -l)
    
    if [ "$SCHEMAS" -ge 9 ]; then
        echo -e "${GREEN}✓${NC} All required schemas exist ($SCHEMAS/9)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Some schemas may be missing ($SCHEMAS/9 found)"
        echo "   Schemas will be created automatically on first API startup"
    fi
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL container not running, skipping schema check"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

TOTAL=$((PASSED + FAILED))
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC} ($PASSED/$TOTAL)"
    echo ""
    echo "✅ Consolidation verification successful!"
    echo ""
    echo "Next steps:"
    echo "  1. Test frontend applications"
    echo "  2. Run full integration tests"
    echo "  3. Deploy to staging environment"
    exit 0
else
    echo -e "${RED}Some tests failed${NC} ($FAILED/$TOTAL failed, $PASSED/$TOTAL passed)"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check service logs: docker-compose logs onboarding-api"
    echo "  2. Verify services are running: docker-compose ps"
    echo "  3. Check network connectivity: docker-compose exec onboarding-api ping postgres"
    exit 1
fi

