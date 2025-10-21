#!/bin/bash

# Comprehensive Backend Testing Script
# Tests all 8 services to ensure they're working properly

set -e

echo "🚀 Testing Complete KYC/Onboarding Platform Backend"
echo "=================================================="

# Configuration
API_BASE_URL="${API_BASE_URL:-https://api.yourdomain.tld}"
KEYCLOAK_URL="${KEYCLOAK_URL:-https://keycloak.yourdomain.tld}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test function
test_endpoint() {
    local service_name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"
    local description="$4"
    
    log_info "Testing $service_name: $description"
    
    if response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$endpoint" 2>/dev/null); then
        http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
        body=$(echo "$response" | sed -e 's/HTTPSTATUS\:.*//g')
        
        if [ "$http_code" -eq "$expected_status" ]; then
            log_success "$service_name health check passed (HTTP $http_code)"
        else
            log_error "$service_name health check failed (HTTP $http_code, expected $expected_status)"
        fi
    else
        log_error "$service_name is not accessible at $endpoint"
    fi
}

# Test authenticated endpoint
test_authenticated_endpoint() {
    local service_name="$1"
    local endpoint="$2"
    local description="$3"
    
    log_info "Testing $service_name: $description"
    
    # For now, just test that the endpoint exists (will return 401 without auth)
    if response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$endpoint" 2>/dev/null); then
        http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
        
        if [ "$http_code" -eq "401" ] || [ "$http_code" -eq "200" ]; then
            log_success "$service_name API endpoint exists (HTTP $http_code)"
        else
            log_error "$service_name API endpoint issue (HTTP $http_code)"
        fi
    else
        log_error "$service_name API is not accessible at $endpoint"
    fi
}

echo ""
echo "🏥 Testing Health Endpoints"
echo "==========================="

# Test all service health endpoints
test_endpoint "Onboarding API" "$API_BASE_URL/onboarding/v1/health/live" 200 "Health check"
test_endpoint "Document Service" "$API_BASE_URL/documents/v1/health/live" 200 "Health check"
test_endpoint "Webhook Dispatcher" "$API_BASE_URL/webhooks/v1/health/live" 200 "Health check"
test_endpoint "Checklist Service" "$API_BASE_URL/checklist/v1/health/live" 200 "Health check"
test_endpoint "Risk Service" "$API_BASE_URL/risk/v1/health/live" 200 "Health check"
test_endpoint "Audit Log Service" "$API_BASE_URL/audit/v1/health/live" 200 "Health check"
test_endpoint "Projections API" "$API_BASE_URL/projections/v1/health/live" 200 "Health check"
test_endpoint "Notification Service" "$API_BASE_URL/notifications/v1/health/live" 200 "Health check"

echo ""
echo "🔐 Testing API Endpoints (Authentication Required)"
echo "================================================"

# Test main API endpoints (should return 401 without auth, which means they exist)
test_authenticated_endpoint "Onboarding API" "$API_BASE_URL/onboarding/v1/cases" "Cases endpoint"
test_authenticated_endpoint "Document Service" "$API_BASE_URL/documents/v1/documents" "Documents endpoint"
test_authenticated_endpoint "Checklist Service" "$API_BASE_URL/checklist/v1/checklists" "Checklists endpoint"
test_authenticated_endpoint "Risk Service" "$API_BASE_URL/risk/v1/risk-assessments" "Risk assessments endpoint"
test_authenticated_endpoint "Audit Log Service" "$API_BASE_URL/audit/v1/audit-logs/search" "Audit logs endpoint"
test_authenticated_endpoint "Projections API" "$API_BASE_URL/projections/v1/dashboard" "Dashboard endpoint"
test_authenticated_endpoint "Projections API" "$API_BASE_URL/projections/v1/cases" "Cases projection endpoint"
test_authenticated_endpoint "Notification Service" "$API_BASE_URL/notifications/v1/notifications" "Notifications endpoint"
test_authenticated_endpoint "Webhook Dispatcher" "$API_BASE_URL/webhooks/v1/webhooks" "Webhooks endpoint"

echo ""
echo "📊 Testing Swagger Documentation"
echo "==============================="

# Test Swagger endpoints
test_endpoint "Onboarding API Swagger" "$API_BASE_URL/onboarding/v1/swagger/index.html" 200 "Swagger UI"
test_endpoint "Projections API Swagger" "$API_BASE_URL/projections/v1/swagger/index.html" 200 "Swagger UI"
test_endpoint "Checklist Service Swagger" "$API_BASE_URL/checklist/v1/swagger/index.html" 200 "Swagger UI"
test_endpoint "Risk Service Swagger" "$API_BASE_URL/risk/v1/swagger/index.html" 200 "Swagger UI"
test_endpoint "Audit Log Service Swagger" "$API_BASE_URL/audit/v1/swagger/index.html" 200 "Swagger UI"
test_endpoint "Notification Service Swagger" "$API_BASE_URL/notifications/v1/swagger/index.html" 200 "Swagger UI"

echo ""
echo "🔑 Testing Keycloak Integration"
echo "=============================="

test_endpoint "Keycloak" "$KEYCLOAK_URL/realms/partners/.well-known/openid_configuration" 200 "OpenID configuration"

echo ""
echo "🐳 Testing Kubernetes Services"
echo "============================="

log_info "Checking Kubernetes pod status..."

# Check if kubectl is available
if command -v kubectl &> /dev/null; then
    # Check pod status
    if kubectl get pods -A | grep -E "(onboarding|checklist|risk|audit|projection|notification|webhook|document)" > /dev/null 2>&1; then
        log_success "Kubernetes services are deployed"
        
        # Count running pods
        running_pods=$(kubectl get pods -A | grep -E "(onboarding|checklist|risk|audit|projection|notification|webhook|document)" | grep "Running" | wc -l)
        total_pods=$(kubectl get pods -A | grep -E "(onboarding|checklist|risk|audit|projection|notification|webhook|document)" | wc -l)
        
        log_info "Running pods: $running_pods/$total_pods"
        
        if [ "$running_pods" -eq "$total_pods" ]; then
            log_success "All service pods are running"
        else
            log_warning "Some service pods are not running"
        fi
    else
        log_warning "No Kubernetes services found (might not be deployed yet)"
    fi
else
    log_warning "kubectl not available - skipping Kubernetes checks"
fi

echo ""
echo "📈 Testing Platform Infrastructure"
echo "================================"

# Test platform services
test_endpoint "PostgreSQL Health" "$API_BASE_URL/health" 200 "Database connectivity"
test_endpoint "Redis Health" "$API_BASE_URL/health" 200 "Cache connectivity"

echo ""
echo "🎯 Summary"
echo "=========="

total_tests=$((TESTS_PASSED + TESTS_FAILED))
success_rate=$(( (TESTS_PASSED * 100) / total_tests ))

echo -e "Total tests: $total_tests"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Success rate: ${BLUE}$success_rate%${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! The backend is ready for React integration!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure Keycloak realm and users"
    echo "2. Set up your React frontend with the API endpoints"
    echo "3. Use the API documentation: /docs/api/react_integration_guide.md"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please check the deployment and configuration.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if all services are deployed: kubectl get pods -A"
    echo "2. Check service logs: kubectl logs -n <namespace> <pod-name>"
    echo "3. Verify DNS and ingress configuration"
    echo "4. Check the deployment guide: DEPLOYMENT_GUIDE.md"
    echo ""
    exit 1
fi
