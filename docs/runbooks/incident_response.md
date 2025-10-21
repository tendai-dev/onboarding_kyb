# Incident Response Runbook

## Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| **P0 - Critical** | < 15 minutes | Complete service outage, data breach, security compromise |
| **P1 - High** | < 1 hour | Partial outage, degraded performance affecting >50% users |
| **P2 - Medium** | < 4 hours | Single service issue, affecting <50% users |
| **P3 - Low** | < 1 day | Minor bugs, cosmetic issues |

## Incident Response Process

### 1. Detection & Alert

**Monitoring Channels:**
- Prometheus Alertmanager → Slack `#alerts`
- Grafana dashboards: https://grafana.yourdomain.tld
- Sentry error tracking
- User reports → Support ticket system

**On-Call Rotation:**
```bash
# Check who's on-call
curl https://pagerduty.com/api/oncalls

# Or check calendar
open https://calendar.google.com/oncall-schedule
```

### 2. Initial Assessment (5 minutes)

```bash
# SSH to server
ssh root@<vps-ip>

# Check cluster health
kubectl get nodes
kubectl get pods -A | grep -v Running

# Check service status
kubectl top nodes
kubectl top pods -A

# Check recent events
kubectl get events -A --sort-by='.lastTimestamp' | head -20

# Check Grafana for RED metrics
# Rate, Errors, Duration
open https://grafana.yourdomain.tld/d/service-red-metrics
```

**Quick Checks:**
```bash
# API Gateway health
curl -f https://api.yourdomain.tld/health || echo "API DOWN"

# Database connectivity
kubectl exec -n platform-observability deployment/postgresql -- psql -U onboarding_user -c "SELECT 1"

# Redis connectivity
kubectl exec -n platform-observability deployment/redis-master -- redis-cli PING

# Kafka health
kubectl exec -n platform-observability kafka-0 -- kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

### 3. Communication

**Slack Incident Channel:**
```
# Create incident channel
/incident create "API 500 errors spike"

# Post initial update
Status: Investigating
Severity: P1
Impact: 500 errors on /onboarding/v1/cases endpoint
Started: 2025-10-21 14:30 UTC
Owner: @oncall-engineer
```

**Status Page:**
```bash
# Update status page
curl -X POST https://status.yourdomain.tld/api/incidents \
  -H "Authorization: Bearer $STATUS_PAGE_TOKEN" \
  -d '{
    "name": "API Issues",
    "status": "investigating",
    "message": "We are investigating increased error rates."
  }'
```

### 4. Diagnosis

**Check Logs:**
```bash
# Application logs
kubectl logs -n business-onboarding deployment/onboarding-api --tail=100

# Follow logs in real-time
kubectl logs -n business-onboarding deployment/onboarding-api -f

# Search Elasticsearch
curl -X GET "elasticsearch-master.platform-observability:9200/fluentbit-*/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "bool": {
        "must": [
          {"match": {"level": "ERROR"}},
          {"range": {"@timestamp": {"gte": "now-1h"}}}
        ]
      }
    },
    "sort": [{"@timestamp": "desc"}],
    "size": 100
  }'
```

**Check Metrics:**
```bash
# Query Prometheus
curl -X GET "prometheus.platform-observability:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])"

# Check error rate
# If > 1%, investigate further
```

**Database Issues:**
```bash
# Check connections
kubectl exec -n platform-observability deployment/postgresql -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
kubectl exec -n platform-observability deployment/postgresql -- \
  psql -U postgres -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds';"

# Check locks
kubectl exec -n platform-observability deployment/postgresql -- \
  psql -U postgres -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

**Kafka Issues:**
```bash
# Check consumer lag
kubectl exec -n platform-observability kafka-0 -- \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 --all-groups --describe

# Check topic health
kubectl exec -n platform-observability kafka-0 -- \
  kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### 5. Mitigation

**Quick Fixes:**

```bash
# Restart failing pods
kubectl rollout restart deployment/onboarding-api -n business-onboarding

# Scale up if resource constrained
kubectl scale deployment/onboarding-api -n business-onboarding --replicas=5

# Rollback recent deployment
kubectl rollout undo deployment/onboarding-api -n business-onboarding

# Check rollback status
kubectl rollout status deployment/onboarding-api -n business-onboarding
```

**Circuit Breaker:**
```bash
# If external dependency failing, enable circuit breaker
kubectl set env deployment/onboarding-api -n business-onboarding \
  CIRCUIT_BREAKER_ENABLED=true \
  CIRCUIT_BREAKER_THRESHOLD=5
```

**Rate Limiting:**
```bash
# Increase rate limits if legitimate traffic spike
kubectl edit configmap ingress-nginx-controller -n platform-ingress
# Update: limit-rps: "200"
kubectl rollout restart deployment/ingress-nginx-controller -n platform-ingress
```

### 6. Resolution

**Verify Fix:**
```bash
# Check error rate dropped
watch -n 5 'curl -s "prometheus.platform-observability:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" | jq'

