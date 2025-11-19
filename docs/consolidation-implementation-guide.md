# Consolidation Implementation Guide

## Quick Start: Phase 1 - Unified Worker Service

This guide shows how to create the unified worker service as a low-risk first step.

### Step 1: Create Unified Worker Project

```bash
cd services
dotnet new worker -n onboarding-workers
cd onboarding-workers
```

### Step 2: Add Required Packages

```xml
<ItemGroup>
  <PackageReference Include="Confluent.Kafka" Version="2.3.0" />
  <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
  <PackageReference Include="StackExchange.Redis" Version="2.7.10" />
  <PackageReference Include="Polly" Version="8.2.0" />
  <PackageReference Include="Microsoft.Extensions.Hosting" Version="8.0.0" />
</ItemGroup>
```

### Step 3: Project Structure

```
onboarding-workers/
├── src/
│   ├── Workers/
│   │   ├── OutboxRelayWorker.cs      (from outbox-relay)
│   │   ├── ComplianceRefreshWorker.cs (from compliance-refresh-job)
│   │   └── EventConsumerWorker.cs     (optional: move Kafka consumers here)
│   ├── Infrastructure/
│   │   ├── Kafka/
│   │   ├── Database/
│   │   └── Redis/
│   └── Program.cs
```

### Step 4: Program.cs Structure

```csharp
var builder = Host.CreateApplicationBuilder(args);

// Configure services
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis")));

// Register workers
builder.Services.AddHostedService<OutboxRelayWorker>();
builder.Services.AddHostedService<ComplianceRefreshWorker>();
// Add more workers as needed

var host = builder.Build();
await host.RunAsync();
```

## Phase 2: Unified API Service Structure

### Recommended Folder Structure

```
onboarding-api/
├── src/
│   ├── Presentation/
│   │   ├── Controllers/
│   │   │   ├── Cases/              (from onboarding-api)
│   │   │   ├── Documents/          (from document-service)
│   │   │   ├── Risk/               (from risk-service)
│   │   │   ├── WorkQueue/          (from work-queue-service)
│   │   │   ├── Projections/        (from projections-api)
│   │   │   ├── Notifications/      (from notification-service)
│   │   │   ├── Audit/              (from auditlog-service)
│   │   │   ├── EntityConfig/       (from entity-configuration-service)
│   │   │   ├── Checklist/          (from checklist-service)
│   │   │   ├── Messaging/          (from messaging-service)
│   │   │   └── Webhooks/           (from webhook-dispatcher)
│   │   └── Middleware/
│   ├── Application/
│   │   ├── Cases/
│   │   ├── Documents/
│   │   ├── Risk/
│   │   └── ... (domain modules)
│   ├── Domain/
│   │   ├── Cases/
│   │   ├── Documents/
│   │   └── ... (domain modules)
│   ├── Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── OnboardingDbContext.cs
│   │   │   ├── DocumentDbContext.cs
│   │   │   └── ... (or unified context with schemas)
│   │   ├── Kafka/
│   │   ├── Storage/
│   │   └── External/
│   └── Program.cs
```

### Database Context Consolidation Options

#### Option A: Multiple DbContexts (Easier Migration)

```csharp
// Keep separate contexts but in same project
services.AddDbContext<OnboardingDbContext>(options => 
    options.UseNpgsql(connString, o => o.MigrationsHistoryTable("__EFMigrationsHistory", "onboarding")));

services.AddDbContext<DocumentDbContext>(options => 
    options.UseNpgsql(connString, o => o.MigrationsHistoryTable("__EFMigrationsHistory", "documents")));
```

#### Option B: Single Unified Context (Better Long-term)

```csharp
public class UnifiedDbContext : DbContext
{
    public DbSet<OnboardingCase> Cases { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<RiskAssessment> RiskAssessments { get; set; }
    // ... other entities

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Use schemas for separation
        modelBuilder.HasDefaultSchema("onboarding");
        modelBuilder.Entity<Document>().ToTable("documents", "documents");
        modelBuilder.Entity<RiskAssessment>().ToTable("risk_assessments", "risk");
        // ...
    }
}
```

## Migration Strategy: Controller-by-Controller

### Example: Migrating Document Service

1. **Copy Controller**
```csharp
// From: services/document-service/src/Presentation/Controllers/DocumentsController.cs
// To: services/onboarding-api/src/Presentation/Controllers/Documents/DocumentsController.cs
```

2. **Copy Application Layer**
```bash
cp -r services/document-service/src/Application/* services/onboarding-api/src/Application/Documents/
```

3. **Copy Domain Layer**
```bash
cp -r services/document-service/src/Domain/* services/onboarding-api/src/Domain/Documents/
```

4. **Update Dependencies**
   - Update namespaces
   - Update DI registrations
   - Update database context references

5. **Update Routing**
```csharp
// In Program.cs or controller
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    // ...
}
```

