using OnboardingApi.Application.Document.Interfaces;
using OnboardingApi.Application.Document.Queries;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;
using OnboardingApi.Domain.Document.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Document;

public class GetDocumentByIdQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnDocumentDto_WhenDocumentExists()
    {
        // Arrange
        var metadata = new DocumentMetadata { Description = "Test document" };
        var document = DomainDocument.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            DocumentType.PassportCopy,
            "passport.pdf",
            "application/pdf",
            1024,
            "storage-key",
            "bucket-name",
            metadata,
            "uploader"
        );
        var documentId = document.Id;
        
        var repository = new MockDocumentRepository();
        repository.SetupGetById(documentId, document);

        var handler = new GetDocumentByIdQueryHandler(repository);
        var query = new GetDocumentByIdQuery(documentId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(document.FileName, result.FileName);
        Assert.Equal(document.Type.ToString(), result.Type);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenDocumentNotFound()
    {
        // Arrange
        var repository = new MockDocumentRepository();
        var handler = new GetDocumentByIdQueryHandler(repository);
        var query = new GetDocumentByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class GetDocumentsByCaseQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnDocuments_WhenCaseHasDocuments()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var metadata = new DocumentMetadata { Description = "Test" };
        var document1 = DomainDocument.Create(caseId, Guid.NewGuid(), DocumentType.PassportCopy, "doc1.pdf", "application/pdf", 1024, "key1", "bucket", metadata, "uploader");
        var document2 = DomainDocument.Create(caseId, Guid.NewGuid(), DocumentType.NationalId, "doc2.pdf", "application/pdf", 2048, "key2", "bucket", metadata, "uploader");
        
        var repository = new MockDocumentRepository();
        repository.SetupGetByCaseId(caseId, new List<DomainDocument> { document1, document2 });

        var handler = new GetDocumentsByCaseQueryHandler(repository);
        var query = new GetDocumentsByCaseQuery(caseId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenCaseHasNoDocuments()
    {
        // Arrange
        var repository = new MockDocumentRepository();
        var handler = new GetDocumentsByCaseQueryHandler(repository);
        var query = new GetDocumentsByCaseQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}

public class GetAllDocumentsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnPagedDocuments()
    {
        // Arrange
        var metadata = new DocumentMetadata { Description = "Test" };
        var repository = new MockDocumentRepository();
        for (int i = 0; i < 5; i++)
        {
            var doc = DomainDocument.Create(Guid.NewGuid(), Guid.NewGuid(), DocumentType.PassportCopy, $"doc{i}.pdf", "application/pdf", 1024, $"key{i}", "bucket", metadata, "uploader");
            await repository.AddAsync(doc, CancellationToken.None);
        }

        var handler = new GetAllDocumentsQueryHandler(repository);
        var query = new GetAllDocumentsQuery(Skip: 0, Take: 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Items.Count);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(0, result.Skip);
        Assert.Equal(10, result.Take);
    }

    [Fact]
    public async Task Handle_ShouldRespectSkipAndTake()
    {
        // Arrange
        var metadata = new DocumentMetadata { Description = "Test" };
        var repository = new MockDocumentRepository();
        for (int i = 0; i < 10; i++)
        {
            var doc = DomainDocument.Create(Guid.NewGuid(), Guid.NewGuid(), DocumentType.PassportCopy, $"doc{i}.pdf", "application/pdf", 1024, $"key{i}", "bucket", metadata, "uploader");
            await repository.AddAsync(doc, CancellationToken.None);
        }

        var handler = new GetAllDocumentsQueryHandler(repository);
        var query = new GetAllDocumentsQuery(Skip: 5, Take: 3);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Items.Count);
        Assert.Equal(10, result.TotalCount);
        Assert.Equal(5, result.Skip);
        Assert.Equal(3, result.Take);
    }
}

