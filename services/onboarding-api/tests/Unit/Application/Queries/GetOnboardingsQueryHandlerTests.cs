using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Queries;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Queries;

public class GetOnboardingsQueryHandlerTests
{
    private readonly MockOnboardingCaseRepository _repositoryMock;
    private readonly MockLogger<GetOnboardingsQueryHandler> _loggerMock;
    private readonly GetOnboardingsQueryHandler _handler;

    public GetOnboardingsQueryHandlerTests()
    {
        _repositoryMock = new MockOnboardingCaseRepository();
        _loggerMock = new MockLogger<GetOnboardingsQueryHandler>();

        _handler = new GetOnboardingsQueryHandler(
            _repositoryMock,
            _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldReturnListOfOnboardingCases_WhenValidPartnerId()
    {
        // Arrange
        var partnerId = Guid.NewGuid();
        var onboardingCases = new List<OnboardingCase>
        {
            CreateTestOnboardingCase(Guid.NewGuid(), partnerId),
            CreateTestOnboardingCase(Guid.NewGuid(), partnerId)
        };
        _repositoryMock.SetupGetByPartnerId(partnerId, onboardingCases);

        var query = new GetOnboardingsQuery
        {
            UserId = partnerId.ToString(),
            Limit = 25,
            Offset = 0
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(onboardingCases[0].Id, result[0].Id);
        Assert.Equal(onboardingCases[1].Id, result[1].Id);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenInvalidUserId()
    {
        // Arrange
        var query = new GetOnboardingsQuery
        {
            UserId = "invalid-guid",
            Limit = 25,
            Offset = 0
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_ShouldApplyFilters_WhenStatusProvided()
    {
        // Arrange
        var partnerId = Guid.NewGuid();
        var case1 = CreateTestOnboardingCase(Guid.NewGuid(), partnerId);
        case1.Submit("test@example.com"); // Submit to change status to Submitted
        var case2 = CreateTestOnboardingCase(Guid.NewGuid(), partnerId); // Keep as Draft
        var onboardingCases = new List<OnboardingCase> { case1, case2 };
        _repositoryMock.SetupGetByPartnerId(partnerId, onboardingCases);

        var query = new GetOnboardingsQuery
        {
            UserId = partnerId.ToString(),
            Limit = 25,
            Offset = 0,
            Status = "Submitted"
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal("Submitted", result[0].Status);
    }

    [Fact]
    public async Task Handle_ShouldApplyPagination_WhenLimitAndOffsetProvided()
    {
        // Arrange
        var partnerId = Guid.NewGuid();
        var onboardingCases = new List<OnboardingCase>();
        // Create 10 cases
        for (int i = 0; i < 10; i++)
        {
            onboardingCases.Add(CreateTestOnboardingCase(Guid.NewGuid(), partnerId));
        }
        _repositoryMock.SetupGetByPartnerId(partnerId, onboardingCases);

        var query = new GetOnboardingsQuery
        {
            UserId = partnerId.ToString(),
            Limit = 5,
            Offset = 5
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(5, result.Count); // Should get 5 items after skipping first 5
    }

    [Fact]
    public async Task Handle_ShouldMapAllProperties_WhenOnboardingCaseReturned()
    {
        // Arrange
        var partnerId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var onboardingCase = CreateTestOnboardingCase(caseId, partnerId);
        _repositoryMock.SetupGetByPartnerId(partnerId, new List<OnboardingCase> { onboardingCase });

        var query = new GetOnboardingsQuery
        {
            UserId = partnerId.ToString()
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Single(result);
        var dto = result[0];
        Assert.Equal(caseId, dto.Id);
        Assert.Equal(onboardingCase.CaseNumber, dto.CaseNumber);
        Assert.Equal("Individual", dto.Type);
        Assert.Equal("Draft", dto.Status);
        Assert.Equal(partnerId, dto.PartnerId);
        Assert.NotNull(dto.Applicant);
        Assert.Equal("John", dto.Applicant.FirstName);
        Assert.Equal("Doe", dto.Applicant.LastName);
    }

    private static OnboardingCase CreateTestOnboardingCase(Guid id, Guid partnerId)
    {
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

        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Individual,
            partnerId,
            "PART-123",
            applicant,
            null,
            "test@example.com"
        );

        typeof(OnboardingCase)
            .GetProperty(nameof(OnboardingCase.Id))!
            .SetValue(onboardingCase, id);

        return onboardingCase;
    }
}