6. **Test**
   - Unit tests
   - Integration tests
   - Manual API testing

7. **Update Gateway**
```yaml
# Update nginx.conf or gateway config
location /api/documents {
    proxy_pass http://onboarding-api:8001;
}
```

8. **Deploy & Monitor**
   - Deploy new API
   - Monitor for errors
   - Gradually shift traffic
   - Decommission old service

## Configuration Management

### Unified appsettings.json Structure

```json
{
  "ConnectionStrings": {
    "PostgreSQL": "Host=postgres;Database=onboarding;...",
    "Redis": "redis:6379"
  },
  "Kafka": {
    "BootstrapServers": "kafka:9092"
  },
  "Modules": {
    "Documents": {
      "Enabled": true,
      "Storage": { ... }
    },
    "Notifications": {
      "Enabled": true,
      "SMTP": { ... }
    }
  }
}
```

### Feature Flags (Optional)

```csharp
// In Program.cs
if (builder.Configuration.GetValue<bool>("Modules:Documents:Enabled"))
{
    builder.Services.AddDocumentModule();
}

if (builder.Configuration.GetValue<bool>("Modules:Notifications:Enabled"))
{
    builder.Services.AddNotificationModule();
}
```

## Docker Compose Update

### Before (12+ services)
```yaml
services:
  kyb-case-api: ...
  kyb-document-api: ...
  kyb-risk-api: ...
  # ... 9 more services
```

### After (2 services)
```yaml
services:
  onboarding-api:
    build: ./services/onboarding-api
    ports:
      - "8001:8001"
    environment:
      - ASPNETCORE_URLS=http://0.0.0.0:8001
      # All module configs here
  
  onboarding-workers:
    build: ./services/onboarding-workers
    environment:
      # Worker configs here
    depends_on:
      - postgres
      - kafka
      - redis
```

## Testing Strategy

### 1. Unit Tests
- Keep existing unit tests
- Update namespaces
- Test module isolation

### 2. Integration Tests
- Test API endpoints
- Test worker jobs
- Test event flow

### 3. Contract Tests
- Verify API contracts unchanged
- Test backward compatibility

### 4. Load Tests
- Test consolidated API under load
- Compare performance metrics

## Rollback Plan

### If Issues Arise

1. **Keep old services running** during migration
2. **Use feature flags** to disable new modules
3. **Route traffic back** to old services via gateway
4. **Gradual migration** - one module at a time

### Rollback Steps

```bash
# 1. Update gateway to route back to old services
# 2. Scale down new unified service
# 3. Scale up old services
# 4. Investigate issues
# 5. Fix and retry
```

## Monitoring & Observability

### Key Metrics to Monitor

1. **API Metrics**
   - Request rate per endpoint
   - Response times
   - Error rates
   - Database connection pool usage

2. **Worker Metrics**
   - Job execution times
   - Job success/failure rates
   - Queue depths
   - Outbox processing lag

3. **Resource Metrics**
   - CPU usage
   - Memory usage
   - Database connections
   - Kafka consumer lag

### Logging Strategy

```csharp
// Use structured logging with module context
_logger.LogInformation(
    "Document uploaded. Module: {Module}, DocumentId: {DocumentId}",
    "Documents",
    documentId);
```

## Common Pitfalls & Solutions

### Pitfall 1: Namespace Conflicts
**Solution**: Use clear namespace structure
```csharp
namespace OnboardingApi.Documents.Application;
namespace OnboardingApi.Risk.Application;
```

### Pitfall 2: Database Migration Conflicts
**Solution**: Use separate migration assemblies or schemas
```csharp
// Separate migration history per schema
options.UseNpgsql(connString, o => 
    o.MigrationsHistoryTable("__EFMigrationsHistory", "documents"));
```

### Pitfall 3: Configuration Conflicts
**Solution**: Use hierarchical configuration with prefixes
```json
{
  "Documents": { "Storage": { ... } },
  "Notifications": { "SMTP": { ... } }
}
```

### Pitfall 4: Dependency Injection Conflicts
**Solution**: Use extension methods for module registration
```csharp
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDocumentModule(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<IDocumentService, DocumentService>();
        // ... module-specific registrations
        return services;
    }
}
```

## Next Steps

1. **Review this guide** with the team
2. **Start with Phase 1** (unified workers) - low risk
3. **Create proof of concept** for unified API
4. **Migrate one controller** as a test
5. **Iterate and improve** based on learnings
6. **Full migration** once confident

## Questions to Answer Before Starting

- [ ] Do we need to maintain backward compatibility?
- [ ] What's our rollback strategy?
- [ ] How will we handle database migrations?
- [ ] What's our testing strategy?
- [ ] How will we monitor the consolidated services?
- [ ] What's our deployment process?
- [ ] Do we need feature flags?

