using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;
using Xunit;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;

namespace OnboardingApi.Tests.Unit.Domain.Notification;

public class NotificationAggregateEdgeCaseTests
{
    [Fact]
    public void MarkAsSending_ShouldChangeStatusToSending()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            null);

        // Act
        notification.MarkAsSending();

        // Assert
        Assert.Equal(NotificationStatus.Sending, notification.Status);
    }

    [Fact]
    public void MarkAsSent_ShouldThrow_WhenStatusNotSending()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            null);

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => notification.MarkAsSent());
        Assert.Contains("status", ex.Message);
    }

    [Fact]
    public void MarkAsSent_ShouldChangeStatusToSent()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            null);
        notification.MarkAsSending();

        // Act
        notification.MarkAsSent();

        // Assert
        Assert.Equal(NotificationStatus.Sent, notification.Status);
        Assert.NotNull(notification.SentAt);
    }

    [Fact]
    public void MarkAsDelivered_ShouldChangeStatusToDelivered()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            null);
        notification.MarkAsSending();
        notification.MarkAsSent();

        // Act
        notification.MarkAsDelivered();

        // Assert
        Assert.Equal(NotificationStatus.Delivered, notification.Status);
        Assert.NotNull(notification.DeliveredAt);
    }

    [Fact]
    public void MarkAsFailed_ShouldSetErrorMessage()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            null);
        notification.MarkAsSending();

        // Act
        notification.MarkAsFailed("Failed to send");

        // Assert
        Assert.Equal(NotificationStatus.Failed, notification.Status);
        Assert.Equal("Failed to send", notification.ErrorMessage);
        Assert.NotNull(notification.FailedAt);
    }
}

