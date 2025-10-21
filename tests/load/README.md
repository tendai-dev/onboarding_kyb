# Load Testing with k6

## Installation

```bash
# Install k6
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

Or using Docker:
```bash
docker pull grafana/k6:latest
```

## Test Scenarios

### 1. Smoke Test (1 user, 1 minute)
Verify basic functionality works

```bash
k6 run k6-load-tests.js --env SCENARIO=smoke
```

**Criteria:**
- All requests succeed (0% error rate)
- P95 latency < 500ms

### 2. Load Test (10 users, 9 minutes)
Simulate normal production load

```bash
k6 run k6-load-tests.js --env SCENARIO=load \
  --env API_BASE_URL=https://api.yourdomain.tld \
  --env TEST_USER_PASSWORD=<password>
```

**Criteria:**
- Error rate < 1%
- P95 latency < 500ms
- P99 latency < 1000ms

### 3. Stress Test (100 users, 21 minutes)
Find the breaking point

```bash
k6 run k6-load-tests.js --env SCENARIO=stress
```

**Observe:**
- When does P95 exceed 500ms?
- When does error rate spike?
- System resource usage (CPU, memory, connections)

### 4. Spike Test (instant 100 users)
Test handling of sudden traffic surge

```bash
k6 run k6-load-tests.js --env SCENARIO=spike
```

**Criteria:**
- System recovers after spike
- No cascading failures
- Circuit breakers activate appropriately

### 5. Soak Test (20 users, 30 minutes)
Test for memory leaks and degradation over time

```bash
k6 run k6-load-tests.js --env SCENARIO=soak
```

**Observe:**
- Memory usage over time (should be stable)
- Response time degradation
- Database connection pool behavior

## Running with Docker

```bash
docker run --rm -i grafana/k6:latest run - < k6-load-tests.js
```

## CI/CD Integration

Add to GitHub Actions:

```yaml
# .github/workflows/load-test.yml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/k6-load-tests.js
          flags: --env SCENARIO=load
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: summary.json
      
      - name: Check thresholds
        run: |
          if grep -q "FAIL" summary.json; then
            echo "Load test failed SLO thresholds!"
            exit 1
          fi
```

## Interpreting Results

### Good Results
```
✓ P95 < 500ms: PASS
✓ Error rate < 1%: PASS
✓ http_req_duration: p(95)<500ms
✓ cases_created: 1000+
```

### Warning Signs
```
⚠ P95 approaching 500ms (400-500ms range)
⚠ Error rate 0.5-1%
⚠ Increasing trend in response times
⚠ Memory usage growing over time (soak test)
```

### Critical Issues
```
✗ P95 > 500ms
✗ Error rate > 1%
✗ Database connection pool exhausted
✗ Circuit breakers opening
✗ Pod OOMKilled or CPU throttled
```

## Monitoring During Tests

**Watch Grafana:**
```bash
open https://grafana.yourdomain.tld/d/service-red-metrics
```

**Watch Prometheus:**
```bash
# Error rate
watch -n 1 'curl -s "prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[1m])" | jq'

# Request rate
watch -n 1 'curl -s "prometheus:9090/api/v1/query?query=rate(http_requests_total[1m])" | jq'
```

**Watch Pods:**
```bash
watch kubectl top pods -n business-onboarding
```

## Custom Scenarios

### Test Specific Endpoint

```javascript
// k6-document-upload-test.js
export default function() {
  // 1. Get presigned URL
  const presignResponse = http.post(`${BASE_URL}/documents/v1/presign`, ...);
  
  // 2. Upload file to MinIO
  const uploadResponse = http.put(presignResponse.upload_url, fileData);
  
  // 3. Confirm upload
  const confirmResponse = http.post(`${BASE_URL}/documents/v1/confirm`, ...);
  
  check(confirmResponse, {
    'document uploaded': (r) => r.status === 201,
    'virus scan triggered': (r) => JSON.parse(r.body).status === 'VirusScanning',
  });
}
```

### Test Idempotency

```javascript
export default function() {
  const idempotencyKey = uuidv4();
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
    }
  };
  
  // Send same request twice
  const response1 = http.post(`${BASE_URL}/onboarding/v1/cases`, payload, params);
  const response2 = http.post(`${BASE_URL}/onboarding/v1/cases`, payload, params);
  
  check(response1, { 'first request: 201': (r) => r.status === 201 });
  check(response2, { 'second request: 201 (cached)': (r) => r.status === 201 });
  
  // Verify same case ID returned
  const body1 = JSON.parse(response1.body);
  const body2 = JSON.parse(response2.body);
  check(body1, {
    'idempotency works': () => body1.data.id === body2.data.id,
  });
}
```

## Performance Baselines

Based on infrastructure (4 vCPU, 8GB RAM):

| Scenario | VUs | RPS | P95 Latency | Error Rate |
|----------|-----|-----|-------------|------------|
| Smoke | 1 | ~10 | <200ms | 0% |
| Load | 10 | ~100 | <500ms | <1% |
| Stress | 50 | ~500 | <1000ms | <5% |
| Soak | 20 | ~200 | <500ms | <1% |

## Troubleshooting

### High Latency
- Check database connection pool
- Check for N+1 queries
- Verify indexes exist
- Check CPU/memory usage

### High Error Rate
- Check application logs
- Check database connectivity
- Check circuit breaker state
- Check rate limiting configuration

### Resource Exhaustion
- Scale up pods: `kubectl scale deployment/onboarding-api --replicas=5`
- Increase resource limits
- Optimize queries
- Add caching

## References

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [Grafana k6 Cloud](https://grafana.com/products/cloud/k6/)

