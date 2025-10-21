using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.Events;
using OnboardingApi.Domain.ValueObjects;
using Xunit;
using FluentAssertions;

namespace OnboardingApi.Tests.Unit.Domain;

public class OnboardingCaseTests
{
    [Fact]
    public void Create_ShouldCreateValidOnboardingCase_WithRequiredFields()
    {
        // Arrange
        var applicant = CreateValidApplicant();
        var partnerId = Guid.NewGuid();
        var createdBy = "test@example.com";

        // Act
        var result = OnboardingCase.Create(
            OnboardingType.Individual,
            partnerId,
            "PART-123",
            applicant,
            null,
            createdBy
        );

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.CaseNumber.Should().StartWith("OBC-");
        result.Type.Should().Be(OnboardingType.Individual);
        result.Status.Should().Be(OnboardingStatus.Draft);
        result.PartnerId.Should().Be(partnerId);
        result.Applicant.Should().Be(applicant);
        result.CreatedBy.Should().Be(createdBy);
    }

    [Fact]
    public void Create_ShouldRaiseDomainEvent_WhenCaseCreated()
    {
        // Arrange
        var applicant = CreateValidApplicant();

        // Act
        var result = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "PART-123",
            applicant,
            null,
            "test@example.com"
        );

        // Assert
        result.DomainEvents.Should().ContainSingle();
        result.DomainEvents.First().Should().BeOfType<OnboardingCaseCreatedEvent>();
    }

    [Fact]
    public void Submit_ShouldChangeStatusToSubmitted_WhenInDraftStatus()
    {
        // Arrange
        var onboardingCase = CreateValidOnboardingCase();
        var submittedBy = "test@example.com";

        // Act
        onboardingCase.Submit(submittedBy);

        // Assert
        onboardingCase.Status.Should().Be(OnboardingStatus.Submitted);
        onboardingCase.UpdatedBy.Should().Be(submittedBy);
    }

    [Fact]
    public void Submit_ShouldThrowException_WhenNotInDraftStatus()
    {
        // Arrange
        var onboardingCase = CreateValidOnboardingCase();
        onboardingCase.Submit("user@example.com");

        // Act
        Action act = () => onboardingCase.Submit("user@example.com");

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot submit case in status*");
    }

    [Fact]
    public void Submit_ShouldThrowException_WhenApplicantIncomplete()
    {
        // Arrange
        var incompleteApplicant = new ApplicantDetails
        {
            FirstName = "John",
            // Missing required fields
        };

        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "PART-123",
            incompleteApplicant,
            null,
            "test@example.com"
        );

        // Act
        Action act = () => onboardingCase.Submit("user@example.com");

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Applicant details are incomplete*");
    }

    [Fact]
    public void Approve_ShouldChangeStatusToApproved_WhenUnderReview()
    {
        // Arrange
        var onboardingCase = CreateValidOnboardingCase();
        onboardingCase.Submit("user@example.com");
        // Simulate review started
        typeof(OnboardingCase)
            .GetProperty(nameof(OnboardingCase.Status))!
            .SetValue(onboardingCase, OnboardingStatus.UnderReview);

        // Act
        onboardingCase.Approve("approver@example.com", "All checks passed");

        // Assert
        onboardingCase.Status.Should().Be(OnboardingStatus.Approved);
        onboardingCase.UpdatedBy.Should().Be("approver@example.com");
        onboardingCase.Metadata.Should().ContainKey("approval_notes");
    }

    [Fact]
    public void Reject_ShouldChangeStatusToRejected_WithReason()
    {
        // Arrange
        var onboardingCase = CreateValidOnboardingCase();
        onboardingCase.Submit("user@example.com");

        // Act
        onboardingCase.Reject("reviewer@example.com", "Incomplete documentation");

        // Assert
        onboardingCase.Status.Should().Be(OnboardingStatus.Rejected);
        onboardingCase.Metadata["rejection_reason"].Should().Be("Incomplete documentation");
    }

    [Fact]
    public void UpdateApplicant_ShouldUpdateDetails_WhenNotFinalStatus()
    {
        // Arrange
        var onboardingCase = CreateValidOnboardingCase();
        var newApplicant = CreateValidApplicant("Jane");

        // Act
        onboardingCase.UpdateApplicant(newApplicant, "user@example.com");

        // Assert
        onboardingCase.Applicant.FirstName.Should().Be("Jane");
        onboardingCase.UpdatedBy.Should().Be("user@example.com");
    }

    [Fact]
    public void UpdateApplicant_ShouldThrowException_WhenCaseApproved()
    {
        // Arrange
        var onboardingCase = CreateValidOnboardingCase();
        typeof(OnboardingCase)
            .GetProperty(nameof(OnboardingCase.Status))!
            .SetValue(onboardingCase, OnboardingStatus.Approved);

        // Act
        Action act = () => onboardingCase.UpdateApplicant(
            CreateValidApplicant(),
            "user@example.com"
        );

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot update applicant in status*");
    }

    [Fact]
    public void RequestAdditionalInfo_ShouldChangeStatusAndRaiseEvent()
    {
        // Arrange
        var onboardingCase = CreateValidOnboardingCase();
        onboardingCase.Submit("user@example.com");

        // Act
        onboardingCase.RequestAdditionalInfo("reviewer@example.com", "Need more docs");

        // Assert
        onboardingCase.Status.Should().Be(OnboardingStatus.AdditionalInfoRequired);
        onboardingCase.DomainEvents.Should().Contain(e => e is AdditionalInfoRequestedEvent);
    }

    // Helper methods
    private static OnboardingCase CreateValidOnboardingCase()
    {
        return OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "PART-123",
            CreateValidApplicant(),
            null,
            "test@example.com"
        );
    }

    private static ApplicantDetails CreateValidApplicant(string firstName = "John")
    {
        return new ApplicantDetails
        {
            FirstName = firstName,
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

