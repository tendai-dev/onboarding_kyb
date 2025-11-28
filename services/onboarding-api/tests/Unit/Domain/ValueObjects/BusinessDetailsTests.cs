using OnboardingApi.Domain.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.ValueObjects;

public class BusinessDetailsTests
{
    [Fact]
    public void IsComplete_ShouldReturnTrue_WhenAllRequiredFieldsAreSet()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "Acme Corp",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = CreateCompleteAddress()
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenLegalNameIsEmpty()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = CreateCompleteAddress()
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenRegistrationNumberIsEmpty()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "Acme Corp",
            RegistrationNumber = "",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = CreateCompleteAddress()
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenRegistrationCountryIsEmpty()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "Acme Corp",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = CreateCompleteAddress()
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenIncorporationDateIsDefault()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "Acme Corp",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = default,
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = CreateCompleteAddress()
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenBusinessTypeIsEmpty()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "Acme Corp",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "",
            Industry = "Technology",
            RegisteredAddress = CreateCompleteAddress()
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenIndustryIsEmpty()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "Acme Corp",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "",
            RegisteredAddress = CreateCompleteAddress()
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenRegisteredAddressIsNull()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "Acme Corp",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = null!
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenRegisteredAddressIsIncomplete()
    {
        // Arrange
        var business = new BusinessDetails
        {
            LegalName = "Acme Corp",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = new Address
            {
                Street = "123 Main St",
                City = "", // Incomplete
                State = "NY",
                PostalCode = "10001",
                Country = "US"
            }
        };

        // Act
        var result = business.IsComplete();

        // Assert
        Assert.False(result);
    }

    private static Address CreateCompleteAddress()
    {
        return new Address
        {
            Street = "123 Main St",
            City = "New York",
            State = "NY",
            PostalCode = "10001",
            Country = "US"
        };
    }
}
