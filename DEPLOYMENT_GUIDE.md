# Complete Deployment Guide

## Prerequisites

Before starting deployment, ensure you have:

- ✅ **Contabo VPS** (Ubuntu 24.04, minimum 4 vCPU / 8GB RAM / 100GB disk)
- ✅ **Domain name** with DNS pointing to your VPS IP
- ✅ **SSH access** to the VPS (root user)
- ✅ **GitHub account** (for CI/CD and container registry)
- ✅ **Email address** for Let's Encrypt certificates

## Step 1: Initial VPS Setup

### 1.1 Connect to VPS

```bash
ssh root@<your-vps-ip>
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
apt install -y git curl wget
```

### 1.3 Configure DNS

Before proceeding, ensure DNS records are set:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | api | `<vps-ip>` | 3600 |
| A | keycloak | `<vps-ip>` | 3600 |
| A | grafana | `<vps-ip>` | 3600 |
| A | minio-console | `<vps-ip>` | 3600 |
| A | * (wildcard) | `<vps-ip>` | 3600 |

Verify DNS propagation:
```bash
dig api.yourdomain.tld
```

## Step 2: Clone Repository

```bash
cd /root
git clone https://github.com/your-org/onboarding-kyc.git
cd onboarding-kyc
```

## Step 3: Bootstrap K3s

```bash
cd infra/k3s-single-vps
chmod +x bootstrap.sh

# Run bootstrap (replace with your domain and email)
./bootstrap.sh api.yourdomain.tld your-email@example.com
```

**What this does:**
- Installs K3s (Kubernetes)
- Installs Helm and Helmfile
- Installs Nginx Ingress Controller
- Installs cert-manager for automatic TLS
- Creates all required namespaces
- Configures system parameters
- Sets up firewall rules

**Duration:** ~5-10 minutes

**Verify bootstrap:**
```bash
kubectl get nodes
kubectl get pods -A
```

All pods should be in `Running` state.

## Step 4: Configure Secrets

⚠️ **CRITICAL:** Update all passwords before deployment!

```bash
cd /root/onboarding-kyc
cp infra/helm/values/dev.yaml infra/helm/values/dev.yaml.backup

# Edit values file
vi infra/helm/values/dev.yaml
```

**Update these values:**

```yaml
global:
  domain: "api.yourdomain.tld"  # Your actual domain
  imageRegistry: "ghcr.io/your-org"  # Your container registry

# CHANGE ALL THESE PASSWORDS!
minio:
  rootPassword: "<generate-strong-password>"

postgresql:
  auth:
    password: "<generate-strong-password>"
    postgresPassword: "<generate-strong-password>"

redis:
  auth:
    password: "<generate-strong-password>"

keycloak:
  auth:
    adminPassword: "<generate-strong-password>"

grafana:
  adminPassword: "<generate-strong-password>"
```

**Generate strong passwords:**
```bash
# Generate a strong password
openssl rand -base64 24
```

## Step 5: Deploy Platform & Services

```bash
cd /root/onboarding-kyc/infra/k3s-single-vps
make up
```

**What this deploys:**
1. PostgreSQL (database)
2. Redis (cache + idempotency)
3. Kafka (message broker)
4. MinIO (object storage)
5. Keycloak (OAuth 2.1)
6. Elasticsearch (logs)
7. Fluent Bit (log shipping)
8. Prometheus (metrics)
9. Grafana (dashboards)
10. OpenTelemetry Collector (traces)
11. All 8 business services

**Duration:** ~15-20 minutes

**Monitor deployment:**
```bash
# Watch pods starting
watch kubectl get pods -A

# Check specific service
kubectl logs -f -n business-onboarding deployment/onboarding-api

# Check ingress
kubectl get ingress -A

# Check certificates
kubectl get certificates -A
```

## Step 6: Verify Deployment

### 6.1 Check Pod Status

```bash
kubectl get pods -A | grep -v Running
```

Should return empty (all pods running).

### 6.2 Check Certificates

```bash
kubectl get certificates -A
```

All certificates should show `READY: True`.

### 6.3 Run Smoke Tests

```bash
cd /root/onboarding-kyc
chmod +x scripts/smoke-tests.sh

export API_BASE_URL="https://api.yourdomain.tld"
./scripts/smoke-tests.sh
```

All tests should pass ✓.

### 6.4 Access Services

Open in browser:
- **API Docs:** https://api.yourdomain.tld/onboarding/v1/swagger
- **Keycloak:** https://keycloak.yourdomain.tld
- **Grafana:** https://grafana.yourdomain.tld
- **MinIO Console:** https://minio-console.yourdomain.tld

## Step 7: Configure Keycloak

### 7.1 Login to Keycloak

1. Go to https://keycloak.yourdomain.tld
2. Click "Administration Console"
3. Login with:
   - Username: `admin`
   - Password: (from `values/dev.yaml`)

### 7.2 Import Realm

```bash
# Copy realm export to VPS if not already there
kubectl create configmap keycloak-realm-import \
  --from-file=/root/onboarding-kyc/infra/keycloak/realm-export-partners.json \
  -n platform-security

# Or import via UI:
# Realms > Create Realm > Import from file
```

### 7.3 Create Test User

1. Select realm: **partners**
2. Go to: **Users** > **Add user**
3. Fill in:
   - Username: `test-partner@example.com`
   - Email: `test-partner@example.com`
   - First name: `Test`
   - Last name: `Partner`
4. Click **Create**
5. Go to **Credentials** tab > **Set password**
6. Go to **Role mapping** > Assign role: `partner`
7. Go to **Attributes** > Add:
   - `partner_id`: `00000000-0000-0000-0000-000000000001`
   - `organization_name`: `Test Partner Corp`

