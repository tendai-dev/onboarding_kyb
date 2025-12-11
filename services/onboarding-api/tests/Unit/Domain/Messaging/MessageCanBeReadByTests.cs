using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Messaging;

public class MessageCanBeReadByTests
{
    [Fact]
    public void CanBeReadBy_ShouldReturnTrue_WhenUserIdIsSender()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            senderId,
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver");

        // Act
        var result = message.CanBeReadBy(senderId, UserRole.Applicant);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnTrue_WhenUserIdIsReceiver()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            senderId,
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver");

        // Act
        var result = message.CanBeReadBy(receiverId, UserRole.Applicant);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnTrue_WhenUserRoleIsAdmin()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            senderId,
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver");

        // Act
        var result = message.CanBeReadBy(adminId, UserRole.Admin);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnTrue_WhenUserRoleIsComplianceManager()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var complianceManagerId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            senderId,
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver");

        // Act
        var result = message.CanBeReadBy(complianceManagerId, UserRole.ComplianceManager);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnFalse_WhenUserIsNotSenderOrReceiverAndNotAdmin()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            senderId,
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver");

        // Act
        var result = message.CanBeReadBy(otherUserId, UserRole.Applicant);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void MarkAsRead_ShouldReturnEarly_WhenMessageIsAlreadyRead()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            senderId,
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver");
        
        message.MarkAsRead(receiverId);
        var initialReadAt = message.ReadAt;

        // Act
        message.MarkAsRead(receiverId);

        // Assert
        Assert.Equal(initialReadAt, message.ReadAt); // Should not change
    }

    [Fact]
    public void MarkAsRead_ShouldThrow_WhenUserIsNotSenderOrReceiver()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var unauthorizedUserId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            senderId,
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver");

        // Act & Assert
        Assert.Throws<UnauthorizedAccessException>(() => message.MarkAsRead(unauthorizedUserId));
    }
}

