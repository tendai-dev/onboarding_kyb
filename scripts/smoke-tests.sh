#!/usr/bin/env bash
# Smoke Tests for Onboarding Platform
# Validates that all services are healthy and responsive

set -e

API_BASE="${API_BASE_URL:-https://api.yourdomain.tld}"
TIMEOUT=10

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Running Smoke Tests for Onboarding Platform"
echo "================================================"
echo "API Base: $API_BASE"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response, expected $expected_status)"
        return 1
    fi
}

# Function to test health endpoint
test_health() {
    local service=$1
    local path=$2
    
    test_endpoint "$service health" "$API_BASE$path/health/live" 200
}

FAILED=0

# Core Services Health Checks
echo "📋 Core Services Health Checks"
echo "-------------------------------"

test_health "Onboarding API" "/onboarding/v1" || ((FAILED++))
test_health "Document Service" "/documents/v1" || ((FAILED++))
test_health "Checklist Service" "/checks/v1" || ((FAILED++))
test_health "Risk Service" "/risk/v1" || ((FAILED++))
test_health "Notification Service" "/notifications/v1" || ((FAILED++))
test_health "Webhook Dispatcher" "/webhooks/v1" || ((FAILED++))
test_health "Projections API" "/projections/v1" || ((FAILED++))

echo ""

# Platform Services
echo "🏗️  Platform Services"
echo "--------------------"

# Keycloak
test_endpoint "Keycloak" "https://keycloak.yourdomain.tld/health" 200 || ((FAILED++))

# Grafana
test_endpoint "Grafana" "https://grafana.yourdomain.tld/api/health" 200 || ((FAILED++))

# MinIO Console
test_endpoint "MinIO Console" "https://minio-console.yourdomain.tld/minio/health/live" 200 || ((FAILED++))

echo ""

# Kubernetes Health
echo "☸️  Kubernetes Health"
echo "--------------------"

if command -v kubectl &> /dev/null; then
    echo -n "Checking nodes... "
    if kubectl get nodes | grep -q "Ready"; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
    
    echo -n "Checking business pods... "
    NOT_RUNNING=$(kubectl get pods -A -l tier=business --no-headers | grep -v "Running" | wc -l)
    if [ "$NOT_RUNNING" -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC} (All pods running)"
    else
        echo -e "${YELLOW}⚠ WARNING${NC} ($NOT_RUNNING pods not running)"
        kubectl get pods -A -l tier=business | grep -v "Running"
    fi
else
    echo -e "${YELLOW}⚠ kubectl not available, skipping K8s checks${NC}"
fi

echo ""

# OpenAPI/Swagger Endpoints
echo "📖 API Documentation"
echo "-------------------"

test_endpoint "Swagger UI" "$API_BASE/onboarding/v1/swagger/index.html" 200 || ((FAILED++))

echo ""

# Summary
echo "📊 Summary"
echo "=========="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED test(s) failed${NC}"
    exit 1
fi

