#!/usr/bin/env bash
# Load Test Runner
# Orchestrates k6 load tests with proper setup and monitoring

set -euo pipefail

SCENARIO="${1:-load}"
API_BASE_URL="${API_BASE_URL:-https://api.yourdomain.tld}"
RESULTS_DIR="./results/$(date +%Y%m%d_%H%M%S)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $*"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $*"
}

mkdir -p "$RESULTS_DIR"

log "🧪 Starting Load Test"
log "Scenario: $SCENARIO"
log "Target: $API_BASE_URL"
log "Results: $RESULTS_DIR"
log ""

# Pre-flight checks
log "Running pre-flight checks..."

# Check API is reachable
if ! curl -sf "$API_BASE_URL/onboarding/v1/health/live" > /dev/null; then
    error "API is not reachable at $API_BASE_URL"
    exit 1
fi
log "✓ API is reachable"

# Check Keycloak is reachable
KEYCLOAK_URL="${KEYCLOAK_URL:-https://keycloak.yourdomain.tld}"
if ! curl -sf "$KEYCLOAK_URL/health" > /dev/null; then
    warn "Keycloak health check failed, authentication may fail"
fi

# Get test credentials
if [ -z "${TEST_USER_PASSWORD:-}" ]; then
    warn "TEST_USER_PASSWORD not set, using default (may fail)"
    export TEST_USER_PASSWORD="test-password"
fi

# Start monitoring
log "Starting Grafana monitoring..."
log "Dashboard: https://grafana.yourdomain.tld/d/service-red-metrics"
log "Watch metrics during test!"
log ""

# Run k6 test
log "Executing k6 load test..."

k6 run tests/load/k6-load-tests.js \
    --env SCENARIO="$SCENARIO" \
    --env API_BASE_URL="$API_BASE_URL" \
    --env KEYCLOAK_URL="$KEYCLOAK_URL" \
    --env TEST_USER_PASSWORD="$TEST_USER_PASSWORD" \
    --out json="$RESULTS_DIR/results.json" \
    --summary-export="$RESULTS_DIR/summary.json" \
    | tee "$RESULTS_DIR/output.log"

TEST_EXIT_CODE=$?

# Analyze results
log ""
log "📊 Analyzing results..."

if [ -f "$RESULTS_DIR/summary.json" ]; then
    # Extract key metrics
    P95=$(jq -r '.metrics.http_req_duration.values["p(95)"]' "$RESULTS_DIR/summary.json")
    ERROR_RATE=$(jq -r '.metrics.errors.values.rate' "$RESULTS_DIR/summary.json")
    TOTAL_REQUESTS=$(jq -r '.metrics.http_reqs.values.count' "$RESULTS_DIR/summary.json")
    
    log "Results Summary:"
    log "  Total Requests: $TOTAL_REQUESTS"
    log "  P95 Latency: ${P95}ms"
    log "  Error Rate: $(echo "$ERROR_RATE * 100" | bc)%"
    log ""
    
    # Check SLO compliance
    SLO_PASS=true
    
    if (( $(echo "$P95 > 500" | bc -l) )); then
        error "❌ SLO VIOLATION: P95 latency ${P95}ms exceeds 500ms threshold"
        SLO_PASS=false
    else
        log "✅ SLO PASS: P95 latency ${P95}ms < 500ms"
    fi
    
    if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
        error "❌ SLO VIOLATION: Error rate $(echo "$ERROR_RATE * 100" | bc)% exceeds 1% threshold"
        SLO_PASS=false
    else
        log "✅ SLO PASS: Error rate $(echo "$ERROR_RATE * 100" | bc)% < 1%"
    fi
    
    if [ "$SLO_PASS" = false ]; then
        error "Load test FAILED SLO requirements"
        exit 1
    fi
fi

# Collect system metrics during test
log ""
log "Collecting system metrics..."

kubectl top nodes > "$RESULTS_DIR/node-metrics.txt"
kubectl top pods -A > "$RESULTS_DIR/pod-metrics.txt"
kubectl get events -A --sort-by='.lastTimestamp' | tail -50 > "$RESULTS_DIR/k8s-events.txt"

# Export Prometheus metrics
PROM_URL="http://prometheus.platform-observability:9090"
kubectl port-forward -n platform-observability svc/prometheus-kube-prometheus-prometheus 9090:9090 &
PROM_PID=$!
sleep 3

# Query error rate during test
curl -s "${PROM_URL}/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" \
    > "$RESULTS_DIR/error-rate.json"

# Query latency percentiles
curl -s "${PROM_URL}/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" \
    > "$RESULTS_DIR/latency-p95.json"

kill $PROM_PID 2>/dev/null || true

log "✓ System metrics collected"

# Generate HTML report
log ""
log "Generating HTML report..."

cat > "$RESULTS_DIR/report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
    <h1>Load Test Report</h1>
    <h2>Summary</h2>
    <pre id="summary"></pre>
    
    <script>
        fetch('summary.json')
            .then(r => r.json())
            .then(data => {
                document.getElementById('summary').textContent = JSON.stringify(data, null, 2);
            });
    </script>
</body>
</html>
EOF

log "✓ HTML report generated: $RESULTS_DIR/report.html"

# Archive results
log ""
log "Archiving results..."
tar -czf "$RESULTS_DIR.tar.gz" "$RESULTS_DIR"
log "✓ Results archived: $RESULTS_DIR.tar.gz"

log ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    log "✅ Load test PASSED"
else
    error "❌ Load test FAILED"
fi

exit $TEST_EXIT_CODE

