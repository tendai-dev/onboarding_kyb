using OnboardingApi.Application.Document.Commands;
using OnboardingApi.Application.Document.Interfaces;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Document;

public class GeneratePresignedDownloadUrlCommandHandlerTests
{
    private readonly MockObjectStorage _objectStorageMock;
    private readonly MockLogger<GeneratePresignedDownloadUrlCommandHandler> _loggerMock;
    private readonly GeneratePresignedDownloadUrlCommandHandler _handler;

    public GeneratePresignedDownloadUrlCommandHandlerTests()
    {
        _objectStorageMock = new MockObjectStorage();
        _loggerMock = new MockLogger<GeneratePresignedDownloadUrlCommandHandler>();
        _handler = new GeneratePresignedDownloadUrlCommandHandler(_objectStorageMock, _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldGeneratePresignedUrl_WhenValidCommand()
    {
        // Arrange
        var command = new GeneratePresignedDownloadUrlCommand(
            StorageKey: "documents/case123/file.pdf",
            BucketName: "kyb-docs"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.DownloadUrl));
        Assert.NotEqual(default(DateTime), result.ExpiresAt);
        Assert.True(result.ExpiresAt > DateTime.UtcNow);
    }
}

