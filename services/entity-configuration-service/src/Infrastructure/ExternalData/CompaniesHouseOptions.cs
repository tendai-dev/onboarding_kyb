namespace EntityConfigurationService.Infrastructure.ExternalData;

public class CompaniesHouseOptions
{
    public const string SectionName = "CompaniesHouse";
    
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.company-information.service.gov.uk";
    public int TimeoutSeconds { get; set; } = 30;
}
