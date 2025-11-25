# Quick Reference Guide - Unified Services

## Service Endpoints

### Unified API (Port 8001)
Base URL: `http://localhost:8001`

| Module | Endpoint | Description |
|--------|----------|-------------|
| Audit | `/api/v1/audit-logs` | Audit logging |
| Checklist | `/api/v1/checklists` | Checklist management |
| Notification | `/api/v1/notifications` | Send notifications |
| Messaging | `/api/v1/messages` | Messaging |
| Webhook | `/api/v1/webhooks` | Webhook delivery |
| Entity Config | `/api/v1/entity-types` | Entity configuration |
| Work Queue | `/api/v1/workqueue` | Work queue |
| Risk | `/api/v1/risk-assessments` | Risk assessment |
| Projections | `/api/v1/projections` | Dashboard data |
| Document | `/api/v1/documents` | Document management |

### Gateway (Port 8000)
Base URL: `http://localhost:8000`

All routes proxy to unified API with backward-compatible paths.

## Common Commands

### Start Services
```bash
# Start all infrastructure
docker-compose up -d postgres redis kafka minio

# Start unified services
docker-compose up -d onboarding-api onboarding-workers gateway

# Start everything
docker-compose up -d
```

### View Logs
```bash
# API logs
docker-compose logs -f onboarding-api

# Worker logs
docker-compose logs -f onboarding-workers

# Gateway logs
docker-compose logs -f gateway

# All logs
docker-compose logs -f
```

### Stop Services
```bash
# Stop unified services
docker-compose stop onboarding-api onboarding-workers

# Stop everything
docker-compose down
```

### Restart Services
```bash
# Restart API
docker-compose restart onboarding-api

# Restart workers
docker-compose restart onboarding-workers
```

### Health Checks
```bash
# API health
curl http://localhost:8001/health

# Gateway health
curl http://localhost:8000/health

# Test endpoint through gateway
curl http://localhost:8000/api/v1/checklists
```

## Database Operations

### Connect to Database
```bash
docker-compose exec postgres psql -U kyb -d kyb_case
```

### List Schemas
```sql
\dn
```

### Check Tables in Schema
```sql
\dt audit.*
\dt checklist.*
-- etc.
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U kyb kyb_case > backup.sql
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs onboarding-api

# Check if port is in use
lsof -i :8001

# Check container status
docker-compose ps
```

### Database Connection Issues
```bash
# Test connection
docker-compose exec onboarding-api ping postgres

# Check connection string
docker-compose exec onboarding-api env | grep ConnectionStrings
```

### Gateway 502 Errors
```bash
# Verify API is running
curl http://localhost:8001/health

# Check gateway logs
docker-compose logs gateway

# Verify upstream
docker-compose exec gateway ping kyb_case_api
```

## File Locations

### API Code
- Domain: `services/onboarding-api/src/Domain/`
- Application: `services/onboarding-api/src/Application/`
- Infrastructure: `services/onboarding-api/src/Infrastructure/`
- Controllers: `services/onboarding-api/src/Presentation/Controllers/`

### Worker Code
- Workers: `services/onboarding-workers/src/Workers/`

### Configuration
- Gateway: `gateway/nginx.conf`
- Docker Compose: `docker-compose.yml`
- K8s Ingress: `k8s-manifests/api-ingress.yaml`

## Environment Variables

### API Service
```bash
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://0.0.0.0:8001
ConnectionStrings__PostgreSQL=Host=postgres;Database=kyb_case;Username=kyb;Password=kyb_password
ConnectionStrings__Redis=redis:6379
Kafka__BootstrapServers=kafka:9092
```

### Worker Service
```bash
ConnectionStrings__PostgreSQL=Host=postgres;Database=kyb_case;Username=kyb;Password=kyb_password
ConnectionStrings__Redis=redis:6379
Kafka__BootstrapServers=kafka:9092
```

## Testing Endpoints

### Quick Test Script
```bash
#!/bin/bash
BASE_URL="http://localhost:8000"

echo "Testing Audit Logs..."
curl -s $BASE_URL/api/audit/ | jq .

echo "Testing Checklists..."
curl -s $BASE_URL/api/checklists/ | jq .

echo "Testing Notifications..."
curl -s $BASE_URL/api/notifications/ | jq .

echo "Testing Messages..."
curl -s $BASE_URL/api/messages/ | jq .

echo "Testing Entity Types..."
curl -s $BASE_URL/api/entities/ | jq .

echo "Testing Work Queue..."
curl -s $BASE_URL/api/workqueue | jq .

echo "Testing Risk Assessments..."
curl -s $BASE_URL/api/risk/risk-assessments | jq .

echo "Testing Projections..."
curl -s $BASE_URL/api/v1/dashboard | jq .

echo "Testing Documents..."
curl -s $BASE_URL/api/documents | jq .
```

## Useful Links

- **Consolidation Summary**: `MIGRATION_SUMMARY.md`
- **Testing Checklist**: `TESTING_CHECKLIST.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Complete Documentation**: `CONSOLIDATION_COMPLETE.md`

---

**Last Updated**: $(date)

