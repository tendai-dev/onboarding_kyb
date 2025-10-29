# KYC Platform Incident Response Guide

## Overview

This guide provides step-by-step procedures for responding to incidents in the KYC Platform. All service names have been updated to follow the new naming convention.

## Service Names Reference

| Old Name | New Name | Port | Description |
|----------|----------|------|-------------|
| `onboarding-api` | `kyc-onboarding-api` | 8081 | Main onboarding API |
| `document-service` | `kyc-document-api` | 8082 | Document management |
| `risk-service` | `kyc-risk-api` | 8083 | Risk assessment |
| `notification-service` | `kyc-notification-api` | 8085 | Notifications |
| `checklist-service` | `kyc-checklist-api` | 8086 | Compliance checklists |
| `messaging-service` | `kyc-messaging-api` | 8087 | Internal messaging |
| `auditlog-service` | `kyc-audit-api` | 8088 | Audit logging |
| `webhook-dispatcher` | `kyc-webhook-handler` | 8089 | Webhook processing |
| `projections-api` | `kyc-projections-api` | 8090 | Read models |
| `work-queue-service` | `kyc-work-queue-worker` | 8091 | Background jobs |

## Incident Severity Levels

### P1 - Critical
- Complete service outage
- Data loss or corruption
- Security breach
- Customer-facing functionality down

### P2 - High
- Partial service degradation
- Performance issues affecting users
- Non-critical functionality down

### P3 - Medium
- Minor performance issues
- Non-user-facing problems
- Cosmetic issues

### P4 - Low
- Documentation issues
- Enhancement requests
- Non-urgent bugs

## Initial Response

### 1. Acknowledge the Incident
- Respond to alert within 5 minutes (P1/P2)
- Update incident status in monitoring system
- Notify stakeholders if P1/P2

### 2. Assess Impact
- Check service health endpoints
- Review monitoring dashboards
- Identify affected users/systems

### 3. Escalate if Needed
- P1: Escalate to senior team members immediately
- P2: Escalate if not resolved in 30 minutes
- P3/P4: Follow normal escalation procedures

## Service-Specific Troubleshooting

### kyc-onboarding-api Issues

#### Symptoms
- 5xx errors on onboarding endpoints
- High response times
- Circuit breaker open alerts

#### Troubleshooting Steps
1. Check service health: `curl http://localhost:8081/health`
2. Review logs: `kubectl logs -f deployment/kyc-onboarding-api -n business-onboarding`
3. Check database connectivity
4. Verify KeyCloak authentication
5. Check Kafka connectivity

#### Common Fixes
- Restart pods: `kubectl rollout restart deployment/kyc-onboarding-api -n business-onboarding`
- Scale up: `kubectl scale deployment kyc-onboarding-api --replicas=3 -n business-onboarding`
- Check resource limits

### kyc-document-api Issues

#### Symptoms
- Document upload failures
- Storage connectivity errors
- Virus scanning failures

#### Troubleshooting Steps
1. Check MinIO connectivity
2. Verify ClamAV service
3. Check file size limits
4. Review storage quotas

### kyc-risk-api Issues

#### Symptoms
- Risk assessment failures
- External API timeouts
- Scoring calculation errors

#### Troubleshooting Steps
1. Check external API connectivity
2. Verify risk model configuration
3. Review scoring thresholds
4. Check database performance

### kyc-notification-api Issues

#### Symptoms
- Email/SMS delivery failures
- Template rendering errors
- Queue processing delays

#### Troubleshooting Steps
1. Check SMTP/SMS provider connectivity
2. Verify template configuration
3. Review queue processing
4. Check rate limits

## Monitoring Commands

### Service Health Checks
```bash
# Check all KYC services
for service in kyc-onboarding-api kyc-document-api kyc-risk-api kyc-notification-api kyc-checklist-api kyc-messaging-api kyc-audit-api kyc-webhook-handler kyc-projections-api kyc-work-queue-worker; do
  echo "Checking $service..."
  kubectl get pods -l app=$service -n business-onboarding
done
```

