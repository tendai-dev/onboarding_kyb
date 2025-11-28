using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Aggregates;

public class OnboardingCaseMoreEdgeCaseTests
{
    [Fact]
    public void Approve_ShouldAddNotesToMetadata_WhenNotesProvided()
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

        caseEntity.Submit("submitter");
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(caseEntity, OnboardingStatus.UnderReview);

        // Act
        caseEntity.Approve("approver", "Approved with notes");

        // Assert
        Assert.Equal(OnboardingStatus.Approved, caseEntity.Status);
        Assert.True(caseEntity.Metadata.ContainsKey("approval_notes"));
        Assert.Equal("Approved with notes", caseEntity.Metadata["approval_notes"]);
    }

    [Fact]
    public void Approve_ShouldNotAddNotesToMetadata_WhenNotesNotProvided()
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

        caseEntity.Submit("submitter");
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(caseEntity, OnboardingStatus.UnderReview);

        // Act
        caseEntity.Approve("approver", null);

        // Assert
        Assert.Equal(OnboardingStatus.Approved, caseEntity.Status);
        Assert.False(caseEntity.Metadata.ContainsKey("approval_notes"));
    }

    [Fact]
    public void Reject_ShouldThrow_WhenStatusIsApproved()
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

        caseEntity.Submit("submitter");
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(caseEntity, OnboardingStatus.Approved);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => caseEntity.Reject("rejector", "Reason"));
    }

    [Fact]
    public void Reject_ShouldSucceed_WhenStatusIsNotApproved()
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

        caseEntity.Submit("submitter");
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(caseEntity, OnboardingStatus.UnderReview);

        // Act
        caseEntity.Reject("rejector", "Reason");

        // Assert
        Assert.Equal(OnboardingStatus.Rejected, caseEntity.Status);
        Assert.True(caseEntity.Metadata.ContainsKey("rejection_reason"));
    }

    [Fact]
    public void RequestAdditionalInfo_ShouldThrow_WhenStatusIsApproved()
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

        typeof(OnboardingCase).GetProperty("Status")!.SetValue(caseEntity, OnboardingStatus.Approved);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => caseEntity.RequestAdditionalInfo("requester", "Need more info"));
    }

    [Fact]
    public void RequestAdditionalInfo_ShouldThrow_WhenStatusIsRejected()
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

        typeof(OnboardingCase).GetProperty("Status")!.SetValue(caseEntity, OnboardingStatus.Rejected);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => caseEntity.RequestAdditionalInfo("requester", "Need more info"));
    }

    [Fact]
    public void RequestAdditionalInfo_ShouldSucceed_WhenStatusIsValid()
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

        caseEntity.Submit("submitter");
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(caseEntity, OnboardingStatus.UnderReview);

        // Act
        caseEntity.RequestAdditionalInfo("requester", "Need more info");

        // Assert
        Assert.Equal(OnboardingStatus.AdditionalInfoRequired, caseEntity.Status);
    }

    [Fact]
    public void Submit_ShouldIncludeMetadataInEvent_WhenMetadataExists()
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

        // Add metadata
        caseEntity.Metadata["key1"] = "value1";
        caseEntity.Metadata["key2"] = "value2";

        // Act
        caseEntity.Submit("submitter");

        // Assert
        Assert.Equal(OnboardingStatus.Submitted, caseEntity.Status);
        Assert.Equal(2, caseEntity.DomainEvents.Count); // Created + Submitted events
        // The Submitted event should include metadata
    }

    [Fact]
    public void Submit_ShouldNotIncludeMetadataInEvent_WhenMetadataIsEmpty()
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

        // No metadata added

        // Act
        caseEntity.Submit("submitter");

        // Assert
        Assert.Equal(OnboardingStatus.Submitted, caseEntity.Status);
        Assert.Equal(2, caseEntity.DomainEvents.Count); // Created + Submitted events
    }
}

