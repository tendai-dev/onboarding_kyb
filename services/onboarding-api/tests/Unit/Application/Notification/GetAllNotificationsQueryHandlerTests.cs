using OnboardingApi.Application.Notification.Interfaces;
using OnboardingApi.Application.Notification.Queries;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;
using OnboardingApi.Domain.Notification.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Notification;

public class GetAllNotificationsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnAllNotifications()
    {
        // Arrange
        var notification1 = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            "user1@example.com",
            "Subject 1",
            "Content 1",
            NotificationPriority.Medium,
            null);
        
        var notification2 = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.SMS,
            "+1234567890",
            "Subject 2",
            "Content 2",
            NotificationPriority.High,
            null);
        
        var repository = new MockNotificationRepositoryForQueryTests();
        await repository.AddAsync(notification1, CancellationToken.None);
        await repository.AddAsync(notification2, CancellationToken.None);

        var handler = new GetAllNotificationsQueryHandler(repository);
        var query = new GetAllNotificationsQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Equal(2, resultList.Count);
        Assert.Equal("Email", resultList[0].Channel);
        Assert.Equal("SMS", resultList[1].Channel);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoNotifications()
    {
        // Arrange
        var repository = new MockNotificationRepositoryForQueryTests();
        var handler = new GetAllNotificationsQueryHandler(repository);
        var query = new GetAllNotificationsQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}

public class GetNotificationsByCaseQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnNotificationsForCase()
    {
        // Arrange
        var caseId = "case123";
        var notification1 = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            "user@example.com",
            "Subject 1",
            "Content 1",
            NotificationPriority.Medium,
            caseId);
        
        var notification2 = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            "user@example.com",
            "Subject 2",
            "Content 2",
            NotificationPriority.Medium,
            caseId);
        
        var repository = new MockNotificationRepositoryForQueryTests();
        await repository.AddAsync(notification1, CancellationToken.None);
        await repository.AddAsync(notification2, CancellationToken.None);

        var handler = new GetNotificationsByCaseQueryHandler(repository);
        var query = new GetNotificationsByCaseQuery(caseId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Equal(2, resultList.Count);
        Assert.All(resultList, n => Assert.Equal(caseId, n.CaseId));
    }
}

public class GetNotificationsByStatusQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnNotificationsByStatus()
    {
        // Arrange
        var notification1 = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            "user@example.com",
            "Subject 1",
            "Content 1",
            NotificationPriority.Medium,
            null);
        notification1.MarkAsSending();
        notification1.MarkAsSent();
        
        var repository = new MockNotificationRepositoryForQueryTests();
        await repository.AddAsync(notification1, CancellationToken.None);

        var handler = new GetNotificationsByStatusQueryHandler(repository);
        var query = new GetNotificationsByStatusQuery("Sent");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Single(resultList);
        Assert.Equal("Sent", resultList[0].Status);
    }
}

public class MockNotificationRepositoryForQueryTests : INotificationRepository
{
    private readonly Dictionary<Guid, DomainNotification> _notifications = new();

    public Task AddAsync(DomainNotification notification, CancellationToken cancellationToken = default)
    {
        _notifications[notification.Id.Value] = notification;
        return Task.CompletedTask;
    }

    public Task UpdateAsync(DomainNotification notification, CancellationToken cancellationToken = default)
    {
        _notifications[notification.Id.Value] = notification;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<List<DomainNotification>> ListByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        var result = _notifications.Values
            .Where(n => n.CaseId == caseId)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<List<DomainNotification>> ListByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        var result = _notifications.Values
            .Where(n => n.Status.ToString() == status)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<List<DomainNotification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_notifications.Values.ToList());
    }

    public Task<DomainNotification?> GetByIdAsync(NotificationId id, CancellationToken cancellationToken = default)
    {
        _notifications.TryGetValue(id.Value, out var notification);
        return Task.FromResult(notification);
    }
}

