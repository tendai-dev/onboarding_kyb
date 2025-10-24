using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EntityConfigurationService.Infrastructure.ExternalData;

/// <summary>
/// Client for UK Companies House API
/// API Documentation: https://developer-specs.company-information.service.gov.uk/
/// </summary>
public class CompaniesHouseClient : IExternalDataService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CompaniesHouseClient> _logger;
    private readonly CompaniesHouseOptions _options;
    
    
    public CompaniesHouseClient(
        HttpClient httpClient,
        ILogger<CompaniesHouseClient> logger,
        IOptions<CompaniesHouseOptions> options)
    {
        _httpClient = httpClient;
        _logger = logger;
        _options = options.Value;
        
        ConfigureHttpClient();
    }
    
    private void ConfigureHttpClient()
    {
        _httpClient.BaseAddress = new Uri(_options.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
        
        // Companies House uses Basic Auth with API key as username and empty password
        var authBytes = Encoding.ASCII.GetBytes($"{_options.ApiKey}:");
        var authHeader = Convert.ToBase64String(authBytes);
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authHeader);
    }
    
    public async Task<ExternalCompanyData?> FetchCompanyDataAsync(
        string registryType,
        string companyNumber,
        string country,
        CancellationToken cancellationToken = default)
    {
        if (country.ToUpper() != "UK" && country.ToUpper() != "GB")
        {
            _logger.LogWarning("Companies House only supports UK companies. Country: {Country}", country);
            return null;
        }
        
        try
        {
            _logger.LogInformation(
                "Fetching company data from Companies House: {CompanyNumber}",
                companyNumber);
            
            // 1. Get company profile
            var companyProfile = await GetCompanyProfileAsync(companyNumber, cancellationToken);
            if (companyProfile == null) return null;
            
            // 2. Get officers
            var officers = await GetCompanyOfficersAsync(companyNumber, cancellationToken);
            
            // 3. Get persons with significant control (shareholders/beneficial owners)
            var pscs = await GetPersonsWithSignificantControlAsync(companyNumber, cancellationToken);
            
            // Map to our domain model
            return MapToExternalCompanyData(companyProfile, officers, pscs);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error fetching company data: {CompanyNumber}", companyNumber);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching company data: {CompanyNumber}", companyNumber);
            throw;
        }
    }
    
    public async Task<List<CompanySearchResult>> SearchCompaniesAsync(
        string registryType,
        string companyName,
        string country,
        CancellationToken cancellationToken = default)
    {
        if (country.ToUpper() != "UK" && country.ToUpper() != "GB")
        {
            return new List<CompanySearchResult>();
        }
        
        try
        {
            _logger.LogInformation("Searching Companies House for: {CompanyName}", companyName);
            
            var response = await _httpClient.GetAsync(
                $"/search/companies?q={Uri.EscapeDataString(companyName)}",
                cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Companies House search failed: {StatusCode}",
                    response.StatusCode);
                return new List<CompanySearchResult>();
            }
            
            var searchResponse = await response.Content.ReadFromJsonAsync<CompaniesHouseSearchResponse>(
                cancellationToken: cancellationToken);
            
            if (searchResponse?.Items == null)
                return new List<CompanySearchResult>();
            
            return searchResponse.Items.Select(item => new CompanySearchResult
            {
                CompanyNumber = item.CompanyNumber ?? string.Empty,
                CompanyName = item.Title ?? string.Empty,
                CompanyStatus = item.CompanyStatus ?? string.Empty,
                Address = MapAddress(item.Address)
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching companies: {CompanyName}", companyName);
            return new List<CompanySearchResult>();
        }
    }
    
    private async Task<CompaniesHouseCompanyProfile?> GetCompanyProfileAsync(
        string companyNumber,
        CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync(
            $"/company/{companyNumber}",
            cancellationToken);
        
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Failed to fetch company profile: {CompanyNumber}, Status: {StatusCode}",
                companyNumber, response.StatusCode);
            return null;
        }
        
        return await response.Content.ReadFromJsonAsync<CompaniesHouseCompanyProfile>(
            cancellationToken: cancellationToken);
    }
    
    private async Task<List<CompaniesHouseOfficer>> GetCompanyOfficersAsync(
        string companyNumber,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"/company/{companyNumber}/officers",
                cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch officers for: {CompanyNumber}", companyNumber);
                return new List<CompaniesHouseOfficer>();
            }
            
            var officersResponse = await response.Content.ReadFromJsonAsync<CompaniesHouseOfficersResponse>(
                cancellationToken: cancellationToken);
            
            return officersResponse?.Items ?? new List<CompaniesHouseOfficer>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching officers for: {CompanyNumber}", companyNumber);
            return new List<CompaniesHouseOfficer>();
        }
    }
    
    private async Task<List<CompaniesHousePSC>> GetPersonsWithSignificantControlAsync(
        string companyNumber,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"/company/{companyNumber}/persons-with-significant-control",
                cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch PSCs for: {CompanyNumber}", companyNumber);
                return new List<CompaniesHousePSC>();
            }
            
            var pscResponse = await response.Content.ReadFromJsonAsync<CompaniesHousePSCResponse>(
                cancellationToken: cancellationToken);
            
            return pscResponse?.Items ?? new List<CompaniesHousePSC>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching PSCs for: {CompanyNumber}", companyNumber);
            return new List<CompaniesHousePSC>();
        }
    }
    
    private ExternalCompanyData MapToExternalCompanyData(
        CompaniesHouseCompanyProfile profile,
        List<CompaniesHouseOfficer> officers,
        List<CompaniesHousePSC> pscs)
    {
        return new ExternalCompanyData
        {
            CompanyNumber = profile.CompanyNumber ?? string.Empty,
            CompanyName = profile.CompanyName ?? string.Empty,
            CompanyType = profile.Type ?? string.Empty,
            CompanyStatus = profile.CompanyStatus ?? string.Empty,
            IncorporationDate = ParseDate(profile.DateOfCreation),
            Country = "GB",
            RegisteredAddress = MapAddress(profile.RegisteredOfficeAddress),
            Officers = officers.Select(MapOfficer).ToList(),
            Shareholders = pscs.Select(MapShareholder).ToList(),
            NatureOfBusiness = profile.SicCodes?.FirstOrDefault(),
            SicCode = profile.SicCodes?.FirstOrDefault(),
            AccountsNextDueDate = ParseDate(profile.Accounts?.NextDue),
            LastAccountsDate = ParseDate(profile.Accounts?.LastAccounts?.MadeUpTo),
            Source = "Companies House UK",
            RetrievedAt = DateTime.UtcNow
        };
    }
    
    private CompanyOfficer MapOfficer(CompaniesHouseOfficer officer)
    {
        return new CompanyOfficer
        {
            Name = officer.Name ?? string.Empty,
            Role = officer.OfficerRole ?? string.Empty,
            AppointedOn = ParseDate(officer.AppointedOn),
            ResignedOn = ParseDate(officer.ResignedOn),
            Address = MapAddress(officer.Address),
            Nationality = officer.Nationality,
            DateOfBirth = ParsePartialDate(officer.DateOfBirth)
        };
    }
    
    private Shareholder MapShareholder(CompaniesHousePSC psc)
    {
        return new Shareholder
        {
            Name = psc.Name ?? string.Empty,
            SharesHeld = null, // Not provided in detailed format
            PercentageOwnership = ExtractOwnershipPercentage(psc.NaturesOfControl),
            ShareClass = string.Join(", ", psc.NaturesOfControl ?? new List<string>())
        };
    }
    
    private CompanyAddress? MapAddress(CompaniesHouseAddress? address)
    {
        if (address == null) return null;
        
        return new CompanyAddress
        {
            AddressLine1 = address.AddressLine1 ?? string.Empty,
            AddressLine2 = address.AddressLine2,
            City = address.Locality,
            Region = address.Region,
            PostalCode = address.PostalCode,
            Country = address.Country ?? "United Kingdom"
        };
    }
    
    private DateTime? ParseDate(string? dateString)
    {
        if (string.IsNullOrWhiteSpace(dateString)) return null;
        
        return DateTime.TryParse(dateString, out var date) ? date : null;
    }
    
    private DateTime? ParsePartialDate(CompaniesHouseDateOfBirth? dob)
    {
        if (dob == null || dob.Year == null) return null;
        
        var year = dob.Year.Value;
        var month = dob.Month ?? 1;
        
        return new DateTime(year, month, 1);
    }
    
    private decimal? ExtractOwnershipPercentage(List<string>? naturesOfControl)
    {
        if (naturesOfControl == null) return null;
        
        // Parse ownership percentage from nature of control strings
        // Example: "ownership-of-shares-75-to-100-percent"
        foreach (var nature in naturesOfControl)
        {
            if (nature.Contains("75-to-100")) return 87.5m;
            if (nature.Contains("50-to-75")) return 62.5m;
            if (nature.Contains("25-to-50")) return 37.5m;
        }
        
        return null;
    }
}


