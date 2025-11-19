# Microservices Consolidation Analysis

## Executive Summary

This document analyzes the current 12+ microservices architecture and proposes consolidation to **1 API service** and **1 Worker service** to reduce DevOps overhead while maintaining functionality.

## Current Architecture Overview

### API Services (HTTP Endpoints)

1. **onboarding-api** (kyb-case-api) - Port 8001
   - Core business logic: Create/update onboarding cases
   - Main write model for KYB/onboarding workflow
   - Publishes domain events via outbox pattern

2. **entity-configuration-service** - Port 8003
   - Entity type configurations
   - Form configurations
   - Requirements management
   - Wizard configurations

3. **work-queue-service** - Port 8005
   - Task assignment and work queue management
   - Consumes: CaseSubmitted, CaseUpdated, RiskAssessed, DocUploaded
   - Publishes: TaskCreated, TaskAssigned, TaskCompleted

4. **risk-service** - Port 8006
   - Risk assessment and scoring
   - Consumes: CaseSubmitted, CaseUpdated
   - Publishes: RiskAssessed

5. **projections-api** - Port 8007
   - Read model/query API
   - Consumes: All case/task/document events
   - Optimized for queries and reporting

6. **document-service** - Port 8008
   - Document upload/download
   - Virus scanning integration (ClamAV)
   - MinIO storage integration
   - Publishes: DocUploaded, DocVerified

7. **notification-service** - Port 8010
   - Email/SMS notifications
   - Consumes: All domain events
   - Template management

8. **auditlog-service** - Port 8011
   - Audit logging
   - Consumes: All domain events

9. **checklist-service** - Port 8086
   - Checklist management
   - Legacy support

10. **messaging-service** - Port 8087
    - Internal messaging/chat
    - SignalR for real-time

11. **webhook-dispatcher** - Port 8089
    - External webhook delivery
    - Retry logic for webhooks

### Background Workers

12. **outbox-relay**
    - Polls outbox tables and publishes to Kafka
    - Implements transactional outbox pattern
    - Critical for event delivery

13. **compliance-refresh-job**
    - Scheduled job for compliance refreshes
    - Runs periodically based on risk tier

## Consolidation Proposal

### Proposed Architecture: 2 Services

#### 1. **Unified API Service** (`onboarding-api`)
Combines all HTTP endpoints into a single API service with modular controllers.

**Included Services:**
- ✅ onboarding-api (core)
- ✅ entity-configuration-service
- ✅ work-queue-service
- ✅ risk-service
- ✅ projections-api
- ✅ document-service
- ✅ notification-service
- ✅ auditlog-service
- ✅ checklist-service
- ✅ messaging-service
- ✅ webhook-dispatcher

**Architecture Pattern:**
- Single ASP.NET Core application
- Modular controllers organized by domain
- Shared infrastructure (DB contexts, Kafka consumers, etc.)
- Feature flags to enable/disable modules if needed

#### 2. **Unified Worker Service** (`onboarding-workers`)
Combines all background processing into a single worker service.

**Included Workers:**
- ✅ outbox-relay (background service)
- ✅ compliance-refresh-job (scheduled job)
- ✅ Kafka event consumers (can be moved from API or kept separate)

**Architecture Pattern:**
- Single .NET Worker Service
- Multiple `IHostedService` implementations
- Shared infrastructure (DB, Kafka, Redis)

## Implementation Strategy

### Phase 1: Consolidate Workers (Low Risk)
1. Create `onboarding-workers` project
2. Move `outbox-relay` and `compliance-refresh-job` as hosted services
3. Test and deploy
4. Decommission old worker containers

### Phase 2: Consolidate API Services (Medium Risk)
1. Create unified API structure in `onboarding-api`
2. Migrate controllers one by one:
   - Start with low-traffic services (audit, checklist)
   - Then medium-traffic (notifications, messaging)
   - Finally high-traffic (documents, projections)
3. Consolidate database contexts (use schemas for separation)
4. Consolidate Kafka consumers (can run in API or move to workers)
5. Update gateway/ingress routing
6. Test thoroughly
7. Decommission old services

