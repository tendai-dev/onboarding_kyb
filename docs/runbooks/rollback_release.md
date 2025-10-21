# Rollback Release Runbook

## When to Rollback

**Rollback immediately if:**
- Critical bugs affecting >50% of users
- Data corruption or loss
- Security vulnerability introduced
- P95 latency > 2000ms
- Error rate > 5%
- Cannot be fixed forward in < 30 minutes

## Rollback Methods

### Method 1: Kubernetes Rollout Undo (Fastest)

**Use when:** Last deployment broke, need immediate rollback

```bash
# Rollback specific service
kubectl rollout undo deployment/onboarding-api -n business-onboarding

# Verify rollback
kubectl rollout status deployment/onboarding-api -n business-onboarding

# Check revision history
kubectl rollout history deployment/onboarding-api -n business-onboarding

# Rollback to specific revision
kubectl rollout undo deployment/onboarding-api -n business-onboarding --to-revision=3
```

**Time:** 2-5 minutes

### Method 2: Helmfile with Previous Image Tags

**Use when:** Need to rollback multiple services or specific version

```bash
# SSH to VPS
ssh root@<vps-ip>

cd /root/onboarding_kyc/infra/helm

# Check current version
helm list -A | grep onboarding-api

# Update values to previous image tag
vi values/dev.yaml
# Change: tag: "sha-abc123" to previous working SHA

# Deploy previous version
helmfile sync --environment dev

# Or rollback specific service
helm rollback onboarding-api -n business-onboarding
```

**Time:** 5-10 minutes

### Method 3: Git Revert + Redeploy

**Use when:** Need clean revert in Git history

```bash
# Find commit to revert
git log --oneline

# Revert bad commit
git revert <bad-commit-sha>

# Push revert
git push origin main

# Wait for CI/CD to deploy
# Or manually trigger: gh workflow run deploy_dev.yml
```

**Time:** 10-20 minutes (includes CI/CD)

## Step-by-Step Rollback Procedure

### 1. Declare Incident (< 2 minutes)

```bash
# Create Slack incident channel
/incident create "Rollback: Bad deployment v1.2.3"

# Update status page
curl -X POST https://status.yourdomain.tld/api/incidents \
  -H "Authorization: Bearer $STATUS_TOKEN" \
  -d '{
    "name": "Service Issues - Rolling Back",
    "status": "investigating",
    "message": "We identified an issue and are rolling back to previous version."
  }'
```

### 2. Identify Target Version (< 3 minutes)

```bash
# Check deployment history
kubectl rollout history deployment/onboarding-api -n business-onboarding

# Or check Helm releases
helm history onboarding-api -n business-onboarding

# Identify last known good version
# Check Grafana for when errors started
open https://grafana.yourdomain.tld/d/service-red-metrics
```

### 3. Execute Rollback (< 5 minutes)

**For Single Service:**
```bash
# Quick rollback
kubectl rollout undo deployment/onboarding-api -n business-onboarding

# Wait for rollout
kubectl rollout status deployment/onboarding-api -n business-onboarding --timeout=5m
```

**For Multiple Services:**
```bash
# Rollback all business services
for svc in onboarding-api document-service checklist-service \
           risk-service notification-service webhook-dispatcher \
           auditlog-service projections-api; do
  echo "Rolling back $svc..."
  kubectl rollout undo deployment/$svc -n business-${svc%-*} || true
done

# Or use Helmfile with previous values
cd /root/onboarding_kyc/infra/helm
git checkout <previous-commit> values/dev.yaml
helmfile sync --environment dev
```

### 4. Verify Rollback (< 5 minutes)

```bash
# Check pods are running
kubectl get pods -A -l tier=business

# Check error rate
watch -n 5 'curl -s "prometheus.platform-observability:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" | jq'

# Run smoke tests
cd /root/onboarding_kyc
./scripts/smoke-tests.sh

# Check specific endpoints
curl -f https://api.yourdomain.tld/onboarding/v1/health/live
curl -f https://api.yourdomain.tld/onboarding/v1/health/ready
```

### 5. Monitor Metrics (< 10 minutes)

**Check Key Metrics:**
```bash
# Error rate (should be < 1%)
# P95 latency (should be < 500ms)
# Request rate (should be normal)
# Pod restarts (should be 0)
```

**Grafana Dashboards:**
- Service RED Metrics
- Database connections
- Cache hit rates
- Message broker lag

### 6. Update Status (< 2 minutes)

```bash
# Slack update
Status: Resolved via Rollback
Rolled back to: v1.2.2 (commit abc123)
Services affected: onboarding-api
Current status: All metrics normal
Next steps: Root cause analysis

# Status page
curl -X PATCH https://status.yourdomain.tld/api/incidents/$INCIDENT_ID \
  -d '{
    "status": "resolved",
    "message": "Issue resolved by rolling back to previous version."
  }'
```

