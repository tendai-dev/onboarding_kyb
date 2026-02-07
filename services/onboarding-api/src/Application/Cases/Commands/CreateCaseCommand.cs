using MediatR;
using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Cases.Commands;

/// <summary>
/// Command to create a new onboarding case
/// </summary>
public record CreateCaseCommand(
    OnboardingType Type,
    Guid PartnerId,
    string PartnerReferenceId,
    ApplicantRequest Applicant,
    BusinessRequest? Business,
    Dictionary<string, object>? Metadata,
    string CreatedBy,
    string? FormConfigId,
    string? FormVersion,
    string? EntityTypeCode
) : IRequest<CreateCaseResult>;

public record ApplicantRequest(
    string? FirstName,
    string? LastName,
    string? Email,
    string? Phone,
    string? DateOfBirth,
    string? Nationality,
    string? IdNumber,
    string? IdType,
    AddressRequest? ResidentialAddress
);

public record BusinessRequest(
    string? LegalName,
    string? TradingName,
    string? RegistrationNumber,
    string? TaxId,
    string? Industry,
    string? Website,
    AddressRequest? RegisteredAddress
);

public record AddressRequest(
    string? Street,
    string? City,
    string? State,
    string? PostalCode,
    string? Country
);

public record CreateCaseResult
{
    public bool Success { get; init; }
    public Guid? CaseId { get; init; }
    public string? CaseNumber { get; init; }
    public string? ErrorMessage { get; init; }
    public List<string>? ValidationErrors { get; init; }

    public static CreateCaseResult Succeeded(Guid caseId, string caseNumber) => 
        new() { Success = true, CaseId = caseId, CaseNumber = caseNumber };
    
    public static CreateCaseResult Failed(string error) => 
        new() { Success = false, ErrorMessage = error };
    
    public static CreateCaseResult ValidationFailed(List<string> errors) => 
        new() { Success = false, ValidationErrors = errors, ErrorMessage = "Validation failed" };
}
