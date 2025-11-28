using OnboardingApi.Domain.Document.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.ValueObjects;

public class DocumentMetadataTests
{
    [Fact]
    public void DocumentMetadata_ShouldInitializeWithEmptyTags()
    {
        // Arrange & Act
        var metadata = new DocumentMetadata();

        // Assert
        Assert.NotNull(metadata.Tags);
        Assert.Empty(metadata.Tags);
    }

    [Fact]
    public void DocumentMetadata_ShouldAllowSettingAllProperties()
    {
        // Arrange
        var tags = new Dictionary<string, string>
        {
            { "category", "identity" },
            { "type", "passport" }
        };

        // Act
        var metadata = new DocumentMetadata
        {
            Description = "Passport copy",
            Tags = tags,
            IssueDate = "2020-01-01",
            ExpiryDate = "2030-01-01",
            IssuingAuthority = "Government",
            DocumentNumber = "P123456",
            Country = "USA"
        };

        // Assert
        Assert.Equal("Passport copy", metadata.Description);
        Assert.Equal(tags, metadata.Tags);
        Assert.Equal("2020-01-01", metadata.IssueDate);
        Assert.Equal("2030-01-01", metadata.ExpiryDate);
        Assert.Equal("Government", metadata.IssuingAuthority);
        Assert.Equal("P123456", metadata.DocumentNumber);
        Assert.Equal("USA", metadata.Country);
    }

    [Fact]
    public void DocumentMetadata_ShouldAllowNullOptionalProperties()
    {
        // Arrange & Act
        var metadata = new DocumentMetadata
        {
            Description = null,
            IssueDate = null,
            ExpiryDate = null,
            IssuingAuthority = null,
            DocumentNumber = null,
            Country = null
        };

        // Assert
        Assert.Null(metadata.Description);
        Assert.Null(metadata.IssueDate);
        Assert.Null(metadata.ExpiryDate);
        Assert.Null(metadata.IssuingAuthority);
        Assert.Null(metadata.DocumentNumber);
        Assert.Null(metadata.Country);
    }
}

