using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Messaging;

public class MessageThreadUnreadCountTests
{
    [Fact]
    public void IncrementUnreadCount_ShouldIncrementApplicantCount_WhenRecipientIsApplicant()
    {
        // Arrange
        var thread = MessageThread.Create(
            Guid.NewGuid(),
            "APP-123",
            Guid.NewGuid(),
            "Applicant");
        var initialCount = thread.UnreadCountApplicant;

        // Act
        thread.IncrementUnreadCount(UserRole.Applicant);

        // Assert
        Assert.Equal(initialCount + 1, thread.UnreadCountApplicant);
        Assert.Equal(0, thread.UnreadCountAdmin);
    }

    [Fact]
    public void IncrementUnreadCount_ShouldIncrementAdminCount_WhenRecipientIsAdmin()
    {
        // Arrange
        var thread = MessageThread.Create(
            Guid.NewGuid(),
            "APP-123",
            Guid.NewGuid(),
            "Applicant");
        var initialCount = thread.UnreadCountAdmin;

        // Act
        thread.IncrementUnreadCount(UserRole.Admin);

        // Assert
        Assert.Equal(initialCount + 1, thread.UnreadCountAdmin);
        Assert.Equal(0, thread.UnreadCountApplicant);
    }

    [Fact]
    public void IncrementUnreadCount_ShouldIncrementAdminCount_WhenRecipientIsComplianceManager()
    {
        // Arrange
        var thread = MessageThread.Create(
            Guid.NewGuid(),
            "APP-123",
            Guid.NewGuid(),
            "Applicant");
        var initialCount = thread.UnreadCountAdmin;

        // Act
        thread.IncrementUnreadCount(UserRole.ComplianceManager);

        // Assert
        Assert.Equal(initialCount + 1, thread.UnreadCountAdmin);
    }

    [Fact]
    public void MarkAsRead_ShouldResetApplicantCount_WhenUserRoleIsApplicant()
    {
        // Arrange
        var thread = MessageThread.Create(
            Guid.NewGuid(),
            "APP-123",
            Guid.NewGuid(),
            "Applicant");
        thread.IncrementUnreadCount(UserRole.Applicant);
        thread.IncrementUnreadCount(UserRole.Applicant);
        Assert.Equal(2, thread.UnreadCountApplicant);

        // Act
        thread.MarkAsRead(UserRole.Applicant);

        // Assert
        Assert.Equal(0, thread.UnreadCountApplicant);
    }

    [Fact]
    public void MarkAsRead_ShouldResetAdminCount_WhenUserRoleIsAdmin()
    {
        // Arrange
        var thread = MessageThread.Create(
            Guid.NewGuid(),
            "APP-123",
            Guid.NewGuid(),
            "Applicant");
        thread.IncrementUnreadCount(UserRole.Admin);
        thread.IncrementUnreadCount(UserRole.Admin);
        Assert.Equal(2, thread.UnreadCountAdmin);

        // Act
        thread.MarkAsRead(UserRole.Admin);

        // Assert
        Assert.Equal(0, thread.UnreadCountAdmin);
    }

    [Fact]
    public void MarkAsRead_ShouldResetAdminCount_WhenUserRoleIsComplianceManager()
    {
        // Arrange
        var thread = MessageThread.Create(
            Guid.NewGuid(),
            "APP-123",
            Guid.NewGuid(),
            "Applicant");
        thread.IncrementUnreadCount(UserRole.ComplianceManager);
        Assert.Equal(1, thread.UnreadCountAdmin);

        // Act
        thread.MarkAsRead(UserRole.ComplianceManager);

        // Assert
        Assert.Equal(0, thread.UnreadCountAdmin);
    }
}

