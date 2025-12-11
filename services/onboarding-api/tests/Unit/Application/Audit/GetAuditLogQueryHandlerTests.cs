using OnboardingApi.Application.Audit.Interfaces;
using OnboardingApi.Application.Audit.Queries;
using OnboardingApi.Domain.Audit.Aggregates;
using OnboardingApi.Domain.Audit.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Audit;

public class GetAuditLogQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnAuditLogDto_WhenEntryExists()
    {
        // Arrange
        var entry = AuditLogEntry.Create(
            "TestEvent",
            "TestEntity",
            "entity123",
            "user123",
            "Admin",
            AuditAction.Create,
            "Test action",
            "192.168.1.1",
            "TestAgent",
            "case123",
            "partner123");

        var repository = new MockAuditLogQueryRepository();
        repository.SetupGetById(entry.Id, entry);
        repository.SetupVerifyIntegrity(entry.Id, true);
        // Also need to add the entry to the repository so GetByIdAsync can find it
        await repository.AddAsync(entry, CancellationToken.None);
        var handler = new GetAuditLogQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetAuditLogQuery(entry.Id.Value), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entry.Id.Value, result.Id);
        Assert.Equal(entry.EventType, result.EventType);
        Assert.Equal(entry.EntityType, result.EntityType);
        Assert.True(result.IntegrityVerified);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenEntryNotFound()
    {
        // Arrange
        var entryId = AuditLogEntryId.New();
        var repository = new MockAuditLogQueryRepository();
        repository.SetupGetById(entryId, null);
        var handler = new GetAuditLogQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetAuditLogQuery(entryId.Value), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class GetAuditLogsByEntityQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnAuditLogsForEntity()
    {
        // Arrange
        var entityType = "TestEntity";
        var entityId = "entity123";
        var entry1 = AuditLogEntry.Create("Event1", entityType, entityId, "user1", "Admin", AuditAction.Create, "Action1", "192.168.1.1", "Agent1", "case1", "partner1");
        var entry2 = AuditLogEntry.Create("Event2", entityType, entityId, "user1", "Admin", AuditAction.Update, "Action2", "192.168.1.1", "Agent1", "case1", "partner1");

        var repository = new MockAuditLogQueryRepository();
        repository.SetupGetByEntity(entityType, entityId, new List<AuditLogEntry> { entry1, entry2 });
        repository.SetupVerifyIntegrity(entry1.Id, true);
        repository.SetupVerifyIntegrity(entry2.Id, true);
        var handler = new GetAuditLogsByEntityQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetAuditLogsByEntityQuery(entityType, entityId), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, e => Assert.Equal(entityType, e.EntityType));
        Assert.All(result, e => Assert.Equal(entityId, e.EntityId));
    }
}

public class GetAuditLogsByCaseQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnAuditLogsForCase()
    {
        // Arrange
        var caseId = "case123";
        var entry1 = AuditLogEntry.Create("Event1", "Entity1", "id1", "user1", "Admin", AuditAction.Create, "Action1", "192.168.1.1", "Agent1", caseId, "partner1");
        var entry2 = AuditLogEntry.Create("Event2", "Entity2", "id2", "user1", "Admin", AuditAction.Update, "Action2", "192.168.1.1", "Agent1", caseId, "partner1");

        var repository = new MockAuditLogQueryRepository();
        repository.SetupGetByCaseId(caseId, new List<AuditLogEntry> { entry1, entry2 });
        var handler = new GetAuditLogsByCaseQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetAuditLogsByCaseQuery(caseId), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, e => Assert.Equal(caseId, e.CaseId));
    }
}

// Mock repository for query handlers
public class MockAuditLogQueryRepository : IAuditLogRepository
{
    private readonly Dictionary<Guid, AuditLogEntry> _entries = new();
    private readonly Dictionary<string, List<AuditLogEntry>> _entriesByCaseId = new();
    private readonly Dictionary<(string, string), List<AuditLogEntry>> _entriesByEntity = new();
    private readonly Dictionary<Guid, bool> _integrityVerification = new();

    public Task<AuditLogEntry?> GetByIdAsync(AuditLogEntryId id, CancellationToken cancellationToken = default)
    {
        _entries.TryGetValue(id.Value, out var entry);
        return Task.FromResult(entry);
    }

    public Task<List<AuditLogEntry>> GetByEntityAsync(string entityType, string entityId, CancellationToken cancellationToken = default)
    {
        _entriesByEntity.TryGetValue((entityType, entityId), out var entries);
        return Task.FromResult(entries ?? new List<AuditLogEntry>());
    }

    public Task<List<AuditLogEntry>> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        _entriesByCaseId.TryGetValue(caseId, out var entries);
        return Task.FromResult(entries ?? new List<AuditLogEntry>());
    }

    public Task<List<AuditLogEntry>> GetByUserIdAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<AuditLogEntry>());
    }

    public Task<List<AuditLogEntry>> GetByComplianceCategoryAsync(ComplianceCategory category, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<AuditLogEntry>());
    }

    public Task<List<AuditLogEntry>> SearchAsync(AuditLogSearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<AuditLogEntry>());
    }

    public Task<bool> VerifyIntegrityAsync(AuditLogEntryId id, CancellationToken cancellationToken = default)
    {
        _integrityVerification.TryGetValue(id.Value, out var verified);
        return Task.FromResult(verified);
    }

    public Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken = default)
    {
        _entries[entry.Id.Value] = entry;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public void SetupGetById(AuditLogEntryId id, AuditLogEntry? entry)
    {
        if (entry != null)
            _entries[id.Value] = entry;
        else
            _entries.Remove(id.Value);
    }

    public void SetupGetByCaseId(string caseId, List<AuditLogEntry> entries)
    {
        _entriesByCaseId[caseId] = entries;
    }

    public void SetupGetByEntity(string entityType, string entityId, List<AuditLogEntry> entries)
    {
        _entriesByEntity[(entityType, entityId)] = entries;
    }

    public void SetupVerifyIntegrity(AuditLogEntryId id, bool verified)
    {
        _integrityVerification[id.Value] = verified;
    }
}

