using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Queries;

/// <summary>
/// Query to get a list of onboardings with filtering
/// </summary>
public record GetOnboardingsQuery : IRequest<List<OnboardingCaseDto>>
{
    public string UserId { get; init; } = string.Empty;
    public int Limit { get; init; } = 25;
    public int Offset { get; init; } = 0;
    public string? Status { get; init; }
    public string? Assignee { get; init; }
}

/// <summary>
/// Handler for GetOnboardingsQuery
/// </summary>
public class GetOnboardingsQueryHandler : IRequestHandler<GetOnboardingsQuery, List<OnboardingCaseDto>>
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly ILogger<GetOnboardingsQueryHandler> _logger;

    public GetOnboardingsQueryHandler(
        IOnboardingCaseRepository repository,
        ILogger<GetOnboardingsQueryHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<List<OnboardingCaseDto>> Handle(GetOnboardingsQuery request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Fetching onboardings for user {UserId} with limit {Limit}, offset {Offset}, status {Status}, assignee {Assignee}", 
            request.UserId, request.Limit, request.Offset, request.Status ?? "all", request.Assignee ?? "all");

        if (!Guid.TryParse(request.UserId, out var partnerId))
        {
            _logger.LogWarning("Invalid UserId format: {UserId}", request.UserId);
            return new List<OnboardingCaseDto>();
        }

        // Use the new repository method with filtering and pagination
        var (onboardings, totalCount) = await _repository.GetByPartnerIdWithFiltersAsync(
            partnerId,
            request.Limit,
            request.Offset,
            request.Status,
            request.Assignee,
            cancellationToken);

        _logger.LogDebug("Retrieved {Count} onboardings out of {TotalCount} total", onboardings.Count(), totalCount);

        return onboardings.Select(MapToDto).ToList();
    }

    private static OnboardingCaseDto MapToDto(OnboardingCase onboardingCase)
    {
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