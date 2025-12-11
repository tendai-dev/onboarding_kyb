using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Messaging;

public class MessageAggregateTests
{
    [Fact]
    public void Create_ShouldThrow_WhenContentIsEmptyAndNoAttachments()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "",
            null,
            null,
            null));
    }

    [Fact]
    public void Create_ShouldAllowEmptyContent_WhenAttachmentsProvided()
    {
        // Arrange
        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var senderId = Guid.NewGuid();
        var attachment = MessageAttachment.Create(
            Guid.Empty,
            "test.pdf",
            "application/pdf",
            1024,
            "storage-key",
            "storage-url",
            Guid.NewGuid(),
            "Test attachment");

        // Act
        var message = Message.Create(
            threadId,
            applicationId,
            senderId,
            "Sender",
            UserRole.Applicant,
            "",
            null,
            null,
            null,
            new[] { attachment });

        // Assert
        Assert.NotNull(message);
        Assert.Single(message.Attachments);
    }

    [Fact]
    public void Create_ShouldThrow_WhenContentExceedsMaxLength()
    {
        // Arrange
        var longContent = new string('a', 5001);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            longContent));
    }

    [Fact]
    public void AddAttachment_ShouldThrow_WhenAttachmentIsNull()
    {
        // Arrange
        var message = CreateMessage();

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => message.AddAttachment(null!));
    }

    [Fact]
    public void AddAttachment_ShouldThrow_WhenAttachmentBelongsToDifferentMessage()
    {
        // Arrange
        var message = CreateMessage();
        var otherMessageId = Guid.NewGuid();
        var attachment = MessageAttachment.Create(
            otherMessageId,
            "test.pdf",
            "application/pdf",
            1024,
            "storage-key",
            "storage-url",
            Guid.NewGuid(),
            null);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => message.AddAttachment(attachment));
    }

    [Fact]
    public void ToggleStar_ShouldToggleIsStarred()
    {
        // Arrange
        var message = CreateMessage();
        var initialStarred = message.IsStarred;

        // Act
        message.ToggleStar();

        // Assert
        Assert.NotEqual(initialStarred, message.IsStarred);
    }

    [Fact]
    public void MarkAsRead_ShouldDoNothing_WhenAlreadyRead()
    {
        // Arrange
        var message = CreateMessage();
        var userId = message.SenderId;
        message.MarkAsRead(userId);
        var initialReadAt = message.ReadAt;

        // Act
        message.MarkAsRead(userId);

        // Assert
        Assert.Equal(initialReadAt, message.ReadAt);
    }

    [Fact]
    public void MarkAsRead_ShouldThrow_WhenUserNotAuthorized()
    {
        // Arrange
        var message = CreateMessage();
        var unauthorizedUserId = Guid.NewGuid();

        // Act & Assert
        Assert.Throws<UnauthorizedAccessException>(() => message.MarkAsRead(unauthorizedUserId));
    }

    [Fact]
    public void MarkAsRead_ShouldUpdateStatus_WhenAuthorized()
    {
        // Arrange
        var receiverId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver",
            null);

        // Act
        message.MarkAsRead(receiverId);

        // Assert
        Assert.Equal(MessageStatus.Read, message.Status);
        Assert.NotNull(message.ReadAt);
    }

    [Fact]
    public void Delete_ShouldThrow_WhenAlreadyDeleted()
    {
        // Arrange
        var message = CreateMessage();
        message.Delete(message.SenderId);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => message.Delete(message.SenderId));
    }

    [Fact]
    public void Delete_ShouldThrow_WhenNotSender()
    {
        // Arrange
        var message = CreateMessage();
        var otherUserId = Guid.NewGuid();

        // Act & Assert
        Assert.Throws<UnauthorizedAccessException>(() => message.Delete(otherUserId));
    }

    [Fact]
    public void Delete_ShouldUpdateStatus_WhenAuthorized()
    {
        // Arrange
        var message = CreateMessage();
        var senderId = message.SenderId;

        // Act
        message.Delete(senderId);

        // Assert
        Assert.Equal(MessageStatus.Deleted, message.Status);
        Assert.NotNull(message.DeletedAt);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnTrue_ForSender()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            senderId,
            "Sender",
            UserRole.Applicant,
            "Content");

        // Act
        var result = message.CanBeReadBy(senderId, UserRole.Applicant);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnTrue_ForReceiver()
    {
        // Arrange
        var receiverId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content",
            receiverId,
            "Receiver",
            null);

        // Act
        var result = message.CanBeReadBy(receiverId, UserRole.Applicant);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnTrue_ForAdmin()
    {
        // Arrange
        var message = CreateMessage();
        var adminId = Guid.NewGuid();

        // Act
        var result = message.CanBeReadBy(adminId, UserRole.Admin);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnTrue_ForComplianceManager()
    {
        // Arrange
        var message = CreateMessage();
        var complianceManagerId = Guid.NewGuid();

        // Act
        var result = message.CanBeReadBy(complianceManagerId, UserRole.ComplianceManager);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanBeReadBy_ShouldReturnFalse_ForUnauthorizedUser()
    {
        // Arrange
        var message = CreateMessage();
        var unauthorizedUserId = Guid.NewGuid();

        // Act
        var result = message.CanBeReadBy(unauthorizedUserId, UserRole.Applicant);

        // Assert
        Assert.False(result);
    }

    private static Message CreateMessage()
    {
        return Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Test message");
    }
}
