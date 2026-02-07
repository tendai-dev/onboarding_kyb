using FluentValidation;
using OnboardingApi.Application.Cases.Commands;
using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Cases.Validators;

/// <summary>
/// FluentValidation validator for CreateCaseCommand
/// </summary>
public class CreateCaseCommandValidator : AbstractValidator<CreateCaseCommand>
{
    public CreateCaseCommandValidator()
    {
        RuleFor(x => x.PartnerId)
            .NotEmpty()
            .WithMessage("PartnerId is required");

        RuleFor(x => x.CreatedBy)
            .NotEmpty()
            .WithMessage("CreatedBy is required")
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.CreatedBy))
            .WithMessage("CreatedBy must be a valid email address");

        RuleFor(x => x.Applicant)
            .NotNull()
            .WithMessage("Applicant information is required")
            .SetValidator(new ApplicantRequestValidator()!);

        RuleFor(x => x.Business)
            .SetValidator(new BusinessRequestValidator()!)
            .When(x => x.Business != null);

        // Business type requires business information
        RuleFor(x => x.Business)
            .NotNull()
            .When(x => x.Type == OnboardingType.Business)
            .WithMessage("Business information is required for Business applications");
    }
}

/// <summary>
/// Validator for ApplicantRequest
/// </summary>
public class ApplicantRequestValidator : AbstractValidator<ApplicantRequest>
{
    public ApplicantRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required")
            .MaximumLength(100)
            .WithMessage("First name cannot exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required")
            .MaximumLength(100)
            .WithMessage("Last name cannot exceed 100 characters");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Email must be a valid email address")
            .MaximumLength(255)
            .WithMessage("Email cannot exceed 255 characters");

        RuleFor(x => x.Phone)
            .MaximumLength(20)
            .When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Phone number cannot exceed 20 characters")
            .Matches(@"^[\d\s\+\-\(\)]+$")
            .When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Phone number contains invalid characters");

        RuleFor(x => x.DateOfBirth)
            .Must(BeAValidDate)
            .When(x => !string.IsNullOrEmpty(x.DateOfBirth))
            .WithMessage("Date of birth must be a valid date (YYYY-MM-DD)");

        RuleFor(x => x.Nationality)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Nationality))
            .WithMessage("Nationality cannot exceed 100 characters");

        RuleFor(x => x.IdNumber)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.IdNumber))
            .WithMessage("ID number cannot exceed 50 characters");

        RuleFor(x => x.ResidentialAddress)
            .SetValidator(new AddressRequestValidator()!)
            .When(x => x.ResidentialAddress != null);
    }

    private static bool BeAValidDate(string? dateString)
    {
        if (string.IsNullOrEmpty(dateString)) return true;
        return DateTime.TryParse(dateString, out _);
    }
}

/// <summary>
/// Validator for BusinessRequest
/// </summary>
public class BusinessRequestValidator : AbstractValidator<BusinessRequest>
{
    public BusinessRequestValidator()
    {
        RuleFor(x => x.LegalName)
            .NotEmpty()
            .WithMessage("Business legal name is required")
            .MaximumLength(255)
            .WithMessage("Business legal name cannot exceed 255 characters");

        RuleFor(x => x.TradingName)
            .MaximumLength(255)
            .When(x => !string.IsNullOrEmpty(x.TradingName))
            .WithMessage("Trading name cannot exceed 255 characters");

        RuleFor(x => x.RegistrationNumber)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.RegistrationNumber))
            .WithMessage("Registration number cannot exceed 50 characters");

        RuleFor(x => x.TaxId)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.TaxId))
            .WithMessage("Tax ID cannot exceed 50 characters");

        RuleFor(x => x.Industry)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Industry))
            .WithMessage("Industry cannot exceed 100 characters");

        RuleFor(x => x.Website)
            .MaximumLength(255)
            .When(x => !string.IsNullOrEmpty(x.Website))
            .WithMessage("Website cannot exceed 255 characters")
            .Must(BeAValidUrl)
            .When(x => !string.IsNullOrEmpty(x.Website))
            .WithMessage("Website must be a valid URL");

        RuleFor(x => x.RegisteredAddress)
            .SetValidator(new AddressRequestValidator()!)
            .When(x => x.RegisteredAddress != null);
    }

    private static bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var result) 
            && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }
}

/// <summary>
/// Validator for AddressRequest
/// </summary>
public class AddressRequestValidator : AbstractValidator<AddressRequest>
{
    public AddressRequestValidator()
    {
        RuleFor(x => x.Street)
            .MaximumLength(255)
            .When(x => !string.IsNullOrEmpty(x.Street))
            .WithMessage("Street cannot exceed 255 characters");

        RuleFor(x => x.City)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.City))
            .WithMessage("City cannot exceed 100 characters");

        RuleFor(x => x.State)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.State))
            .WithMessage("State cannot exceed 100 characters");

        RuleFor(x => x.PostalCode)
            .MaximumLength(20)
            .When(x => !string.IsNullOrEmpty(x.PostalCode))
            .WithMessage("Postal code cannot exceed 20 characters");

        RuleFor(x => x.Country)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Country))
            .WithMessage("Country cannot exceed 100 characters");
    }
}
