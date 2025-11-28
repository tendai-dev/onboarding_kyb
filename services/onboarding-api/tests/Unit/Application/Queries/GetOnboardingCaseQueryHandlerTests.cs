using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Queries;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Queries;

public class GetOnboardingCaseQueryHandlerTests
{
    private readonly MockOnboardingCaseRepository _repositoryMock;
    private readonly MockLogger<GetOnboardingCaseQueryHandler> _loggerMock;
    private readonly GetOnboardingCaseQueryHandler _handler;

    public GetOnboardingCaseQueryHandlerTests()
    {
        _repositoryMock = new MockOnboardingCaseRepository();
        _loggerMock = new MockLogger<GetOnboardingCaseQueryHandler>();

        _handler = new GetOnboardingCaseQueryHandler(
            _repositoryMock,
            _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldReturnOnboardingCaseDto_WhenCaseExists()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var onboardingCase = CreateTestOnboardingCase(caseId);
        _repositoryMock.SetupGetById(caseId, onboardingCase);

        var query = new GetOnboardingCaseQuery(caseId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(caseId, result!.Id);
        Assert.Equal(onboardingCase.CaseNumber, result.CaseNumber);
        Assert.Equal("Individual", result.Type);
        Assert.Equal("Draft", result.Status);
        Assert.NotNull(result.Applicant);
        Assert.Equal("John", result.Applicant.FirstName);
        Assert.Equal("Doe", result.Applicant.LastName);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenCaseNotFound()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        _repositoryMock.SetupGetById(caseId, null);

        var query = new GetOnboardingCaseQuery(caseId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task Handle_ShouldMapBusinessDetails_WhenBusinessOnboarding()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var onboardingCase = CreateTestBusinessOnboardingCase(caseId);
        _repositoryMock.SetupGetById(caseId, onboardingCase);

        var query = new GetOnboardingCaseQuery(caseId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result!.Business);
        Assert.Equal("Test Company Inc", result.Business!.LegalName);
        Assert.Equal("REG-12345", result.Business.RegistrationNumber);
        Assert.Equal("Business", result.Type);
    }

    [Fact]
    public async Task Handle_ShouldMapAddressCorrectly()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var onboardingCase = CreateTestOnboardingCase(caseId);
        _repositoryMock.SetupGetById(caseId, onboardingCase);

        var query = new GetOnboardingCaseQuery(caseId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result!.Applicant.ResidentialAddress);
        Assert.Equal("123 Main St", result.Applicant.ResidentialAddress.Street);
        Assert.Equal("New York", result.Applicant.ResidentialAddress.City);
        Assert.Equal("US", result.Applicant.ResidentialAddress.Country);
    }

    [Fact]
    public async Task Handle_ShouldMapOperatingAddress_WhenBusinessHasOperatingAddress()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var onboardingCase = CreateTestBusinessOnboardingCaseWithOperatingAddress(caseId);
        _repositoryMock.SetupGetById(caseId, onboardingCase);

        var query = new GetOnboardingCaseQuery(caseId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result!.Business);
        Assert.NotNull(result.Business!.OperatingAddress);
        Assert.Equal("200 Operating St", result.Business.OperatingAddress!.Street);
    }

    [Fact]
    public async Task Handle_ShouldReturnNullBusiness_WhenBusinessIsNull()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var onboardingCase = CreateTestOnboardingCase(caseId); // Individual case, no business
        _repositoryMock.SetupGetById(caseId, onboardingCase);

        var query = new GetOnboardingCaseQuery(caseId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result!.Business);
    }

    private static OnboardingCase CreateTestOnboardingCase(Guid id)
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
            Guid.NewGuid(),
            "PART-123",
            applicant,
            null,
            "test@example.com"
        );

        // Use reflection to set the Id for testing
        typeof(OnboardingCase)
            .GetProperty(nameof(OnboardingCase.Id))!
            .SetValue(onboardingCase, id);

        return onboardingCase;
    }

    private static OnboardingCase CreateTestBusinessOnboardingCase(Guid id)
    {
        var applicant = new ApplicantDetails
        {
            FirstName = "Company",
            LastName = "Rep",
            DateOfBirth = new DateTime(1985, 5, 15),
            Email = "rep@company.com",
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

        var business = new BusinessDetails
        {
            LegalName = "Test Company Inc",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = new Address
            {
                Street = "100 Corporate Blvd",
                City = "New York",
                State = "NY",
                PostalCode = "10001",
                Country = "US"
            }
        };

        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Business,
            Guid.NewGuid(),
            "PART-123",
            applicant,
            business,
            "test@example.com"
        );

        typeof(OnboardingCase)
            .GetProperty(nameof(OnboardingCase.Id))!
            .SetValue(onboardingCase, id);

        return onboardingCase;
    }

    private static OnboardingCase CreateTestBusinessOnboardingCaseWithOperatingAddress(Guid id)
    {
        var applicant = new ApplicantDetails
        {
            FirstName = "Company",
            LastName = "Rep",
            DateOfBirth = new DateTime(1985, 5, 15),
            Email = "rep@company.com",
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

        var business = new BusinessDetails
        {
            LegalName = "Test Company Inc",
            RegistrationNumber = "REG-12345",
            RegistrationCountry = "US",
            IncorporationDate = new DateTime(2020, 1, 1),
            BusinessType = "Corporation",
            Industry = "Technology",
            RegisteredAddress = new Address
            {
                Street = "100 Corporate Blvd",
                City = "New York",
                State = "NY",
                PostalCode = "10001",
                Country = "US"
            },
            OperatingAddress = new Address
            {
                Street = "200 Operating St",
                City = "New York",
                State = "NY",
                PostalCode = "10002",
                Country = "US"
            }
        };

        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Business,
            Guid.NewGuid(),
            "PART-123",
            applicant,
            business,
            "test@example.com"
        );

        typeof(OnboardingCase)
            .GetProperty(nameof(OnboardingCase.Id))!
            .SetValue(onboardingCase, id);

        return onboardingCase;
    }
}
