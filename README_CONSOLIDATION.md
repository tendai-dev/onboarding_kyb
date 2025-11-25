# Microservices Consolidation - README

## 🎉 Consolidation Complete!

All **12+ microservices** have been successfully consolidated into **2 unified services**.

## Quick Start

### 1. Start Services
```bash
# Option 1: Use the startup script
./scripts/start-consolidated-services.sh

# Option 2: Manual start
docker-compose up -d postgres redis kafka minio
docker-compose up -d onboarding-api onboarding-workers gateway
```

### 2. Verify Services
```bash
# Run verification script
./scripts/verify-consolidation.sh

# Or manually check
curl http://localhost:8001/health
curl http://localhost:8000/health
```

### 3. Access Services
- **API**: http://localhost:8001
- **Gateway**: http://localhost:8000
- **Swagger**: http://localhost:8001/swagger

## Architecture

```
┌─────────────┐
│   Gateway   │ (Port 8000)
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼────┐ ┌─▼────────┐
│  API  │ │ Workers  │
└───────┘ └──────────┘
```

## Services Consolidated

### Unified API (`onboarding-api`)
All HTTP endpoints are now in one service:
- `/api/v1/audit-logs` - Audit logging
- `/api/v1/checklists` - Checklists
- `/api/v1/notifications` - Notifications
- `/api/v1/messages` - Messaging
- `/api/v1/webhooks` - Webhooks
- `/api/v1/entity-types` - Entity configuration
- `/api/v1/workqueue` - Work queue
- `/api/v1/risk-assessments` - Risk assessment
- `/api/v1/projections` - Dashboard & projections
- `/api/v1/documents` - Document management

### Unified Workers (`onboarding-workers`)
All background jobs in one service:
- Outbox Relay Worker
- Compliance Refresh Worker

## Documentation

- **Complete Guide**: `CONSOLIDATION_COMPLETE.md`
- **Testing Checklist**: `TESTING_CHECKLIST.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Migration Summary**: `MIGRATION_SUMMARY.md`
- **Quick Reference**: `QUICK_REFERENCE.md`

## Key Benefits

✅ **83% reduction** in service count (12+ → 2)  
✅ **Simplified deployment** - One API service  
✅ **Easier debugging** - All logs in one place  
✅ **Better resource utilization** - Shared pools  
✅ **Lower costs** - Fewer containers  

## Next Steps

1. ✅ **Code Migration** - Complete
2. ✅ **Configuration Updates** - Complete
3. ⏳ **Testing** - Use `TESTING_CHECKLIST.md`
4. ⏳ **Staging Deployment** - Use `DEPLOYMENT_GUIDE.md`
5. ⏳ **Production Deployment** - After staging validation

## Support

For issues:
- Check logs: `docker-compose logs onboarding-api`
- Run verification: `./scripts/verify-consolidation.sh`
- See troubleshooting in `DEPLOYMENT_GUIDE.md`

---

**Status**: ✅ **READY FOR TESTING**

