using OnboardingApi.Application.Document.Commands;
using OnboardingApi.Application.Document.Interfaces;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;
using OnboardingApi.Domain.Document.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Document;

public class UploadDocumentCommandHandlerTests
{
    private readonly MockDocumentRepository _repositoryMock;
    private readonly MockObjectStorage _objectStorageMock;
    private readonly MockLogger<UploadDocumentCommandHandler> _loggerMock;
    private readonly UploadDocumentCommandHandler _handler;

    public UploadDocumentCommandHandlerTests()
    {
        _repositoryMock = new MockDocumentRepository();
        _objectStorageMock = new MockObjectStorage();
        _loggerMock = new MockLogger<UploadDocumentCommandHandler>();
        _handler = new UploadDocumentCommandHandler(_repositoryMock, _objectStorageMock, _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldUploadDocument_WhenValidCommand()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        var fileStream = new MemoryStream(new byte[] { 1, 2, 3, 4, 5 });
        var metadata = new DocumentMetadata { Tags = new Dictionary<string, string> { { "key", "value" } } };

        var command = new UploadDocumentCommand
        {
            CaseId = caseId,
            PartnerId = partnerId,
            Type = DocumentType.NationalId,
            FileName = "test.pdf",
            ContentType = "application/pdf",
            FileStream = fileStream,
            FileSizeBytes = 5,
            Metadata = metadata,
            UploadedBy = "user123"
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.DocumentId);
        Assert.False(string.IsNullOrEmpty(result.DocumentNumber));
        Assert.False(string.IsNullOrEmpty(result.StorageKey));
        Assert.Single(_objectStorageMock.UploadedKeys);
    }

    [Fact]
    public async Task Handle_ShouldResetStreamPosition_WhenStreamCanSeek()
    {
        // Arrange
        var fileStream = new MemoryStream(new byte[] { 1, 2, 3 });
        fileStream.Position = 2; // Move position

        var command = new UploadDocumentCommand
        {
            CaseId = Guid.NewGuid(),
            PartnerId = Guid.NewGuid(),
            Type = DocumentType.NationalId,
            FileName = "test.pdf",
            ContentType = "application/pdf",
            FileStream = fileStream,
            FileSizeBytes = 3,
            Metadata = new DocumentMetadata { Tags = new Dictionary<string, string>() },
            UploadedBy = "user123"
        };

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Single(_objectStorageMock.UploadedKeys);
    }
}

