using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;

namespace OnboardingApi.Application.Commands;

/// <summary>
/// Handler for CreateOnboardingCaseCommand
/// </summary>
public class CreateOnboardingCaseCommandHandler : IRequestHandler<CreateOnboardingCaseCommand, CreateOnboardingCaseResult>
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly IEventBus _eventBus;
    private readonly ILogger<CreateOnboardingCaseCommandHandler> _logger;

    public CreateOnboardingCaseCommandHandler(
        IOnboardingCaseRepository repository,
        IEventBus eventBus,
        ILogger<CreateOnboardingCaseCommandHandler> logger)
    {
        _repository = repository;
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task<CreateOnboardingCaseResult> Handle(CreateOnboardingCaseCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Creating onboarding case for partner {PartnerId}, type {Type}",
            request.PartnerId,
            request.Type);

        // Map DTOs to value objects
        var applicant = MapToApplicantDetails(request.Applicant);
        var business = request.Business != null ? MapToBusinessDetails(request.Business) : null;

        // Create aggregate
        var onboardingCase = OnboardingCase.Create(
            request.Type,
            request.PartnerId,
            request.PartnerReferenceId,
            applicant,
            business,
            request.CreatedBy);

        // Persist
        await _repository.AddAsync(onboardingCase, cancellationToken);
        await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        // Publish domain events
        foreach (var domainEvent in onboardingCase.DomainEvents)
        {
            await _eventBus.PublishAsync(domainEvent, cancellationToken);
        }

        onboardingCase.ClearDomainEvents();

        _logger.LogInformation(
            "Created onboarding case {CaseId} with number {CaseNumber}",
            onboardingCase.Id,
            onboardingCase.CaseNumber);

        return new CreateOnboardingCaseResult(onboardingCase.Id, onboardingCase.CaseNumber);
    }

    private static ApplicantDetails MapToApplicantDetails(ApplicantDetailsDto dto)
    {
        return new ApplicantDetails
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            MiddleName = dto.MiddleName,
            DateOfBirth = dto.DateOfBirth,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            ResidentialAddress = MapToAddress(dto.ResidentialAddress),
            Nationality = dto.Nationality,
            TaxId = dto.TaxId,
            PassportNumber = dto.PassportNumber,
            DriversLicenseNumber = dto.DriversLicenseNumber
        };
    }

    private static BusinessDetails MapToBusinessDetails(BusinessDetailsDto dto)
    {
        return new BusinessDetails
        {
            LegalName = dto.LegalName,
            TradeName = dto.TradeName,
            RegistrationNumber = dto.RegistrationNumber,
            RegistrationCountry = dto.RegistrationCountry,
            IncorporationDate = dto.IncorporationDate,
            BusinessType = dto.BusinessType,
            Industry = dto.Industry,
            RegisteredAddress = MapToAddress(dto.RegisteredAddress),
            OperatingAddress = dto.OperatingAddress != null ? MapToAddress(dto.OperatingAddress) : null,
            TaxId = dto.TaxId,
            VatNumber = dto.VatNumber,
            Website = dto.Website,
            NumberOfEmployees = dto.NumberOfEmployees,
            EstimatedAnnualRevenue = dto.EstimatedAnnualRevenue
        };
    }

    private static Address MapToAddress(AddressDto dto)
    {
        return new Address
        {
            Street = dto.Street,
            Street2 = dto.Street2,
            City = dto.City,
            State = dto.State,
            PostalCode = dto.PostalCode,
            Country = dto.Country
        };
    }
}

