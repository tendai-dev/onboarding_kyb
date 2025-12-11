using MediatR;
using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Queries;

/// <summary>
/// Query to get an onboarding case by ID
/// </summary>
public record GetOnboardingCaseQuery(Guid CaseId) : IRequest<OnboardingCaseDto?>;

/// <summary>
/// DTO for onboarding case response
/// </summary>
public record OnboardingCaseDto
{
    public Guid Id { get; init; }
    public string CaseNumber { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public Guid PartnerId { get; init; }
    public string PartnerReferenceId { get; init; } = string.Empty;
    public ApplicantDto Applicant { get; init; } = null!;
    public BusinessDto? Business { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public string? UpdatedBy { get; init; }
    public Dictionary<string, string> Metadata { get; init; } = new();
}

public record ApplicantDto
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? MiddleName { get; init; }
    public DateTime DateOfBirth { get; init; }
    public string Email { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public AddressDto ResidentialAddress { get; init; } = null!;
    public string Nationality { get; init; } = string.Empty;
}

public record BusinessDto
{
    public string LegalName { get; init; } = string.Empty;
    public string? TradeName { get; init; }
    public string RegistrationNumber { get; init; } = string.Empty;
    public string RegistrationCountry { get; init; } = string.Empty;
    public DateTime IncorporationDate { get; init; }
    public string BusinessType { get; init; } = string.Empty;
    public string Industry { get; init; } = string.Empty;
    public AddressDto RegisteredAddress { get; init; } = null!;
    public AddressDto? OperatingAddress { get; init; }
}

public record AddressDto
{
    public string Street { get; init; } = string.Empty;
    public string? Street2 { get; init; }
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public string PostalCode { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
}

