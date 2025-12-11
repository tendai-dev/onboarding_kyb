using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.Audit.Interfaces;
using OnboardingApi.Domain.Audit.Aggregates;
using OnboardingApi.Domain.Audit.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Audit;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class AuditLogRepositoryTests : IDisposable
{
    private readonly AuditLogDbContext _context;
    private readonly AuditLogRepository _repository;

    public AuditLogRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<AuditLogDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AuditLogDbContext(options);
        _repository = new AuditLogRepository(_context);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnEntry_WhenExists()
    {
        // Arrange
        var entry = AuditLogEntry.Create(
            "TestEvent",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description",
            "127.0.0.1",
            "TestAgent");

        await _context.AuditLogEntries.AddAsync(entry);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(entry.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entry.Id.Value, result!.Id.Value);
        Assert.Equal("TestEvent", result.EventType);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var result = await _repository.GetByIdAsync(AuditLogEntryId.New());

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByEntityAsync_ShouldReturnEntries_WhenExists()
    {
        // Arrange
        var entry1 = AuditLogEntry.Create(
            "TestEvent1",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 1",
            "127.0.0.1",
            "TestAgent");

        var entry2 = AuditLogEntry.Create(
            "TestEvent2",
            "TestEntity",
            "entity-123",
            "user-456",
            "User",
            AuditAction.Update,
            "Test description 2",
            "127.0.0.1",
            "TestAgent");

        var entry3 = AuditLogEntry.Create(
            "TestEvent3",
            "OtherEntity",
            "entity-456",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 3",
            "127.0.0.1",
            "TestAgent");

        await _context.AuditLogEntries.AddRangeAsync(entry1, entry2, entry3);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByEntityAsync("TestEntity", "entity-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, e => Assert.Equal("TestEntity", e.EntityType));
        Assert.All(result, e => Assert.Equal("entity-123", e.EntityId));
        // Should be ordered by timestamp descending
        Assert.True(result[0].Timestamp >= result[1].Timestamp);
    }

    [Fact]
    public async Task GetByCaseIdAsync_ShouldReturnEntries_WhenExists()
    {
        // Arrange
        var entry1 = AuditLogEntry.Create(
            "TestEvent1",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 1",
            "127.0.0.1",
            "TestAgent",
            caseId: "case-123");

        var entry2 = AuditLogEntry.Create(
            "TestEvent2",
            "TestEntity",
            "entity-456",
            "user-456",
            "User",
            AuditAction.Update,
            "Test description 2",
            "127.0.0.1",
            "TestAgent",
            caseId: "case-123");

        var entry3 = AuditLogEntry.Create(
            "TestEvent3",
            "OtherEntity",
            "entity-789",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 3",
            "127.0.0.1",
            "TestAgent",
            caseId: "case-456");

        await _context.AuditLogEntries.AddRangeAsync(entry1, entry2, entry3);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByCaseIdAsync("case-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, e => Assert.Equal("case-123", e.CaseId));
        // Should be ordered by timestamp descending
        Assert.True(result[0].Timestamp >= result[1].Timestamp);
    }

    [Fact]
    public async Task GetByUserIdAsync_ShouldReturnEntries_WhenExists()
    {
        // Arrange
        var entry1 = AuditLogEntry.Create(
            "TestEvent1",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 1",
            "127.0.0.1",
            "TestAgent");

        var entry2 = AuditLogEntry.Create(
            "TestEvent2",
            "TestEntity",
            "entity-456",
            "user-123",
            "Admin",
            AuditAction.Update,
            "Test description 2",
            "127.0.0.1",
            "TestAgent");

        var entry3 = AuditLogEntry.Create(
            "TestEvent3",
            "OtherEntity",
            "entity-789",
            "user-456",
            "User",
            AuditAction.Create,
            "Test description 3",
            "127.0.0.1",
            "TestAgent");

        await _context.AuditLogEntries.AddRangeAsync(entry1, entry2, entry3);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByUserIdAsync("user-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, e => Assert.Equal("user-123", e.UserId));
        // Should be ordered by timestamp descending
        Assert.True(result[0].Timestamp >= result[1].Timestamp);
    }

    [Fact]
    public async Task GetByUserIdAsync_ShouldFilterByDateRange_WhenProvided()
    {
        // Arrange
        var baseDate = DateTime.UtcNow;
        var entry1 = AuditLogEntry.Create(
            "TestEvent1",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 1",
            "127.0.0.1",
            "TestAgent");
        // Set timestamp manually via reflection for testing
        var timestampProperty = typeof(AuditLogEntry).GetProperty("Timestamp");
        timestampProperty?.SetValue(entry1, baseDate.AddDays(-5));

        var entry2 = AuditLogEntry.Create(
            "TestEvent2",
            "TestEntity",
            "entity-456",
            "user-123",
            "Admin",
            AuditAction.Update,
            "Test description 2",
            "127.0.0.1",
            "TestAgent");
        timestampProperty?.SetValue(entry2, baseDate.AddDays(-2));

        var entry3 = AuditLogEntry.Create(
            "TestEvent3",
            "OtherEntity",
            "entity-789",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 3",
            "127.0.0.1",
            "TestAgent");
        timestampProperty?.SetValue(entry3, baseDate.AddDays(1));

        await _context.AuditLogEntries.AddRangeAsync(entry1, entry2, entry3);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByUserIdAsync(
            "user-123",
            fromDate: baseDate.AddDays(-3),
            toDate: baseDate);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("TestEvent2", result[0].EventType);
    }

    [Fact]
    public async Task GetByComplianceCategoryAsync_ShouldReturnEntries_WhenExists()
    {
        // Arrange
        var entry1 = AuditLogEntry.Create(
            "TestEvent1",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 1",
            "127.0.0.1",
            "TestAgent",
            complianceCategory: ComplianceCategory.KYC);

        var entry2 = AuditLogEntry.Create(
            "TestEvent2",
            "TestEntity",
            "entity-456",
            "user-456",
            "User",
            AuditAction.Update,
            "Test description 2",
            "127.0.0.1",
            "TestAgent",
            complianceCategory: ComplianceCategory.KYC);

        var entry3 = AuditLogEntry.Create(
            "TestEvent3",
            "OtherEntity",
            "entity-789",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 3",
            "127.0.0.1",
            "TestAgent",
            complianceCategory: ComplianceCategory.AML);

        await _context.AuditLogEntries.AddRangeAsync(entry1, entry2, entry3);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByComplianceCategoryAsync(ComplianceCategory.KYC);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, e => Assert.Equal(ComplianceCategory.KYC, e.ComplianceCategory));
    }

    [Fact]
    public async Task SearchAsync_ShouldFilterByEventType()
    {
        // Arrange
        var entry1 = AuditLogEntry.Create(
            "EventType1",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 1",
            "127.0.0.1",
            "TestAgent");

        var entry2 = AuditLogEntry.Create(
            "EventType2",
            "TestEntity",
            "entity-456",
            "user-456",
            "User",
            AuditAction.Update,
            "Test description 2",
            "127.0.0.1",
            "TestAgent");

        await _context.AuditLogEntries.AddRangeAsync(entry1, entry2);
        await _context.SaveChangesAsync();

        var criteria = new AuditLogSearchCriteria
        {
            EventType = "EventType1"
        };

        // Act
        var result = await _repository.SearchAsync(criteria);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("EventType1", result[0].EventType);
    }

    [Fact]
    public async Task SearchAsync_ShouldFilterByMultipleCriteria()
    {
        // Arrange
        var entry1 = AuditLogEntry.Create(
            "EventType1",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description 1",
            "127.0.0.1",
            "TestAgent",
            caseId: "case-123",
            severity: AuditSeverity.High);

        var entry2 = AuditLogEntry.Create(
            "EventType2",
            "TestEntity",
            "entity-456",
            "user-456",
            "User",
            AuditAction.Update,
            "Test description 2",
            "127.0.0.1",
            "TestAgent",
            caseId: "case-123",
            severity: AuditSeverity.Low);

        await _context.AuditLogEntries.AddRangeAsync(entry1, entry2);
        await _context.SaveChangesAsync();

        var criteria = new AuditLogSearchCriteria
        {
            CaseId = "case-123",
            Severity = AuditSeverity.High
        };

        // Act
        var result = await _repository.SearchAsync(criteria);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("case-123", result[0].CaseId);
        Assert.Equal(AuditSeverity.High, result[0].Severity);
    }

    [Fact]
    public async Task SearchAsync_ShouldRespectSkipAndTake()
    {
        // Arrange
        var entries = Enumerable.Range(1, 10).Select(i =>
            AuditLogEntry.Create(
                $"EventType{i}",
                "TestEntity",
                $"entity-{i}",
                "user-123",
                "Admin",
                AuditAction.Create,
                $"Test description {i}",
                "127.0.0.1",
                "TestAgent")).ToList();

        await _context.AuditLogEntries.AddRangeAsync(entries);
        await _context.SaveChangesAsync();

        var criteria = new AuditLogSearchCriteria
        {
            Skip = 2,
            Take = 3
        };

        // Act
        var result = await _repository.SearchAsync(criteria);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
    }

    [Fact]
    public async Task AddAsync_ShouldAddEntry()
    {
        // Arrange
        var entry = AuditLogEntry.Create(
            "TestEvent",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description",
            "127.0.0.1",
            "TestAgent");

        // Act
        await _repository.AddAsync(entry);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _repository.GetByIdAsync(entry.Id);
        Assert.NotNull(result);
        Assert.Equal(entry.Id.Value, result!.Id.Value);
    }

    [Fact]
    public async Task VerifyIntegrityAsync_ShouldReturnTrue_WhenHashIsValid()
    {
        // Arrange
        var entry = AuditLogEntry.Create(
            "TestEvent",
            "TestEntity",
            "entity-123",
            "user-123",
            "Admin",
            AuditAction.Create,
            "Test description",
            "127.0.0.1",
            "TestAgent");

        await _context.AuditLogEntries.AddAsync(entry);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.VerifyIntegrityAsync(entry.Id);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task VerifyIntegrityAsync_ShouldReturnFalse_WhenEntryNotFound()
    {
        // Act
        var result = await _repository.VerifyIntegrityAsync(AuditLogEntryId.New());

        // Assert
        Assert.False(result);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