### Phase 3: Optimize (Post-Consolidation)
1. Review shared dependencies
2. Optimize database connections
3. Consolidate Redis usage
4. Review Kafka consumer groups

## Benefits

### DevOps Benefits
- **Reduced Container Count**: 12+ containers → 2 containers
- **Simplified Deployment**: Single API deployment, single worker deployment
- **Easier Monitoring**: Fewer services to monitor
- **Simplified Networking**: Fewer service-to-service calls
- **Lower Resource Overhead**: Shared infrastructure per service type

### Development Benefits
- **Easier Local Development**: Fewer services to run
- **Simplified Testing**: Single API to test against
- **Code Reuse**: Shared models, validators, utilities
- **Easier Refactoring**: All code in one place

### Operational Benefits
- **Simplified Scaling**: Scale API and workers independently
- **Easier Debugging**: Single codebase to trace
- **Reduced Latency**: No network hops between services

## Considerations & Trade-offs

### Potential Challenges

1. **Deployment Coupling**
   - All API features deploy together
   - **Mitigation**: Use feature flags, modular architecture

2. **Scaling Granularity**
   - Can't scale individual features independently
   - **Mitigation**: API can still scale horizontally, workers can scale separately

3. **Technology Constraints**
   - All features must use same .NET version
   - **Mitigation**: Usually not an issue for .NET services

4. **Database Schema Management**
   - Multiple schemas in single database
   - **Mitigation**: Use EF Core schema support, maintain separation

5. **Code Organization**
   - Larger codebase requires better organization
   - **Mitigation**: Use modular architecture, clear folder structure

### What We Keep

- ✅ Event-driven architecture (Kafka)
- ✅ CQRS pattern (separate read/write models)
- ✅ Domain-driven design
- ✅ Outbox pattern for reliable events
- ✅ Database per domain (can use schemas instead)

### What We Simplify

- ❌ Service-to-service HTTP calls (become in-process calls)
- ❌ Separate deployments per feature
- ❌ Complex service mesh/routing
- ❌ Multiple health check endpoints

## Database Strategy

### Option A: Single Database with Schemas (Recommended)
- Single PostgreSQL instance
- Separate schemas: `onboarding`, `documents`, `risk`, `notifications`, etc.
- Easier to manage, backup, and maintain
- Still provides logical separation

### Option B: Keep Separate Databases
- Maintain current database-per-service approach
- More isolation but more overhead
- Better for future re-splitting if needed

## Migration Checklist

### Pre-Migration
- [ ] Document all API endpoints and their usage
- [ ] Document all Kafka topics and consumers
- [ ] Document all database schemas
- [ ] Create feature flags for gradual rollout
- [ ] Set up monitoring/alerting for unified services

### Migration Steps
- [ ] Create unified API project structure
- [ ] Migrate controllers one by one
- [ ] Consolidate database contexts
- [ ] Consolidate Kafka consumers
- [ ] Update gateway routing
- [ ] Update frontend API clients
- [ ] Update CI/CD pipelines
- [ ] Update documentation

### Post-Migration
- [ ] Performance testing
- [ ] Load testing
- [ ] Monitor error rates
- [ ] Decommission old services
- [ ] Update runbooks

## Estimated Effort

- **Phase 1 (Workers)**: 1-2 weeks
- **Phase 2 (API)**: 4-6 weeks
- **Testing & Stabilization**: 2-3 weeks
- **Total**: 7-11 weeks

## Recommendation

**✅ Proceed with consolidation** - The benefits outweigh the risks for a team of this size. The current microservices architecture appears to be over-engineered for the scale and team size.

**Suggested Approach:**
1. Start with Phase 1 (workers) - low risk, quick win
2. Then Phase 2 (API) - migrate incrementally
3. Keep the option to re-split later if needed (modular architecture makes this easier)

## Alternative: Hybrid Approach

If full consolidation seems too risky, consider a **3-service approach**:

1. **Core API** (onboarding-api + entity-config + work-queue)
2. **Supporting API** (documents + notifications + audit + messaging + webhooks)
3. **Workers** (outbox-relay + compliance-refresh + event consumers)

This reduces from 12+ to 3 services while maintaining some separation.

