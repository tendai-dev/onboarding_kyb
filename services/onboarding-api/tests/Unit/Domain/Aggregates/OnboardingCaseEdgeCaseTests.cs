using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Aggregates;

public class OnboardingCaseEdgeCaseTests
{
    [Fact]
    public void Submit_ShouldThrow_WhenStatusIsNotDraft()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            DateOfBirth = DateTime.UtcNow.AddYears(-30),
            Nationality = "US",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "City",
                State = "State",
                PostalCode = "12345",
                Country = "US"
            }
        };

        var caseEntity = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "REF-123",
            applicant,
            null,
            "creator");

        // Change status to Submitted
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(caseEntity, OnboardingStatus.Submitted);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => caseEntity.Submit("submitter"));
    }

    [Fact]
    public void Submit_ShouldThrow_WhenApplicantDetailsAreIncomplete()
    {
        // Arrange
        var incompleteApplicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "", // Missing last name
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            DateOfBirth = DateTime.UtcNow.AddYears(-30),
            Nationality = "US",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "City",
                State = "State",
                PostalCode = "12345",
                Country = "US"
            }
        };

        var caseEntity = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "REF-123",
            incompleteApplicant,
            null,
            "creator");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => caseEntity.Submit("submitter"));
    }

    [Fact]
    public void Submit_ShouldThrow_WhenBusinessTypeAndBusinessDetailsAreIncomplete()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            DateOfBirth = DateTime.UtcNow.AddYears(-30),
            Nationality = "US",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "City",
                State = "State",
                PostalCode = "12345",
                Country = "US"
            }
        };

        var incompleteBusiness = new BusinessDetails
        {
            LegalName = "Test Corp",
            RegistrationNumber = "", // Missing registration number
            RegistrationCountry = "US",
            IncorporationDate = DateTime.UtcNow.AddYears(-5),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = new Address
            {
                Street = "456 Business St",
                City = "City",
                State = "State",
                PostalCode = "12345",
                Country = "US"
            }
        };

        var caseEntity = OnboardingCase.Create(
            OnboardingType.Business,
            Guid.NewGuid(),
            "REF-123",
            applicant,
            incompleteBusiness,
            "creator");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => caseEntity.Submit("submitter"));
    }

    [Fact]
    public void Submit_ShouldThrow_WhenBusinessTypeAndBusinessDetailsAreNull()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            DateOfBirth = DateTime.UtcNow.AddYears(-30),
            Nationality = "US",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "City",
                State = "State",
                PostalCode = "12345",
                Country = "US"
            }
        };

        var caseEntity = OnboardingCase.Create(
            OnboardingType.Business,
            Guid.NewGuid(),
            "REF-123",
            applicant,
            null, // Business details are null
            "creator");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => caseEntity.Submit("submitter"));
    }

    [Fact]
    public void Submit_ShouldSucceed_WhenAllDetailsAreComplete()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            DateOfBirth = DateTime.UtcNow.AddYears(-30),
            Nationality = "US",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "City",
                State = "State",
                PostalCode = "12345",
                Country = "US"
            }
        };

        var caseEntity = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "REF-123",
            applicant,
            null,
            "creator");

        // Act
        caseEntity.Submit("submitter");

        // Assert
        Assert.Equal(OnboardingStatus.Submitted, caseEntity.Status);
        Assert.Equal("submitter", caseEntity.UpdatedBy);
    }

    [Fact]
    public void Submit_ShouldSucceed_WhenBusinessTypeAndBusinessDetailsAreComplete()
    {
        // Arrange
        var applicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            DateOfBirth = DateTime.UtcNow.AddYears(-30),
            Nationality = "US",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "City",
                State = "State",
                PostalCode = "12345",
                Country = "US"
            }
        };

        var business = new BusinessDetails
        {
            LegalName = "Test Corp",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = DateTime.UtcNow.AddYears(-5),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = new Address
            {
                Street = "456 Business St",
                City = "City",
                State = "State",
                PostalCode = "12345",
                Country = "US"
            }
        };

        var caseEntity = OnboardingCase.Create(
            OnboardingType.Business,
            Guid.NewGuid(),
            "REF-123",
            applicant,
            business,
            "creator");

        // Act
        caseEntity.Submit("submitter");

        // Assert
        Assert.Equal(OnboardingStatus.Submitted, caseEntity.Status);
    }
}

