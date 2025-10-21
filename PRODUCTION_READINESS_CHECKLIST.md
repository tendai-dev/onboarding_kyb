# Production Readiness Checklist

Complete this checklist before deploying to production.

## ✅ Infrastructure

### Cluster
- [ ] K3s installed and configured
- [ ] All namespaces created with proper labels
- [ ] NetworkPolicies applied (default-deny)
- [ ] Pod Security Standards enforced (restricted)
- [ ] Resource quotas defined per namespace
- [ ] LimitRanges configured
- [ ] StorageClass configured with appropriate provisioner

### Networking
- [ ] Nginx Ingress Controller installed
- [ ] cert-manager installed and configured
- [ ] Let's Encrypt ClusterIssuer created
- [ ] DNS records pointing to VPS IP
- [ ] TLS certificates issued and valid
- [ ] Firewall rules configured (80, 443, 6443)

### Storage
- [ ] PostgreSQL deployed with persistence
- [ ] Redis deployed with persistence
- [ ] MinIO deployed with persistence
- [ ] Kafka deployed with persistence
- [ ] Backup strategy implemented
- [ ] PITR (Point-in-Time Recovery) configured

## ✅ Security

### Authentication & Authorization
- [ ] Keycloak realm configured
- [ ] All clients created (onboarding-api, partner-portal, admin-portal)
- [ ] Roles and permissions defined
- [ ] Test users created
- [ ] Production users provisioned
- [ ] MFA enabled for admins
- [ ] Active Directory integration configured (if applicable)

### Secrets Management
- [ ] All default passwords changed
- [ ] Strong passwords generated (24+ characters)
- [ ] Secrets stored in Kubernetes Secrets (not in Git)
- [ ] SOPS configured for encrypted values (dev)
- [ ] Vault configured for production secrets (recommended)
- [ ] Webhook signing secrets generated per partner
- [ ] Client secrets documented securely

### Data Protection
- [ ] PII masking configured in Fluent Bit
- [ ] Encryption at rest enabled (PostgreSQL, MinIO)
- [ ] TLS 1.3 enforced everywhere
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] CORS policies reviewed and restricted
- [ ] Data residency rules configured
- [ ] GDPR/CCPA compliance verified

## ✅ Application Services

### For Each Service:
- [ ] Clean Architecture layers implemented
- [ ] CQRS pattern followed (MediatR)
- [ ] Event sourcing with outbox pattern
- [ ] FluentValidation for input validation
- [ ] Global exception handling configured
- [ ] Idempotency middleware enabled
- [ ] Rate limiting configured
- [ ] Circuit breakers configured (Polly)
- [ ] Timeouts set for all external calls
- [ ] Retry policies with exponential backoff
- [ ] Health checks implemented (/health/live, /health/ready)
- [ ] Metrics exposed (/metrics)
- [ ] OpenAPI documentation complete
- [ ] Structured logging configured
- [ ] OpenTelemetry tracing enabled

### Specific Services:
- [ ] **onboarding-api** - Create/manage cases
- [ ] **document-service** - Upload, virus scan, verify documents
- [ ] **checklist-service** - KYC/KYB rule engine
- [ ] **risk-service** - Risk scoring and AML checks
- [ ] **notification-service** - Email/SMS delivery
- [ ] **webhook-dispatcher** - HMAC-signed webhooks with retries
- [ ] **auditlog-service** - Immutable audit trail
- [ ] **projections-api** - Read models for queries
- [ ] **outbox-relay** - Background event publisher

## ✅ Observability

### Logging
- [ ] Fluent Bit deployed and collecting logs
- [ ] Elasticsearch deployed and accessible
- [ ] Kibana deployed (optional)
- [ ] PII masking filters configured
- [ ] Log retention policies set
- [ ] Log indexes created

### Metrics
- [ ] Prometheus deployed
- [ ] All services exposing /metrics
- [ ] ServiceMonitors configured
- [ ] Alertmanager configured
- [ ] Alert rules created (SLO violations)
- [ ] Notification channels configured (Slack, email, PagerDuty)

### Dashboards
- [ ] Grafana deployed and accessible
- [ ] Data sources configured (Prometheus, Elasticsearch)
- [ ] Service RED metrics dashboard imported
- [ ] Kafka queue metrics dashboard imported
- [ ] Database metrics dashboard imported
- [ ] Ingress metrics dashboard imported
- [ ] Custom dashboards per service

### Tracing
- [ ] OpenTelemetry Collector deployed
- [ ] Traces exported to Elasticsearch
- [ ] Jaeger UI accessible (optional)
- [ ] Trace sampling configured
- [ ] W3C Trace Context propagation working

## ✅ Resilience

### Patterns
- [ ] Retry policies configured for all dependencies
- [ ] Circuit breakers configured
- [ ] Timeouts set appropriately
- [ ] Bulkhead isolation configured
- [ ] Graceful degradation tested
- [ ] Idempotency working for all state-changing operations

### Testing
- [ ] Circuit breaker tests pass
- [ ] Timeout tests pass
- [ ] Retry logic tested
- [ ] Chaos tests executed (pod failures, network delays)
- [ ] Degraded mode tested (Redis down, Kafka down)

## ✅ Testing

### Unit Tests
- [ ] Domain logic tested (>80% coverage)
- [ ] Command handlers tested
- [ ] Query handlers tested
- [ ] Validators tested
- [ ] All tests passing

