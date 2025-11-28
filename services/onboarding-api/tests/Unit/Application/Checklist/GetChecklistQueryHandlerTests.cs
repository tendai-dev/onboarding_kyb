using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Application.Checklist.Queries;
using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;
using ChecklistItemTemplate = OnboardingApi.Domain.Checklist.ValueObjects.ChecklistItemTemplate;

namespace OnboardingApi.Tests.Unit.Application.Checklist;

public class GetChecklistQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnChecklistDto_WhenChecklistExists()
    {
        // Arrange
        var checklistId = ChecklistId.New();
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            Guid.NewGuid().ToString(),
            new List<ChecklistItemTemplate>());

        var repository = new MockChecklistRepository();
        repository.SetupGetById(checklistId, checklist);
        var handler = new GetChecklistQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetChecklistQuery(checklistId.Value), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(checklist.Id.Value, result.Id);
        Assert.Equal(checklist.CaseId, result.CaseId);
        Assert.Equal(checklist.Type.ToString(), result.Type);
        Assert.Equal(checklist.Status.ToString(), result.Status);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenChecklistNotFound()
    {
        // Arrange
        var checklistId = ChecklistId.New();
        var repository = new MockChecklistRepository();
        repository.SetupGetById(checklistId, null);
        var handler = new GetChecklistQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetChecklistQuery(checklistId.Value), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class GetChecklistByCaseQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnChecklistDto_WhenChecklistExists()
    {
        // Arrange
        var caseId = Guid.NewGuid().ToString();
        var checklist = DomainChecklist.Create(
            caseId,
            ChecklistType.Individual,
            "partner123",
            new List<ChecklistItemTemplate>());

        var repository = new MockChecklistRepository();
        repository.SetupGetByCaseId(caseId, checklist);
        var handler = new GetChecklistByCaseQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetChecklistByCaseQuery(caseId), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(checklist.Id.Value, result.Id);
        Assert.Equal(caseId, result.CaseId);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenChecklistNotFound()
    {
        // Arrange
        var nonexistentCaseId = Guid.NewGuid().ToString();
        var repository = new MockChecklistRepository();
        repository.SetupGetByCaseId(nonexistentCaseId, null);
        var handler = new GetChecklistByCaseQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetChecklistByCaseQuery(nonexistentCaseId), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class GetAllChecklistsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnAllChecklists()
    {
        // Arrange
        var checklist1 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, Guid.NewGuid().ToString(), new List<ChecklistItemTemplate>());
        var checklist2 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Corporate, Guid.NewGuid().ToString(), new List<ChecklistItemTemplate>());

        var repository = new MockChecklistRepository();
        repository.SetupGetAll(new List<DomainChecklist> { checklist1, checklist2 });
        var handler = new GetAllChecklistsQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetAllChecklistsQuery(), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
    }
}

public class GetChecklistsByPartnerQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnChecklistsForPartner()
    {
        // Arrange
        var partnerId = Guid.NewGuid().ToString();
        var checklist1 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, partnerId, new List<ChecklistItemTemplate>());
        var checklist2 = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Corporate, partnerId, new List<ChecklistItemTemplate>());

        var repository = new MockChecklistRepository();
        repository.SetupGetByPartnerId(partnerId, new List<DomainChecklist> { checklist1, checklist2 });
        var handler = new GetChecklistsByPartnerQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetChecklistsByPartnerQuery(partnerId), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, c => Assert.Equal(partnerId, c.PartnerId));
    }
}

public class GetChecklistProgressQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnProgressDto()
    {
        // Arrange
        var checklist = DomainChecklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, Guid.NewGuid().ToString(), new List<ChecklistItemTemplate>());
        
        var repository = new MockChecklistRepository();
        repository.SetupGetById(checklist.Id, checklist);
        var handler = new GetChecklistProgressQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetChecklistProgressQuery(checklist.Id.Value), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(checklist.Id.Value, result.ChecklistId);
        Assert.Equal(checklist.GetCompletionPercentage(), result.CompletionPercentage);
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenChecklistNotFound()
    {
        // Arrange
        var checklistId = ChecklistId.New();
        var repository = new MockChecklistRepository();
        repository.SetupGetById(checklistId, null);
        var handler = new GetChecklistProgressQueryHandler(repository);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new GetChecklistProgressQuery(checklistId.Value), CancellationToken.None));
    }
}

// Mock repository
public class MockChecklistRepository : IChecklistRepository
{
    private readonly Dictionary<Guid, DomainChecklist> _checklists = new();
    private readonly Dictionary<string, DomainChecklist> _checklistsByCaseId = new();
    private readonly Dictionary<string, List<DomainChecklist>> _checklistsByPartnerId = new();
    private List<DomainChecklist> _allChecklists = new();

    public Task<DomainChecklist?> GetByIdAsync(ChecklistId id, CancellationToken cancellationToken = default)
    {
        _checklists.TryGetValue(id.Value, out var checklist);
        return Task.FromResult(checklist);
    }

    public Task<DomainChecklist?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        _checklistsByCaseId.TryGetValue(caseId, out var checklist);
        return Task.FromResult(checklist);
    }

    public Task<List<DomainChecklist>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default)
    {
        _checklistsByPartnerId.TryGetValue(partnerId, out var checklists);
        return Task.FromResult(checklists ?? new List<DomainChecklist>());
    }

    public Task<List<DomainChecklist>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_allChecklists);
    }

    public Task AddAsync(DomainChecklist checklist, CancellationToken cancellationToken = default)
    {
        _checklists[checklist.Id.Value] = checklist;
        _checklistsByCaseId[checklist.CaseId] = checklist;
        return Task.CompletedTask;
    }

    public Task UpdateAsync(DomainChecklist checklist, CancellationToken cancellationToken = default)
    {
        _checklists[checklist.Id.Value] = checklist;
        _checklistsByCaseId[checklist.CaseId] = checklist;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public void SetupGetById(ChecklistId id, DomainChecklist? checklist)
    {
        if (checklist != null)
            _checklists[id.Value] = checklist;
        else
            _checklists.Remove(id.Value);
    }

    public void SetupGetByCaseId(string caseId, DomainChecklist? checklist)
    {
        if (checklist != null)
            _checklistsByCaseId[caseId] = checklist;
        else
            _checklistsByCaseId.Remove(caseId);
    }

    public void SetupGetByPartnerId(string partnerId, List<DomainChecklist> checklists)
    {
        _checklistsByPartnerId[partnerId] = checklists;
    }

    public void SetupGetAll(List<DomainChecklist> checklists)
    {
        _allChecklists = checklists;
    }
}

