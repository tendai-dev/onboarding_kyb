namespace EntityConfigurationService.Infrastructure.ExternalData;

/// <summary>
/// Service for fetching data from external sources (Companies House, CIPC, OpenCorporates, etc.)
/// </summary>
public interface IExternalDataService
{
    /// <summary>
    /// Fetch company data from external registry
    /// </summary>
    /// <param name="registryType">Type of registry (CompaniesHouse, CIPC, etc.)</param>
    /// <param name="companyNumber">Company registration number</param>
    /// <param name="country">Country code (UK, ZA, etc.)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Company data from external source</returns>
    Task<ExternalCompanyData?> FetchCompanyDataAsync(
        string registryType,
        string companyNumber,
        string country,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Search for companies by name
    /// </summary>
    Task<List<CompanySearchResult>> SearchCompaniesAsync(
        string registryType,
        string companyName,
        string country,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Company data retrieved from external registry
/// </summary>
public record ExternalCompanyData
{
    public string CompanyNumber { get; init; } = string.Empty;
    public string CompanyName { get; init; } = string.Empty;
    public string? TradingName { get; init; }
    public string CompanyType { get; init; } = string.Empty;
    public string CompanyStatus { get; init; } = string.Empty;
    public DateTime? IncorporationDate { get; init; }
    public string Country { get; init; } = string.Empty;
    
    // Address
    public CompanyAddress? RegisteredAddress { get; init; }
    
    // Officers
    public List<CompanyOfficer> Officers { get; init; } = new();
    
    // Shareholders (if available)
    public List<Shareholder> Shareholders { get; init; } = new();
    
    // Business details
    public string? NatureOfBusiness { get; init; }
    public string? SicCode { get; init; }
    public string? SicDescription { get; init; }
    
    // Financial (if available)
    public DateTime? AccountsNextDueDate { get; init; }
    public DateTime? LastAccountsDate { get; init; }
    
    // Source metadata
    public string Source { get; init; } = string.Empty;
    public DateTime RetrievedAt { get; init; }
}

public record CompanyAddress
{
    public string AddressLine1 { get; init; } = string.Empty;
    public string? AddressLine2 { get; init; }
    public string? City { get; init; }
    public string? Region { get; init; }
    public string? PostalCode { get; init; }
    public string Country { get; init; } = string.Empty;
}

public record CompanyOfficer
{
    public string Name { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public DateTime? AppointedOn { get; init; }
    public DateTime? ResignedOn { get; init; }
    public CompanyAddress? Address { get; init; }
    public string? Nationality { get; init; }
    public DateTime? DateOfBirth { get; init; }
}

public record Shareholder
{
    public string Name { get; init; } = string.Empty;
    public decimal? SharesHeld { get; init; }
    public decimal? PercentageOwnership { get; init; }
    public string ShareClass { get; init; } = string.Empty;
}

public record CompanySearchResult
{
    public string CompanyNumber { get; init; } = string.Empty;
    public string CompanyName { get; init; } = string.Empty;
    public string CompanyStatus { get; init; } = string.Empty;
    public CompanyAddress? Address { get; init; }
}

