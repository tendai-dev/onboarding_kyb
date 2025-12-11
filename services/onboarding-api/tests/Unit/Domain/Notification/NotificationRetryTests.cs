using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;
using Xunit;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;

namespace OnboardingApi.Tests.Unit.Domain.Notification;

public class NotificationRetryTests
{
    [Fact]
    public void Retry_ShouldThrow_WhenStatusNotFailed()
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
        Assert.Throws<InvalidOperationException>(() => notification.Retry());
    }

    [Fact]
    public void Retry_ShouldThrow_WhenMaxRetriesExceeded()
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
        notification.MarkAsFailed("Error");
        // Set retry count to max
        typeof(DomainNotification).GetProperty("RetryCount")!.SetValue(notification, 3);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => notification.Retry());
    }

    [Fact]
    public void Retry_ShouldResetStatusToPending()
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
        notification.MarkAsFailed("Error");

        // Act
        notification.Retry();

        // Assert
        Assert.Equal(NotificationStatus.Pending, notification.Status);
        Assert.Null(notification.ErrorMessage);
    }

    [Fact]
    public void CanRetry_ShouldReturnTrue_WhenFailedAndRetryCountBelowMax()
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
        notification.MarkAsFailed("Error");

        // Act
        var result = notification.CanRetry;

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanRetry_ShouldReturnFalse_WhenNotFailed()
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
        var result = notification.CanRetry;

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnTrue_WhenScheduledMoreThan7DaysAgo()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            null,
            null,
            null,
            null,
            DateTime.UtcNow.AddDays(-8));

        // Act
        var result = notification.IsExpired;

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnFalse_WhenScheduledLessThan7DaysAgo()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            null,
            null,
            null,
            null,
            DateTime.UtcNow.AddDays(-5));

        // Act
        var result = notification.IsExpired;

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnFalse_WhenNotScheduled()
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
        var result = notification.IsExpired;

        // Assert
        Assert.False(result);
    }
}

