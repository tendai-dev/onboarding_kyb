using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Cases.Queries;

/// <summary>
/// Handler for GetCaseByIdQuery
/// </summary>
public class GetCaseByIdQueryHandler : IRequestHandler<GetCaseByIdQuery, GetCaseResult>
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly ILogger<GetCaseByIdQueryHandler> _logger;

    public GetCaseByIdQueryHandler(
        IOnboardingCaseRepository repository,
        ILogger<GetCaseByIdQueryHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<GetCaseResult> Handle(GetCaseByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.CaseId, cancellationToken);
        
        if (entity == null)
            return GetCaseResult.NotFound();

        // Check access if requesting partner ID is provided
        if (request.RequestingPartnerId.HasValue && entity.PartnerId != request.RequestingPartnerId.Value)
        {
            _logger.LogWarning("Access denied: Partner {RequestingPartnerId} tried to access case {CaseId} owned by {OwnerPartnerId}",
                request.RequestingPartnerId, request.CaseId, entity.PartnerId);
            return GetCaseResult.Forbidden();
        }

        return GetCaseResult.Found(MapToDto(entity));
    }

    private static CaseDto MapToDto(OnboardingCase entity)
    {
        return new CaseDto(
            entity.Id,
            entity.CaseNumber,
            entity.Type.ToString(),
            entity.Status.ToString(),
            entity.PartnerId,
            entity.PartnerReferenceId,
            MapApplicantDto(entity.Applicant),
            entity.Business != null ? MapBusinessDto(entity.Business) : null,
            entity.Metadata,
            entity.CreatedAt,
            entity.CreatedBy,
            entity.UpdatedAt,
            entity.UpdatedBy
        );
    }

    private static ApplicantDto MapApplicantDto(Domain.ValueObjects.ApplicantDetails applicant)
    {
        return new ApplicantDto(
            applicant.FirstName,
            applicant.LastName,
            applicant.Email,
            applicant.PhoneNumber,
            applicant.DateOfBirth,
            applicant.Nationality,
            applicant.PassportNumber ?? applicant.DriversLicenseNumber ?? string.Empty,
            applicant.PassportNumber != null ? "passport" : (applicant.DriversLicenseNumber != null ? "drivers_license" : string.Empty),
            applicant.ResidentialAddress != null ? MapAddressDto(applicant.ResidentialAddress) : null
        );
    }

    private static BusinessDto MapBusinessDto(Domain.ValueObjects.BusinessDetails business)
    {
        return new BusinessDto(
            business.LegalName,
            business.TradeName ?? string.Empty,
            business.RegistrationNumber,
            business.TaxId ?? string.Empty,
            business.Industry,
            business.Website,
            business.RegisteredAddress != null ? MapAddressDto(business.RegisteredAddress) : null
        );
    }

    private static AddressDto MapAddressDto(Domain.ValueObjects.Address address)
    {
        return new AddressDto(
            address.Street,
            address.City,
            address.State,
            address.PostalCode,
            address.Country
        );
    }
}

/// <summary>
/// Handler for GetCaseByCaseNumberQuery
/// </summary>
public class GetCaseByCaseNumberQueryHandler : IRequestHandler<GetCaseByCaseNumberQuery, GetCaseResult>
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly ILogger<GetCaseByCaseNumberQueryHandler> _logger;

    public GetCaseByCaseNumberQueryHandler(
        IOnboardingCaseRepository repository,
        ILogger<GetCaseByCaseNumberQueryHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<GetCaseResult> Handle(GetCaseByCaseNumberQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByCaseNumberAsync(request.CaseNumber, cancellationToken);
        
        if (entity == null)
            return GetCaseResult.NotFound();

        // Check access if requesting partner ID is provided
        if (request.RequestingPartnerId.HasValue && entity.PartnerId != request.RequestingPartnerId.Value)
        {
            _logger.LogWarning("Access denied: Partner {RequestingPartnerId} tried to access case {CaseNumber} owned by {OwnerPartnerId}",
                request.RequestingPartnerId, request.CaseNumber, entity.PartnerId);
            return GetCaseResult.Forbidden();
        }

        return GetCaseResult.Found(MapToDto(entity));
    }

    private static CaseDto MapToDto(OnboardingCase entity)
    {
        return new CaseDto(
            entity.Id,
            entity.CaseNumber,
            entity.Type.ToString(),
            entity.Status.ToString(),
            entity.PartnerId,
            entity.PartnerReferenceId,
            MapApplicantDto(entity.Applicant),
            entity.Business != null ? MapBusinessDto(entity.Business) : null,
            entity.Metadata,
            entity.CreatedAt,
            entity.CreatedBy,
            entity.UpdatedAt,
            entity.UpdatedBy
        );
    }

    private static ApplicantDto MapApplicantDto(Domain.ValueObjects.ApplicantDetails applicant)
    {
        return new ApplicantDto(
            applicant.FirstName,
            applicant.LastName,
            applicant.Email,
            applicant.PhoneNumber,
            applicant.DateOfBirth,
            applicant.Nationality,
            applicant.PassportNumber ?? applicant.DriversLicenseNumber ?? string.Empty,
            applicant.PassportNumber != null ? "passport" : (applicant.DriversLicenseNumber != null ? "drivers_license" : string.Empty),
            applicant.ResidentialAddress != null ? MapAddressDto(applicant.ResidentialAddress) : null
        );
    }

    private static BusinessDto MapBusinessDto(Domain.ValueObjects.BusinessDetails business)
    {
        return new BusinessDto(
            business.LegalName,
            business.TradeName ?? string.Empty,
            business.RegistrationNumber,
            business.TaxId ?? string.Empty,
            business.Industry,
            business.Website,
            business.RegisteredAddress != null ? MapAddressDto(business.RegisteredAddress) : null
        );
    }

    private static AddressDto MapAddressDto(Domain.ValueObjects.Address address)
    {
        return new AddressDto(
            address.Street,
            address.City,
            address.State,
            address.PostalCode,
            address.Country
        );
    }
}
