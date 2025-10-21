using FluentValidation;
using MediatR;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;

namespace OnboardingApi.Application.Commands;

/// <summary>
/// Command to create a new onboarding case
/// </summary>
public record CreateOnboardingCaseCommand : IRequest<CreateOnboardingCaseResult>
{
    public OnboardingType Type { get; init; }
    public Guid PartnerId { get; init; }
    public string PartnerReferenceId { get; init; } = string.Empty;
    public ApplicantDetailsDto Applicant { get; init; } = null!;
    public BusinessDetailsDto? Business { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}

public record ApplicantDetailsDto
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? MiddleName { get; init; }
    public DateTime DateOfBirth { get; init; }
    public string Email { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public AddressDto ResidentialAddress { get; init; } = null!;
    public string Nationality { get; init; } = string.Empty;
    public string? TaxId { get; init; }
    public string? PassportNumber { get; init; }
    public string? DriversLicenseNumber { get; init; }
}

public record BusinessDetailsDto
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
    public string? TaxId { get; init; }
    public string? VatNumber { get; init; }
    public string Website { get; init; } = string.Empty;
    public int NumberOfEmployees { get; init; }
    public decimal EstimatedAnnualRevenue { get; init; }
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

public record CreateOnboardingCaseResult(Guid CaseId, string CaseNumber);

/// <summary>
/// Validator for CreateOnboardingCaseCommand
/// </summary>
public class CreateOnboardingCaseCommandValidator : AbstractValidator<CreateOnboardingCaseCommand>
{
    public CreateOnboardingCaseCommandValidator()
    {
        RuleFor(x => x.PartnerId).NotEmpty().WithMessage("Partner ID is required");
        RuleFor(x => x.PartnerReferenceId).NotEmpty().MaximumLength(100);
        RuleFor(x => x.CreatedBy).NotEmpty().MaximumLength(255);
        
        RuleFor(x => x.Applicant).NotNull().SetValidator(new ApplicantDetailsDtoValidator());
        
        When(x => x.Type == OnboardingType.Business, () =>
        {
            RuleFor(x => x.Business).NotNull().WithMessage("Business details required for business onboarding");
            RuleFor(x => x.Business).SetValidator(new BusinessDetailsDtoValidator()!);
        });
    }
}

public class ApplicantDetailsDtoValidator : AbstractValidator<ApplicantDetailsDto>
{
    public ApplicantDetailsDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DateOfBirth).LessThan(DateTime.UtcNow.AddYears(-18))
            .WithMessage("Applicant must be at least 18 years old");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Nationality).NotEmpty().MaximumLength(2).Length(2)
            .WithMessage("Nationality must be ISO 3166-1 alpha-2 code");
        RuleFor(x => x.ResidentialAddress).NotNull().SetValidator(new AddressDtoValidator());
    }
}

public class BusinessDetailsDtoValidator : AbstractValidator<BusinessDetailsDto>
{
    public BusinessDetailsDtoValidator()
    {
        RuleFor(x => x.LegalName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.RegistrationNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RegistrationCountry).NotEmpty().Length(2);
        RuleFor(x => x.IncorporationDate).LessThanOrEqualTo(DateTime.UtcNow);
        RuleFor(x => x.BusinessType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Industry).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RegisteredAddress).NotNull().SetValidator(new AddressDtoValidator());
        RuleFor(x => x.NumberOfEmployees).GreaterThanOrEqualTo(0);
        RuleFor(x => x.EstimatedAnnualRevenue).GreaterThanOrEqualTo(0);
    }
}

public class AddressDtoValidator : AbstractValidator<AddressDto>
{
    public AddressDtoValidator()
    {
        RuleFor(x => x.Street).NotEmpty().MaximumLength(255);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.State).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PostalCode).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Country).NotEmpty().Length(2)
            .WithMessage("Country must be ISO 3166-1 alpha-2 code");
    }
}

