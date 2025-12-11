using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Messaging;

public class MessageAttachmentTests
{
    [Fact]
    public void AddAttachment_ShouldThrow_WhenAttachmentIsNull()
    {
        // Arrange
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content");

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => message.AddAttachment(null!));
    }

    [Fact]
    public void AddAttachment_ShouldThrow_WhenAttachmentBelongsToDifferentMessage()
    {
        // Arrange
        var messageId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content");
        typeof(Message).GetProperty("Id")!.SetValue(message, messageId);

        var otherMessageId = Guid.NewGuid();
        var attachment = MessageAttachment.Create(
            otherMessageId, // Different message ID
            "test.pdf",
            "application/pdf",
            1024,
            "storage/key",
            "https://storage.example.com/key",
            Guid.NewGuid(),
            "Description");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => message.AddAttachment(attachment));
    }

    [Fact]
    public void AddAttachment_ShouldAddAttachment_WhenValid()
    {
        // Arrange
        var messageId = Guid.NewGuid();
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content");
        typeof(Message).GetProperty("Id")!.SetValue(message, messageId);

        var attachment = MessageAttachment.Create(
            messageId,
            "test.pdf",
            "application/pdf",
            1024,
            "storage/key",
            "https://storage.example.com/key",
            Guid.NewGuid(),
            "Description");

        // Act
        message.AddAttachment(attachment);

        // Assert
        Assert.Single(message.Attachments);
        Assert.Equal("test.pdf", message.Attachments.First().FileName);
    }

    [Fact]
    public void ToggleStar_ShouldToggleStarStatus()
    {
        // Arrange
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content");
        var initialStarred = message.IsStarred;

        // Act
        message.ToggleStar();

        // Assert
        Assert.NotEqual(initialStarred, message.IsStarred);
    }

    [Fact]
    public void ToggleStar_ShouldToggleBack_WhenCalledTwice()
    {
        // Arrange
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content");
        var initialStarred = message.IsStarred;

        // Act
        message.ToggleStar();
        message.ToggleStar();

        // Assert
        Assert.Equal(initialStarred, message.IsStarred);
    }
}

