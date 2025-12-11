using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Messaging;

public class MessageCreateEdgeCaseTests
{
    [Fact]
    public void Create_ShouldThrow_WhenContentExceeds5000Characters()
    {
        // Arrange
        var longContent = new string('a', 5001); // 5001 characters

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
    public void Create_ShouldSucceed_WhenContentIsExactly5000Characters()
    {
        // Arrange
        var content = new string('a', 5000); // Exactly 5000 characters

        // Act
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            content);

        // Assert
        Assert.NotNull(message);
        Assert.Equal(content, message.Content);
    }

    [Fact]
    public void Create_ShouldSucceed_WhenContentIsEmptyButHasAttachments()
    {
        // Arrange
        var threadId = Guid.NewGuid();
        var messageId = Guid.NewGuid();
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
        var message = Message.Create(
            threadId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "", // Empty content
            attachments: new[] { attachment });

        // Assert
        Assert.NotNull(message);
        Assert.Single(message.Attachments);
    }

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
            "")); // Empty content, no attachments
    }

    [Fact]
    public void Create_ShouldThrow_WhenContentIsWhitespaceAndNoAttachments()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "   ")); // Whitespace content, no attachments
    }
}

