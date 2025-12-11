using OnboardingApi.Infrastructure.Utilities;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Utilities;

public class PartnerIdGeneratorTests
{
    [Fact]
    public void GenerateFromEmail_ShouldReturnDeterministicGuid()
    {
        // Arrange
        var email = "test@example.com";

        // Act
        var partnerId1 = PartnerIdGenerator.GenerateFromEmail(email);
        var partnerId2 = PartnerIdGenerator.GenerateFromEmail(email);

        // Assert
        Assert.Equal(partnerId1, partnerId2);
        Assert.NotEqual(Guid.Empty, partnerId1);
    }

    [Fact]
    public void GenerateFromEmail_ShouldBeCaseInsensitive()
    {
        // Arrange
        var emailLower = "test@example.com";
        var emailUpper = "TEST@EXAMPLE.COM";
        var emailMixed = "TeSt@ExAmPlE.CoM";

        // Act
        var partnerId1 = PartnerIdGenerator.GenerateFromEmail(emailLower);
        var partnerId2 = PartnerIdGenerator.GenerateFromEmail(emailUpper);
        var partnerId3 = PartnerIdGenerator.GenerateFromEmail(emailMixed);

        // Assert
        Assert.Equal(partnerId1, partnerId2);
        Assert.Equal(partnerId1, partnerId3);
    }

    [Fact]
    public void GenerateFromEmail_ShouldTrimWhitespace()
    {
        // Arrange
        var email1 = "test@example.com";
        var email2 = "  test@example.com  ";
        var email3 = "\ttest@example.com\n";

        // Act
        var partnerId1 = PartnerIdGenerator.GenerateFromEmail(email1);
        var partnerId2 = PartnerIdGenerator.GenerateFromEmail(email2);
        var partnerId3 = PartnerIdGenerator.GenerateFromEmail(email3);

        // Assert
        Assert.Equal(partnerId1, partnerId2);
        Assert.Equal(partnerId1, partnerId3);
    }

    [Fact]
    public void GenerateFromEmail_ShouldThrow_WhenEmailIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            PartnerIdGenerator.GenerateFromEmail(null!));
    }

    [Fact]
    public void GenerateFromEmail_ShouldThrow_WhenEmailIsEmpty()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            PartnerIdGenerator.GenerateFromEmail(string.Empty));
    }

    [Fact]
    public void GenerateFromEmail_ShouldThrow_WhenEmailIsWhitespace()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            PartnerIdGenerator.GenerateFromEmail("   "));
    }

    [Fact]
    public void GenerateFromEmail_ShouldReturnDifferentGuids_ForDifferentEmails()
    {
        // Arrange
        var email1 = "user1@example.com";
        var email2 = "user2@example.com";

        // Act
        var partnerId1 = PartnerIdGenerator.GenerateFromEmail(email1);
        var partnerId2 = PartnerIdGenerator.GenerateFromEmail(email2);

        // Assert
        Assert.NotEqual(partnerId1, partnerId2);
    }

    [Fact]
    public void Validate_ShouldReturnTrue_WhenPartnerIdMatches()
    {
        // Arrange
        var email = "test@example.com";
        var partnerId = PartnerIdGenerator.GenerateFromEmail(email);

        // Act
        var result = PartnerIdGenerator.Validate(email, partnerId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void Validate_ShouldReturnFalse_WhenPartnerIdDoesNotMatch()
    {
        // Arrange
        var email = "test@example.com";
        var wrongPartnerId = Guid.NewGuid();

        // Act
        var result = PartnerIdGenerator.Validate(email, wrongPartnerId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void Validate_ShouldReturnFalse_WhenEmailIsNull()
    {
        // Arrange
        var partnerId = Guid.NewGuid();

        // Act
        var result = PartnerIdGenerator.Validate(null!, partnerId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void Validate_ShouldReturnFalse_WhenEmailIsEmpty()
    {
        // Arrange
        var partnerId = Guid.NewGuid();

        // Act
        var result = PartnerIdGenerator.Validate(string.Empty, partnerId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void Validate_ShouldBeCaseInsensitive()
    {
        // Arrange
        var email = "Test@Example.com";
        var partnerId = PartnerIdGenerator.GenerateFromEmail(email);

        // Act
        var result1 = PartnerIdGenerator.Validate("test@example.com", partnerId);
        var result2 = PartnerIdGenerator.Validate("TEST@EXAMPLE.COM", partnerId);

        // Assert
        Assert.True(result1);
        Assert.True(result2);
    }
}
