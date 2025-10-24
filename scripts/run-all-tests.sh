#!/bin/bash
# Complete test automation script for the entire platform
# Runs all integration, unit, and performance tests

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║    🧪 COMPLETE PLATFORM INTEGRATION TEST SUITE 🧪         ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
export KAFKA_BOOTSTRAP_SERVERS=${KAFKA_BOOTSTRAP_SERVERS:-"localhost:9092"}
export BASE_URL=${BASE_URL:-"http://localhost"}
export TEST_AUTH_TOKEN=${TEST_AUTH_TOKEN:-""}

TEST_RESULTS_DIR="./test-results"
mkdir -p "$TEST_RESULTS_DIR"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ═══════════════════════════════════════════════════════════════
# PHASE 1: PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  PHASE 1: PRE-FLIGHT CHECKS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking Kubernetes cluster..."
if kubectl cluster-info &> /dev/null; then
    echo -e "${GREEN}✅ Kubernetes cluster accessible${NC}"
else
    echo -e "${RED}❌ Kubernetes cluster not accessible${NC}"
    exit 1
fi

echo "Checking all pods are running..."
PENDING_PODS=$(kubectl get pods -n onboarding --field-selector=status.phase!=Running,status.phase!=Succeeded 2>/dev/null | grep -v NAME | wc -l || echo "0")
if [ "$PENDING_PODS" -eq "0" ]; then
    echo -e "${GREEN}✅ All pods are running${NC}"
else
    echo -e "${YELLOW}⚠️  ${PENDING_PODS} pods not in Running state${NC}"
    kubectl get pods -n onboarding
fi

echo "Checking Kafka connectivity..."
if command -v kafkacat &> /dev/null; then
    if kafkacat -L -b $KAFKA_BOOTSTRAP_SERVERS &> /dev/null; then
        echo -e "${GREEN}✅ Kafka accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Kafka not accessible${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  kafkacat not installed, skipping Kafka check${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 2: SERVICE HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  PHASE 2: SERVICE HEALTH CHECKS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SERVICES=(
    "onboarding-api:8080"
    "document-service:8081"
    "risk-service:8082"
    "checklist-service:8083"
    "entity-configuration-service:8084"
    "notification-service:8085"
    "audit-log-service:8086"
    "projections-api:8087"
    "work-queue-service:8088"
    "messaging-service:8089"
)

for service_port in "${SERVICES[@]}"; do
    IFS=':' read -r service port <<< "$service_port"
    
    echo -n "Checking $service... "
    
    if curl -f -s "${BASE_URL}:${port}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ Unhealthy${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
done

echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 3: UNIT TESTS
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  PHASE 3: UNIT TESTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Find and run all unit tests
for service in services/*/; do
    service_name=$(basename "$service")
    
    if [ -d "$service/tests/Unit" ]; then
        echo "Running unit tests for $service_name..."
        
        if dotnet test "$service/tests/Unit" --logger "trx;LogFileName=${TEST_RESULTS_DIR}/${service_name}-unit-tests.xml" --verbosity quiet; then
            echo -e "${GREEN}✅ $service_name unit tests passed${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}❌ $service_name unit tests failed${NC}"
            ((FAILED_TESTS++))
        fi
        ((TOTAL_TESTS++))
        echo ""
    fi
done

# ═══════════════════════════════════════════════════════════════
# PHASE 4: INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  PHASE 4: INTEGRATION TESTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd tests/integration

echo "Running circuit breaker tests..."
if dotnet test --filter "CircuitBreakerTests" --logger "trx;LogFileName=${TEST_RESULTS_DIR}/circuit-breaker-tests.xml" --verbosity normal; then
    echo -e "${GREEN}✅ Circuit breaker tests passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Circuit breaker tests failed${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

echo "Running end-to-end integration tests..."
if dotnet test --filter "EndToEndIntegrationTests" --logger "trx;LogFileName=${TEST_RESULTS_DIR}/e2e-tests.xml" --verbosity normal; then
    echo -e "${GREEN}✅ End-to-end tests passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ End-to-end tests failed${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

echo "Running service-to-service tests..."
if dotnet test --filter "ServiceToServiceIntegrationTests" --logger "trx;LogFileName=${TEST_RESULTS_DIR}/service-to-service-tests.xml" --verbosity normal; then
    echo -e "${GREEN}✅ Service-to-service tests passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Service-to-service tests failed${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

echo "Running Kafka event flow tests..."
if dotnet test --filter "KafkaEventFlowTests" --logger "trx;LogFileName=${TEST_RESULTS_DIR}/kafka-tests.xml" --verbosity normal; then
    echo -e "${GREEN}✅ Kafka event flow tests passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Kafka event flow tests failed${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

cd ../..

# ═══════════════════════════════════════════════════════════════
# PHASE 5: FRONTEND TESTS
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  PHASE 5: FRONTEND TESTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd frontend

echo "Running frontend unit tests..."
if npm test -- --passWithNoTests --coverage; then
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Frontend tests failed${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

cd ..

# ═══════════════════════════════════════════════════════════════
# PHASE 6: API CONTRACT VALIDATION
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  PHASE 6: API CONTRACT VALIDATION${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v spectral &> /dev/null; then
    for spec in services/*/openapi.yaml; do
        if [ -f "$spec" ]; then
            service_name=$(dirname "$spec" | xargs basename)
            echo "Validating $service_name OpenAPI spec..."
            
            if spectral lint "$spec" --fail-severity=error --format=stylish; then
                echo -e "${GREEN}✅ $service_name API contract valid${NC}"
                ((PASSED_TESTS++))
            else
                echo -e "${RED}❌ $service_name API contract invalid${NC}"
                ((FAILED_TESTS++))
            fi
            ((TOTAL_TESTS++))
        fi
    done
else
    echo -e "${YELLOW}⚠️  Spectral not installed, skipping API contract validation${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 7: PERFORMANCE/LOAD TESTS (Optional)
# ═══════════════════════════════════════════════════════════════

if [ "$RUN_LOAD_TESTS" = "true" ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  PHASE 7: PERFORMANCE TESTS${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if command -v k6 &> /dev/null; then
        echo "Running K6 performance tests..."
        
        if k6 run tests/load/performance-test.js --out json=${TEST_RESULTS_DIR}/k6-results.json; then
            echo -e "${GREEN}✅ Performance tests passed${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}❌ Performance tests failed${NC}"
            ((FAILED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    else
        echo -e "${YELLOW}⚠️  K6 not installed, skipping performance tests${NC}"
    fi
    
    echo ""
fi

# ═══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║                   📊 TEST SUMMARY 📊                       ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  ${BLUE}${TOTAL_TESTS}${NC}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"
echo ""

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo -e "Success Rate: ${GREEN}${SUCCESS_RATE}%${NC}"
echo ""

if [ "$FAILED_TESTS" -eq "0" ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║         🎉 ALL TESTS PASSED! SYSTEM VERIFIED! 🎉          ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║      ❌ SOME TESTS FAILED - REVIEW RESULTS ❌             ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Test results saved in: $TEST_RESULTS_DIR"
    exit 1
fi