### Log Analysis
```bash
# Get recent logs for a service
kubectl logs -f deployment/kyc-onboarding-api -n business-onboarding --tail=100

# Search for errors
kubectl logs deployment/kyc-onboarding-api -n business-onboarding | grep -i error

# Check specific time range
kubectl logs deployment/kyc-onboarding-api -n business-onboarding --since=1h
```

### Metrics Queries
```bash
# Check service availability
curl "http://prometheus:9090/api/v1/query?query=up{job=~\"kyc-.*\"}"

# Check error rates
curl "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{service=~\"kyc-.*\",status=~\"5..\"}[5m])"

# Check response times
curl "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket{service=~\"kyc-.*\"}[5m]))"
```

## Recovery Procedures

### Service Restart
```bash
# Restart specific service
kubectl rollout restart deployment/kyc-onboarding-api -n business-onboarding

# Check rollout status
kubectl rollout status deployment/kyc-onboarding-api -n business-onboarding

# Rollback if needed
kubectl rollout undo deployment/kyc-onboarding-api -n business-onboarding
```

### Database Recovery
```bash
# Check database connectivity
kubectl exec -it postgresql-0 -n platform-observability -- psql -U postgres -c "SELECT 1"

# Check connection pools
kubectl exec -it postgresql-0 -n platform-observability -- psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

### Message Queue Recovery
```bash
# Check Kafka topics
kubectl exec -it kafka-0 -n platform-observability -- kafka-topics --list --bootstrap-server localhost:9092

# Check consumer lag
kubectl exec -it kafka-0 -n platform-observability -- kafka-consumer-groups --bootstrap-server localhost:9092 --list
```

## Communication Templates

### Incident Notification
```
🚨 INCIDENT ALERT
Service: kyc-onboarding-api
Severity: P1/P2/P3/P4
Status: Investigating/Identified/Monitoring/Resolved
Impact: [Description of impact]
ETA: [Estimated resolution time]
```

### Status Update
```
📊 INCIDENT UPDATE
Service: kyc-onboarding-api
Status: [Current status]
Progress: [What's been done]
Next Steps: [What's planned]
ETA: [Updated resolution time]
```

### Resolution
```
✅ INCIDENT RESOLVED
Service: kyc-onboarding-api
Root Cause: [Brief description]
Resolution: [What was done]
Prevention: [Steps to prevent recurrence]
```

## Post-Incident

### 1. Post-Mortem
- Schedule within 48 hours for P1/P2
- Document timeline, root cause, and resolution
- Identify improvement opportunities

### 2. Follow-up Actions
- Implement preventive measures
- Update monitoring and alerting
- Improve documentation
- Conduct team training if needed

### 3. Documentation
- Update runbooks
- Add new troubleshooting procedures
- Update incident response guide

## Emergency Contacts

- **Platform Team Lead**: [Contact Info]
- **On-Call Engineer**: [Contact Info]
- **Security Team**: [Contact Info]
- **Database Team**: [Contact Info]
- **Infrastructure Team**: [Contact Info]

## Escalation Matrix

| Severity | Response Time | Escalation Time | Escalation Target |
|----------|---------------|-----------------|-------------------|
| P1 | 5 minutes | 15 minutes | Platform Team Lead |
| P2 | 15 minutes | 30 minutes | Senior Engineer |
| P3 | 1 hour | 2 hours | Team Lead |
| P4 | 4 hours | 8 hours | Team Lead |

## Resources

- **Monitoring Dashboards**: [Grafana URL]
- **Log Aggregation**: [ELK Stack URL]
- **Alert Management**: [AlertManager URL]
- **Documentation**: [Confluence/Wiki URL]
- **Runbooks**: [Runbook Repository URL]
