# Key & Token Rotation Runbook

## Overview

Regular rotation of secrets, keys, and tokens is critical for security. This runbook covers the rotation procedures for all sensitive credentials in the platform.

## Rotation Schedule

| Component | Rotation Frequency | Owner |
|-----------|-------------------|-------|
| Keycloak Client Secrets | 90 days | Platform Team |
| Webhook Signing Secrets | 90 days | Platform Team |
| Database Passwords | 180 days | DBA/Platform Team |
| Redis Password | 180 days | Platform Team |
| MinIO Access Keys | 90 days | Platform Team |
| Kafka SASL Credentials | 180 days | Platform Team |
| TLS Certificates | Auto-renewed (Let's Encrypt) | cert-manager |
| SSH Keys | 365 days | Security Team |
| Service Account Tokens | 90 days | Platform Team |

## 1. Keycloak Client Secrets

### When to Rotate
- Every 90 days (scheduled)
- After suspected compromise
- When team member with access leaves

### Procedure

```bash
# 1. Access Keycloak admin console
open https://keycloak.yourdomain.tld

# 2. Navigate to: Realm > Clients > onboarding-api > Credentials

# 3. Click "Regenerate Secret"
# Copy new secret

# 4. Update secret in Kubernetes
kubectl create secret generic onboarding-keycloak-secret \
  --from-literal=client-secret='<new-secret>' \
  -n business-onboarding \
  --dry-run=client -o yaml | kubectl apply -f -

# 5. Update deployment to use new secret
kubectl set env deployment/onboarding-api \
  -n business-onboarding \
  KEYCLOAK_CLIENT_SECRET='<new-secret>'

# 6. Verify pods restart successfully
kubectl rollout status deployment/onboarding-api -n business-onboarding

# 7. Test authentication
curl -X POST "https://keycloak.yourdomain.tld/realms/partners/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=onboarding-api" \
  -d "client_secret=<new-secret>"

# 8. Update CI/CD secrets (GitHub/GitLab)
# Settings > Secrets > KEYCLOAK_CLIENT_SECRET

# 9. Document rotation in log
echo "$(date): Rotated Keycloak client secret for onboarding-api" >> /var/log/key-rotation.log
```

**Rollback:** If issues occur, use previous secret from step 4.

## 2. Webhook Signing Secrets

### When to Rotate
- Every 90 days (scheduled)
- After partner reports security concern
- When webhook secret is accidentally exposed

### Procedure

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update in database (partners table)
kubectl exec -n platform-observability postgresql-0 -- \
  psql -U onboarding_user -d onboarding -c \
  "UPDATE partners SET webhook_secret = '$NEW_SECRET' WHERE id = '<partner-id>';"

# 3. Notify partner via secure channel
# Send email with new secret + instructions

# 4. Give partner 48 hours to update their webhook verification

# 5. Monitor webhook delivery success rate
# Check Grafana dashboard for failed webhooks

# 6. After confirmation, disable old secret
```

**Template Email to Partners:**
```
Subject: Webhook Signing Secret Rotation - Action Required

Dear Partner,

As part of our regular security maintenance, we're rotating webhook signing secrets.

Your NEW webhook signing secret:
[NEW_SECRET]

Please update your webhook verification code within 48 hours.

Verification example:
https://docs.yourdomain.tld/webhooks/verification

If you need assistance, contact support@yourdomain.tld

Best regards,
Platform Team
```

## 3. Database Passwords

### When to Rotate
- Every 180 days (scheduled)
- After suspected database breach
- When DBA leaves the team

### Procedure

```bash
# ⚠️  REQUIRES MAINTENANCE WINDOW - Plan ahead!

# 1. Create maintenance announcement
curl -X POST https://status.yourdomain.tld/api/maintenance \
  -d '{"start": "2025-10-21T02:00:00Z", "duration": "30m"}'

# 2. Scale down application pods
kubectl scale deployment --all --replicas=0 -n business-onboarding
kubectl scale deployment --all --replicas=0 -n business-documents
# ... repeat for all business namespaces

# 3. Generate new password
NEW_PASSWORD=$(openssl rand -base64 24)

# 4. Update PostgreSQL password
kubectl exec -n platform-observability postgresql-0 -- \
  psql -U postgres -c \
  "ALTER USER onboarding_user WITH PASSWORD '$NEW_PASSWORD';"

# 5. Update Kubernetes secrets
kubectl create secret generic postgresql-credentials \
  --from-literal=password="$NEW_PASSWORD" \
  -n platform-observability \
  --dry-run=client -o yaml | kubectl apply -f -

# 6. Update application connection strings
kubectl set env deployment/onboarding-api \
  -n business-onboarding \
  "ConnectionStrings__PostgreSQL=Host=postgresql.platform-observability;Database=onboarding;Username=onboarding_user;Password=$NEW_PASSWORD"

# Repeat for all services...

# 7. Scale up application pods
kubectl scale deployment --all --replicas=2 -n business-onboarding
kubectl scale deployment --all --replicas=2 -n business-documents

# 8. Verify connections
kubectl logs -n business-onboarding deployment/onboarding-api | grep -i "database"

# 9. End maintenance
curl -X PATCH https://status.yourdomain.tld/api/maintenance/$MAINT_ID \
  -d '{"status": "completed"}'

# 10. Update values file (encrypted)
# Edit infra/helm/values/dev.yaml with new password (use SOPS)
sops infra/helm/values/dev.yaml
```

**Estimated Downtime:** 15-30 minutes

## 4. Redis Password

### Procedure

```bash
# 1. Scale down application pods (Redis cache, so safe)
kubectl scale deployment --all --replicas=0 -n business-onboarding

# 2. Generate new password
NEW_REDIS_PASSWORD=$(openssl rand -base64 24)

# 3. Update Redis password
kubectl set env statefulset/redis-master \
  -n platform-observability \
  REDIS_PASSWORD="$NEW_REDIS_PASSWORD"

# 4. Wait for Redis to restart
kubectl rollout status statefulset/redis-master -n platform-observability

# 5. Update application connection strings
kubectl set env deployment/onboarding-api \
  -n business-onboarding \
  "ConnectionStrings__Redis=redis.platform-observability:6379,password=$NEW_REDIS_PASSWORD"

# 6. Scale up applications
kubectl scale deployment --all --replicas=2 -n business-onboarding

# 7. Verify
kubectl exec -n platform-observability redis-master-0 -- \
  redis-cli -a "$NEW_REDIS_PASSWORD" PING
```

## 5. MinIO Access Keys

### Procedure

```bash
# 1. Access MinIO console
open https://minio-console.yourdomain.tld

# 2. Navigate to: Access Keys > Create Access Key

# 3. Copy new access key and secret key

# 4. Update Kubernetes secrets
kubectl create secret generic minio-credentials \
  --from-literal=accesskey='<new-access-key>' \
  --from-literal=secretkey='<new-secret-key>' \
  -n platform-observability \
  --dry-run=client -o yaml | kubectl apply -f -

# 5. Update services
kubectl set env deployment/document-service \
  -n business-documents \
  MINIO_ACCESS_KEY='<new-access-key>' \
  MINIO_SECRET_KEY='<new-secret-key>'

# 6. Verify document upload/download still works
./scripts/smoke-tests.sh

# 7. Delete old access key in MinIO console
```

## 6. SSH Keys

### Procedure

```bash
# 1. Generate new SSH key pair
ssh-keygen -t ed25519 -C "deployment@yourdomain.tld" -f ~/.ssh/deploy_key_new

# 2. Add new public key to VPS
ssh-copy-id -i ~/.ssh/deploy_key_new.pub root@<vps-ip>

# 3. Update GitHub Actions secrets
# Settings > Secrets > VPS_SSH_KEY
# Paste contents of ~/.ssh/deploy_key_new

# 4. Test deployment with new key
gh workflow run deploy_dev.yml

# 5. After successful deployment, remove old key from VPS
ssh root@<vps-ip> "sed -i '/<old-key-fingerprint>/d' ~/.ssh/authorized_keys"

# 6. Delete old local key
rm ~/.ssh/deploy_key_old ~/.ssh/deploy_key_old.pub
```

## 7. TLS Certificates

### Auto-Renewal (cert-manager)

**Normally automatic, but if manual intervention needed:**

```bash
# 1. Check certificate status
kubectl get certificates -A

# 2. Check cert-manager logs
kubectl logs -n platform-security deployment/cert-manager -f

# 3. Force renewal (if needed)
kubectl delete certificate api-gateway-tls -n platform-ingress
# cert-manager will automatically recreate

# 4. Check ACME challenge
kubectl get challenges -A

# 5. Verify new certificate
curl -vI https://api.yourdomain.tld 2>&1 | grep -A 5 "Server certificate"
```

### Manual Certificate Rotation (if not using Let's Encrypt)

```bash
# 1. Obtain new certificate from CA

# 2. Create TLS secret
kubectl create secret tls api-gateway-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n platform-ingress \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Ingress controller will automatically pick up new cert

# 4. Verify
openssl s_client -connect api.yourdomain.tld:443 -servername api.yourdomain.tld < /dev/null | openssl x509 -noout -dates
```

## Rotation Checklist Template

Use this checklist for each rotation:

- [ ] Create rotation ticket (Jira/Linear)
- [ ] Schedule maintenance window (if required)
- [ ] Announce maintenance (status page, Slack)
- [ ] Take backup before changes
- [ ] Generate new credentials
- [ ] Update Kubernetes secrets
- [ ] Update application configurations
- [ ] Restart affected services
- [ ] Verify functionality with smoke tests
- [ ] Update documentation
- [ ] Notify affected parties (partners, team)
- [ ] Log rotation in audit log
- [ ] Schedule next rotation
- [ ] Delete old credentials (after grace period)

## Automation

### Automated Rotation Script

```bash
#!/usr/bin/env bash
# auto-rotate-secrets.sh
# Run monthly via cron

SECRETS_TO_ROTATE=("keycloak-client-secret" "minio-credentials")

for secret in "${SECRETS_TO_ROTATE[@]}"; do
  AGE=$(kubectl get secret "$secret" -n platform-observability -o jsonpath='{.metadata.creationTimestamp}')
  AGE_DAYS=$(( ($(date +%s) - $(date -d "$AGE" +%s)) / 86400 ))
  
  if [ $AGE_DAYS -gt 90 ]; then
    echo "Secret $secret is $AGE_DAYS days old - rotation needed"
    # Send alert to Slack
    curl -X POST $SLACK_WEBHOOK \
      -d "{\"text\": \"⚠️  Secret $secret requires rotation ($AGE_DAYS days old)\"}"
  fi
done
```

### Cron Schedule

```bash
# Add to crontab
0 2 1 * * /root/scripts/auto-rotate-secrets.sh
```

## Emergency Rotation

If credentials are compromised:

1. **Immediate Actions (< 15 minutes)**
   - Rotate affected credentials immediately
   - Block access using old credentials
   - Alert security team
   - Review access logs

2. **Investigation (< 1 hour)**
   - Determine scope of breach
   - Identify affected systems
   - Check for unauthorized access

3. **Remediation (< 4 hours)**
   - Rotate all potentially affected credentials
   - Update all dependent systems
   - Enable additional monitoring
   - Notify affected parties

4. **Post-Incident (< 1 week)**
   - Conduct security review
   - Update procedures
   - Implement additional safeguards
   - Document lessons learned

## Best Practices

1. **Never commit secrets to Git**
   - Use SOPS for encrypted values
   - Use environment variables
   - Use secret managers

2. **Use strong passwords**
   - Minimum 24 characters
   - Mix of upper, lower, numbers, symbols
   - Generate with `openssl rand -base64 32`

3. **Implement grace periods**
   - Keep old credentials valid for 48 hours
   - Allow time for partners to update
   - Monitor both old and new credentials

4. **Document everything**
   - Log all rotations
   - Update runbooks
   - Notify affected parties

5. **Test after rotation**
   - Run smoke tests
   - Check all integrations
   - Monitor error rates

6. **Automate where possible**
   - Use tools like Vault, SOPS
   - Automated rotation scripts
   - Alerting for expiring credentials

## Contact

- **Security Team**: security@yourdomain.tld
- **Platform Team**: platform@yourdomain.tld
- **On-Call**: PagerDuty

## References

- [NIST SP 800-57: Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

