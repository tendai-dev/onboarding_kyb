# Deployment Guide - Unified Services

This guide covers deploying the consolidated microservices architecture.

## Architecture Overview

- **onboarding-api**: Unified API service (port 8001)
- **onboarding-workers**: Unified worker service
- **gateway**: API Gateway (port 8000)

## Local Development

### Prerequisites
```bash
# Required services
- PostgreSQL
- Redis
- Kafka
- MinIO (for document storage)
```

### Start Services
```bash
# Start all infrastructure
docker-compose up -d postgres redis kafka minio

# Start unified services
docker-compose up -d onboarding-api onboarding-workers gateway

# View logs
docker-compose logs -f onboarding-api
docker-compose logs -f onboarding-workers
```

### Access Points
- **API**: http://localhost:8001
- **Gateway**: http://localhost:8000
- **Admin Portal**: http://localhost:3001 (run separately)
- **Partner Portal**: http://localhost:3000 (run separately)

## Environment Variables

### onboarding-api
```bash
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://0.0.0.0:8001
ConnectionStrings__PostgreSQL=Host=postgres;Database=kyb_case;Username=kyb;Password=kyb_password
ConnectionStrings__Redis=redis:6379
Kafka__BootstrapServers=kafka:9092
Storage__Endpoint=minio:9000
Storage__AccessKey=minioadmin
Storage__SecretKey=minioadmin
Storage__BucketName=kyb-docs
```

### onboarding-workers
```bash
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__PostgreSQL=Host=postgres;Database=kyb_case;Username=kyb;Password=kyb_password
ConnectionStrings__Redis=redis:6379
Kafka__BootstrapServers=kafka:9092
```

## Database Setup

### Create Schemas
The application automatically creates schemas on startup. To verify:

```sql
-- Connect to PostgreSQL
psql -h localhost -U kyb -d kyb_case

-- List schemas
\dn

-- Should see:
-- audit, checklist, notification, messaging,
-- entity_configuration, work_queue, risk,
-- projections, document
```

### Manual Schema Creation (if needed)
```sql
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS checklist;
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS messaging;
CREATE SCHEMA IF NOT EXISTS entity_configuration;
CREATE SCHEMA IF NOT EXISTS work_queue;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS projections;
CREATE SCHEMA IF NOT EXISTS document;
```

## Kubernetes Deployment

### Service Definitions

#### onboarding-api Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: onboarding-api
  namespace: business-onboarding
spec:
  selector:
    app: onboarding-api
  ports:
    - port: 80
      targetPort: 8001
  type: ClusterIP
```

#### onboarding-workers Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: onboarding-workers
  namespace: business-onboarding
spec:
  selector:
    app: onboarding-workers
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

### Deployment Manifests

#### onboarding-api Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: onboarding-api
  namespace: business-onboarding
spec:
  replicas: 3
  selector:
    matchLabels:
      app: onboarding-api
  template:
    metadata:
      labels:
        app: onboarding-api
    spec:
      containers:
      - name: api
        image: your-registry/onboarding-api:latest
        ports:
        - containerPort: 8001
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__PostgreSQL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: connection-string
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

#### onboarding-workers Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: onboarding-workers
  namespace: business-onboarding
spec:
  replicas: 2
  selector:
    matchLabels:
      app: onboarding-workers
  template:
    metadata:
      labels:
        app: onboarding-workers
    spec:
      containers:
      - name: workers
        image: your-registry/onboarding-workers:latest
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__PostgreSQL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: connection-string
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## Health Checks

### API Health Endpoints
- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`

### Worker Health
Workers don't expose HTTP endpoints. Monitor via:
- Container health status
- Log output
- Job execution metrics

## Monitoring

### Key Metrics to Monitor
- API response times
- Error rates
- Database connection pool usage
- Kafka message processing
- Worker job execution times
- Memory and CPU usage

### Log Aggregation
- All logs go to stdout/stderr
- Configure log aggregation (ELK, Splunk, etc.)
- Use structured logging (Serilog)

## Scaling

### Horizontal Scaling
```bash
# Scale API
kubectl scale deployment onboarding-api --replicas=5

# Scale Workers
kubectl scale deployment onboarding-workers --replicas=3
```

### Vertical Scaling
Adjust resource limits in deployment manifests.

## Rollback Procedure

### Quick Rollback
1. Revert to previous Docker image tag
2. Update deployment manifest
3. Apply changes: `kubectl apply -f deployment.yaml`

### Full Rollback
1. Re-enable old services in docker-compose.yml
2. Revert gateway configuration
3. Revert frontend proxy routes
4. Restart services

## Troubleshooting

### API Not Starting
```bash
# Check logs
docker-compose logs onboarding-api

# Check database connection
docker-compose exec onboarding-api ping postgres

# Check environment variables
docker-compose exec onboarding-api env | grep ConnectionStrings
```

### Workers Not Processing
```bash
# Check logs
docker-compose logs onboarding-workers

# Verify Kafka connectivity
docker-compose exec onboarding-workers ping kafka

# Check Redis connection
docker-compose exec onboarding-workers redis-cli -h redis ping
```

### Gateway Issues
```bash
# Check gateway logs
docker-compose logs gateway

# Test gateway connectivity
curl -v http://localhost:8000/health

# Verify upstream
docker-compose exec gateway ping kyb_case_api
```

## Performance Tuning

### Database Connection Pooling
```json
{
  "ConnectionStrings": {
    "PostgreSQL": "Host=postgres;Database=kyb_case;Username=kyb;Password=kyb_password;Maximum Pool Size=100;Minimum Pool Size=10"
  }
}
```

### API Threading
- Default thread pool is usually sufficient
- Monitor thread pool exhaustion
- Adjust if needed via configuration

### Worker Concurrency
- Outbox Relay: Processes sequentially (prevents duplicates)
- Compliance Refresh: Uses distributed lock (single instance)

## Security Considerations

- [ ] Use secrets for connection strings
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Use authentication/authorization
- [ ] Enable rate limiting
- [ ] Monitor for security vulnerabilities

## Backup & Recovery

### Database Backups
```bash
# Backup all schemas
pg_dump -h postgres -U kyb -d kyb_case > backup.sql

# Restore
psql -h postgres -U kyb -d kyb_case < backup.sql
```

### Document Storage
- MinIO supports versioning
- Configure backup for MinIO buckets
- Consider object storage replication

---

**Last Updated**: $(date)  
**Version**: 1.0

