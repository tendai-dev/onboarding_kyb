using OnboardingApi.Application.Document.Commands;
using OnboardingApi.Application.Document.Interfaces;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;
using OnboardingApi.Domain.Document.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Document;

public class VerifyDocumentCommandHandlerTests
{
    private readonly MockDocumentRepository _repositoryMock;
    private readonly MockLogger<VerifyDocumentCommandHandler> _loggerMock;
    private readonly VerifyDocumentCommandHandler _handler;

    public VerifyDocumentCommandHandlerTests()
    {
        _repositoryMock = new MockDocumentRepository();
        _loggerMock = new MockLogger<VerifyDocumentCommandHandler>();
        _handler = new VerifyDocumentCommandHandler(_repositoryMock, _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldVerifyDocument_WhenDocumentExists()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var document = DomainDocument.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            DocumentType.NationalId,
            "test.pdf",
            "application/pdf",
            100,
            "storage/key",
            "bucket",
            new DocumentMetadata { Tags = new Dictionary<string, string>() },
            "user123"
        );
        typeof(DomainDocument).GetProperty("Id")!.SetValue(document, documentId);
        
        // Mark as virus scanned and clean (required for verification)
        document.MarkVirusScanned(true);
        
        _repositoryMock.SetupGetById(documentId, document);

        var command = new VerifyDocumentCommand(documentId, "verifier123");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task Handle_ShouldReturnFalse_WhenDocumentNotFound()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        _repositoryMock.SetupGetById(documentId, null);

        var command = new VerifyDocumentCommand(documentId, "verifier123");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}

