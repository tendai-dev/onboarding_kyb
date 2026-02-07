using MediatR;

namespace OnboardingApi.Application.Cases.Queries;

/// <summary>
/// Query to get a case by ID
/// </summary>
public record GetCaseByIdQuery(Guid CaseId, Guid? RequestingPartnerId = null) : IRequest<GetCaseResult>;

/// <summary>
/// Query to get a case by case number
/// </summary>
public record GetCaseByCaseNumberQuery(string CaseNumber, Guid? RequestingPartnerId = null) : IRequest<GetCaseResult>;

public record GetCaseResult
{
    public bool Success { get; init; }
    public CaseDto? Case { get; init; }
    public string? ErrorMessage { get; init; }

    public static GetCaseResult Found(CaseDto caseDto) => new() { Success = true, Case = caseDto };
    public static GetCaseResult NotFound() => new() { Success = false, ErrorMessage = "Case not found" };
    public static GetCaseResult Forbidden() => new() { Success = false, ErrorMessage = "Access denied" };
}

public record CaseDto(
    Guid Id,
    string CaseNumber,
    string Type,
    string Status,
    Guid PartnerId,
    string PartnerReferenceId,
    ApplicantDto Applicant,
    BusinessDto? Business,
    Dictionary<string, string> Metadata,
    DateTime CreatedAt,
    string CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy
);

public record ApplicantDto(
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    DateTime? DateOfBirth,
    string Nationality,
    string IdNumber,
    string IdType,
    AddressDto? ResidentialAddress
);

public record BusinessDto(
    string LegalName,
    string TradingName,
    string RegistrationNumber,
    string TaxId,
    string Industry,
    string Website,
    AddressDto? RegisteredAddress
);

public record AddressDto(
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country
);
