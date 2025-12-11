using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.Events;
using OnboardingApi.Domain.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain;

public class OnboardingCaseAggregateTests
{
    [Fact]
    public void Submit_ShouldThrow_WhenStatusNotDraft()
    {
        // Arrange
        var onboardingCase = CreateTestCase();
        onboardingCase.Submit("submitter");
        
        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => onboardingCase.Submit("submitter2"));
    }

    [Fact]
    public void Submit_ShouldThrow_WhenApplicantIncomplete()
    {
        // Arrange
        var incompleteApplicant = new ApplicantDetails
        {
            FirstName = "John",
            LastName = "", // Incomplete
            Email = "test@example.com"
        };
        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "PART-123",
            incompleteApplicant,
            null,
            "creator");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => onboardingCase.Submit("submitter"));
    }

    [Fact]
    public void Submit_ShouldThrow_WhenBusinessOnboardingButBusinessIncomplete()
    {
        // Arrange
        var applicant = CreateCompleteApplicant();
        var incompleteBusiness = new BusinessDetails
        {
            LegalName = "Company",
            RegistrationNumber = "" // Incomplete
        };
        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Business,
            Guid.NewGuid(),
            "PART-123",
            applicant,
            incompleteBusiness,
            "creator");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => onboardingCase.Submit("submitter"));
    }

    [Fact]
    public void Submit_ShouldChangeStatusToSubmitted()
    {
        // Arrange
        var onboardingCase = CreateTestCase();

        // Act
        onboardingCase.Submit("submitter");

        // Assert
        Assert.Equal(OnboardingStatus.Submitted, onboardingCase.Status);
        Assert.Equal("submitter", onboardingCase.UpdatedBy);
        Assert.Single(onboardingCase.DomainEvents.OfType<OnboardingCaseSubmittedEvent>());
    }

    [Fact]
    public void UpdateApplicant_ShouldThrow_WhenStatusIsApproved()
    {
        // Arrange
        var onboardingCase = CreateTestCase();
        onboardingCase.Submit("submitter");
        // Simulate approval by setting status directly
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(onboardingCase, OnboardingStatus.Approved);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            onboardingCase.UpdateApplicant(CreateCompleteApplicant(), "updater"));
    }

    [Fact]
    public void UpdateBusiness_ShouldThrow_WhenNotBusinessOnboarding()
    {
        // Arrange
        var onboardingCase = CreateTestCase();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            onboardingCase.UpdateBusiness(new BusinessDetails { LegalName = "Company" }, "updater"));
    }

    [Fact]
    public void Approve_ShouldThrow_WhenStatusNotUnderReview()
    {
        // Arrange
        var onboardingCase = CreateTestCase();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => onboardingCase.Approve("approver"));
    }

    [Fact]
    public void Approve_ShouldSetApprovalNotes_WhenProvided()
    {
        // Arrange
        var onboardingCase = CreateTestCase();
        onboardingCase.Submit("submitter");
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(onboardingCase, OnboardingStatus.UnderReview);

        // Act
        onboardingCase.Approve("approver", "Approved with notes");

        // Assert
        Assert.Equal(OnboardingStatus.Approved, onboardingCase.Status);
        Assert.Equal("Approved with notes", onboardingCase.Metadata["approval_notes"]);
    }

    [Fact]
    public void Reject_ShouldThrow_WhenStatusIsApproved()
    {
        // Arrange
        var onboardingCase = CreateTestCase();
        onboardingCase.Submit("submitter");
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(onboardingCase, OnboardingStatus.Approved);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => onboardingCase.Reject("rejecter", "Reason"));
    }

    [Fact]
    public void Reject_ShouldSetRejectionReason()
    {
        // Arrange
        var onboardingCase = CreateTestCase();
        onboardingCase.Submit("submitter");

        // Act
        onboardingCase.Reject("rejecter", "Invalid documents");

        // Assert
        Assert.Equal(OnboardingStatus.Rejected, onboardingCase.Status);
        Assert.Equal("Invalid documents", onboardingCase.Metadata["rejection_reason"]);
    }

    [Fact]
    public void RequestAdditionalInfo_ShouldThrow_WhenStatusIsApproved()
    {
        // Arrange
        var onboardingCase = CreateTestCase();
        onboardingCase.Submit("submitter");
        typeof(OnboardingCase).GetProperty("Status")!.SetValue(onboardingCase, OnboardingStatus.Approved);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            onboardingCase.RequestAdditionalInfo("requester", "Need more info"));
    }

    [Fact]
    public void RequestAdditionalInfo_ShouldChangeStatus()
    {
        // Arrange
        var onboardingCase = CreateTestCase();
        onboardingCase.Submit("submitter");

        // Act
        onboardingCase.RequestAdditionalInfo("requester", "Need more info");

        // Assert
        Assert.Equal(OnboardingStatus.AdditionalInfoRequired, onboardingCase.Status);
        Assert.Single(onboardingCase.DomainEvents.OfType<AdditionalInfoRequestedEvent>());
    }

    private static OnboardingCase CreateTestCase()
    {
        return OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "PART-123",
            CreateCompleteApplicant(),
            null,
            "creator");
    }

    private static ApplicantDetails CreateCompleteApplicant()
    {
        return new ApplicantDetails
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
    }
}

