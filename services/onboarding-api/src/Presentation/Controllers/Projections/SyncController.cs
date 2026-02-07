using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Persistence.Projections;
using System.Text.Json;

namespace OnboardingApi.Presentation.Controllers.Projections;

// Helper class for raw SQL query
public class ProjectionData
{
    public string CaseId { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

[ApiController]
[Route("api/v1")]
public class SyncController : ControllerBase
{
    private readonly ILogger<SyncController> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public SyncController(
        ILogger<SyncController> logger,
        IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    /// <summary>
    /// Sync onboarding cases to projections table
    /// Handles dynamic fields based on entity configuration
    /// Uses separate scopes to avoid EF Core context conflicts
    /// Requires Admin or Service role authentication
    /// </summary>
    [HttpPost("sync")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,Service")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Sync([FromQuery] bool forceFullSync = false)
    {
        try
        {
            _logger.LogInformation("Starting projections sync. ForceFullSync: {ForceFullSync}", forceFullSync);

            int casesCreated = 0;
            int casesUpdated = 0;
            List<Domain.Aggregates.OnboardingCase> casesToSync;
            Dictionary<string, DateTime> allExistingProjections;

            // Use separate scopes to avoid context conflicts
            // First scope: Get all cases from onboarding schema
            using (var onboardingScope = _serviceScopeFactory.CreateScope())
            {
                var onboardingContext = onboardingScope.ServiceProvider.GetRequiredService<OnboardingDbContext>();
                var allCases = await onboardingContext.OnboardingCases
                    .AsNoTracking()
                    .ToListAsync();
                
                // Use raw SQL to get projections data (using same context to avoid conflicts)
                var existingProjectionsData = await onboardingContext.Database
                    .SqlQueryRaw<ProjectionData>("SELECT case_id as \"CaseId\", updated_at as \"UpdatedAt\" FROM projections.onboarding_case_projections")
                    .ToListAsync();
                
                allExistingProjections = existingProjectionsData.ToDictionary(p => p.CaseId, p => p.UpdatedAt);
                
                // Filter cases if not force sync
                if (!forceFullSync)
                {
                    var existingCaseIds = allExistingProjections.Keys.ToHashSet();
                    casesToSync = allCases.Where(c => 
                        !existingCaseIds.Contains(c.CaseNumber) || 
                        (allExistingProjections.TryGetValue(c.CaseNumber, out var projectionUpdatedAt) && 
                         c.UpdatedAt > projectionUpdatedAt)).ToList();
                    
                    _logger.LogInformation("Found {Count} cases to sync (filtered from {Total})", casesToSync.Count, allCases.Count);
                }
                else
                {
                    casesToSync = allCases;
                    _logger.LogInformation("Found {Count} cases to sync", casesToSync.Count);
                }
            } // Scope disposed here - onboarding context is closed
            
            // Second scope: Load projections and perform updates
            using (var projectionsScope = _serviceScopeFactory.CreateScope())
            {
                var projectionsContext = projectionsScope.ServiceProvider.GetRequiredService<ProjectionsDbContext>();
                
                // Load all existing projections for updates
                var caseIdsToLookup = casesToSync.Select(c => c.CaseNumber).ToList();
                var projectionsToUpdate = await projectionsContext.OnboardingCases
                    .AsNoTracking()
                    .Where(p => caseIdsToLookup.Contains(p.CaseId))
                    .ToDictionaryAsync(p => p.CaseId, p => p);

                foreach (var onboardingCase in casesToSync)
                {
                    projectionsToUpdate.TryGetValue(onboardingCase.CaseNumber, out var existingProjection);

                    // Parse metadata JSON if it exists
                    var metadataJson = "{}";
                    if (onboardingCase.Metadata != null && onboardingCase.Metadata.Count > 0)
                    {
                        metadataJson = JsonSerializer.Serialize(onboardingCase.Metadata);
                    }

                    var projection = existingProjection ?? new Domain.Projections.ReadModels.OnboardingCaseProjection
                    {
                        Id = onboardingCase.Id,
                        CaseId = onboardingCase.CaseNumber,
                        Type = onboardingCase.Type.ToString(),
                        Status = onboardingCase.Status.ToString(),
                        PartnerId = onboardingCase.PartnerId.ToString(),
                        PartnerName = string.Empty, // Can be populated from partner service if needed
                        PartnerReferenceId = onboardingCase.PartnerReferenceId,
                        CreatedAt = onboardingCase.CreatedAt,
                        UpdatedAt = onboardingCase.UpdatedAt,
                        MetadataJson = metadataJson
                    };

                    // Always update core fields (in case they changed or were incorrect)
                    projection.Type = onboardingCase.Type.ToString();
                    projection.Status = onboardingCase.Status.ToString();
                    projection.PartnerId = onboardingCase.PartnerId.ToString();
                    projection.PartnerReferenceId = onboardingCase.PartnerReferenceId;
                    projection.UpdatedAt = onboardingCase.UpdatedAt;
                    projection.MetadataJson = metadataJson;

                    // Map applicant information (handle dynamic fields via metadata)
                    projection.ApplicantFirstName = onboardingCase.Applicant.FirstName ?? string.Empty;
                    projection.ApplicantLastName = onboardingCase.Applicant.LastName ?? string.Empty;
                    projection.ApplicantEmail = onboardingCase.Applicant.Email ?? string.Empty;
                    projection.ApplicantPhone = onboardingCase.Applicant.PhoneNumber ?? string.Empty;
                    projection.ApplicantDateOfBirth = onboardingCase.Applicant.DateOfBirth;
                    projection.ApplicantNationality = onboardingCase.Applicant.Nationality ?? string.Empty;
                    projection.ApplicantAddress = onboardingCase.Applicant.ResidentialAddress?.Street ?? string.Empty;
                    projection.ApplicantCity = onboardingCase.Applicant.ResidentialAddress?.City ?? string.Empty;
                    projection.ApplicantCountry = onboardingCase.Applicant.ResidentialAddress?.Country ?? string.Empty;

                    // Map business information if available (dynamic based on entity type)
                    if (onboardingCase.Business != null)
                    {
                        projection.BusinessLegalName = onboardingCase.Business.LegalName ?? string.Empty;
                        projection.BusinessRegistrationNumber = onboardingCase.Business.RegistrationNumber ?? string.Empty;
                        projection.BusinessTaxId = onboardingCase.Business.TaxId ?? string.Empty;
                        projection.BusinessCountryOfRegistration = onboardingCase.Business.RegistrationCountry ?? string.Empty;
                        projection.BusinessAddress = onboardingCase.Business.RegisteredAddress?.Street ?? string.Empty;
                        projection.BusinessCity = onboardingCase.Business.RegisteredAddress?.City ?? string.Empty;
                        projection.BusinessIndustry = onboardingCase.Business.Industry ?? string.Empty;
                        projection.BusinessWebsite = onboardingCase.Business.Website ?? string.Empty;
                        projection.BusinessNumberOfEmployees = onboardingCase.Business.NumberOfEmployees;
                        projection.BusinessAnnualRevenue = onboardingCase.Business.EstimatedAnnualRevenue;
                    }
                    else
                    {
                        // Set defaults for non-business cases (fields are required but may be empty for individual cases)
                        projection.BusinessLegalName = string.Empty;
                        projection.BusinessRegistrationNumber = string.Empty;
                        projection.BusinessTaxId = string.Empty;
                        projection.BusinessCountryOfRegistration = string.Empty;
                        projection.BusinessAddress = string.Empty;
                        projection.BusinessCity = string.Empty;
                        projection.BusinessIndustry = string.Empty;
                        projection.BusinessWebsite = string.Empty;
                    }

                    // Set timestamps based on status
                    if (onboardingCase.Status == Domain.Aggregates.OnboardingStatus.Submitted && projection.SubmittedAt == null)
                    {
                        projection.SubmittedAt = onboardingCase.UpdatedAt;
                    }
                    else if (onboardingCase.Status == Domain.Aggregates.OnboardingStatus.Approved && projection.ApprovedAt == null)
                    {
                        projection.ApprovedAt = onboardingCase.UpdatedAt;
                    }
                    else if (onboardingCase.Status == Domain.Aggregates.OnboardingStatus.Rejected && projection.RejectedAt == null)
                    {
                        projection.RejectedAt = onboardingCase.UpdatedAt;
                    }

                    // Set defaults for required fields that may not have values (dynamic fields stored in metadata)
                    projection.ProgressPercentage = 0;
                    projection.TotalSteps = 0;
                    projection.CompletedSteps = 0;
                    projection.ChecklistStatus = string.Empty;
                    projection.ChecklistCompletionPercentage = 0;
                    projection.ChecklistTotalItems = 0;
                    projection.ChecklistCompletedItems = 0;
                    projection.ChecklistRequiredItems = 0;
                    projection.ChecklistCompletedRequiredItems = 0;
                    projection.RiskLevel = string.Empty;
                    projection.RiskScore = 0;
                    projection.RiskStatus = string.Empty;
                    projection.RiskFactorCount = 0;
                    projection.DocumentCount = 0;
                    projection.VerifiedDocumentCount = 0;
                    projection.PendingDocumentCount = 0;
                    projection.RejectedDocumentCount = 0;
                    projection.RequiresManualReview = false;
                    projection.HasComplianceIssues = false;

                    if (existingProjection == null)
                    {
                        projectionsContext.OnboardingCases.Add(projection);
                        casesCreated++;
                    }
                    else
                    {
                        projectionsContext.OnboardingCases.Update(projection);
                        casesUpdated++;
                    }
                }

                await projectionsContext.SaveChangesAsync();
            } // Scope disposed here - projections context is closed

            _logger.LogInformation("Projections sync completed. Created: {Created}, Updated: {Updated}", 
                casesCreated, casesUpdated);

            return Ok(new
            {
                casesCreated,
                casesUpdated,
                totalProcessed = casesToSync.Count,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during projections sync");
            return StatusCode(500, new { error = "Failed to sync projections", message = ex.Message });
        }
    }
}