# Check pod status
kubectl get pods -n business-onboarding

# Run smoke tests
cd /root/onboarding_kyc
./scripts/smoke-tests.sh
```

**Update Status:**
```
# Slack
Status: Resolved
Severity: P1
Root Cause: Database connection pool exhaustion
Resolution: Increased connection pool size from 20 to 50
Duration: 45 minutes
Next Steps: Post-mortem scheduled for tomorrow

# Status page
curl -X PATCH https://status.yourdomain.tld/api/incidents/$INCIDENT_ID \
  -d '{"status": "resolved", "message": "Issue has been resolved."}'
```

### 7. Post-Incident

**Post-Mortem Template:**
```markdown
# Incident Post-Mortem: [Title]

**Date:** 2025-10-21
**Severity:** P1
**Duration:** 45 minutes
**Owner:** @engineer

## Summary
Brief description of what happened.

## Timeline
- 14:30 UTC: Alert triggered
- 14:35 UTC: Incident acknowledged
- 14:45 UTC: Root cause identified
- 15:15 UTC: Fix deployed
- 15:20 UTC: Verified resolution

## Root Cause
Database connection pool exhausted due to long-running queries.

## Impact
- 500 errors on /onboarding/v1/cases endpoint
- ~1000 failed requests
- 3 customers reported issues

## Resolution
- Increased connection pool size from 20 to 50
- Added query timeout of 30 seconds
- Killed long-running queries

## Action Items
- [ ] Add monitoring for connection pool usage
- [ ] Review and optimize slow queries
- [ ] Update capacity planning docs
- [ ] Add automated scaling for DB connections

## Lessons Learned
- Connection pool size was too small for production load
- Need better visibility into database metrics
```

## Common Issues & Solutions

### 1. High CPU Usage

```bash
# Identify hot pods
kubectl top pods -A --sort-by=cpu

# Get detailed metrics
kubectl exec <pod> -- top

# Check for CPU throttling
kubectl describe pod <pod> | grep -i throttle

# Solution: Scale up or optimize code
kubectl scale deployment/<name> --replicas=5
```

### 2. Out of Memory

```bash
# Check memory usage
kubectl top pods -A --sort-by=memory

# Check OOMKilled pods
kubectl get pods -A | grep OOMKilled

# View pod events
kubectl describe pod <pod>

# Solution: Increase memory limits
kubectl set resources deployment/<name> --limits=memory=1Gi
```

### 3. Database Connection Errors

```bash
# Check connection count
kubectl exec -n platform-observability deployment/postgresql -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
kubectl exec -n platform-observability deployment/postgresql -- \
  psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '30 minutes';"

# Increase max connections (temporary)
kubectl exec -n platform-observability deployment/postgresql -- \
  psql -U postgres -c "ALTER SYSTEM SET max_connections = 200;"
kubectl rollout restart statefulset/postgresql -n platform-observability
```

### 4. Disk Space Issues

```bash
# Check disk usage
df -h

# Find large files
du -h / | sort -rh | head -20

# Clean up old logs
find /var/log -name "*.gz" -mtime +30 -delete

# Clean up old Docker images
docker system prune -a --volumes -f

# Extend PVC (if needed)
kubectl edit pvc <pvc-name> -n <namespace>
# Increase storage size, then apply
```

### 5. Certificate Expiry

```bash
# Check certificate expiration
kubectl get certificates -A

# View certificate details
kubectl describe certificate <cert-name> -n <namespace>

# Force renewal
kubectl delete certificate <cert-name> -n <namespace>
# cert-manager will automatically recreate

# Check cert-manager logs
kubectl logs -n platform-security deployment/cert-manager -f
```

## Emergency Contacts

| Role | Name | Slack | Phone | Backup |
|------|------|-------|-------|--------|
| On-Call Engineer | Rotation | @oncall | PagerDuty | @backup-oncall |
| Platform Lead | - | @platform-lead | - | @platform-backup |
| Security Lead | - | @security-lead | - | - |
| CTO | - | @cto | Emergency only | - |

## Escalation Path

1. **On-Call Engineer** (0-15 min)
2. **Platform Lead** (15-30 min if not resolved)
3. **CTO** (30+ min or security incident)

## Tools & Links

- **Grafana**: https://grafana.yourdomain.tld
- **Prometheus**: https://prometheus.yourdomain.tld  
- **Kibana**: https://kibana.yourdomain.tld
- **Status Page**: https://status.yourdomain.tld
- **PagerDuty**: https://pagerduty.com
- **Runbooks**: https://wiki.yourdomain.tld/runbooks
- **VPS Access**: `ssh root@<vps-ip>`

