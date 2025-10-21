# Corporate Digital Onboarding & KYC Platform

Production-grade platform for corporate digital onboarding and KYC compliance, built with Clean/Hexagonal Architecture, CQRS, Event-Driven Architecture, and deployed on a single Contabo Ubuntu VPS with K3s.

## 🏗️ Architecture

### Design Principles
- **Clean/Hexagonal Architecture** (Ports & Adapters): Domain-centric, framework-independent core
- **Domain-Driven Design (DDD)**: Rich domain models, aggregates, value objects, domain events
- **CQRS**: Separate command and query models/handlers
- **Event-Driven Architecture**: Domain events, integration events, outbox pattern, eventual consistency
- **REST + JSON-only**: Resource-oriented URIs, standard HTTP methods, OpenAPI-first
- **OAuth 2.1**: Keycloak for external users, Active Directory federation for internal SSO

### Technology Stack

**Infrastructure:**
- **Orchestration**: K3s (lightweight Kubernetes) on Ubuntu 24.04
- **Ingress**: Nginx Ingress Controller + cert-manager (Let's Encrypt)
- **Storage**: Local-path provisioner
- **Networking**: NetworkPolicies (default-deny), Pod Security Standards

**Platform Services:**
- **Database**: PostgreSQL 15 (with PITR backups)
- **Cache**: Redis (idempotency + sessions)
- **Message Broker**: Kafka (default) or RabbitMQ (toggle)
- **Object Storage**: MinIO (S3-compatible)
- **Identity**: Keycloak (OAuth 2.1, AD federation)

**Observability:**
- **Logs**: Fluent Bit → Elasticsearch (with PII masking)
- **Metrics**: Prometheus + Alertmanager
- **Dashboards**: Grafana (RED metrics, SLO dashboards)
- **Tracing**: OpenTelemetry Collector → Elasticsearch

**Application Services:**
- **Runtime**: .NET 8
- **Patterns**: MediatR (CQRS), FluentValidation, Polly (resilience)
- **Database**: EF Core + Npgsql
- **Events**: Kafka producer/consumer
- **HTTP**: Polly retry policies, circuit breakers, timeouts

## 📁 Repository Structure

```
repo/
├── infra/
│   ├── k3s-single-vps/           # K3s bootstrap scripts
│   │   ├── bootstrap.sh          # One-shot installer
│   │   ├── Makefile              # make up/down/status
│   │   ├── networking/           # Ingress, NetworkPolicies
│   │   ├── certs/                # cert-manager configs
│   │   └── storage/              # StorageClass
│   └── helm/
│       ├── helmfile.yaml         # Platform + services orchestration
│       ├── values/dev.yaml       # Dev environment config
│       └── charts/               # Helm charts for all services
├── platform/
│   ├── gateway/                  # API Gateway routes & policies
│   └── observability/            # Dashboards, alerts, log parsers
├── services/
│   ├── onboarding-api/           # Main onboarding service
│   ├── document-service/         # Document management
│   ├── checklist-service/        # KYC/KYB checklists
│   ├── risk-service/             # Risk scoring & AML
│   ├── notification-service/     # Email/SMS notifications
│   ├── webhook-dispatcher/       # HMAC-signed webhook delivery
│   ├── auditlog-service/         # Immutable audit trail
│   └── projections-api/          # Read models for queries
├── ci/
│   └── github-actions/           # CI/CD pipelines
├── docs/
│   ├── api/                      # API style guide, error catalog
│   ├── security/                 # Webhook HMAC, OAuth, data masking
│   └── runbooks/                 # Incident response, rollbacks
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- **Contabo VPS**: Ubuntu 24.04 (minimum 4 vCPU, 8GB RAM, 100GB disk)
- **Domain**: Pointed to your VPS IP (e.g., `api.yourdomain.tld`)
- **SSH Access**: Root access to the VPS

### 1. Bootstrap K3s & Platform

SSH into your Contabo VPS:

```bash
ssh root@<your-vps-ip>

# Clone repository
git clone https://github.com/your-org/onboarding-kyc.git
cd onboarding-kyc

# Run bootstrap (installs K3s, Helm, cert-manager, ingress)
cd infra/k3s-single-vps
chmod +x bootstrap.sh
./bootstrap.sh api.yourdomain.tld your-email@example.com
```

**What it does:**
- Installs K3s (server mode, Traefik disabled)
- Installs Helm + Helmfile
- Creates namespaces
- Installs Nginx Ingress Controller
- Installs cert-manager with Let's Encrypt
- Configures system (vm.max_map_count, swap, firewall)

### 2. Configure Values

Edit `infra/helm/values/dev.yaml`:

```yaml
global:
  domain: "api.yourdomain.tld"  # Replace with your domain
  imageRegistry: "ghcr.io/your-org"

# Update passwords (REQUIRED!)
minio:
  rootPassword: "change-me-strong-password"

postgresql:
  auth:
    password: "change-me-strong-password"
    postgresPassword: "change-me-root-password"

redis:
  auth:
    password: "change-me-strong-password"

keycloak:
  auth:
    adminPassword: "change-me-strong-password"
```

### 3. Deploy Platform & Services

```bash
cd infra/k3s-single-vps
make up
```

This will:
1. Deploy PostgreSQL, Redis, Kafka, MinIO
2. Deploy Keycloak with OAuth 2.1
3. Deploy observability stack (Elasticsearch, Prometheus, Grafana)
4. Deploy application services
5. Configure ingress routes with TLS

**Deployment takes ~10-15 minutes** for all services to become ready.

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods -A

# Check ingress routes
kubectl get ingress -A

# Check certificates
kubectl get certificates -A

# View deployment summary
make status
```

### 5. Access Services

Once deployed, access these URLs (replace with your domain):

| Service | URL | Credentials |
|---------|-----|-------------|
| **API Gateway** | https://api.yourdomain.tld | Bearer token from Keycloak |
| **Swagger Docs** | https://api.yourdomain.tld/onboarding/v1/swagger | - |
| **Keycloak** | https://keycloak.yourdomain.tld | admin / (from values.yaml) |
| **Grafana** | https://grafana.yourdomain.tld | admin / (from values.yaml) |
| **Prometheus** | https://prometheus.yourdomain.tld | - |
| **MinIO Console** | https://minio-console.yourdomain.tld | admin / (from values.yaml) |

## 🔑 Authentication Setup

### 1. Configure Keycloak Realm

```bash
# Access Keycloak admin console
open https://keycloak.yourdomain.tld

# Login with admin credentials
# Username: admin
# Password: (from values.yaml)

# Create realm "partners"
# Create client "onboarding-api"
# Create roles: partner, compliance_officer, admin
# Create test user
```

### 2. Get Access Token

```bash
# Get token for API access
curl -X POST "https://keycloak.yourdomain.tld/realms/partners/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=onboarding-api" \
  -d "client_secret=<from-keycloak>" \
  -d "username=test@example.com" \
  -d "password=<user-password>" \
  | jq -r '.access_token'
```

### 3. Test API

```bash
# Set token
export TOKEN="<access-token-from-above>"

# Health check
curl https://api.yourdomain.tld/onboarding/v1/health/live

# Create onboarding case
curl -X POST https://api.yourdomain.tld/onboarding/v1/cases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "type": "Individual",
    "partner_id": "00000000-0000-0000-0000-000000000001",
    "partner_reference_id": "PART-12345",
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

## 📊 Monitoring & Observability

### Grafana Dashboards

Access Grafana at `https://grafana.yourdomain.tld`

**Pre-installed dashboards:**
- **Service RED Metrics**: Rate, Errors, Duration for all services
- **Kafka Metrics**: Topics, partitions, consumer lag
- **PostgreSQL Metrics**: Connections, queries, locks
- **Redis Metrics**: Memory, connections, commands
- **Ingress Metrics**: Request rate, error rate, latency

### Prometheus Alerts

Configured alerts (see `platform/observability/alerts/slo-alerts.yaml`):
- High error rate (>1% of requests)
- High latency (P95 > 500ms)
- Database connection pool exhaustion
- Kafka consumer lag
- Certificate expiry warnings
- Pod restarts
- High CPU/memory usage

### Logs

View logs in Elasticsearch/Kibana or via kubectl:

```bash
# View application logs
kubectl logs -n business-onboarding deployment/onboarding-api --tail=100

# Follow logs
kubectl logs -n business-onboarding deployment/onboarding-api -f

# Search logs in Elasticsearch
curl -X GET "elasticsearch-master.platform-observability:9200/fluentbit-*/_search" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match": {"level": "ERROR"}}}'
```

## 🔧 Configuration

### Environment Toggle: Kafka ↔ RabbitMQ

Edit `infra/helm/values/dev.yaml`:

```yaml
kafka:
  enabled: true   # Set to false to use RabbitMQ

rabbitmq:
  enabled: false  # Set to true to use RabbitMQ
```

Then redeploy:
```bash
cd infra/k3s-single-vps
make up
```

### Scaling Services

```bash
# Scale onboarding-api to 5 replicas
kubectl scale deployment/onboarding-api -n business-onboarding --replicas=5

# Enable autoscaling
kubectl autoscale deployment/onboarding-api -n business-onboarding \
  --cpu-percent=70 --min=2 --max=10
```

## 🛡️ Security

### Webhook Security

All webhooks are signed with HMAC-SHA256. See [Webhook HMAC Spec](docs/security/webhook_hmac_spec.md) for implementation details.

**Headers:**
```
X-Webhook-Signature: sha256=<base64-encoded-hmac>
X-Webhook-Delivery-Id: <uuid>
X-Webhook-Event-Type: <event-type>
X-Webhook-Timestamp: <unix-timestamp>
```

### OAuth 2.1 & Roles

See [OAuth Scopes & Roles](docs/security/oauth_scopes_roles.md) for:
- Realm configuration
- Client setup
- Role definitions
- Active Directory integration
- Token validation examples

### Data Masking

PII is automatically masked in logs via Fluent Bit filters. Sensitive fields redacted:
- Passwords, tokens, secrets, API keys
- Credit card numbers
- SSN/Tax IDs
- Email addresses (in error logs)

## 📖 Documentation

### API Documentation
- **[API Style Guide](docs/api/style_guide.md)**: URI conventions, error handling, versioning
- **OpenAPI Specs**: Available at `https://api.yourdomain.tld/onboarding/v1/swagger`

### Security Documentation
- **[Webhook HMAC Spec](docs/security/webhook_hmac_spec.md)**: Signing and verification
- **[OAuth Scopes & Roles](docs/security/oauth_scopes_roles.md)**: Authentication and authorization
- **[Data Masking](docs/security/data_masking_logging.md)**: PII protection in logs

### Runbooks
- **[Incident Response](docs/runbooks/incident_response.md)**: On-call procedures
- **[Rollback Release](docs/runbooks/rollback_release.md)**: Deployment rollback steps
- **[Rotate Keys & Tokens](docs/runbooks/rotate_keys_tokens.md)**: Security credential rotation

## 🔄 CI/CD

### GitHub Actions Workflows

Located in `ci/github-actions/`:

1. **`build_and_test.yml`**: Build, test, lint, security scan
2. **`image_publish.yml`**: Build and push Docker images to GHCR
3. **`deploy_dev.yml`**: Deploy to dev environment via Helmfile

### Manual Deployment

```bash
# Build Docker image
cd services/onboarding-api
docker build -t ghcr.io/your-org/onboarding-api:latest .

# Push to registry
docker push ghcr.io/your-org/onboarding-api:latest

# Deploy via Helmfile
cd infra/helm
helmfile sync --environment dev
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -A | grep -v Running

# Describe pod for events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>
```

#### 2. Certificate Issues

```bash
# Check certificate status
kubectl get certificates -A

# Describe certificate
kubectl describe certificate <cert-name> -n <namespace>

# Check cert-manager logs
kubectl logs -n platform-security deployment/cert-manager
```

#### 3. Database Connection Errors

```bash
# Test database connectivity
kubectl exec -n platform-observability deployment/postgresql -- \
  psql -U onboarding_user -d onboarding -c "SELECT 1"

# Check connection count
kubectl exec -n platform-observability deployment/postgresql -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

#### 4. Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up old images
docker system prune -a --volumes -f

# Increase PVC size (edit and apply)
kubectl edit pvc <pvc-name> -n <namespace>
```

### Get Help

- **Documentation**: Check `docs/` directory
- **Runbooks**: See `docs/runbooks/` for specific procedures
- **Logs**: Check Grafana and Elasticsearch
- **Support**: Open an issue on GitHub

## 📋 Maintenance

### Regular Tasks

**Daily:**
- Check Grafana dashboards for anomalies
- Review critical alerts

**Weekly:**
- Review error logs
- Check disk usage
- Review security scan results

**Monthly:**
- Update dependencies
- Review and rotate secrets
- Test backup/restore procedures
- Review access logs and user permissions

**Quarterly:**
- Update Kubernetes and platform components
- Review and update documentation
- Conduct security audit
- Review SLOs and adjust alerts

### Backup Procedures

**PostgreSQL:**
```bash
# Manual backup
kubectl exec -n platform-observability postgresql-0 -- \
  pg_dump -U postgres onboarding > backup_$(date +%Y%m%d).sql

# Restore
kubectl exec -i -n platform-observability postgresql-0 -- \
  psql -U postgres onboarding < backup_20251021.sql
```

**MinIO:**
```bash
# Use MinIO client (mc)
mc alias set myminio https://minio.yourdomain.tld admin <password>
mc mirror myminio/documents ./backups/documents
```

## 🎯 SLOs & SLIs

### Service Level Objectives

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Availability** | 99.9% | (successful requests / total requests) |
| **Latency (P95)** | < 500ms | 95th percentile response time |
| **Error Rate** | < 0.1% | (5xx responses / total requests) |

### Monitoring

- **Prometheus**: Scrapes metrics every 30s
- **Grafana**: Displays RED metrics and SLO dashboards
- **Alertmanager**: Fires alerts when SLOs breached

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Clean Architecture principles
- Write unit tests (min 80% coverage)
- Document APIs using OpenAPI
- Follow API style guide
- Include runbook updates for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with .NET 8 and Clean Architecture
- Deployed on K3s (lightweight Kubernetes)
- Observability by Prometheus + Grafana + OpenTelemetry
- Secure webhooks with HMAC-SHA256
- OAuth 2.1 via Keycloak

---

**🚀 Ready to deploy? Start with the [Quick Start](#quick-start) guide above!**

