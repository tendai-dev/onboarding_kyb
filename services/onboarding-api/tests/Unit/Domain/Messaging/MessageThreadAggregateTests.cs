using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Messaging;

public class MessageThreadAggregateTests
{
    [Fact]
    public void Create_ShouldCreateThread_WithAllProperties()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var applicantId = Guid.NewGuid();

        // Act
        var thread = MessageThread.Create(applicationId, "APP-123", applicantId, "Applicant Name");

        // Assert
        Assert.NotEqual(Guid.Empty, thread.Id);
        Assert.Equal(applicationId, thread.ApplicationId);
        Assert.Equal("APP-123", thread.ApplicationReference);
        Assert.Equal(applicantId, thread.ApplicantId);
        Assert.Equal("Applicant Name", thread.ApplicantName);
        Assert.Equal(0, thread.MessageCount);
        Assert.False(thread.IsArchived);
        Assert.False(thread.IsStarred);
        Assert.True(thread.CreatedAt > DateTime.MinValue);
    }

    [Fact]
    public void IncrementMessageCount_ShouldIncreaseCount()
    {
        // Arrange
        var thread = MessageThread.Create(Guid.NewGuid(), "APP-123", Guid.NewGuid(), "Applicant");

        // Act
        thread.IncrementMessageCount();
        thread.IncrementMessageCount();

        // Assert
        Assert.Equal(2, thread.MessageCount);
    }

    [Fact]
    public void AssignAdmin_ShouldSetAdminProperties()
    {
        // Arrange
        var thread = MessageThread.Create(Guid.NewGuid(), "APP-123", Guid.NewGuid(), "Applicant");
        var adminId = Guid.NewGuid();

        // Act
        thread.AssignAdmin(adminId, "Admin Name");

        // Assert
        Assert.Equal(adminId, thread.AssignedAdminId);
        Assert.Equal("Admin Name", thread.AssignedAdminName);
    }

    [Fact]
    public void ToggleStar_ShouldToggleIsStarred()
    {
        // Arrange
        var thread = MessageThread.Create(Guid.NewGuid(), "APP-123", Guid.NewGuid(), "Applicant");
        var initialStarred = thread.IsStarred;

        // Act
        thread.ToggleStar();

        // Assert
        Assert.NotEqual(initialStarred, thread.IsStarred);
    }

    [Fact]
    public void Archive_ShouldSetIsArchivedToTrue()
    {
        // Arrange
        var thread = MessageThread.Create(Guid.NewGuid(), "APP-123", Guid.NewGuid(), "Applicant");

        // Act
        thread.Archive();

        // Assert
        Assert.True(thread.IsArchived);
    }

    [Fact]
    public void Unarchive_ShouldSetIsArchivedToFalse()
    {
        // Arrange
        var thread = MessageThread.Create(Guid.NewGuid(), "APP-123", Guid.NewGuid(), "Applicant");
        thread.Archive();

        // Act
        thread.Unarchive();

        // Assert
        Assert.False(thread.IsArchived);
    }
}

