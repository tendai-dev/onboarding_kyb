using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Notification.Interfaces;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;
using OnboardingApi.Domain.Notification.ValueObjects;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class NotificationSenderEdgeCaseTests
{
    [Fact]
    public async Task SendAsync_ShouldThrowNotSupportedException_WhenChannelIsUnknown()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            (NotificationChannel)999, // Invalid channel
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

        // Act & Assert
        await Assert.ThrowsAsync<NotSupportedException>(() => 
            sender.SendAsync(notification, CancellationToken.None));
        
        Assert.Equal(NotificationStatus.Failed, notification.Status);
    }

    [Fact]
    public async Task SendAsync_ShouldHandlePushChannel()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Push,
            "user123",
            "Push Subject",
            "Push Content",
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
        // Push channel is not implemented, so it should log a warning but not throw
    }

    [Fact]
    public async Task SendAsync_ShouldHandleWebhookChannel()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Webhook,
            "https://example.com/webhook",
            "Webhook Subject",
            "Webhook Content",
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
        // Webhook channel is not implemented, so it should log a warning but not throw
    }

    [Fact]
    public async Task SendAsync_ShouldHandleInAppChannel()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.InApp,
            "user123",
            "InApp Subject",
            "InApp Content",
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
    public async Task SendAsync_ShouldHandleSmsException()
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
        var smsSender = new MockSmsSender { ShouldThrow = true };
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
    public async Task SendAsync_ShouldHandleEmailException()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            "user@example.com",
            "Email Subject",
            "Email Content",
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
}

