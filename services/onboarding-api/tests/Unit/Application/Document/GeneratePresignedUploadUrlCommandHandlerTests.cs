using OnboardingApi.Application.Document.Commands;
using OnboardingApi.Application.Document.Interfaces;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Document;

public class GeneratePresignedUploadUrlCommandHandlerTests
{
    private readonly MockObjectStorage _objectStorageMock;
    private readonly MockLogger<GeneratePresignedUploadUrlCommandHandler> _loggerMock;
    private readonly GeneratePresignedUploadUrlCommandHandler _handler;

    public GeneratePresignedUploadUrlCommandHandlerTests()
    {
        _objectStorageMock = new MockObjectStorage();
        _loggerMock = new MockLogger<GeneratePresignedUploadUrlCommandHandler>();
        _handler = new GeneratePresignedUploadUrlCommandHandler(_objectStorageMock, _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldGeneratePresignedUploadUrl_WhenValidCommand()
    {
        // Arrange
        var expiry = TimeSpan.FromHours(2);
        var command = new GeneratePresignedUploadUrlCommand(
            BucketName: "kyb-docs",
            ObjectKey: "documents/case123/file.pdf",
            ContentType: "application/pdf",
            Expiry: expiry
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.UploadUrl));
        Assert.NotEqual(default(DateTime), result.ExpiresAt);
        Assert.True(result.ExpiresAt > DateTime.UtcNow);
    }
}

