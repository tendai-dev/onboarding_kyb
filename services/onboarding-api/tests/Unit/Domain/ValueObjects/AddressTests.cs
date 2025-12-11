using OnboardingApi.Domain.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.ValueObjects;

public class AddressTests
{
    [Fact]
    public void IsComplete_ShouldReturnTrue_WhenAllRequiredFieldsAreSet()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            City = "New York",
            State = "NY",
            PostalCode = "10001",
            Country = "US"
        };

        // Act
        var result = address.IsComplete();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenStreetIsEmpty()
    {
        // Arrange
        var address = new Address
        {
            Street = "",
            City = "New York",
            State = "NY",
            PostalCode = "10001",
            Country = "US"
        };

        // Act
        var result = address.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenCityIsEmpty()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            City = "",
            State = "NY",
            PostalCode = "10001",
            Country = "US"
        };

        // Act
        var result = address.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenStateIsEmpty()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            City = "New York",
            State = "",
            PostalCode = "10001",
            Country = "US"
        };

        // Act
        var result = address.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenPostalCodeIsEmpty()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            City = "New York",
            State = "NY",
            PostalCode = "",
            Country = "US"
        };

        // Act
        var result = address.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenCountryIsEmpty()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            City = "New York",
            State = "NY",
            PostalCode = "10001",
            Country = ""
        };

        // Act
        var result = address.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void GetFormattedAddress_ShouldFormatCorrectly_WithoutStreet2()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            City = "New York",
            State = "NY",
            PostalCode = "10001",
            Country = "US"
        };

        // Act
        var result = address.GetFormattedAddress();

        // Assert
        Assert.Contains("123 Main St", result);
        Assert.Contains("New York, NY 10001", result);
        Assert.Contains("US", result);
    }

    [Fact]
    public void GetFormattedAddress_ShouldIncludeStreet2_WhenSet()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            Street2 = "Apt 4B",
            City = "New York",
            State = "NY",
            PostalCode = "10001",
            Country = "US"
        };

        // Act
        var result = address.GetFormattedAddress();

        // Assert
        Assert.Contains("123 Main St", result);
        Assert.Contains("Apt 4B", result);
        Assert.Contains("New York, NY 10001", result);
        Assert.Contains("US", result);
    }

    [Fact]
    public void GetFormattedAddress_ShouldIgnoreEmptyStreet2()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            Street2 = "",
            City = "New York",
            State = "NY",
            PostalCode = "10001",
            Country = "US"
        };

        // Act
        var result = address.GetFormattedAddress();

        // Assert
        Assert.DoesNotContain("Apt", result);
        Assert.Contains("123 Main St", result);
    }

    [Fact]
    public void GetFormattedAddress_ShouldIgnoreWhitespaceStreet2()
    {
        // Arrange
        var address = new Address
        {
            Street = "123 Main St",
            Street2 = "   ",
            City = "New York",
            State = "NY",
            PostalCode = "10001",
            Country = "US"
        };

        // Act
        var result = address.GetFormattedAddress();

        // Assert
        var lines = result.Split(Environment.NewLine);
        Assert.Equal(3, lines.Length); // Street, City/State/Postal, Country
    }
}
