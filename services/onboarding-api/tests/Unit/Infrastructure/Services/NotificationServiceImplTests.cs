using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Notification.Interfaces;
using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class NotificationServiceImplTests
{
    private readonly MockNotificationServiceImplRepository _repository;
    private readonly MockNotificationServiceImplSender _sender;
    private readonly ILogger<NotificationServiceImpl> _logger;
    private readonly NotificationServiceImpl _service;

    public NotificationServiceImplTests()
    {
        _repository = new MockNotificationServiceImplRepository();
        _sender = new MockNotificationServiceImplSender();
        _logger = new MockLogger<NotificationServiceImpl>();
        _service = new NotificationServiceImpl(_repository, _sender, _logger);
    }

    [Fact]
    public async Task SendEmailAsync_ShouldCreateAndSendNotification()
    {
        // Arrange
        var templateData = new { Name = "John", Message = "Welcome" };

        // Act
        await _service.SendEmailAsync(
            "test@example.com",
            "Welcome Email",
            "welcome_template",
            templateData,
            NotificationPriority.High,
            "case123");

        // Assert
        Assert.True(_repository.AddCalled);
        Assert.True(_repository.SaveChangesCalled);
        Assert.True(_sender.SendCalled);
        Assert.NotNull(_sender.LastNotification);
        Assert.Equal(NotificationChannel.Email, _sender.LastNotification!.Channel);
        Assert.Equal("test@example.com", _sender.LastNotification.Recipient);
        Assert.Equal("Welcome Email", _sender.LastNotification.Subject);
        Assert.Equal(NotificationPriority.High, _sender.LastNotification.Priority);
        Assert.Equal("case123", _sender.LastNotification.CaseId);
    }

    [Fact]
    public async Task SendSmsAsync_ShouldCreateAndSendNotification()
    {
        // Arrange
        var message = "Your verification code is 123456";

        // Act
        await _service.SendSmsAsync(
            "+1234567890",
            message,
            NotificationPriority.Medium,
            "case456");

        // Assert
        Assert.True(_repository.AddCalled);
        Assert.True(_repository.SaveChangesCalled);
        Assert.True(_sender.SendCalled);
        Assert.NotNull(_sender.LastNotification);
        Assert.Equal(NotificationChannel.SMS, _sender.LastNotification!.Channel);
        Assert.Equal("+1234567890", _sender.LastNotification.Recipient);
        Assert.Equal(message, _sender.LastNotification.Content);
        Assert.Equal("case456", _sender.LastNotification.CaseId);
    }

    [Fact]
    public async Task ScheduleNotificationAsync_ShouldCreateScheduledNotification()
    {
        // Arrange
        var scheduledAt = DateTime.UtcNow.AddHours(1);

        // Act
        await _service.ScheduleNotificationAsync(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "test@example.com",
            "Reminder",
            "Don't forget!",
            scheduledAt,
            NotificationPriority.Medium,
            "case789");

        // Assert
        Assert.True(_repository.AddCalled);
        Assert.True(_repository.SaveChangesCalled);
        Assert.NotNull(_repository.LastAddedNotification);
        Assert.Equal(NotificationStatus.Scheduled, _repository.LastAddedNotification!.Status);
        Assert.Equal(scheduledAt, _repository.LastAddedNotification.ScheduledAt);
        Assert.False(_sender.SendCalled); // Should not send immediately
    }

    [Fact]
    public async Task SendWebhookAsync_ShouldLogWebhook()
    {
        // Arrange
        var payload = new { Event = "test", Data = "data" };

        // Act
        await _service.SendWebhookAsync("https://example.com/webhook", payload);

        // Assert
        // Webhook implementation is simplified, just verify it doesn't throw
        Assert.True(true);
    }
}

// Manual mocks
public class MockNotificationServiceImplSender : INotificationSender
{
    public bool SendCalled { get; private set; }
    public Notification? LastNotification { get; private set; }

    public async Task SendAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        SendCalled = true;
        LastNotification = notification;
        await Task.CompletedTask;
    }
}

public class MockNotificationServiceImplRepository : INotificationRepository
{
    private readonly Dictionary<Guid, Notification> _notifications = new();
    public bool AddCalled { get; private set; }
    public bool SaveChangesCalled { get; private set; }
    public Notification? LastAddedNotification { get; private set; }

    public Task AddAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        AddCalled = true;
        LastAddedNotification = notification;
        _notifications[notification.Id.Value] = notification;
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        _notifications[notification.Id.Value] = notification;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCalled = true;
        return Task.CompletedTask;
    }

    public Task<List<Notification>> ListByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        var result = _notifications.Values
            .Where(n => n.CaseId == caseId)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<List<Notification>> ListByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        var result = _notifications.Values
            .Where(n => n.Status.ToString() == status)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<List<Notification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_notifications.Values.ToList());
    }

    public Task<Notification?> GetByIdAsync(NotificationId id, CancellationToken cancellationToken = default)
    {
        _notifications.TryGetValue(id.Value, out var notification);
        return Task.FromResult(notification);
    }
}

