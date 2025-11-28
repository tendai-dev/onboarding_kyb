using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Notification.Interfaces;
using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class NotificationServiceImplMoreTests
{
    private readonly MockNotificationServiceImplRepository _repository;
    private readonly MockNotificationServiceImplSender _sender;
    private readonly ILogger<NotificationServiceImpl> _logger;
    private readonly NotificationServiceImpl _service;

    public NotificationServiceImplMoreTests()
    {
        _repository = new MockNotificationServiceImplRepository();
        _sender = new MockNotificationServiceImplSender();
        _logger = new MockLogger<NotificationServiceImpl>();
        _service = new NotificationServiceImpl(_repository, _sender, _logger);
    }

    [Fact]
    public async Task SendEmailAsync_ShouldHandleNullCaseId()
    {
        // Arrange
        var templateData = new { Name = "John", Message = "Welcome" };

        // Act
        await _service.SendEmailAsync(
            "test@example.com",
            "Welcome Email",
            "welcome_template",
            templateData,
            NotificationPriority.Medium,
            null);

        // Assert
        Assert.True(_repository.AddCalled);
        Assert.True(_sender.SendCalled);
        Assert.Null(_sender.LastNotification!.CaseId);
    }

    [Fact]
    public async Task SendEmailAsync_ShouldHandleDifferentPriorities()
    {
        // Arrange
        var templateData = new { Name = "John" };

        // Act
        await _service.SendEmailAsync(
            "test@example.com",
            "Test",
            "template",
            templateData,
            NotificationPriority.Critical);

        // Assert
        Assert.Equal(NotificationPriority.Critical, _sender.LastNotification!.Priority);
    }

    [Fact]
    public async Task SendSmsAsync_ShouldHandleNullCaseId()
    {
        // Arrange
        var message = "Test SMS";

        // Act
        await _service.SendSmsAsync(
            "+1234567890",
            message,
            NotificationPriority.Medium,
            null);

        // Assert
        Assert.True(_repository.AddCalled);
        Assert.True(_sender.SendCalled);
        Assert.Null(_sender.LastNotification!.CaseId);
    }

    [Fact]
    public async Task SendSmsAsync_ShouldSetCorrectSubject()
    {
        // Arrange
        var message = "Test SMS";

        // Act
        await _service.SendSmsAsync(
            "+1234567890",
            message,
            NotificationPriority.Medium);

        // Assert
        Assert.Equal("SMS Notification", _sender.LastNotification!.Subject);
    }

    [Fact]
    public async Task ScheduleNotificationAsync_ShouldHandleNullCaseId()
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
            null);

        // Assert
        Assert.True(_repository.AddCalled);
        Assert.Null(_repository.LastAddedNotification!.CaseId);
    }

    [Fact]
    public async Task ScheduleNotificationAsync_ShouldHandleDifferentChannels()
    {
        // Arrange
        var scheduledAt = DateTime.UtcNow.AddHours(1);

        // Act
        await _service.ScheduleNotificationAsync(
            NotificationType.Reminder,
            NotificationChannel.SMS,
            "+1234567890",
            "Reminder",
            "Don't forget!",
            scheduledAt);

        // Assert
        Assert.Equal(NotificationChannel.SMS, _repository.LastAddedNotification!.Channel);
    }

    [Fact]
    public async Task ScheduleNotificationAsync_ShouldHandleDifferentTypes()
    {
        // Arrange
        var scheduledAt = DateTime.UtcNow.AddHours(1);

        // Act
        await _service.ScheduleNotificationAsync(
            NotificationType.Other,
            NotificationChannel.Email,
            "test@example.com",
            "Alert",
            "Important!",
            scheduledAt);

        // Assert
        Assert.Equal(NotificationType.Other, _repository.LastAddedNotification!.Type);
    }
}

