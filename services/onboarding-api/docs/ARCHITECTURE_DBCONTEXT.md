# DbContext Architecture Analysis

## Current State: 10 Separate DbContexts

| DbContext | Schema | Purpose |
|-----------|--------|---------|
| `OnboardingDbContext` | `onboarding` | Core case management |
| `DocumentDbContext` | `document` | Document storage metadata |
| `WorkQueueDbContext` | `work_queue` | Work items for reviewers |
| `RiskDbContext` | `risk` | Risk assessments |
| `AuditLogDbContext` | `audit` | Audit trail |
| `ChecklistDbContext` | `checklist` | Verification checklists |
| `NotificationDbContext` | `notification` | Email/SMS notifications |
| `MessagingDbContext` | `messaging` | Internal messaging |
| `EntityConfigurationDbContext` | `entity_configuration` | Dynamic form configs |
| `ProjectionsDbContext` | `projections` | Read-optimized views |

## Issues

### 1. **Connection Pool Exhaustion**
Each DbContext maintains its own connection pool. With 10 contexts × default 100 connections = potential 1000 connections to the same database.

```csharp
// Each of these creates a separate pool
builder.Services.AddDbContext<OnboardingDbContext>(...);
builder.Services.AddDbContext<AuditLogDbContext>(...);
// ... 8 more
```

### 2. **Cross-Schema Transaction Complexity**
Operations spanning multiple schemas require manual coordination:

```csharp
// Current: No transaction coordination
await _onboardingContext.SaveChangesAsync();
await _workQueueContext.SaveChangesAsync(); // If this fails, onboarding is already committed!
await _auditContext.SaveChangesAsync();
```

### 3. **Inconsistent Unit of Work**
Each context has its own `SaveChangesAsync()`, making atomic operations across modules impossible without distributed transactions.

### 4. **Memory Overhead**
Each DbContext instance tracks its own change tracker, metadata cache, and compiled queries.

### 5. **Testing Complexity**
Integration tests need to mock/setup 10 different contexts.

## Recommended Solutions

### Option A: Unified DbContext with Schema Separation (Recommended)

Create a single `UnifiedDbContext` that manages all schemas:

```csharp
public class UnifiedDbContext : DbContext
{
    // Core
    public DbSet<OnboardingCase> OnboardingCases => Set<OnboardingCase>();
    
    // Documents
    public DbSet<Document> Documents => Set<Document>();
    
    // Work Queue
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    
    // ... etc
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Schema separation via configuration
        modelBuilder.Entity<OnboardingCase>().ToTable("onboarding_cases", "onboarding");
        modelBuilder.Entity<Document>().ToTable("documents", "document");
        modelBuilder.Entity<WorkItem>().ToTable("work_items", "work_queue");
        // ... etc
    }
}
```

**Benefits:**
- Single connection pool
- Native transaction support across all entities
- Single Unit of Work
- Simpler testing

**Migration Path:**
1. Create `UnifiedDbContext` with all entities
2. Keep existing contexts as facades (deprecated)
3. Gradually migrate consumers
4. Remove old contexts

### Option B: Bounded Context Consolidation

Group related contexts into 3-4 bounded contexts:

```
CoreContext (onboarding + work_queue + projections)
ComplianceContext (risk + checklist + audit)
CommunicationContext (notification + messaging)
ConfigurationContext (entity_configuration + document)
```

### Option C: Keep Separate but Share Connection Pool

Configure all contexts to use the same `NpgsqlDataSource`:

```csharp
// Create shared data source
var dataSource = NpgsqlDataSource.Create(connectionString);
builder.Services.AddSingleton(dataSource);

// All contexts use the same pool
builder.Services.AddDbContext<OnboardingDbContext>((sp, options) =>
    options.UseNpgsql(sp.GetRequiredService<NpgsqlDataSource>()));
builder.Services.AddDbContext<AuditLogDbContext>((sp, options) =>
    options.UseNpgsql(sp.GetRequiredService<NpgsqlDataSource>()));
// ... etc
```

## Immediate Improvements (Low Risk)

### 1. Shared NpgsqlDataSource

Implement Option C immediately to prevent connection pool exhaustion:

```csharp
// In Program.cs
var connectionString = builder.Configuration.GetConnectionString("PostgreSQL");
var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();
builder.Services.AddSingleton(dataSource);
```

### 2. Cross-Context Transaction Helper

```csharp
public class TransactionCoordinator
{
    public async Task ExecuteInTransactionAsync(
        Func<Task> operation,
        params DbContext[] contexts)
    {
        using var transaction = await contexts[0].Database.BeginTransactionAsync();
        
        foreach (var ctx in contexts.Skip(1))
        {
            await ctx.Database.UseTransactionAsync(transaction.GetDbTransaction());
        }
        
        try
        {
            await operation();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
```

## Migration Priority

1. **Immediate**: Implement shared `NpgsqlDataSource` (Option C)
2. **Short-term**: Add `TransactionCoordinator` for cross-context operations
3. **Medium-term**: Evaluate bounded context consolidation (Option B)
4. **Long-term**: Consider unified context (Option A) if complexity warrants

## Monitoring

Add metrics to track:
- Active connections per context
- Transaction duration across contexts
- Failed cross-context operations