### 7. Post-Rollback Actions (< 30 minutes)

```bash
# Tag the bad release
git tag -a v1.2.3-broken -m "Rolled back due to high error rate"
git push --tags

# Create incident ticket
# Document what went wrong
# Schedule post-mortem

# Block deployment of bad version
# Update CI/CD to prevent redeployment
```

## Rollback Checklist

- [ ] Incident declared and communicated
- [ ] Target version identified
- [ ] Rollback executed (kubectl/helm)
- [ ] Pods are Running
- [ ] Error rate < 1%
- [ ] P95 latency < 500ms
- [ ] Smoke tests pass
- [ ] Status page updated
- [ ] Team notified
- [ ] Bad version tagged/blocked
- [ ] Post-mortem scheduled

## Service-Specific Rollback Notes

### onboarding-api
- **Database migrations:** Check if migration needs rollback
- **Events:** May have published new event types
- **Dependencies:** Check if other services depend on new endpoints

### document-service  
- **MinIO:** Check if new bucket structure was created
- **Files:** Ensure presigned URLs still work

### webhook-dispatcher
- **Webhook format:** Partners may have received new format
- **Signatures:** Verify HMAC signatures still valid

## Database Migration Rollback

If database migration was part of deployment:

```bash
# Connect to database
kubectl exec -it -n platform-observability postgresql-0 -- psql -U onboarding_user -d onboarding

# Check migration history
SELECT * FROM __EFMigrationsHistory ORDER BY applied DESC LIMIT 5;

# Manual rollback (if needed)
# Run down migration script
BEGIN;
-- Migration rollback SQL here
COMMIT;

# Update migration history
DELETE FROM __EFMigrationsHistory WHERE migration_id = 'xxx';
```

**⚠️ CAUTION:** Only rollback migrations if absolutely necessary. Consider data loss implications.

## Communication Templates

### Slack Announcement
```
@here We've rolled back the deployment due to [issue].

Current status: ✅ Resolved
Rolled back to: v1.2.2
Error rate: 0.1% (was 5%)
Latency P95: 250ms (was 1500ms)

All services are now stable. We'll conduct a post-mortem tomorrow.
```

### Email to Stakeholders
```
Subject: [RESOLVED] Platform Rollback - [Service Name]

Hi team,

We experienced issues with today's deployment and have successfully rolled back to the previous stable version.

Timeline:
- 14:30 UTC: Deployment completed
- 14:35 UTC: High error rate detected
- 14:40 UTC: Rollback initiated
- 14:45 UTC: Rollback completed
- 14:50 UTC: Metrics returned to normal

Impact:
- Duration: 20 minutes
- Affected: [Service names]
- User impact: Some users may have experienced errors

Current Status: ✅ Resolved
All systems operating normally.

Next Steps:
- Root cause analysis scheduled for [date]
- Will implement additional testing before next deployment

[Your Name]
```

## Prevention Strategies

To reduce rollback frequency:

1. **Better Testing**
   - Add integration tests
   - Load testing before production
   - Canary deployments

2. **Progressive Rollout**
   - Deploy to 10% of pods first
   - Monitor for 30 minutes
   - Gradually increase to 100%

3. **Feature Flags**
   - Hide new features behind flags
   - Enable gradually
   - Quick disable if issues

4. **Automated Rollback**
   - Monitor error rate continuously
   - Auto-rollback if error rate > 3%
   - Alert team when auto-rollback happens

## Rollback Decision Matrix

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 5% | Rollback immediately |
| Error rate | 2-5% | Consider rollback, investigate |
| Error rate | 1-2% | Monitor closely |
| P95 latency | > 2000ms | Rollback immediately |
| P95 latency | 1000-2000ms | Consider rollback |
| P95 latency | 500-1000ms | Monitor closely |
| Pod crashes | > 3 in 5 min | Rollback immediately |
| User reports | > 10 in 5 min | Investigate, possible rollback |

## Emergency Contacts

| Role | Contact |
|------|---------|
| On-Call Engineer | @oncall (PagerDuty) |
| Platform Lead | @platform-lead |
| CTO | @cto (P0 incidents only) |

## Post-Rollback

After successful rollback:

1. ✅ Verify all metrics normal
2. ✅ Run full smoke test suite
3. ✅ Update status page
4. ✅ Notify stakeholders
5. ✅ Schedule post-mortem
6. ✅ Document lessons learned
7. ✅ Fix root cause before next deployment
8. ✅ Add tests to prevent recurrence

**Remember:** Rollback is not failure—it's protection. Better to rollback quickly than debug in production.

