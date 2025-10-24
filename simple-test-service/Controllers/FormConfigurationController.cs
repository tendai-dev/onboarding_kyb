using Microsoft.AspNetCore.Mvc;

namespace SimpleTestService.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class FormConfigurationController : ControllerBase
{
    private readonly ILogger<FormConfigurationController> _logger;
    
    public FormConfigurationController(ILogger<FormConfigurationController> logger)
    {
        _logger = logger;
    }
    
    [HttpGet]
    public IActionResult GetFormConfiguration(
        [FromQuery] string entityType,
        [FromQuery] string country = "*",
        [FromQuery] string riskLevel = "*")
    {
        _logger.LogInformation(
            "Fetching form configuration: EntityType={EntityType}, Country={Country}, RiskLevel={RiskLevel}",
            entityType, country, riskLevel);
        
        // Return sample configuration
        var formConfig = new
        {
            Id = Guid.NewGuid(),
            FormCode = "UK_PRIVATE_COMPANY_V1",
            DisplayName = "UK Private Company Onboarding",
            Description = "Dynamic form for UK private limited companies",
            Version = 1,
            Sections = new object[]
            {
                new
                {
                    SectionCode = "company_details",
                    Title = "Company Details",
                    Description = "Basic company information",
                    Order = 1,
                    Fields = new object[]
                    {
                        new
                        {
                            FieldCode = "company_number",
                            Label = "Company Registration Number",
                            Type = "text",
                            Order = 1,
                            IsRequired = true,
                            DataSourceCode = "companies_house"
                        },
                        new
                        {
                            FieldCode = "company_name",
                            Label = "Company Name",
                            Type = "text",
                            Order = 2,
                            IsRequired = true
                        }
                    }
                }
            },
            DataSources = new object[]
            {
                new
                {
                    SourceCode = "companies_house",
                    DisplayName = "Companies House UK",
                    ApiEndpoint = "https://api.company-information.service.gov.uk",
                    Type = "REST"
                }
            }
        };
        
        return Ok(formConfig);
    }
}
