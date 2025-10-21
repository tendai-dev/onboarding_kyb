# ⚡ Quick Reference Guide

## Common Commands

### Deployment
```bash
# Deploy everything
cd /root/onboarding_kyc/infra/k3s-single-vps && make up

# Deploy with safety checks
./scripts/deploy.sh dev

# Check status
make status

# Rollback
kubectl rollout undo deployment/onboarding-api -n business-onboarding
```

### Monitoring
```bash
# View logs
kubectl logs -n business-onboarding deployment/onboarding-api -f

# Check metrics
open https://grafana.yourdomain.tld

# View pod resources
kubectl top pods -A

# Check events
kubectl get events -A --sort-by='.lastTimestamp' | head -20
```

### DLQ Management
```bash
# List DLQs
./tools/dlq-manager/dlq-cli.sh list

# View messages
./tools/dlq-manager/dlq-cli.sh view dlq.onboarding.domain-events

# Replay messages
./tools/dlq-manager/dlq-cli.sh replay dlq.onboarding.domain-events

# Purge DLQ
./tools/dlq-manager/dlq-cli.sh purge dlq.onboarding.domain-events
```

### Testing
```bash
# Smoke tests
./scripts/smoke-tests.sh

# Load tests
./tests/load/run-load-tests.sh load

# Contract tests
cd tests/contract && npm test

# Unit tests
cd services/onboarding-api && dotnet test
```

### Troubleshooting
```bash
# Check pod logs
kubectl logs -n <namespace> <pod-name>

# Describe pod (see events)
kubectl describe pod <pod-name> -n <namespace>

# Exec into pod
kubectl exec -it <pod-name> -n <namespace> -- /bin/bash

# Check database
kubectl exec -n platform-observability postgresql-0 -- \
  psql -U onboarding_user -d onboarding -c "SELECT COUNT(*) FROM onboarding.onboarding_cases;"

# Check Redis
kubectl exec -n platform-observability redis-master-0 -- redis-cli PING

# Check Kafka topics
kubectl exec -n platform-observability kafka-0 -- \
  kafka-topics.sh --bootstrap-server localhost:9092 --list
```

---

## 📍 Important URLs

| Service | URL |
|---------|-----|
| API Base | https://api.yourdomain.tld |
| Swagger | https://api.yourdomain.tld/onboarding/v1/swagger |
| Keycloak | https://keycloak.yourdomain.tld |
| Grafana | https://grafana.yourdomain.tld |
| MinIO | https://minio-console.yourdomain.tld |

---

## 🔑 Default Credentials (CHANGE IN PRODUCTION!)

See `infra/helm/values/dev.yaml` for all passwords.

**First thing to do:** Update all passwords!

```bash
# Generate strong password
openssl rand -base64 32
```

---

## 🚨 Emergency Procedures

### System Down
1. Check Grafana dashboards
2. Review recent deployments: `kubectl rollout history deployment/<name>`
3. Rollback if needed: `kubectl rollout undo deployment/<name>`
4. Check logs: `kubectl logs -n <namespace> deployment/<name>`
5. Follow [Incident Response Runbook](docs/runbooks/incident_response.md)

### High Error Rate
1. Check Prometheus: Error rate metrics
2. View logs in Elasticsearch
3. Check circuit breaker status
4. Scale up if resource issue: `kubectl scale deployment/<name> --replicas=5`
5. Rollback if recent deployment

### Certificate Issues
1. Check status: `kubectl get certificates -A`
2. Describe: `kubectl describe certificate <name>`
3. Force renewal: `kubectl delete certificate <name>`
4. Check cert-manager logs

---

## 📊 SLO Dashboard Quick Check

```bash
# Current error rate
curl -s "prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" | jq

# P95 latency
curl -s "prometheus:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" | jq

# Queue lag
./tools/dlq-manager/dlq-cli.sh list
```

---

## 🔄 Key Rotation Schedule

| Component | Frequency | Command |
|-----------|-----------|---------|
| Keycloak Client Secrets | 90 days | Manual (see runbook) |
| Webhook Secrets | 90 days | Manual per partner |
| Database Passwords | 180 days | `./scripts/key-rotation-automation.sh` |
| MinIO Keys | 90 days | Auto or manual |
| TLS Certificates | Auto | cert-manager |

Run automation: `./scripts/key-rotation-automation.sh`

---

## 📞 Who to Contact

| Issue | Contact |
|-------|---------|
| Service Down | On-Call (PagerDuty) |
| Security Incident | security@yourdomain.tld |
| API Questions | platform@yourdomain.tld |
| Partner Support | support@yourdomain.tld |

---

## ⚡ Quick Wins

### Add New Service
```bash
# Use template (coming soon)
./templates/generate-service.sh my-service

# Or copy existing
cp -r services/onboarding-api services/my-service
# Update names and logic
```

### Add New API Endpoint
1. Update `openapi.yaml`
2. Run Spectral lint: `spectral lint openapi.yaml`
3. Implement command/query handler
4. Add controller method
5. Write tests
6. Deploy

### Configure New Partner
1. Login to Keycloak
2. Create user with `partner` role
3. Set `partner_id` attribute
4. Generate webhook secret
5. Provide credentials to partner

---

## 🎓 Learning Path

**Day 1:** Deploy platform, explore APIs  
**Day 2:** Review architecture docs, understand Clean/Hex + CQRS  
**Day 3:** Build new endpoint, run tests  
**Week 2:** Implement new service using template  
**Week 3:** Configure monitoring, practice incident response  
**Week 4:** Production deployment, go-live!

---

**Everything you need. Nothing you don't. Production-ready!** ✅

