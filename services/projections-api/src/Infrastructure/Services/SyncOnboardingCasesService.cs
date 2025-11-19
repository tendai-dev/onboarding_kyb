using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ProjectionsApi.Domain;
using ProjectionsApi.Domain.ReadModels;
using ProjectionsApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Data;
using Dapper;
using Npgsql;

namespace ProjectionsApi.Infrastructure.Services;

internal record OnboardingCaseRecord
{
    public Guid Id { get; init; }
    public string? case_id { get; init; }
    public string? Type { get; init; }
    public string? Status { get; init; }
    public Guid? PartnerId { get; init; }
    public string? PartnerReferenceId { get; init; }
    public DateTime? CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public string? CreatedBy { get; init; }
    public string? UpdatedBy { get; init; }
    public string? applicant_first_name { get; init; }
    public string? applicant_last_name { get; init; }
    public string? applicant_email { get; init; }
    public string? applicant_phone { get; init; }
    public DateTime? applicant_date_of_birth { get; init; }
    public string? applicant_nationality { get; init; }
    public string? applicant_address { get; init; }
    public string? applicant_city { get; init; }
    public string? applicant_country { get; init; }
    public string? business_name { get; init; }
    public string? business_registration_number { get; init; }
    public string? business_tax_id { get; init; }
    public string? business_country { get; init; }
    public string? business_industry { get; init; }
    public int? business_number_of_employees { get; init; }
    public decimal? business_annual_revenue { get; init; }
    public string? business_website { get; init; }
    public string? business_address { get; init; }
    public string? business_city { get; init; }
    public string? metadata_json { get; init; }
}

/// <summary>
/// Service that syncs onboarding cases from the onboarding database to projections
/// </summary>
public class SyncOnboardingCasesService
{
    private readonly ProjectionsDbContext _projectionsContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SyncOnboardingCasesService> _logger;