## Step 8: Test API Authentication

### 8.1 Get Access Token

```bash
# Get token
TOKEN=$(curl -s -X POST "https://keycloak.yourdomain.tld/realms/partners/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=partner-portal" \
  -d "username=test-partner@example.com" \
  -d "password=<password-you-set>" \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

### 8.2 Test API Endpoints

```bash
# Health check (no auth required)
curl https://api.yourdomain.tld/onboarding/v1/health/live

# Create onboarding case
curl -X POST https://api.yourdomain.tld/onboarding/v1/cases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "type": "Individual",
    "partner_id": "00000000-0000-0000-0000-000000000001",
    "partner_reference_id": "TEST-001",
    "applicant": {
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-01",
      "email": "john.doe@example.com",
      "phone_number": "+1234567890",
      "residential_address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "US"
      },
      "nationality": "US"
    }
  }'
```

Should return `201 Created` with case details.

### 8.3 Query Case

```bash
# Get the case ID from previous response, then:
CASE_ID="<case-id-from-response>"

curl https://api.yourdomain.tld/onboarding/v1/cases/$CASE_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Step 9: Configure CI/CD (Optional)

### 9.1 GitHub Actions Secrets

Go to GitHub repository > Settings > Secrets and add:

| Secret Name | Value |
|-------------|-------|
| `VPS_SSH_KEY` | SSH private key for VPS |
| `VPS_HOST` | VPS IP address |
| `VPS_KNOWN_HOSTS` | Output of `ssh-keyscan <vps-ip>` |
| `KEYCLOAK_CLIENT_SECRET` | From Keycloak |

### 9.2 Test Deployment Pipeline

```bash
# Push to main branch triggers deployment
git push origin main

# Or manually trigger
gh workflow run deploy_dev.yml
```

## Step 10: Configure Monitoring

### 10.1 Access Grafana

1. Go to https://grafana.yourdomain.tld
2. Login with:
   - Username: `admin`
   - Password: (from `values/dev.yaml`)

### 10.2 Verify Dashboards

Navigate to:
- **Dashboards** > **Service RED Metrics**
- Should show request rate, errors, duration for all services

### 10.3 Configure Alerts (Optional)

1. Go to **Alerting** > **Contact points**
2. Add Slack/email integration
3. Test alert delivery

## Troubleshooting

### Issue: Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>

# Common issues:
# - Image pull errors: Check image registry URL
# - OOMKilled: Increase memory limits
# - CrashLoopBackOff: Check application logs
```

### Issue: Certificate Not Issuing

```bash
# Check cert-manager logs
kubectl logs -n platform-security deployment/cert-manager -f

# Check certificate status
kubectl describe certificate <cert-name> -n <namespace>

# Check challenges
kubectl get challenges -A

# Common issues:
# - DNS not propagated: Wait for DNS
# - HTTP-01 challenge failing: Check ingress configuration
# - Rate limiting: Use staging issuer first
```

### Issue: Database Connection Errors

```bash
# Test database connectivity
kubectl exec -n platform-observability postgresql-0 -- \
  psql -U onboarding_user -d onboarding -c "SELECT 1"

# Check PostgreSQL logs
kubectl logs -n platform-observability postgresql-0

# Reset password if needed (see Step 4)
```

### Issue: High Memory Usage

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -A

# Scale down non-critical services temporarily
kubectl scale deployment/projections-api -n business-readmodel --replicas=1

# Or increase VPS resources
```

## Post-Deployment Checklist

- [ ] All pods running
- [ ] All certificates issued (READY: True)
- [ ] Smoke tests pass
- [ ] API authentication works
- [ ] Created test onboarding case
- [ ] Grafana dashboards showing data
- [ ] Logs flowing to Elasticsearch
- [ ] Metrics visible in Prometheus
- [ ] Keycloak realm configured
- [ ] Changed all default passwords
- [ ] Documented admin credentials (securely!)
- [ ] Configured backup strategy
- [ ] Set up monitoring alerts
- [ ] Tested rollback procedure

## Next Steps

1. **Configure Partners**: Add real partner organizations in Keycloak
2. **Webhook Setup**: Configure webhook endpoints for partners
3. **AD Integration**: Set up Active Directory federation (if needed)
4. **Load Testing**: Run performance tests
5. **Backup Strategy**: Configure automated backups
6. **Monitoring**: Set up alerting rules
7. **Documentation**: Update with organization-specific details

## Support

If you encounter issues:

1. Check logs: `kubectl logs -n <namespace> <pod-name>`
2. Review events: `kubectl get events -A --sort-by='.lastTimestamp'`
3. Consult runbooks: `/root/onboarding-kyc/docs/runbooks/`
4. Check status: `make status`

## Rollback

If deployment fails:

```bash
# Rollback specific service
kubectl rollout undo deployment/<name> -n <namespace>

# Or rollback all via Helmfile
cd infra/helm
helmfile destroy
helmfile sync
```

## Production Readiness

Before going to production:

- [ ] Change all passwords to strong, unique values
- [ ] Enable MFA for admin accounts
- [ ] Configure backups (database, MinIO)
- [ ] Set up monitoring alerts with PagerDuty/Slack
- [ ] Review and adjust resource limits
- [ ] Enable autoscaling for services
- [ ] Configure log retention policies
- [ ] Set up disaster recovery plan
- [ ] Conduct security audit
- [ ] Perform load testing
- [ ] Document incident response procedures
- [ ] Train team on operations

---

**Congratulations! Your platform is deployed and ready to use!** 🎉

