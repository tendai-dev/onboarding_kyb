using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.Document.Aggregates;
using OnboardingApi.Domain.Document.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Document;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class DocumentRepositoryTests
{
    [Fact]
    public async Task GetByIdAsync_ShouldReturnDocument_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        var document = Document.Create(
            caseId,
            partnerId,
            DocumentType.PassportCopy,
            "passport.pdf",
            "application/pdf",
            1024,
            "storage-key-123",
            "test-bucket",
            new DocumentMetadata
            {
                Country = "US",
                IssueDate = DateTime.UtcNow.AddYears(-5).ToString("yyyy-MM-dd"),
                ExpiryDate = DateTime.UtcNow.AddYears(5).ToString("yyyy-MM-dd")
            },
            "uploader123");

        context.Set<Document>().Add(document);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByIdAsync(document.Id, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(document.Id, result.Id);
        Assert.Equal("storage-key-123", result.StorageKey);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        // Act
        var result = await repository.GetByIdAsync(Guid.NewGuid(), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByStorageKeyAsync_ShouldReturnDocument_WhenExactMatch()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        var document = Document.Create(
            caseId,
            partnerId,
            DocumentType.PassportCopy,
            "passport.pdf",
            "application/pdf",
            1024,
            "exact-key",
            "test-bucket",
            null,
            "uploader123");

        context.Set<Document>().Add(document);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByStorageKeyAsync("exact-key", CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("exact-key", result.StorageKey);
    }

    [Fact]
    public async Task GetByStorageKeyAsync_ShouldReturnNull_WhenKeyIsEmpty()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        // Act
        var result = await repository.GetByStorageKeyAsync("", CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByCaseIdAsync_ShouldReturnDocuments_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        var doc1 = Document.Create(caseId, partnerId, DocumentType.PassportCopy, "doc1.pdf", "application/pdf", 1024, "key1", "test-bucket", null, "uploader123");
        var doc2 = Document.Create(caseId, partnerId, DocumentType.DriversLicense, "doc2.pdf", "application/pdf", 2048, "key2", "test-bucket", null, "uploader123");
        var doc3 = Document.Create(Guid.NewGuid(), Guid.NewGuid(), DocumentType.PassportCopy, "doc3.pdf", "application/pdf", 1024, "key3", "test-bucket", null, "uploader123");

        context.Set<Document>().AddRange(doc1, doc2, doc3);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByCaseIdAsync(caseId, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, d => Assert.Equal(caseId, d.CaseId));
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnPaginatedDocuments()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        for (int i = 0; i < 5; i++)
        {
            var doc = Document.Create(caseId, partnerId, DocumentType.PassportCopy, $"doc{i}.pdf", "application/pdf", 1024, $"key{i}", "test-bucket", null, "uploader123");
            context.Set<Document>().Add(doc);
        }
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(skip: 1, take: 2, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetCountAsync_ShouldReturnCorrectCount()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        for (int i = 0; i < 3; i++)
        {
            var doc = Document.Create(caseId, partnerId, DocumentType.PassportCopy, $"doc{i}.pdf", "application/pdf", 1024, $"key{i}", "test-bucket", null, "uploader123");
            context.Set<Document>().Add(doc);
        }
        await context.SaveChangesAsync();

        // Act
        var count = await repository.GetCountAsync(CancellationToken.None);

        // Assert
        Assert.Equal(3, count);
    }

    [Fact]
    public async Task AddAsync_ShouldAddDocument()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        var document = Document.Create(caseId, partnerId, DocumentType.PassportCopy, "doc.pdf", "application/pdf", 1024, "key", "test-bucket", null, "uploader123");

        // Act
        await repository.AddAsync(document, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(document.Id, CancellationToken.None);
        Assert.NotNull(result);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateDocument()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<DocumentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new DocumentDbContext(options);
        var repository = new DocumentRepository(context);

        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        var document = Document.Create(caseId, partnerId, DocumentType.PassportCopy, "doc.pdf", "application/pdf", 1024, "key", "test-bucket", null, "uploader123");
        document.MarkVirusScanned(true);
        context.Set<Document>().Add(document);
        await context.SaveChangesAsync();

        // Act
        document.Verify("verifier123");
        await repository.UpdateAsync(document, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(document.Id, CancellationToken.None);
        Assert.NotNull(result);
        Assert.Equal(DocumentStatus.Verified, result.Status);
    }
}

