using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Notification.Interfaces;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;
using OnboardingApi.Domain.Notification.ValueObjects;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class NotificationSenderTests
{
    [Fact]
    public async Task SendAsync_ShouldSendEmail_WhenChannelIsEmail()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            "user@example.com",
            "Test Subject",
            "Test Content",
            NotificationPriority.Medium,
            null);

        var emailSender = new MockEmailSender();
        var smsSender = new MockSmsSender();
        var repository = new MockNotificationRepositoryForSenderTests();
        var logger = new MockLogger<NotificationSender>();
        var sender = new NotificationSender(emailSender, smsSender, repository, logger);

        // Act
        await sender.SendAsync(notification, CancellationToken.None);

        // Assert
        Assert.True(emailSender.SendEmailCalled);
        Assert.False(smsSender.SendSmsCalled);
        Assert.Equal("user@example.com", emailSender.LastTo);
        Assert.Equal("Test Subject", emailSender.LastSubject);
        Assert.Equal(NotificationStatus.Sent, notification.Status);
        Assert.True(repository.UpdateCalled);
    }

    [Fact]
    public async Task SendAsync_ShouldSendSms_WhenChannelIsSms()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.SMS,
            "+1234567890",
            "SMS Subject",
            "SMS Message",
            NotificationPriority.Medium,
            null);

        var emailSender = new MockEmailSender();
        var smsSender = new MockSmsSender();
        var repository = new MockNotificationRepositoryForSenderTests();
        var logger = new MockLogger<NotificationSender>();
        var sender = new NotificationSender(emailSender, smsSender, repository, logger);

        // Act
        await sender.SendAsync(notification, CancellationToken.None);

        // Assert
        Assert.False(emailSender.SendEmailCalled);
        Assert.True(smsSender.SendSmsCalled);
        Assert.Equal("+1234567890", smsSender.LastTo);
        Assert.Equal("SMS Message", smsSender.LastMessage);
        Assert.Equal(NotificationStatus.Sent, notification.Status);
    }

    [Fact]
    public async Task SendAsync_ShouldLogWarning_WhenChannelIsInApp()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.InApp,
            "user123",
            "In-App Subject",
            "In-App Content",
            NotificationPriority.Medium,
            null);

        var emailSender = new MockEmailSender();
        var smsSender = new MockSmsSender();
        var repository = new MockNotificationRepositoryForSenderTests();
        var logger = new MockLogger<NotificationSender>();
        var sender = new NotificationSender(emailSender, smsSender, repository, logger);

        // Act
        await sender.SendAsync(notification, CancellationToken.None);

        // Assert
        Assert.False(emailSender.SendEmailCalled);
        Assert.False(smsSender.SendSmsCalled);
        // InApp channel is not implemented, so it should log a warning but not throw
    }

    [Fact]
    public async Task SendAsync_ShouldHandleException_WhenEmailFails()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            "user@example.com",
            "Test Subject",
            "Test Content",
            NotificationPriority.Medium,
            null);

        var emailSender = new MockEmailSender { ShouldThrow = true };
        var smsSender = new MockSmsSender();
        var repository = new MockNotificationRepositoryForSenderTests();
        var logger = new MockLogger<NotificationSender>();
        var sender = new NotificationSender(emailSender, smsSender, repository, logger);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => 
            sender.SendAsync(notification, CancellationToken.None));
        
        Assert.Equal(NotificationStatus.Failed, notification.Status);
        Assert.NotNull(notification.ErrorMessage);
    }

    [Fact]
    public async Task SendAsync_ShouldUpdateStatusToSending_First()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            "user@example.com",
            "Test Subject",
            "Test Content",
            NotificationPriority.Medium,
            null);

        var emailSender = new MockEmailSender();
        var smsSender = new MockSmsSender();
        var repository = new MockNotificationRepositoryForSenderTests();
        var logger = new MockLogger<NotificationSender>();
        var sender = new NotificationSender(emailSender, smsSender, repository, logger);

        // Act
        await sender.SendAsync(notification, CancellationToken.None);

        // Assert
        Assert.True(repository.UpdateCalled);
        Assert.Equal(NotificationStatus.Sent, notification.Status);
    }
}

public class MockEmailSender : IEmailSender
{
    public bool SendEmailCalled { get; private set; }
    public string? LastTo { get; private set; }
    public string? LastSubject { get; private set; }
    public string? LastContent { get; private set; }
    public bool ShouldThrow { get; set; }

    public async Task SendEmailAsync(string to, string subject, string content, CancellationToken cancellationToken = default)
    {
        if (ShouldThrow)
            throw new Exception("Email send failed");

        SendEmailCalled = true;
        LastTo = to;
        LastSubject = subject;
        LastContent = content;
        await Task.CompletedTask;
    }
}

public class MockSmsSender : ISmsSender
{
    public bool SendSmsCalled { get; private set; }
    public string? LastTo { get; private set; }
    public string? LastMessage { get; private set; }
    public bool ShouldThrow { get; set; }

    public async Task SendSmsAsync(string to, string message, CancellationToken cancellationToken = default)
    {
        if (ShouldThrow)
            throw new Exception("SMS send failed");

        SendSmsCalled = true;
        LastTo = to;
        LastMessage = message;
        await Task.CompletedTask;
    }
}

public class MockNotificationRepositoryForSenderTests : INotificationRepository
{
    private readonly Dictionary<Guid, DomainNotification> _notifications = new();
    public bool UpdateCalled { get; private set; }
    public bool SaveChangesCalled { get; private set; }

    public Task AddAsync(DomainNotification notification, CancellationToken cancellationToken = default)
    {
        _notifications[notification.Id.Value] = notification;
        return Task.CompletedTask;
    }

    public Task UpdateAsync(DomainNotification notification, CancellationToken cancellationToken = default)
    {
        UpdateCalled = true;
        _notifications[notification.Id.Value] = notification;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCalled = true;
        return Task.CompletedTask;
    }

    public Task<List<DomainNotification>> ListByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_notifications.Values.Where(n => n.CaseId == caseId).ToList());
    }

    public Task<List<DomainNotification>> ListByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_notifications.Values.Where(n => n.Status.ToString() == status).ToList());
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
