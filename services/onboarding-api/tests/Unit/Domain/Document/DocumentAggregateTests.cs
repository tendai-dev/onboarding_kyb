using OnboardingApi.Domain.Document.Aggregates;
using OnboardingApi.Domain.Document.ValueObjects;
using Xunit;
using Document = OnboardingApi.Domain.Document.Aggregates.Document;

namespace OnboardingApi.Tests.Unit.Domain.Document;

public class DocumentAggregateTests
{
    [Fact]
    public void MarkVirusScanned_ShouldRejectDocument_WhenVirusDetected()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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

        // Act
        document.MarkVirusScanned(false);

        // Assert
        Assert.True(document.IsVirusScanned);
        Assert.False(document.IsVirusClean);
        Assert.Equal(DocumentStatus.Rejected, document.Status);
        Assert.Equal("Virus detected", document.RejectionReason);
        Assert.Equal(2, document.DomainEvents.Count); // DocumentUploadedEvent + DocumentRejectedEvent
    }

    [Fact]
    public void MarkVirusScanned_ShouldSetPendingVerification_WhenVirusClean()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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

        // Act
        document.MarkVirusScanned(true);

        // Assert
        Assert.True(document.IsVirusScanned);
        Assert.True(document.IsVirusClean);
        Assert.Equal(DocumentStatus.PendingVerification, document.Status);
        Assert.Equal(2, document.DomainEvents.Count); // DocumentUploadedEvent + DocumentVirusScannedEvent
    }

    [Fact]
    public void Verify_ShouldThrowException_WhenNotVirusScanned()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => document.Verify("verifier123"));
    }

    [Fact]
    public void Verify_ShouldThrowException_WhenVirusNotClean()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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
        document.MarkVirusScanned(false);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => document.Verify("verifier123"));
    }

    [Fact]
    public void Verify_ShouldThrowException_WhenStatusNotPendingVerification()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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
        document.MarkVirusScanned(true);
        document.Verify("verifier123");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => document.Verify("verifier123"));
    }

    [Fact]
    public void Reject_ShouldThrowException_WhenDocumentVerified()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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
        document.MarkVirusScanned(true);
        document.Verify("verifier123");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => document.Reject("reason", "rejector123"));
    }

    [Fact]
    public void SetExpiry_ShouldThrowException_WhenExpiryInPast()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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

        // Act & Assert
        Assert.Throws<ArgumentException>(() => document.SetExpiry(DateTime.UtcNow.AddDays(-1)));
    }

    [Fact]
    public void SetExpiry_ShouldSetExpiry_WhenValidDate()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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
        var expiryDate = DateTime.UtcNow.AddDays(30);

        // Act
        document.SetExpiry(expiryDate);

        // Assert
        Assert.Equal(expiryDate, document.ExpiresAt);
    }

    [Fact]
    public void IsExpired_ShouldReturnTrue_WhenExpired()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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
        // Set expiry in the past using reflection since SetExpiry validates
        var expiryProp = typeof(OnboardingApi.Domain.Document.Aggregates.Document).GetProperty("ExpiresAt");
        expiryProp!.SetValue(document, DateTime.UtcNow.AddDays(-1));

        // Act
        var result = document.IsExpired();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnFalse_WhenNotExpired()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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
        document.SetExpiry(DateTime.UtcNow.AddDays(30));

        // Act
        var result = document.IsExpired();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnFalse_WhenNoExpirySet()
    {
        // Arrange
        var document = OnboardingApi.Domain.Document.Aggregates.Document.Create(
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

        // Act
        var result = document.IsExpired();

        // Assert
        Assert.False(result);
    }
}

