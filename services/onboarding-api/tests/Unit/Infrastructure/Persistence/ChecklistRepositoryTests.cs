using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Checklist;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class ChecklistRepositoryTests
{
    [Fact]
    public async Task GetByIdAsync_ShouldReturnChecklist_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ChecklistDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new ChecklistDbContext(options);
        var repository = new ChecklistRepository(context);

        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "ID_VERIFY", Name = "Identity Verification", Description = "Verify ID", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 }
        };
        var caseId = Guid.NewGuid().ToString();
        var partnerId = Guid.NewGuid().ToString();
        var checklist = DomainChecklist.Create(caseId, ChecklistType.Individual, partnerId, templates);

        context.Set<DomainChecklist>().Add(checklist);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByIdAsync(checklist.Id, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(checklist.Id, result.Id);
        Assert.Equal(caseId, result.CaseId);
    }

    [Fact]
    public async Task GetByCaseIdAsync_ShouldReturnChecklist_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ChecklistDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new ChecklistDbContext(options);
        var repository = new ChecklistRepository(context);

        var caseId = Guid.NewGuid().ToString();
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "ID_VERIFY", Name = "Identity Verification", Description = "Verify ID", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 }
        };
        var checklist = DomainChecklist.Create(caseId, ChecklistType.Individual, Guid.NewGuid().ToString(), templates);

        context.Set<DomainChecklist>().Add(checklist);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByCaseIdAsync(caseId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(caseId, result.CaseId);
    }

    [Fact]
    public async Task GetByPartnerIdAsync_ShouldReturnChecklists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ChecklistDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new ChecklistDbContext(options);
        var repository = new ChecklistRepository(context);

        var partnerIdGuid = Guid.NewGuid().ToString();
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "ID_VERIFY", Name = "Identity Verification", Description = "Verify ID", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 }
        };
        var checklist1 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, partnerIdGuid, templates);
        var checklist2 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Corporate, partnerIdGuid, templates);
        var checklist3 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, Guid.NewGuid().ToString(), templates);

        context.Set<DomainChecklist>().AddRange(checklist1, checklist2, checklist3);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByPartnerIdAsync(partnerIdGuid, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, c => Assert.Equal(partnerIdGuid, c.PartnerId));
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllChecklists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ChecklistDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new ChecklistDbContext(options);
        var repository = new ChecklistRepository(context);

        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "ID_VERIFY", Name = "Identity Verification", Description = "Verify ID", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 }
        };
        var partnerIdGuid = Guid.NewGuid().ToString();
        var checklist1 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, partnerIdGuid, templates);
        var checklist2 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Corporate, partnerIdGuid, templates);

        context.Set<DomainChecklist>().AddRange(checklist1, checklist2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task AddAsync_ShouldAddChecklist()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ChecklistDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new ChecklistDbContext(options);
        var repository = new ChecklistRepository(context);

        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "ID_VERIFY", Name = "Identity Verification", Description = "Verify ID", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 }
        };
        var checklist = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, Guid.NewGuid().ToString(), templates);

        // Act
        await repository.AddAsync(checklist, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(checklist.Id, CancellationToken.None);
        Assert.NotNull(result);
    }

}

