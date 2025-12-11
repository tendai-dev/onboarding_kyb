using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;

namespace OnboardingApi.Application.Queries;

/// <summary>
/// Handler for GetOnboardingCaseQuery
/// </summary>
public class GetOnboardingCaseQueryHandler : IRequestHandler<GetOnboardingCaseQuery, OnboardingCaseDto?>
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly ILogger<GetOnboardingCaseQueryHandler> _logger;

    public GetOnboardingCaseQueryHandler(
        IOnboardingCaseRepository repository,
        ILogger<GetOnboardingCaseQueryHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<OnboardingCaseDto?> Handle(GetOnboardingCaseQuery request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Fetching onboarding case {CaseId}", request.CaseId);

        var onboardingCase = await _repository.GetByIdAsync(request.CaseId, cancellationToken);

        if (onboardingCase == null)
        {
            _logger.LogWarning("Onboarding case {CaseId} not found", request.CaseId);
            return null;
        }

        return new OnboardingCaseDto
        {
            Id = onboardingCase.Id,
            CaseNumber = onboardingCase.CaseNumber,
            Type = onboardingCase.Type.ToString(),
            Status = onboardingCase.Status.ToString(),
            PartnerId = onboardingCase.PartnerId,
            PartnerReferenceId = onboardingCase.PartnerReferenceId,
            Applicant = new ApplicantDto
            {
                FirstName = onboardingCase.Applicant.FirstName,
                LastName = onboardingCase.Applicant.LastName,
                MiddleName = onboardingCase.Applicant.MiddleName,
                DateOfBirth = onboardingCase.Applicant.DateOfBirth,
                Email = onboardingCase.Applicant.Email,
                PhoneNumber = onboardingCase.Applicant.PhoneNumber,
                ResidentialAddress = new AddressDto
                {
                    Street = onboardingCase.Applicant.ResidentialAddress.Street,
                    Street2 = onboardingCase.Applicant.ResidentialAddress.Street2,
                    City = onboardingCase.Applicant.ResidentialAddress.City,
                    State = onboardingCase.Applicant.ResidentialAddress.State,
                    PostalCode = onboardingCase.Applicant.ResidentialAddress.PostalCode,
                    Country = onboardingCase.Applicant.ResidentialAddress.Country
                },
                Nationality = onboardingCase.Applicant.Nationality
            },
            Business = onboardingCase.Business != null ? new BusinessDto
            {
                LegalName = onboardingCase.Business.LegalName,
                TradeName = onboardingCase.Business.TradeName,
                RegistrationNumber = onboardingCase.Business.RegistrationNumber,
                RegistrationCountry = onboardingCase.Business.RegistrationCountry,
                IncorporationDate = onboardingCase.Business.IncorporationDate,
                BusinessType = onboardingCase.Business.BusinessType,
                Industry = onboardingCase.Business.Industry,
                RegisteredAddress = new AddressDto
                {
                    Street = onboardingCase.Business.RegisteredAddress.Street,
                    Street2 = onboardingCase.Business.RegisteredAddress.Street2,
                    City = onboardingCase.Business.RegisteredAddress.City,
                    State = onboardingCase.Business.RegisteredAddress.State,
                    PostalCode = onboardingCase.Business.RegisteredAddress.PostalCode,
                    Country = onboardingCase.Business.RegisteredAddress.Country
                },
                OperatingAddress = onboardingCase.Business.OperatingAddress != null ? new AddressDto
                {
                    Street = onboardingCase.Business.OperatingAddress.Street,
                    Street2 = onboardingCase.Business.OperatingAddress.Street2,
                    City = onboardingCase.Business.OperatingAddress.City,
                    State = onboardingCase.Business.OperatingAddress.State,
                    PostalCode = onboardingCase.Business.OperatingAddress.PostalCode,
                    Country = onboardingCase.Business.OperatingAddress.Country
                } : null
            } : null,
            CreatedAt = onboardingCase.CreatedAt,
            UpdatedAt = onboardingCase.UpdatedAt,
            CreatedBy = onboardingCase.CreatedBy,
            UpdatedBy = onboardingCase.UpdatedBy,
            Metadata = onboardingCase.Metadata
        };
    }
}

