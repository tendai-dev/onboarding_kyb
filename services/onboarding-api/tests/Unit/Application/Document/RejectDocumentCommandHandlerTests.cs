using OnboardingApi.Application.Document.Commands;
using OnboardingApi.Application.Document.Interfaces;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;
using OnboardingApi.Domain.Document.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Document;

public class RejectDocumentCommandHandlerTests
{
    private readonly MockDocumentRepository _repositoryMock;
    private readonly MockLogger<RejectDocumentCommandHandler> _loggerMock;
    private readonly RejectDocumentCommandHandler _handler;

    public RejectDocumentCommandHandlerTests()
    {
        _repositoryMock = new MockDocumentRepository();
        _loggerMock = new MockLogger<RejectDocumentCommandHandler>();
        _handler = new RejectDocumentCommandHandler(_repositoryMock, _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldRejectDocument_WhenDocumentExists()
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
        
        _repositoryMock.SetupGetById(documentId, document);

        var command = new RejectDocumentCommand(documentId, "Invalid format", "rejector123");

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

        var command = new RejectDocumentCommand(documentId, "Invalid format", "rejector123");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}

