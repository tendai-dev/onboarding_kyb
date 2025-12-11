using OnboardingApi.Application.Messaging.Commands;
using OnboardingApi.Application.Messaging.Interfaces;
using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Messaging;

// Note: SendMessageCommandHandlerTests already exists in separate file

public class MarkMessageAsReadCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldMarkMessageAsRead_WhenMessageExists()
    {
        // Arrange
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content",
            Guid.NewGuid(),
            "Receiver",
            null);
        var repository = new MockMessageRepository();
        repository.SetupGetById(message.Id, message);
        var handler = new MarkMessageAsReadCommandHandler(repository);
        var command = new MarkMessageAsReadCommand(message.Id, message.ReceiverId!.Value);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(MessageStatus.Read, message.Status);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenMessageNotFound()
    {
        // Arrange
        var repository = new MockMessageRepository();
        var handler = new MarkMessageAsReadCommandHandler(repository);
        var command = new MarkMessageAsReadCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("not found", result.ErrorMessage);
    }
}

public class DeleteMessageCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldDeleteMessage_WhenAuthorized()
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
        var repository = new MockMessageRepository();
        repository.SetupGetById(message.Id, message);
        var handler = new DeleteMessageCommandHandler(repository);
        var command = new DeleteMessageCommand(message.Id, senderId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(MessageStatus.Deleted, message.Status);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenMessageNotFound()
    {
        // Arrange
        var repository = new MockMessageRepository();
        var handler = new DeleteMessageCommandHandler(repository);
        var command = new DeleteMessageCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

public class StarMessageCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldToggleStar_WhenMessageExists()
    {
        // Arrange
        var message = Message.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Sender",
            UserRole.Applicant,
            "Content");
        var repository = new MockMessageRepository();
        repository.SetupGetById(message.Id, message);
        var handler = new StarMessageCommandHandler(repository);
        var userId = Guid.NewGuid();
        var command = new StarMessageCommand(message.Id, userId);
        var initialStarred = message.IsStarred;

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotEqual(initialStarred, result.IsStarred);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenMessageNotFound()
    {
        // Arrange
        var repository = new MockMessageRepository();
        var handler = new StarMessageCommandHandler(repository);
        var command = new StarMessageCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

