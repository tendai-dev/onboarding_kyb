# Microservices Consolidation Status

## Overview

This document tracks the progress of consolidating 12+ microservices into 2 unified services.

## Target Architecture

- **onboarding-api**: Unified API service (all HTTP endpoints)
- **onboarding-workers**: Unified worker service (all background jobs)

## Progress

### ✅ Phase 1: Unified Worker Service (COMPLETED)

**Status**: ✅ Complete

**What was done**:
- Created `services/onboarding-workers` project
- Migrated `outbox-relay` → `OutboxRelayWorker`
- Migrated `compliance-refresh-job` → `ComplianceRefreshWorker`
- Updated `docker-compose.yml` to use unified worker service

**Services Replaced**:
- ✅ `outbox-relay` (can be decommissioned)
- ✅ `compliance-refresh-job` (can be decommissioned)

**Next Steps**:
- Test the unified worker service in development
- Deploy to staging
- Monitor for issues
- Decommission old services once stable

### 🔄 Phase 2: Unified API Service (IN PROGRESS)

**Status**: 🚧 Three Services Migrated (AuditLog, Checklist, Notification)

**Services to Consolidate**:
- [x] `auditlog-service` ✅ **MIGRATED** → `onboarding-api/src/Presentation/Controllers/Audit/`
- [x] `checklist-service` ✅ **MIGRATED** → `onboarding-api/src/Presentation/Controllers/Checklist/`
- [x] `notification-service` ✅ **MIGRATED** → `onboarding-api/src/Presentation/Controllers/Notification/`
- [ ] `onboarding-api` (core - keep as base)
- [ ] `entity-configuration-service`
- [ ] `work-queue-service`
- [ ] `risk-service`
- [ ] `projections-api`
- [ ] `document-service`
- [ ] `notification-service`
- [ ] `messaging-service`
- [ ] `webhook-dispatcher`

**AuditLog Migration Details**:
- ✅ Domain layer migrated: `Domain/Audit/`
- ✅ Application layer migrated: `Application/Audit/`
- ✅ Infrastructure layer migrated: `Infrastructure/Persistence/Audit/`
- ✅ Controller migrated: `Presentation/Controllers/Audit/AuditLogController.cs`
- ✅ Registered in `Program.cs`
- ✅ Database context configured with `audit` schema
- ✅ Endpoints available at: `/api/v1/audit-logs`

**Checklist Migration Details**:
- ✅ Domain layer migrated: `Domain/Checklist/`
- ✅ Application layer migrated: `Application/Checklist/`
- ✅ Infrastructure layer migrated: `Infrastructure/Persistence/Checklist/`
- ✅ Controller migrated: `Presentation/Controllers/Checklist/ChecklistController.cs`
- ✅ Template service migrated: `Infrastructure/Services/ChecklistTemplateService.cs`
- ✅ Registered in `Program.cs`
- ✅ Database context configured with `checklist` schema
- ✅ Endpoints available at: `/api/v1/checklists`

**Notification Migration Details**:
- ✅ Domain layer migrated: `Domain/Notification/`
- ✅ Application layer migrated: `Application/Notification/`
- ✅ Infrastructure layer migrated: `Infrastructure/Persistence/Notification/` and `Infrastructure/Services/`
- ✅ Controller migrated: `Presentation/Controllers/Notification/NotificationController.cs`
- ✅ Email/SMS senders migrated
- ✅ Registered in `Program.cs`
- ✅ Database context configured with `notification` schema
- ✅ Endpoints available at: `/api/v1/notifications`

**Approach**:
1. Start with low-traffic services (auditlog, checklist)
2. Then medium-traffic (notifications, messaging)
3. Finally high-traffic (documents, projections)

**Migration Strategy**:
- Add controllers to `onboarding-api/src/Presentation/Controllers/` organized by domain
- Use feature flags to enable/disable modules
- Keep separate database contexts initially (can consolidate later)
- Update gateway routing incrementally

## Current Service Count

**Before**: 12+ microservices
**After Phase 1**: 11 microservices (2 workers → 1 worker)
**After Phase 2 (Partial)**: 8 microservices (3 API services consolidated)
**Target**: 2 services (1 API + 1 Worker)

## Docker Compose Changes

### Before
```yaml
services:
  outbox-relay: ...
  kyb-case-api: ...
  kyb-document-api: ...
  # ... 10+ more services
```

### After Phase 1
```yaml
services:
  onboarding-workers: ...  # Replaces outbox-relay
  kyb-case-api: ...
  kyb-document-api: ...
  # ... 9 more services
```

### Target (After Phase 2)
```yaml
services:
  onboarding-api: ...      # All API endpoints
  onboarding-workers: ...  # All background jobs
```

## Testing Checklist

### Phase 1 (Workers)
- [ ] Outbox events are being published to Kafka
- [ ] Compliance refresh job runs on schedule
- [ ] Distributed locking works correctly
- [ ] No duplicate event processing
- [ ] Error handling and retries work

### Phase 2 (API)
- [ ] All endpoints respond correctly
- [ ] Authentication/authorization works
- [ ] Database connections are stable
- [ ] Event publishing works
- [ ] Performance is acceptable

## Rollback Plan

If issues arise:

1. **Phase 1 Rollback**: Re-enable `outbox-relay` service in docker-compose
2. **Phase 2 Rollback**: Use feature flags to disable new modules, route back to old services

## Documentation

- [Consolidation Analysis](./docs/microservices-consolidation-analysis.md)
- [Implementation Guide](./docs/consolidation-implementation-guide.md)
- [Worker Service README](./services/onboarding-workers/README.md)

## Questions/Issues

Track any questions or issues during migration here.