// Companies House API Response Models
internal record CompaniesHouseCompanyProfile
{
    public string? CompanyNumber { get; init; }
    public string? CompanyName { get; init; }
    public string? Type { get; init; }
    public string? CompanyStatus { get; init; }
    public string? DateOfCreation { get; init; }
    public CompaniesHouseAddress? RegisteredOfficeAddress { get; init; }
    public List<string>? SicCodes { get; init; }
    public CompaniesHouseAccounts? Accounts { get; init; }
}

internal record CompaniesHouseAddress
{
    public string? AddressLine1 { get; init; }
    public string? AddressLine2 { get; init; }
    public string? Locality { get; init; }
    public string? Region { get; init; }
    public string? PostalCode { get; init; }
    public string? Country { get; init; }
}

internal record CompaniesHouseAccounts
{
    public string? NextDue { get; init; }
    public CompaniesHouseLastAccounts? LastAccounts { get; init; }
}

internal record CompaniesHouseLastAccounts
{
    public string? MadeUpTo { get; init; }
}

internal record CompaniesHouseOfficersResponse
{
    public List<CompaniesHouseOfficer>? Items { get; init; }
}

internal record CompaniesHouseOfficer
{
    public string? Name { get; init; }
    public string? OfficerRole { get; init; }
    public string? AppointedOn { get; init; }
    public string? ResignedOn { get; init; }
    public CompaniesHouseAddress? Address { get; init; }
    public string? Nationality { get; init; }
    public CompaniesHouseDateOfBirth? DateOfBirth { get; init; }
}

internal record CompaniesHouseDateOfBirth
{
    public int? Year { get; init; }
    public int? Month { get; init; }
}

internal record CompaniesHousePSCResponse
{
    public List<CompaniesHousePSC>? Items { get; init; }
}

internal record CompaniesHousePSC
{
    public string? Name { get; init; }
    public List<string>? NaturesOfControl { get; init; }
}

internal record CompaniesHouseSearchResponse
{
    public List<CompaniesHouseSearchItem>? Items { get; init; }
}

internal record CompaniesHouseSearchItem
{
    public string? CompanyNumber { get; init; }
    public string? Title { get; init; }
    public string? CompanyStatus { get; init; }
    public CompaniesHouseAddress? Address { get; init; }
}

