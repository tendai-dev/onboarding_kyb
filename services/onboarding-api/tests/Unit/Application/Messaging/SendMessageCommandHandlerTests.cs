using OnboardingApi.Application.Messaging.Commands;
using OnboardingApi.Application.Messaging.Interfaces;
using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;
using AttachmentInfo = OnboardingApi.Application.Messaging.Commands.AttachmentInfo;

namespace OnboardingApi.Tests.Unit.Application.Messaging;

public class SendMessageCommandHandlerTests
{
    private readonly MockMessageRepository _repositoryMock;
    private readonly SendMessageCommandHandler _handler;

    public SendMessageCommandHandlerTests()
    {
        _repositoryMock = new MockMessageRepository();
        _handler = new SendMessageCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateNewThread_WhenThreadDoesNotExist()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var command = new SendMessageCommand(
            ApplicationId: applicationId,
            SenderId: Guid.NewGuid(),
            SenderName: "John Doe",
            SenderRole: UserRole.Admin,
            Content: "Test message"
        );

        _repositoryMock.SetupGetThreadByApplicationId(applicationId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.MessageId);
        Assert.NotNull(result.ThreadId);
    }

    [Fact]
    public async Task Handle_ShouldUseExistingThread_WhenThreadExists()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var existingThread = MessageThread.Create(applicationId, "APP-123", Guid.NewGuid(), "Test User");
        var threadId = Guid.NewGuid();
        typeof(MessageThread).GetProperty("Id")!.SetValue(existingThread, threadId);
        
        _repositoryMock.SetupGetThreadByApplicationId(applicationId, existingThread);

        var command = new SendMessageCommand(
            ApplicationId: applicationId,
            SenderId: Guid.NewGuid(),
            SenderName: "John Doe",
            SenderRole: UserRole.Admin,
            Content: "Test message"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task Handle_ShouldHandleAttachments_WhenAttachmentsProvided()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var command = new SendMessageCommand(
            ApplicationId: applicationId,
            SenderId: Guid.NewGuid(),
            SenderName: "John Doe",
            SenderRole: UserRole.Admin,
            Content: "Test message",
            Attachments: new List<AttachmentInfo>
            {
                new AttachmentInfo(
                    FileName: "test.pdf",
                    ContentType: "application/pdf",
                    FileSizeBytes: 1024,
                    StorageKey: "storage/key",
                    StorageUrl: "https://storage.example.com/key",
                    DocumentId: Guid.NewGuid(),
                    Description: "Test attachment"
                )
            }
        );

        _repositoryMock.SetupGetThreadByApplicationId(applicationId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task Handle_ShouldHandleNullAttachments()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var command = new SendMessageCommand(
            ApplicationId: applicationId,
            SenderId: Guid.NewGuid(),
            SenderName: "John Doe",
            SenderRole: UserRole.Admin,
            Content: "Test message",
            Attachments: null
        );

        _repositoryMock.SetupGetThreadByApplicationId(applicationId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
    }
}

