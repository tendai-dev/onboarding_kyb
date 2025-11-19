# API Consolidation Migration Notes

## AuditLog Service Migration ✅ COMPLETE

### What Was Migrated

The `auditlog-service` has been successfully migrated into `onboarding-api` as the first consolidated module.

### Structure

```
onboarding-api/
├── src/
│   ├── Domain/
│   │   └── Audit/                    # Audit domain layer
│   │       ├── Aggregates/
│   │       │   └── AuditLogEntry.cs
│   │       └── ValueObjects/
│   │           └── AuditValueObjects.cs
│   ├── Application/
│   │   └── Audit/                    # Audit application layer
│   │       ├── Commands/
│   │       ├── Queries/
│   │       └── Interfaces/
│   ├── Infrastructure/
│   │   └── Persistence/
│   │       └── Audit/                # Audit infrastructure
│   │           ├── AuditLogDbContext.cs
│   │           └── AuditLogRepository.cs
│   └── Presentation/
│       └── Controllers/
│           └── Audit/                # Audit API endpoints
│               └── AuditLogController.cs
```

### Endpoints

All audit log endpoints are now available at:
- `POST /api/v1/audit-logs` - Create audit log entry
- `GET /api/v1/audit-logs/{id}` - Get audit log by ID
- `GET /api/v1/audit-logs/entity/{entityType}/{entityId}` - Get logs by entity
- `GET /api/v1/audit-logs/case/{caseId}` - Get logs by case
- `POST /api/v1/audit-logs/search` - Search audit logs

### Database

- Uses `audit` schema in the same PostgreSQL database
- Migration history table: `audit.__EFMigrationsHistory`
- Table: `audit.audit_log_entries`

### Configuration

No additional configuration needed - uses the same PostgreSQL connection string as the main onboarding context.

### Testing

To test the migrated service:

```bash
# Start the unified API
cd services/onboarding-api
dotnet run

# Test endpoints
curl http://localhost:8001/api/v1/audit-logs/search -X POST -H "Content-Type: application/json" -d '{}'
```

### Next Steps

1. Test the audit endpoints work correctly
2. Update any clients that call the old `kyb-audit-api:8011` to use `kyb-case-api:8001/api/v1/audit-logs`
3. Once verified, remove the old `auditlog-service` from docker-compose
4. Proceed with migrating the next service (checklist-service recommended)

## Migration Pattern

This migration establishes the pattern for consolidating other services:

1. **Domain Layer**: Copy to `Domain/{Module}/`
2. **Application Layer**: Copy to `Application/{Module}/`
3. **Infrastructure Layer**: Copy to `Infrastructure/Persistence/{Module}/`
4. **Controller**: Copy to `Presentation/Controllers/{Module}/`
5. **Register in Program.cs**: Add DbContext, repositories, MediatR handlers
6. **Update docker-compose**: Comment out old service
7. **Test thoroughly**: Verify all endpoints work
8. **Update clients**: Point to new endpoints
9. **Decommission**: Remove old service

## Notes

- Each module uses its own database schema for logical separation
- All modules share the same PostgreSQL instance
- MediatR handlers are automatically discovered from the Application assemblies
- Controllers are automatically discovered by ASP.NET Core