### Integration Tests
- [ ] API endpoints tested
- [ ] Database operations tested
- [ ] Event publishing tested
- [ ] Authentication/authorization tested
- [ ] Idempotency tested
- [ ] Rate limiting tested

### Contract Tests
- [ ] OpenAPI specs validated (Spectral)
- [ ] Pact consumer tests created
- [ ] Provider verification working
- [ ] Breaking change detection configured

### Load Tests
- [ ] Smoke tests pass
- [ ] Load tests pass (P95 < 500ms, error rate < 1%)
- [ ] Stress tests executed (find breaking point)
- [ ] Soak tests pass (no memory leaks)
- [ ] Spike tests pass (handle traffic surges)

### Chaos Tests
- [ ] Pod failure tests
- [ ] Network delay tests
- [ ] Database unreachable tests
- [ ] Kafka unreachable tests
- [ ] CPU stress tests
- [ ] Memory pressure tests

## ✅ CI/CD

### Build Pipeline
- [ ] Builds on every commit
- [ ] Unit tests run automatically
- [ ] Linting configured (Spectral, Hadolint, dotnet format)
- [ ] Security scanning (Trivy)
- [ ] SBOM generation
- [ ] Code coverage reporting

### Image Pipeline
- [ ] Docker images built and pushed to registry
- [ ] Multi-stage builds for optimization
- [ ] Non-root user configured
- [ ] Image scanning before push
- [ ] Semantic versioning tags

### Deployment Pipeline
- [ ] Automated deployment to dev
- [ ] Manual approval for staging/production
- [ ] Helm/Helmfile deployment working
- [ ] Smoke tests run after deployment
- [ ] Rollback procedure tested
- [ ] Blue/green deployment strategy (if applicable)

## ✅ Operations

### Runbooks
- [ ] Incident response runbook complete
- [ ] Rollback procedures documented
- [ ] Key rotation procedures documented
- [ ] Scaling procedures documented
- [ ] Backup/restore procedures documented

### Monitoring & Alerting
- [ ] On-call rotation configured
- [ ] PagerDuty integration working
- [ ] Slack alerts configured
- [ ] Email alerts configured
- [ ] Alert escalation paths defined
- [ ] Status page configured

### Backup & DR
- [ ] Database backups automated (daily)
- [ ] Backup retention policy defined (30 days)
- [ ] Backup verification scheduled (weekly)
- [ ] Disaster recovery plan documented
- [ ] DR drills scheduled (quarterly)
- [ ] RTO/RPO defined and tested

## ✅ Documentation

### API Documentation
- [ ] OpenAPI spec complete and accurate
- [ ] API style guide published
- [ ] Error catalog published
- [ ] Authentication guide published
- [ ] Webhook integration guide published
- [ ] Postman collection created

### Architecture Documentation
- [ ] System architecture diagram
- [ ] Component interaction diagrams
- [ ] Data flow diagrams
- [ ] Security architecture documented
- [ ] Deployment architecture documented

### Operational Documentation
- [ ] Deployment guide complete
- [ ] Configuration guide complete
- [ ] Troubleshooting guide complete
- [ ] FAQ created
- [ ] Known issues documented

## ✅ Performance

### SLO Targets
- [ ] P95 latency < 500ms (verified with load tests)
- [ ] P99 latency < 1000ms
- [ ] Error rate < 0.1%
- [ ] Availability > 99.9%

### Capacity Planning
- [ ] Current resource usage documented
- [ ] Growth projections documented
- [ ] Scaling triggers defined
- [ ] Autoscaling configured and tested

## ✅ Compliance

### GDPR (if applicable)
- [ ] Data residency enforced
- [ ] PII encryption at rest
- [ ] PII masking in logs
- [ ] Right to erasure implemented
- [ ] Data portability implemented
- [ ] Consent management implemented
- [ ] Privacy policy published

### Audit Trail
- [ ] All writes logged
- [ ] Audit logs immutable
- [ ] Audit log retention 7+ years
- [ ] Compliance reports automated

## ✅ Pre-Launch

### Final Checks
- [ ] Load test with production-like data
- [ ] Security penetration test completed
- [ ] Third-party security audit (if required)
- [ ] Legal review completed
- [ ] Privacy impact assessment completed
- [ ] Go-live plan reviewed with stakeholders
- [ ] Rollback plan tested
- [ ] Communication plan ready
- [ ] Support team trained
- [ ] Customer success team trained

### Go-Live Preparation
- [ ] Maintenance window scheduled (if needed)
- [ ] Partners notified of go-live
- [ ] Status page message prepared
- [ ] Support team on standby
- [ ] Monitoring dashboards open and visible
- [ ] On-call engineer ready

## ✅ Post-Launch

### Week 1
- [ ] Monitor error rates hourly
- [ ] Review logs daily
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Hot-fix issues immediately

### Week 2-4
- [ ] Conduct retrospective
- [ ] Document lessons learned
- [ ] Optimize based on real usage patterns
- [ ] Update capacity planning
- [ ] Schedule next deployment

---

## Sign-Off

Before production deployment, obtain sign-off from:

- [ ] **Engineering Lead** - Technical readiness
- [ ] **Security Team** - Security audit
- [ ] **Compliance** - Regulatory compliance
- [ ] **Product Owner** - Feature completeness
- [ ] **CTO** - Final approval

---

**Production Deployment Date:** ___________________

**Deployed By:** ___________________

**Approved By:** ___________________

