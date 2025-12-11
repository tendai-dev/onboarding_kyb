using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;
using Xunit;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;

namespace OnboardingApi.Tests.Unit.Domain.Notification;

public class NotificationAggregateTests
{
    [Fact]
    public void MarkAsSending_ShouldThrowException_WhenStatusNotPendingOrScheduled()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Welcome,
            NotificationChannel.Email,
            "test@example.com",
            "Subject",
            "Content"
        );
        notification.MarkAsSending();
        notification.MarkAsSent();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => notification.MarkAsSending());
    }

    [Fact]
    public void MarkAsSent_ShouldThrowException_WhenStatusNotSending()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Welcome,
            NotificationChannel.Email,
            "test@example.com",
            "Subject",
            "Content"
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => notification.MarkAsSent());
    }

    [Fact]
    public void MarkAsDelivered_ShouldThrowException_WhenStatusNotSent()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Welcome,
            NotificationChannel.Email,
            "test@example.com",
            "Subject",
            "Content"
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => notification.MarkAsDelivered());
    }

    [Fact]
    public void Retry_ShouldThrowException_WhenStatusNotFailed()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Welcome,
            NotificationChannel.Email,
            "test@example.com",
            "Subject",
            "Content"
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => notification.Retry());
    }

    [Fact]
    public void Retry_ShouldThrowException_WhenMaxRetriesExceeded()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Welcome,
            NotificationChannel.Email,
            "test@example.com",
            "Subject",
            "Content"
        );
        
        // Set MaxRetries to 3
        typeof(DomainNotification).GetProperty("MaxRetries")!.SetValue(notification, 3);
        
        // Retry 2 times successfully (RetryCount will be 1, then 2)
        for (int i = 0; i < 2; i++)
        {
            notification.MarkAsSending();
            notification.MarkAsFailed("Error");
            notification.Retry();
        }
        
        // One more failure - this will set RetryCount to 3
        notification.MarkAsSending();
        notification.MarkAsFailed("Error");
        
        // Verify retry count is 3
        Assert.Equal(3, notification.RetryCount);

        // Act & Assert - should throw because RetryCount (3) >= MaxRetries (3)
        Assert.Throws<InvalidOperationException>(() => notification.Retry());
    }

    [Fact]
    public void MarkAsFailed_ShouldIncrementRetryCount()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Welcome,
            NotificationChannel.Email,
            "test@example.com",
            "Subject",
            "Content"
        );
        notification.MarkAsSending();

        // Act
        notification.MarkAsFailed("Error");

        // Assert
        Assert.Equal(1, notification.RetryCount);
        Assert.Equal(NotificationStatus.Failed, notification.Status);
        Assert.NotNull(notification.FailedAt);
    }
}

