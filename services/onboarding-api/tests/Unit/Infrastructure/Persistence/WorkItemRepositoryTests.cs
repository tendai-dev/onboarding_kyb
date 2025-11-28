using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.WorkQueue;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class WorkItemRepositoryTests
{
    private readonly MockLogger<WorkItemRepository> _logger;

    public WorkItemRepositoryTests()
    {
        _logger = new MockLogger<WorkItemRepository>();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnWorkItem_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "John Doe",
            "INDIVIDUAL",
            "US",
            RiskLevel.Medium,
            "creator123");

        context.Set<WorkItem>().Add(workItem);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByIdAsync(workItem.Id, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(workItem.Id, result.Id);
        Assert.Equal("John Doe", result.ApplicantName);
    }

    [Fact]
    public async Task GetByApplicationIdAsync_ShouldReturnWorkItem_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var applicationId = Guid.NewGuid();
        var workItem = WorkItem.Create(
            applicationId,
            "John Doe",
            "INDIVIDUAL",
            "US",
            RiskLevel.Medium,
            "creator123");

        context.Set<WorkItem>().Add(workItem);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByApplicationIdAsync(applicationId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(applicationId, result.ApplicationId);
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterByStatus()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var item1 = WorkItem.Create(Guid.NewGuid(), "John", "INDIVIDUAL", "US", RiskLevel.Low, "creator123");
        var item2 = WorkItem.Create(Guid.NewGuid(), "Jane", "INDIVIDUAL", "US", RiskLevel.Medium, "creator123");
        item2.AssignTo(Guid.NewGuid(), "User2", "admin");

        context.Set<WorkItem>().AddRange(item1, item2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(status: WorkItemStatus.Assigned, cancellationToken: CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(WorkItemStatus.Assigned, result[0].Status);
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterByAssignedTo()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var userId = Guid.NewGuid();
        var item1 = WorkItem.Create(Guid.NewGuid(), "John", "INDIVIDUAL", "US", RiskLevel.Low, "creator123");
        var item2 = WorkItem.Create(Guid.NewGuid(), "Jane", "INDIVIDUAL", "US", RiskLevel.Medium, "creator123");
        item1.AssignTo(userId, "User1", "admin");
        item2.AssignTo(Guid.NewGuid(), "User2", "admin");

        context.Set<WorkItem>().AddRange(item1, item2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(assignedTo: userId, cancellationToken: CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(userId, result[0].AssignedTo);
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterByRiskLevel()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var item1 = WorkItem.Create(Guid.NewGuid(), "John", "INDIVIDUAL", "US", RiskLevel.High, "creator123");
        var item2 = WorkItem.Create(Guid.NewGuid(), "Jane", "INDIVIDUAL", "US", RiskLevel.Low, "creator123");

        context.Set<WorkItem>().AddRange(item1, item2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(riskLevel: RiskLevel.High, cancellationToken: CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(RiskLevel.High, result[0].RiskLevel);
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterByCountry()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var item1 = WorkItem.Create(Guid.NewGuid(), "John", "INDIVIDUAL", "US", RiskLevel.Low, "creator123");
        var item2 = WorkItem.Create(Guid.NewGuid(), "Jane", "INDIVIDUAL", "CA", RiskLevel.Low, "creator123");

        context.Set<WorkItem>().AddRange(item1, item2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(country: "US", cancellationToken: CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal("US", result[0].Country);
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterBySearchTerm()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var item1 = WorkItem.Create(Guid.NewGuid(), "John Doe", "INDIVIDUAL", "US", RiskLevel.Low, "creator123");
        var item2 = WorkItem.Create(Guid.NewGuid(), "Jane Smith", "CORPORATE", "CA", RiskLevel.Low, "creator123");

        context.Set<WorkItem>().AddRange(item1, item2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(searchTerm: "John", cancellationToken: CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Contains("John", result[0].ApplicantName);
    }

    [Fact]
    public async Task GetByAssignedUserAsync_ShouldReturnWorkItems()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var userId = Guid.NewGuid();
        var item1 = WorkItem.Create(Guid.NewGuid(), "John", "INDIVIDUAL", "US", RiskLevel.Low, "creator123");
        var item2 = WorkItem.Create(Guid.NewGuid(), "Jane", "INDIVIDUAL", "US", RiskLevel.Low, "creator123");
        item1.AssignTo(userId, "User1", "admin");
        item2.AssignTo(userId, "User2", "admin");

        context.Set<WorkItem>().AddRange(item1, item2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByAssignedUserAsync(userId, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, item => Assert.Equal(userId, item.AssignedTo));
    }

    [Fact]
    public async Task GetPendingApprovalsAsync_ShouldReturnPendingItems()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var item1 = WorkItem.Create(Guid.NewGuid(), "John", "INDIVIDUAL", "US", RiskLevel.High, "creator123");
        var item2 = WorkItem.Create(Guid.NewGuid(), "Jane", "INDIVIDUAL", "US", RiskLevel.Critical, "creator123");
        item1.AssignTo(Guid.NewGuid(), "User1", "admin");
        item1.StartReview("reviewer1");
        item1.SubmitForApproval("submitter1");
        item2.AssignTo(Guid.NewGuid(), "User2", "admin");
        item2.StartReview("reviewer2");
        item2.SubmitForApproval("submitter2");

        context.Set<WorkItem>().AddRange(item1, item2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetPendingApprovalsAsync(null, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, item => Assert.Equal(WorkItemStatus.PendingApproval, item.Status));
    }

    [Fact]
    public async Task GetPendingApprovalsAsync_ShouldFilterByMinimumRiskLevel()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var item1 = WorkItem.Create(Guid.NewGuid(), "John", "INDIVIDUAL", "US", RiskLevel.High, "creator123");
        var item2 = WorkItem.Create(Guid.NewGuid(), "Jane", "INDIVIDUAL", "US", RiskLevel.Medium, "creator123");
        item1.AssignTo(Guid.NewGuid(), "User1", "admin");
        item1.StartReview("reviewer1");
        item1.SubmitForApproval("submitter1");
        // item2 doesn't require approval (Medium risk), so we can't submit it for approval

        context.Set<WorkItem>().AddRange(item1, item2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetPendingApprovalsAsync(RiskLevel.High, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(RiskLevel.High, result[0].RiskLevel);
    }

    [Fact]
    public async Task AddAsync_ShouldAddWorkItem()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<WorkQueueDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new WorkQueueDbContext(options);
        var repository = new WorkItemRepository(context, _logger);

        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "John Doe",
            "INDIVIDUAL",
            "US",
            RiskLevel.Medium,
            "creator123");

        // Act
        await repository.AddAsync(workItem, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(workItem.Id, CancellationToken.None);
        Assert.NotNull(result);
    }
}

