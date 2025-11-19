using FluentAssertions;
using Mapster;
using Moq;
using OnboardingApi.Application.Commands;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Mapping;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Commands;

/// <summary>
/// Unit tests for CreateOnboardingCaseCommandHandler
/// Demonstrates best practices for testing CQRS handlers with MediatR
/// </summary>
public class CreateOnboardingCaseCommandHandlerTests
{
    private readonly Mock<IOnboardingCaseRepository> _repositoryMock;
    private readonly Mock<IEventBus> _eventBusMock;
    private readonly Mock<Microsoft.Extensions.Logging.ILogger<CreateOnboardingCaseCommandHandler>> _loggerMock;
    private readonly CreateOnboardingCaseCommandHandler _handler;

    public CreateOnboardingCaseCommandHandlerTests()
    {
        // Configure Mapster for tests
        MapsterConfig.Configure();

        _repositoryMock = new Mock<IOnboardingCaseRepository>();
        _eventBusMock = new Mock<IEventBus>();
        _loggerMock = new Mock<Microsoft.Extensions.Logging.ILogger<CreateOnboardingCaseCommandHandler>>();

        // Setup repository unit of work mock
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        _repositoryMock.Setup(r => r.UnitOfWork).Returns(unitOfWorkMock.Object);

        _handler = new CreateOnboardingCaseCommandHandler(
            _repositoryMock.Object,
            _eventBusMock.Object,
            _loggerMock.Object);
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
        result.Should().NotBeNull();
        result.CaseId.Should().NotBeEmpty();
        result.CaseNumber.Should().StartWith("OBC-");

        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<OnboardingCase>(), It.IsAny<CancellationToken>()), Times.Once);
        _repositoryMock.Verify(r => r.UnitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _eventBusMock.Verify(e => e.PublishAsync(It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
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

        OnboardingCase? capturedCase = null;
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<OnboardingCase>(), It.IsAny<CancellationToken>()))
            .Callback<OnboardingCase, CancellationToken>((c, ct) => capturedCase = c);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Verify Mapster correctly mapped the DTO to domain model
        capturedCase.Should().NotBeNull();
        capturedCase!.Applicant.FirstName.Should().Be("Jane");
        capturedCase.Applicant.LastName.Should().Be("Smith");
        capturedCase.Applicant.MiddleName.Should().Be("Marie");
        capturedCase.Applicant.ResidentialAddress.Street.Should().Be("456 Oak Ave");
        capturedCase.Applicant.ResidentialAddress.Street2.Should().Be("Apt 2B");
        capturedCase.Applicant.TaxId.Should().Be("123-45-6789");
        capturedCase.Applicant.PassportNumber.Should().Be("P123456");
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

        OnboardingCase? capturedCase = null;
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<OnboardingCase>(), It.IsAny<CancellationToken>()))
            .Callback<OnboardingCase, CancellationToken>((c, ct) => capturedCase = c);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        capturedCase.Should().NotBeNull();
        capturedCase!.Type.Should().Be(OnboardingType.Business);
        capturedCase.Business.Should().NotBeNull();
        capturedCase.Business!.LegalName.Should().Be("Test Company Inc");
        capturedCase.Business.RegistrationNumber.Should().Be("REG-12345");
        capturedCase.Business.NumberOfEmployees.Should().Be(50);
    }
}

