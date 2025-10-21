namespace OnboardingApi.Domain.ValueObjects;

/// <summary>
/// Value Object representing applicant personal details
/// </summary>
public record ApplicantDetails
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? MiddleName { get; init; }
    public DateTime DateOfBirth { get; init; }
    public string Email { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public Address ResidentialAddress { get; init; } = null!;
    public string Nationality { get; init; } = string.Empty;
    public string? TaxId { get; init; }
    public string? PassportNumber { get; init; }
    public string? DriversLicenseNumber { get; init; }
    
    public bool IsComplete()
    {
        return !string.IsNullOrWhiteSpace(FirstName) &&
               !string.IsNullOrWhiteSpace(LastName) &&
               DateOfBirth != default &&
               !string.IsNullOrWhiteSpace(Email) &&
               !string.IsNullOrWhiteSpace(PhoneNumber) &&
               ResidentialAddress != null &&
               ResidentialAddress.IsComplete() &&
               !string.IsNullOrWhiteSpace(Nationality);
    }
    
    public string GetFullName() => string.IsNullOrWhiteSpace(MiddleName)
        ? $"{FirstName} {LastName}"
        : $"{FirstName} {MiddleName} {LastName}";
}

/// <summary>
/// Value Object representing business details (for KYB)
/// </summary>
public record BusinessDetails
{
    public string LegalName { get; init; } = string.Empty;
    public string? TradeName { get; init; }
    public string RegistrationNumber { get; init; } = string.Empty;
    public string RegistrationCountry { get; init; } = string.Empty;
    public DateTime IncorporationDate { get; init; }
    public string BusinessType { get; init; } = string.Empty;
    public string Industry { get; init; } = string.Empty;
    public Address RegisteredAddress { get; init; } = null!;
    public Address? OperatingAddress { get; init; }
    public string? TaxId { get; init; }
    public string? VatNumber { get; init; }
    public string Website { get; init; } = string.Empty;
    public int NumberOfEmployees { get; init; }
    public decimal EstimatedAnnualRevenue { get; init; }
    
    public bool IsComplete()
    {
        return !string.IsNullOrWhiteSpace(LegalName) &&
               !string.IsNullOrWhiteSpace(RegistrationNumber) &&
               !string.IsNullOrWhiteSpace(RegistrationCountry) &&
               IncorporationDate != default &&
               !string.IsNullOrWhiteSpace(BusinessType) &&
               !string.IsNullOrWhiteSpace(Industry) &&
               RegisteredAddress != null &&
               RegisteredAddress.IsComplete();
    }
}

/// <summary>
/// Value Object representing an address
/// </summary>
public record Address
{
    public string Street { get; init; } = string.Empty;
    public string? Street2 { get; init; }
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public string PostalCode { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    
    public bool IsComplete()
    {
        return !string.IsNullOrWhiteSpace(Street) &&
               !string.IsNullOrWhiteSpace(City) &&
               !string.IsNullOrWhiteSpace(State) &&
               !string.IsNullOrWhiteSpace(PostalCode) &&
               !string.IsNullOrWhiteSpace(Country);
    }
    
    public string GetFormattedAddress()
    {
        var parts = new List<string> { Street };
        if (!string.IsNullOrWhiteSpace(Street2))
            parts.Add(Street2);
        parts.Add($"{City}, {State} {PostalCode}");
        parts.Add(Country);
        return string.Join(Environment.NewLine, parts);
    }
}

