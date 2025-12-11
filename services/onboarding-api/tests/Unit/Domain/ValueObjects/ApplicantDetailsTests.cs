using OnboardingApi.Domain.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.ValueObjects;

public class ApplicantDetailsTests
{
    [Fact]
    public void IsComplete_ShouldReturnTrue_WhenAllRequiredFieldsAreSet()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "New York",
                State = "NY",
                PostalCode = "10001",
                Country = "US"
            },
            Nationality = "US"
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenFirstNameIsEmpty()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            ResidentialAddress = CreateCompleteAddress(),
            Nationality = "US"
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenLastNameIsEmpty()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            ResidentialAddress = CreateCompleteAddress(),
            Nationality = "US"
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenDateOfBirthIsDefault()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = default,
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            ResidentialAddress = CreateCompleteAddress(),
            Nationality = "US"
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenEmailIsEmpty()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "",
            PhoneNumber = "+1234567890",
            ResidentialAddress = CreateCompleteAddress(),
            Nationality = "US"
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenPhoneNumberIsEmpty()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "john.doe@example.com",
            PhoneNumber = "",
            ResidentialAddress = CreateCompleteAddress(),
            Nationality = "US"
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenAddressIsNull()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            ResidentialAddress = null!,
            Nationality = "US"
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenAddressIsIncomplete()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "", // Incomplete
                State = "NY",
                PostalCode = "10001",
                Country = "US"
            },
            Nationality = "US"
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsComplete_ShouldReturnFalse_WhenNationalityIsEmpty()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            ResidentialAddress = CreateCompleteAddress(),
            Nationality = ""
        };

        // Act
        var result = applicant.IsComplete();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void GetFullName_ShouldReturnFirstNameAndLastName_WhenNoMiddleName()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var result = applicant.GetFullName();

        // Assert
        Assert.Equal("John Doe", result);
    }

    [Fact]
    public void GetFullName_ShouldIncludeMiddleName_WhenMiddleNameIsSet()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            MiddleName = "Michael",
            LastName = "Doe"
        };

        // Act
        var result = applicant.GetFullName();

        // Assert
        Assert.Equal("John Michael Doe", result);
    }

    [Fact]
    public void GetFullName_ShouldHandleWhitespaceMiddleName()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            MiddleName = "   ",
            LastName = "Doe"
        };

        // Act
        var result = applicant.GetFullName();

        // Assert
        Assert.Equal("John Doe", result);
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
