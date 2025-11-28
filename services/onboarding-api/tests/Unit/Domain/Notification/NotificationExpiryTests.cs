using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;
using Xunit;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;

namespace OnboardingApi.Tests.Unit.Domain.Notification;

public class NotificationExpiryTests
{
    [Fact]
    public void IsExpired_ShouldReturnTrue_WhenScheduledAtIsMoreThan7DaysAgo()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            caseId: null,
            partnerId: null,
            templateId: null,
            templateData: null,
            scheduledAt: DateTime.UtcNow.AddDays(-8)); // 8 days ago

        // Act
        var result = notification.IsExpired;

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnFalse_WhenScheduledAtIsLessThan7DaysAgo()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            caseId: null,
            partnerId: null,
            templateId: null,
            templateData: null,
            scheduledAt: DateTime.UtcNow.AddDays(-6)); // 6 days ago

        // Act
        var result = notification.IsExpired;

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnFalse_WhenScheduledAtIsNull()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            scheduledAt: null);

        // Act
        var result = notification.IsExpired;

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnTrue_WhenScheduledAtIsExactly7DaysAgo()
    {
        // Arrange
        var notification = DomainNotification.Create(
            NotificationType.Reminder,
            NotificationChannel.Email,
            "user@example.com",
            "Subject",
            "Content",
            NotificationPriority.Medium,
            caseId: null,
            partnerId: null,
            templateId: null,
            templateData: null,
            scheduledAt: DateTime.UtcNow.AddDays(-7)); // Exactly 7 days ago

        // Act
        var result = notification.IsExpired;

        // Assert
        Assert.True(result); // Is expired because check uses < (less than), not <=
    }
}

