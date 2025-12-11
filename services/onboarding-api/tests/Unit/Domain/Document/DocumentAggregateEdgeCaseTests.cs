using OnboardingApi.Domain.Document.Aggregates;
using OnboardingApi.Domain.Document.ValueObjects;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Document;

public class DocumentAggregateEdgeCaseTests
{
    [Fact]
    public void MarkVirusScanned_ShouldUpdateVirusScanStatus()
    {
        // Arrange
        var document = CreateDocument();
        
        // Act
        document.MarkVirusScanned(true);

        // Assert
        Assert.True(document.IsVirusScanned);
        Assert.True(document.IsVirusClean);
        Assert.NotNull(document.VirusScannedAt);
    }

    [Fact]
    public void MarkVirusScanned_ShouldSetVirusCleanToFalse_WhenVirusFound()
    {
        // Arrange
        var document = CreateDocument();
        
        // Act
        document.MarkVirusScanned(false);

        // Assert
        Assert.True(document.IsVirusScanned);
        Assert.False(document.IsVirusClean);
    }

    [Fact]
    public void Verify_ShouldThrow_WhenNotVirusScanned()
    {
        // Arrange
        var document = CreateDocument();
        typeof(DomainDocument).GetProperty("Status")!.SetValue(document, DocumentStatus.PendingVerification);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => document.Verify("verifier"));
    }

    [Fact]
    public void Verify_ShouldThrow_WhenVirusNotClean()
    {
        // Arrange
        var document = CreateDocument();
        document.MarkVirusScanned(false);
        typeof(DomainDocument).GetProperty("Status")!.SetValue(document, DocumentStatus.PendingVerification);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => document.Verify("verifier"));
    }

    [Fact]
    public void Verify_ShouldThrow_WhenStatusNotPendingVerification()
    {
        // Arrange
        var document = CreateDocument();
        document.MarkVirusScanned(true);
        // Change status to something other than PendingVerification
        typeof(DomainDocument).GetProperty("Status")!.SetValue(document, DocumentStatus.Uploaded);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => document.Verify("verifier"));
    }

    [Fact]
    public void Verify_ShouldUpdateStatusToVerified()
    {
        // Arrange
        var document = CreateDocument();
        document.MarkVirusScanned(true);
        typeof(DomainDocument).GetProperty("Status")!.SetValue(document, DocumentStatus.PendingVerification);

        // Act
        document.Verify("verifier");

        // Assert
        Assert.Equal(DocumentStatus.Verified, document.Status);
        Assert.True(document.IsVerified);
        Assert.NotNull(document.VerifiedAt);
        Assert.Equal("verifier", document.VerifiedBy);
    }

    [Fact]
    public void Reject_ShouldThrow_WhenDocumentIsVerified()
    {
        // Arrange
        var document = CreateDocument();
        document.MarkVirusScanned(true);
        typeof(DomainDocument).GetProperty("Status")!.SetValue(document, DocumentStatus.PendingVerification);
        document.Verify("verifier");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => document.Reject("Reason", "rejecter"));
    }

    [Fact]
    public void Reject_ShouldUpdateStatusToRejected()
    {
        // Arrange
        var document = CreateDocument();

        // Act
        document.Reject("Invalid format", "rejecter");

        // Assert
        Assert.Equal(DocumentStatus.Rejected, document.Status);
        Assert.Equal("Invalid format", document.RejectionReason);
        Assert.Equal("rejecter", document.VerifiedBy);
    }

    [Fact]
    public void SetExpiry_ShouldThrow_WhenExpiryDateInPast()
    {
        // Arrange
        var document = CreateDocument();
        var pastDate = DateTime.UtcNow.AddDays(-1);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => document.SetExpiry(pastDate));
    }

    [Fact]
    public void SetExpiry_ShouldSetExpiryDate_WhenFutureDate()
    {
        // Arrange
        var document = CreateDocument();
        var futureDate = DateTime.UtcNow.AddDays(30);

        // Act
        document.SetExpiry(futureDate);

        // Assert
        Assert.Equal(futureDate, document.ExpiresAt);
    }

    [Fact]
    public void IsExpired_ShouldReturnTrue_WhenExpired()
    {
        // Arrange
        var document = CreateDocument();
        // Use reflection to set expiry in the past since SetExpiry validates
        typeof(DomainDocument).GetProperty("ExpiresAt")!.SetValue(document, DateTime.UtcNow.AddDays(-1));

        // Act
        var result = document.IsExpired();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnFalse_WhenNotExpired()
    {
        // Arrange
        var document = CreateDocument();
        document.SetExpiry(DateTime.UtcNow.AddDays(30));

        // Act
        var result = document.IsExpired();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsExpired_ShouldReturnFalse_WhenNoExpiryDate()
    {
        // Arrange
        var document = CreateDocument();

        // Act
        var result = document.IsExpired();

        // Assert
        Assert.False(result);
    }

    private static DomainDocument CreateDocument()
    {
        var metadata = new DocumentMetadata { Description = "Test document" };
        return DomainDocument.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            DocumentType.PassportCopy,
            "test.pdf",
            "application/pdf",
            1024,
            "storage-key",
            "bucket-name",
            metadata,
            "uploader");
    }
}