    public SyncOnboardingCasesService(
        ProjectionsDbContext projectionsContext,
        IConfiguration configuration,
        ILogger<SyncOnboardingCasesService> logger)
    {
        _projectionsContext = projectionsContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<SyncOnboardingCasesResult> SyncAsync(bool forceFullSync, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting sync of onboarding cases to projections");
        
        var casesCreated = 0;
        var casesUpdated = 0;
        var errors = 0;

        try
        {
            // Get connection string to onboarding database
            var onboardingConnectionString = _configuration.GetConnectionString("OnboardingDatabase") 
                ?? _configuration.GetConnectionString("DefaultConnection");
            
            if (string.IsNullOrEmpty(onboardingConnectionString))
            {
                // Try to construct from environment or use the same database with different schema
                var baseConnectionString = _configuration.GetConnectionString("PostgreSQL") 
                    ?? "Host=postgres;Database=onboarding;Username=postgres;Password=postgres";
                onboardingConnectionString = baseConnectionString.Replace("Database=projections", "Database=onboarding");
            }

            using var onboardingConnection = new NpgsqlConnection(onboardingConnectionString);
            await onboardingConnection.OpenAsync(cancellationToken);

            // Get the max updated_at from projections database first (if not doing full sync)
            DateTime? lastSyncDate = null;
            if (!forceFullSync)
            {
                try
                {
                    var maxUpdatedAt = await _projectionsContext.OnboardingCases
                        .Select(p => p.UpdatedAt)
                        .DefaultIfEmpty(DateTime.MinValue)
                        .MaxAsync(cancellationToken);
                    
                    if (maxUpdatedAt > DateTime.MinValue)
                    {
                        lastSyncDate = maxUpdatedAt;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not get last sync date from projections, doing full sync");
                    forceFullSync = true;
                }
            }

            // Query onboarding cases from the onboarding schema
            // Note: Table is in 'onboarding' schema, not 'public'
            // For incremental sync, we check updated_at OR created_at (to catch newly created cases)
            var sql = @"
                SELECT 
                    oc.id as Id,
                    oc.case_number as case_id,
                    oc.type as Type,
                    oc.status as Status,
                    oc.partner_id as PartnerId,
                    oc.partner_reference_id as PartnerReferenceId,
                    oc.created_at as CreatedAt,
                    oc.updated_at as UpdatedAt,
                    oc.created_by as CreatedBy,
                    oc.updated_by as UpdatedBy,
                    -- Applicant details
                    oc.applicant_first_name,
                    oc.applicant_last_name,
                    oc.applicant_email,
                    oc.applicant_phone_number as applicant_phone,
                    oc.applicant_date_of_birth,
                    oc.applicant_nationality,
                    -- Address
                    COALESCE(oc.applicant_address_street, '') as applicant_address,
                    oc.applicant_address_city as applicant_city,
                    oc.applicant_address_country as applicant_country,
                    -- Business details (for KYB)
                    oc.business_legal_name as business_name,
                    oc.business_registration_number as business_registration_number,
                    oc.business_tax_id as business_tax_id,
                    oc.business_registration_country as business_country,
                    oc.business_industry as business_industry,
                    oc.business_number_of_employees as business_number_of_employees,
                    oc.business_estimated_annual_revenue as business_annual_revenue,
                    oc.business_website as business_website,
                    CONCAT(COALESCE(oc.business_registered_address_street, ''), ', ', 
                           COALESCE(oc.business_registered_address_city, '')) as business_address,
                    oc.business_registered_address_city as business_city,
                    -- Metadata (dynamic fields from Entity Configuration Service)
                    oc.metadata as metadata_json
                FROM onboarding.onboarding_cases oc
                WHERE (@ForceFullSync = true OR oc.updated_at > @LastSyncDate OR oc.created_at > @LastSyncDate)
                ORDER BY oc.created_at DESC
                LIMIT 10000";

            var onboardingCases = await onboardingConnection.QueryAsync<OnboardingCaseRecord>(
                sql, 
                new { 
                    ForceFullSync = forceFullSync,
                    LastSyncDate = lastSyncDate ?? DateTime.MinValue
                });

            foreach (var sourceCase in onboardingCases)
            {
                try
                {
                    // Check if projection already exists
                    var caseId = sourceCase.case_id?.ToString() ?? string.Empty;
                    var existingProjection = await _projectionsContext.OnboardingCases
                        .FirstOrDefaultAsync(p => p.CaseId == caseId, cancellationToken);

                    var typeString = sourceCase.Type?.ToString() ?? "Individual";
                    var statusString = MapStatus(sourceCase.Status?.ToString());

                    if (existingProjection != null)
                    {
                        // Update existing projection
                        existingProjection.Type = typeString;
                        existingProjection.Status = statusString;
                        existingProjection.PartnerId = sourceCase.PartnerId?.ToString() ?? string.Empty;
                        existingProjection.PartnerReferenceId = sourceCase.PartnerReferenceId?.ToString() ?? string.Empty;
                        existingProjection.ApplicantFirstName = sourceCase.applicant_first_name ?? string.Empty;
                        existingProjection.ApplicantLastName = sourceCase.applicant_last_name ?? string.Empty;
                        existingProjection.ApplicantEmail = sourceCase.applicant_email ?? string.Empty;
                        existingProjection.ApplicantPhone = sourceCase.applicant_phone ?? string.Empty;
                        existingProjection.ApplicantDateOfBirth = sourceCase.applicant_date_of_birth as DateTime?;
                        existingProjection.ApplicantNationality = sourceCase.applicant_nationality ?? string.Empty;
                        existingProjection.ApplicantAddress = sourceCase.applicant_address ?? string.Empty;
                        existingProjection.ApplicantCity = sourceCase.applicant_city ?? string.Empty;
                        existingProjection.ApplicantCountry = sourceCase.applicant_country ?? string.Empty;
                        
                        // Update business details
                        existingProjection.BusinessLegalName = sourceCase.business_name ?? string.Empty;
                        existingProjection.BusinessRegistrationNumber = sourceCase.business_registration_number ?? string.Empty;
                        existingProjection.BusinessTaxId = sourceCase.business_tax_id ?? string.Empty;
                        existingProjection.BusinessCountryOfRegistration = sourceCase.business_country ?? string.Empty;
                        existingProjection.BusinessAddress = sourceCase.business_address ?? string.Empty;
                        existingProjection.BusinessCity = sourceCase.business_city ?? string.Empty;
                        existingProjection.BusinessIndustry = sourceCase.business_industry ?? string.Empty;
                        existingProjection.MetadataJson = sourceCase.metadata_json ?? string.Empty;
                        existingProjection.BusinessNumberOfEmployees = sourceCase.business_number_of_employees;
                        existingProjection.BusinessAnnualRevenue = sourceCase.business_annual_revenue;
                        existingProjection.BusinessWebsite = sourceCase.business_website ?? string.Empty;
                        
                        // Update progress based on REAL status - NOT hardcoded
                        existingProjection.ProgressPercentage = CalculateProgress(statusString);
                        existingProjection.Status = statusString; // Ensure status is updated
                        
                        existingProjection.UpdatedAt = sourceCase.UpdatedAt ?? DateTime.UtcNow;

                        // Set approved/rejected dates based on status
                        if (statusString == "Approved")
                        {
                            existingProjection.ApprovedAt ??= sourceCase.UpdatedAt;
                        }
                        else if (statusString == "Rejected")
                        {
                            existingProjection.RejectedAt ??= sourceCase.UpdatedAt;
                        }

                        casesUpdated++;
                    }
                    else
                    {
                        // Create new projection
                        var projection = new OnboardingCaseProjection
                        {
                            Id = Guid.NewGuid(),
                            CaseId = sourceCase.case_id?.ToString() ?? string.Empty,
                            Type = typeString,
                            Status = statusString,
                            PartnerId = sourceCase.PartnerId?.ToString() ?? string.Empty,
                            PartnerReferenceId = sourceCase.PartnerReferenceId?.ToString() ?? string.Empty,
                            ApplicantFirstName = sourceCase.applicant_first_name ?? string.Empty,
                            ApplicantLastName = sourceCase.applicant_last_name ?? string.Empty,
                            ApplicantEmail = sourceCase.applicant_email ?? string.Empty,
                            ApplicantPhone = sourceCase.applicant_phone ?? string.Empty,
                            ApplicantDateOfBirth = sourceCase.applicant_date_of_birth as DateTime?,
                            ApplicantNationality = sourceCase.applicant_nationality ?? string.Empty,
                            ApplicantAddress = sourceCase.applicant_address ?? string.Empty,
                            ApplicantCity = sourceCase.applicant_city ?? string.Empty,
                            ApplicantCountry = sourceCase.applicant_country ?? string.Empty,
                            
                            // Business details
                            BusinessLegalName = sourceCase.business_name ?? string.Empty,
                            BusinessRegistrationNumber = sourceCase.business_registration_number ?? string.Empty,
                            BusinessTaxId = sourceCase.business_tax_id ?? string.Empty,
                            BusinessCountryOfRegistration = sourceCase.business_country ?? string.Empty,
                            BusinessAddress = sourceCase.business_address ?? string.Empty,
                            BusinessCity = sourceCase.business_city ?? string.Empty,
                            BusinessIndustry = sourceCase.business_industry ?? string.Empty,
                            BusinessNumberOfEmployees = sourceCase.business_number_of_employees,
                            BusinessAnnualRevenue = sourceCase.business_annual_revenue,
                            BusinessWebsite = sourceCase.business_website ?? string.Empty,
                            
                            // Dynamic metadata from Entity Configuration Service
                            MetadataJson = sourceCase.metadata_json ?? string.Empty,
                            
                            CreatedAt = sourceCase.CreatedAt ?? DateTime.UtcNow,
                            UpdatedAt = sourceCase.UpdatedAt ?? DateTime.UtcNow,
                            RiskLevel = "Low", // Default, should be populated from risk service
                            RiskScore = 0,
                            // Calculate progress based on REAL status from database - NOT hardcoded
                            ProgressPercentage = CalculateProgress(statusString),
                            // Estimate steps based on status (can be enhanced with checklist service later)
                            TotalSteps = 5,
                            CompletedSteps = statusString == "Approved" ? 5 : (statusString == "Rejected" ? 0 : 1)
                        };

                        if (statusString == "Approved")
                        {
                            projection.ApprovedAt = sourceCase.UpdatedAt;
                        }
                        else if (statusString == "Rejected")
                        {
                            projection.RejectedAt = sourceCase.UpdatedAt;
                        }

                        await _projectionsContext.OnboardingCases.AddAsync(projection, cancellationToken);
                        casesCreated++;
                    }
                }
                catch (Exception ex)
                {
                    var caseIdStr = sourceCase.case_id?.ToString() ?? "unknown";
                    _logger.LogError(ex, "Error syncing case {CaseId}", caseIdStr);
                    errors++;
                }
            }

            await _projectionsContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Sync completed: {Created} created, {Updated} updated, {Errors} errors", 
                casesCreated, casesUpdated, errors);

            return new SyncOnboardingCasesResult
            {
                CasesSynced = casesCreated + casesUpdated,
                CasesCreated = casesCreated,
                CasesUpdated = casesUpdated,
                Errors = errors,
                CompletedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during sync operation");
            errors++;
            
            return new SyncOnboardingCasesResult
            {
                CasesSynced = casesCreated + casesUpdated,
                CasesCreated = casesCreated,
                CasesUpdated = casesUpdated,
                Errors = errors,
                CompletedAt = DateTime.UtcNow
            };
        }
    }

    private static string MapStatus(string? status)
    {
        // Map backend status to frontend-friendly status
        // Keep "Submitted" as "Submitted" - don't change it to InProgress
        return status switch
        {
            "Draft" => "Draft",
            "Submitted" => "Submitted", // Keep as Submitted - don't map to InProgress
            "UnderReview" => "UnderReview",
            "AdditionalInfoRequired" => "AdditionalInfoRequired",
            "Approved" => "Approved",
            "Rejected" => "Rejected",
            _ => status ?? "Draft" // Return original if not recognized
        };
    }

    private static decimal CalculateProgress(string status)
    {
        // Calculate progress based on actual status from the database
        // NOT hardcoded - this reflects real progress
        return status?.ToLower() switch
        {
            "draft" => 0m, // Not submitted yet
            "submitted" => 25m, // Submitted, awaiting review
            "inprogress" or "in_progress" or "underreview" or "under_review" => 50m, // Being reviewed
            "additionalinforequired" or "additional_info_required" => 40m, // More info needed
            "approved" => 100m, // Complete
            "rejected" => 0m, // Rejected
            _ => 0m // Unknown status
        };
    }
}

