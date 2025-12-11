using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Application.WorkQueue.Queries;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.WorkQueue;

public class GetWorkItemsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnPagedWorkItems()
    {
        // Arrange
        var workItems = new List<WorkItem>();
        for (int i = 0; i < 5; i++)
        {
            workItems.Add(WorkItem.Create(Guid.NewGuid(), $"Applicant{i}", "Individual", "US", RiskLevel.Low, "creator"));
        }
        
        var repository = new MockWorkItemRepository();
        repository.SetupGetAll(null, null, null, null, null, null, workItems);

        var handler = new GetWorkItemsQueryHandler(repository);
        var query = new GetWorkItemsQuery(Page: 1, PageSize: 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Items.Count);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
    }

    [Fact]
    public async Task Handle_ShouldRespectPagination()
    {
        // Arrange
        var workItems = new List<WorkItem>();
        for (int i = 0; i < 10; i++)
        {
            workItems.Add(WorkItem.Create(Guid.NewGuid(), $"Applicant{i}", "Individual", "US", RiskLevel.Low, "creator"));
        }
        
        var repository = new MockWorkItemRepository();
        repository.SetupGetAll(null, null, null, null, null, null, workItems);

        var handler = new GetWorkItemsQueryHandler(repository);
        var query = new GetWorkItemsQuery(Page: 2, PageSize: 3);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Items.Count);
        Assert.Equal(10, result.TotalCount);
        Assert.Equal(2, result.Page);
    }
}

public class GetWorkItemByIdQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnWorkItemDto_WhenWorkItemExists()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Medium, "creator");
        
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);

        var handler = new GetWorkItemByIdQueryHandler(repository);
        var query = new GetWorkItemByIdQuery(workItem.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(workItem.Id, result.Id);
        Assert.Equal(workItem.WorkItemNumber, result.WorkItemNumber);
        Assert.Equal("Medium", result.RiskLevel);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new GetWorkItemByIdQueryHandler(repository);
        var query = new GetWorkItemByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class GetWorkItemHistoryQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnHistory_WhenWorkItemExists()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Low, "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);

        var handler = new GetWorkItemHistoryQueryHandler(repository);
        var query = new GetWorkItemHistoryQuery(workItem.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count); // Created, Assigned, Review started
        Assert.Equal("Review started", result[0].Action);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new GetWorkItemHistoryQueryHandler(repository);
        var query = new GetWorkItemHistoryQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}

public class GetWorkItemCommentsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnComments_WhenWorkItemExists()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Low, "creator");
        workItem.AddComment("First comment", "author1", "Author 1");
        workItem.AddComment("Second comment", "author2", "Author 2");
        
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);

        var handler = new GetWorkItemCommentsQueryHandler(repository);
        var query = new GetWorkItemCommentsQuery(workItem.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        // Comments are ordered by CreatedAt descending, so most recent first
        var commentTexts = result.Select(c => c.Text).ToList();
        Assert.Contains("First comment", commentTexts);
        Assert.Contains("Second comment", commentTexts);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new GetWorkItemCommentsQueryHandler(repository);
        var query = new GetWorkItemCommentsQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}

public class GetMyWorkItemsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnPagedWorkItems_ForAssignedUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var workItems = new List<WorkItem>();
        for (int i = 0; i < 5; i++)
        {
            var wi = WorkItem.Create(Guid.NewGuid(), $"Applicant{i}", "Individual", "US", RiskLevel.Low, "creator");
            wi.AssignTo(userId, "User", "assigner");
            workItems.Add(wi);
        }
        
        var repository = new MockWorkItemRepository();
        repository.SetupGetByAssignedUser(userId, workItems);

        var handler = new GetMyWorkItemsQueryHandler(repository);
        var query = new GetMyWorkItemsQuery(userId, Page: 1, PageSize: 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Items.Count);
        Assert.Equal(5, result.TotalCount);
    }
}

public class GetPendingApprovalsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnPendingApprovals()
    {
        // Arrange
        var workItems = new List<WorkItem>();
        for (int i = 0; i < 3; i++)
        {
            var wi = WorkItem.Create(Guid.NewGuid(), $"Applicant{i}", "Individual", "US", RiskLevel.High, "creator");
            wi.AssignTo(Guid.NewGuid(), "User", "assigner");
            wi.StartReview("reviewer");
            wi.SubmitForApproval("submitter");
            workItems.Add(wi);
        }
        
        var repository = new MockWorkItemRepository();
        repository.SetupGetPendingApprovals(null, workItems);

        var handler = new GetPendingApprovalsQueryHandler(repository);
        var query = new GetPendingApprovalsQuery(Page: 1, PageSize: 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Items.Count);
    }
}

public class GetItemsDueForRefreshQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnItemsDueForRefresh()
    {
        // Arrange
        var workItems = new List<WorkItem>();
        for (int i = 0; i < 2; i++)
        {
            var wi = WorkItem.Create(Guid.NewGuid(), $"Applicant{i}", "Individual", "US", RiskLevel.Low, "creator");
            wi.AssignTo(Guid.NewGuid(), "User", "assigner");
            wi.StartReview("reviewer");
            wi.Complete("completer", null);
            wi.ScheduleRefresh(DateTime.UtcNow.AddDays(-1), "scheduler"); // Past date
            workItems.Add(wi);
        }
        
        var repository = new MockWorkItemRepository();
        repository.SetupGetItemsDueForRefresh(null, workItems);

        var handler = new GetItemsDueForRefreshQueryHandler(repository);
        var query = new GetItemsDueForRefreshQuery(Page: 1, PageSize: 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Items.Count);
    }
}

