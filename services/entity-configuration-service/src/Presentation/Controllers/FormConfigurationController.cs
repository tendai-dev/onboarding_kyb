using EntityConfigurationService.Application.Queries;
using EntityConfigurationService.Infrastructure.ExternalData;
using EntityConfigurationService.Presentation.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EntityConfigurationService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class FormConfigurationController : ControllerBase
{
    private readonly ILogger<FormConfigurationController> _logger;
    private readonly IExternalDataService _externalDataService;
    
    public FormConfigurationController(
        ILogger<FormConfigurationController> logger,
        IExternalDataService externalDataService)
    {
        _logger = logger;
        _externalDataService = externalDataService;
    }
    
    /// <summary>
    /// Get form configuration for specific context
    /// </summary>
    /// <param name="entityType">Entity type code (e.g., "PRIVATE_COMPANY")</param>
    /// <param name="country">Country code (e.g., "UK", "ZA")</param>
    /// <param name="riskLevel">Risk level (e.g., "LOW", "MEDIUM", "HIGH")</param>
    /// <returns>Dynamic form configuration</returns>
    [HttpGet]
    [ProducesResponseType(typeof(EntityConfigurationService.Application.Queries.FormConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFormConfiguration(
        [FromQuery] string entityType,
        [FromQuery] string country = "*",
        [FromQuery] string riskLevel = "*")
    {
        _logger.LogInformation(
            "Fetching form configuration: EntityType={EntityType}, Country={Country}, RiskLevel={RiskLevel}",
            entityType, country, riskLevel);
        
        // TODO: Implement query handler to fetch from repository
        // For now, return a sample configuration
        var formConfig = GetSampleFormConfiguration(entityType, country, riskLevel);
        
        if (formConfig == null)
        {
            return NotFound(new { message = "No form configuration found for specified criteria" });
        }
        
        return Ok(formConfig);
    }
    
    /// <summary>
    /// Fetch company data from external registry (Companies House, CIPC, etc.)
    /// </summary>
    /// <param name="registryType">Registry type (e.g., "CompaniesHouse", "CIPC")</param>
    /// <param name="companyNumber">Company registration number</param>
    /// <param name="country">Country code</param>
    /// <returns>Company data from external source</returns>
    [HttpGet("external-data/company")]
    [ProducesResponseType(typeof(ExternalCompanyData), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FetchCompanyData(
        [FromQuery] string registryType,
        [FromQuery] string companyNumber,
        [FromQuery] string country)
    {
        _logger.LogInformation(
            "Fetching external company data: Registry={Registry}, CompanyNumber={CompanyNumber}, Country={Country}",
            registryType, companyNumber, country);
        
        var companyData = await _externalDataService.FetchCompanyDataAsync(
            registryType,
            companyNumber,
            country);
        
        if (companyData == null)
        {
            return NotFound(new { message = $"Company not found: {companyNumber}" });
        }
        
        return Ok(companyData);
    }
    
    /// <summary>
    /// Search for companies by name
    /// </summary>
    /// <param name="registryType">Registry type</param>
    /// <param name="companyName">Company name to search</param>
    /// <param name="country">Country code</param>
    /// <returns>List of matching companies</returns>
    [HttpGet("external-data/search")]
    [ProducesResponseType(typeof(List<CompanySearchResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchCompanies(
        [FromQuery] string registryType,
        [FromQuery] string companyName,
        [FromQuery] string country)
    {
        _logger.LogInformation(
            "Searching companies: Registry={Registry}, Name={CompanyName}, Country={Country}",
            registryType, companyName, country);
        
        var results = await _externalDataService.SearchCompaniesAsync(
            registryType,
            companyName,
            country);
        
        return Ok(results);
    }
    
    // Sample form configuration for demonstration
    private EntityConfigurationService.Application.Queries.FormConfigurationDto? GetSampleFormConfiguration(
        string entityType,
        string country,
        string riskLevel)
    {
        // This would normally come from database
        // Returning UK Private Company form as example
        if (entityType.ToUpper() == "PRIVATE_COMPANY" && country.ToUpper() == "UK")
        {
            return new EntityConfigurationService.Application.Queries.FormConfigurationDto
            {
                Id = Guid.NewGuid(),
                FormCode = "UK_PRIVATE_COMPANY_V1",
                DisplayName = "UK Private Company Onboarding",
                Description = "Dynamic form for UK private limited companies",
                Version = 1,
                Sections = new List<EntityConfigurationService.Application.Queries.FormSectionDto>
                {
                    new()
                    {
                        SectionCode = "company_details",
                        Title = "Company Details",
                        Description = "Basic company information",
                        Order = 1,
                        Fields = new List<EntityConfigurationService.Application.Queries.FormFieldDto>
                        {
                            new()
                            {
                                FieldCode = "company_number",
                                Label = "Company Registration Number",
                                Placeholder = "e.g., 12345678",
                                HelpText = "Enter your Companies House registration number",
                                Type = "text",
                                Order = 1,
                                IsRequired = true,
                                DataSourceCode = "companies_house",
                                ValidationRules = new List<EntityConfigurationService.Application.Queries.ValidationRuleDto>
                                {
                                    new() { Type = "regex", Parameter = "^[0-9]{8}$", ErrorMessage = "Must be 8 digits" }
                                }
                            },
                            new()
                            {
                                FieldCode = "company_name",
                                Label = "Company Name",
                                Type = "text",
                                Order = 2,
                                IsRequired = true,
                                DataPath = "companyName",
                                ValidationRules = new List<EntityConfigurationService.Application.Queries.ValidationRuleDto>
                                {
                                    new() { Type = "minLength", Parameter = "3", ErrorMessage = "Minimum 3 characters" }
                                }
                            },
                            new()
                            {
                                FieldCode = "trading_name",
                                Label = "Trading Name (if different)",
                                Type = "text",
                                Order = 3,
                                IsRequired = false,
                                DataPath = "tradingName"
                            },
                            new()
                            {
                                FieldCode = "incorporation_date",
                                Label = "Date of Incorporation",
                                Type = "date",
                                Order = 4,
                                IsRequired = true,
                                DataPath = "incorporationDate"
                            }
                        }
                    },
                    new()
                    {
                        SectionCode = "directors",
                        Title = "Directors",
                        Description = "Company directors information",
                        Order = 2,
                        VisibilityRule = new EntityConfigurationService.Application.Queries.VisibilityRuleDto
                        {
                            Condition = "riskLevel == 'HIGH'",
                            FieldConditions = new List<EntityConfigurationService.Application.Queries.FieldConditionDto>
                            {
                                new() { FieldCode = "company_number", Operator = "isNotEmpty", Value = "" }
                            }
                        },
                        Fields = new List<EntityConfigurationService.Application.Queries.FormFieldDto>
                        {
                            new()
                            {
                                FieldCode = "directors_count",
                                Label = "Number of Directors",
                                Type = "number",
                                Order = 1,
                                IsRequired = true,
                                DataPath = "officers.length"
                            }
                        }
                    },
                    new()
                    {
                        SectionCode = "beneficial_owners",
                        Title = "Beneficial Owners",
                        Description = "Persons with significant control",
                        Order = 3,
                        Fields = new List<EntityConfigurationService.Application.Queries.FormFieldDto>
                        {
                            new()
                            {
                                FieldCode = "has_psc",
                                Label = "Are there persons with significant control?",
                                Type = "radio",
                                Order = 1,
                                IsRequired = true,
                                Options = new List<EntityConfigurationService.Application.Queries.FieldOptionDto>
                                {
                                    new() { Value = "yes", Label = "Yes", IsDefault = false },
                                    new() { Value = "no", Label = "No", IsDefault = false }
                                }
                            }
                        }
                    }
                },
                DataSources = new List<EntityConfigurationService.Application.Queries.ExternalDataSourceDto>
                {
                    new()
                    {
                        SourceCode = "companies_house",
                        DisplayName = "Companies House UK",
                        ApiEndpoint = "https://api.company-information.service.gov.uk",
                        Type = "REST",
                        Mappings = new List<EntityConfigurationService.Application.Queries.DataMappingDto>
                        {
                            new() { SourcePath = "company_name", TargetFieldCode = "company_name" },
                            new() { SourcePath = "date_of_creation", TargetFieldCode = "incorporation_date" },
                            new() { SourcePath = "registered_office_address", TargetFieldCode = "registered_address" }
                        }
                    }
                }
            };
        }
        
        return null;
    }
}

