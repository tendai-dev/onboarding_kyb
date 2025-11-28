using Mapster;
using OnboardingApi.Application.Commands;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Mapping;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Commands;

/// <summary>
/// Unit tests for CreateOnboardingCaseCommandHandler
/// Demonstrates best practices for testing CQRS handlers with MediatR
/// </summary>
public class CreateOnboardingCaseCommandHandlerTests
{
    private readonly MockOnboardingCaseRepository _repositoryMock;
    private readonly MockEventBus _eventBusMock;
    private readonly MockLogger<CreateOnboardingCaseCommandHandler> _loggerMock;
    private readonly CreateOnboardingCaseCommandHandler _handler;

    public CreateOnboardingCaseCommandHandlerTests()
    {
        // Configure Mapster for tests
        MapsterConfig.Configure();

        _repositoryMock = new MockOnboardingCaseRepository();
        _eventBusMock = new MockEventBus();
        _loggerMock = new MockLogger<CreateOnboardingCaseCommandHandler>();

        _handler = new CreateOnboardingCaseCommandHandler(
            _repositoryMock,
            _eventBusMock,
            _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateOnboardingCase_WithValidCommand()
    {
        // Arrange
        var command = new CreateOnboardingCaseCommand
        {
            Type = OnboardingType.Individual,
            PartnerId = Guid.NewGuid(),
            PartnerReferenceId = "PART-001",
            CreatedBy = "test@example.com",
            Applicant = new ApplicantDetailsDto
            {
                FirstName = "John",
                LastName = "Doe",
                DateOfBirth = new DateTime(1990, 1, 1),
                Email = "john.doe@example.com",
                PhoneNumber = "+1234567890",
                ResidentialAddress = new AddressDto
                {
                    Street = "123 Main St",
                    City = "New York",
                    State = "NY",
                    PostalCode = "10001",
                    Country = "US"
                },
                Nationality = "US"
            }
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.CaseId);
        Assert.StartsWith("OBC-", result.CaseNumber);

        var addedCases = _repositoryMock.GetAddedCases();
        Assert.Single(addedCases);
        Assert.True(((MockUnitOfWork)_repositoryMock.UnitOfWork).SaveChangesAsyncCalled);
        Assert.NotEmpty(_eventBusMock.PublishedEvents);
    }

    [Fact]
    public async Task Handle_ShouldMapDtoToDomain_UsingMapster()
    {
        // Arrange
        var command = new CreateOnboardingCaseCommand
        {
            Type = OnboardingType.Individual,
            PartnerId = Guid.NewGuid(),
            PartnerReferenceId = "PART-001",
            CreatedBy = "test@example.com",
            Applicant = new ApplicantDetailsDto
            {
                FirstName = "Jane",
                LastName = "Smith",
                MiddleName = "Marie",
                DateOfBirth = new DateTime(1985, 5, 15),
                Email = "jane.smith@example.com",
                PhoneNumber = "+1987654321",
                ResidentialAddress = new AddressDto
                {
                    Street = "456 Oak Ave",
                    Street2 = "Apt 2B",
                    City = "Los Angeles",
                    State = "CA",
                    PostalCode = "90001",
                    Country = "US"
                },
                Nationality = "US",
                TaxId = "123-45-6789",
                PassportNumber = "P123456"
            }
        };

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Verify Mapster correctly mapped the DTO to domain model
        var addedCases = _repositoryMock.GetAddedCases();
        Assert.Single(addedCases);
        var capturedCase = addedCases[0];
        Assert.Equal("Jane", capturedCase.Applicant.FirstName);
        Assert.Equal("Smith", capturedCase.Applicant.LastName);
        Assert.Equal("Marie", capturedCase.Applicant.MiddleName);
        Assert.Equal("456 Oak Ave", capturedCase.Applicant.ResidentialAddress.Street);
        Assert.Equal("Apt 2B", capturedCase.Applicant.ResidentialAddress.Street2);
        Assert.Equal("123-45-6789", capturedCase.Applicant.TaxId);
        Assert.Equal("P123456", capturedCase.Applicant.PassportNumber);
    }

    [Fact]
    public async Task Handle_ShouldHandleBusinessOnboarding_WithBusinessDetails()
    {
        // Arrange
        var command = new CreateOnboardingCaseCommand
        {
            Type = OnboardingType.Business,
            PartnerId = Guid.NewGuid(),
            PartnerReferenceId = "PART-002",
            CreatedBy = "test@example.com",
            Applicant = new ApplicantDetailsDto
            {
                FirstName = "Company",
                LastName = "Rep",
                Email = "rep@company.com",
                PhoneNumber = "+1234567890",
                ResidentialAddress = new AddressDto
                {
                    Street = "789 Business St",
                    City = "Chicago",
                    State = "IL",
                    PostalCode = "60601",
                    Country = "US"
                },
                Nationality = "US"
            },
            Business = new BusinessDetailsDto
            {
                LegalName = "Test Company Inc",
                RegistrationNumber = "REG-12345",
                RegistrationCountry = "US",
                IncorporationDate = new DateTime(2020, 1, 1),
                BusinessType = "Corporation",
                Industry = "Technology",
                RegisteredAddress = new AddressDto
                {
                    Street = "100 Corporate Blvd",
                    City = "New York",
                    State = "NY",
                    PostalCode = "10001",
                    Country = "US"
                },
                NumberOfEmployees = 50,
                EstimatedAnnualRevenue = 1000000
            }
        };

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var addedCases = _repositoryMock.GetAddedCases();
        Assert.Single(addedCases);
        var capturedCase = addedCases[0];
        Assert.Equal(OnboardingType.Business, capturedCase.Type);
        Assert.NotNull(capturedCase.Business);
        Assert.Equal("Test Company Inc", capturedCase.Business!.LegalName);
        Assert.Equal("REG-12345", capturedCase.Business.RegistrationNumber);
        Assert.Equal(50, capturedCase.Business.NumberOfEmployees);
    }
}
