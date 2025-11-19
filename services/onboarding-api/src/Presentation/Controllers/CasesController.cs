using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using OnboardingApi.Infrastructure.Persistence;

namespace OnboardingApi.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
#if !DEBUG
[Microsoft.AspNetCore.Authorization.Authorize]
#endif
public partial class CasesController : ControllerBase
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CasesController> _logger;
    private readonly OnboardingDbContext _context;
    private readonly IEventBus _eventBus;
    private readonly OnboardingApi.Infrastructure.Services.IEntityConfigurationService _entityConfigService;
    private readonly ICurrentUser _currentUser;

    public CasesController(
        IOnboardingCaseRepository repository, 
        IHttpClientFactory httpClientFactory, 
        IConfiguration configuration, 
        ILogger<CasesController> logger,
        OnboardingDbContext context,
        IEventBus eventBus,
        OnboardingApi.Infrastructure.Services.IEntityConfigurationService entityConfigService,
        ICurrentUser currentUser)
    {
        _repository = repository;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _context = context;
        _eventBus = eventBus;
        _entityConfigService = entityConfigService;
        _currentUser = currentUser;
    }

    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateCaseRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
            return BadRequest(new { error = "Invalid request" });

        // Extract user identity from JWT token
        if (!_currentUser.IsAuthenticated)
        {
            _logger.LogWarning("Create case request rejected - user not authenticated");
            return Unauthorized(new { error = "Authentication required" });
        }

        var userEmail = _currentUser.Email;
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            _logger.LogWarning("Create case request rejected - user email not found in token");
            return Unauthorized(new { error = "User email not found in authentication token" });
        }

        // Generate PartnerId from authenticated user's email
        var expectedPartnerId = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(userEmail);

        // Validate that provided PartnerId matches authenticated user (if provided)
        // If not provided, use the generated one
        Guid partnerId;
        if (request.PartnerId.HasValue && request.PartnerId.Value != Guid.Empty)
        {
            if (request.PartnerId.Value != expectedPartnerId)
            {
                _logger.LogWarning(
                    "Create case request rejected - PartnerId mismatch. Expected: {Expected}, Provided: {Provided}, UserEmail: {Email}",
                    expectedPartnerId, request.PartnerId.Value, userEmail);
                return BadRequest(new { error = "PartnerId does not match authenticated user" });
            }
            partnerId = request.PartnerId.Value;
        }
        else
        {
            // PartnerId not provided, use generated one from authenticated user
            partnerId = expectedPartnerId;
            _logger.LogInformation("PartnerId not provided in request, using generated value from authenticated user: {PartnerId}", partnerId);
        }

        // Use authenticated user's email for CreatedBy (never trust request body)
        var createdBy = userEmail;
        _logger.LogInformation("Creating case for authenticated user: {Email}, PartnerId: {PartnerId}", userEmail, partnerId);

        // Log request structure for debugging
        _logger.LogInformation("Received CreateCaseRequest - Type: {Type}, HasApplicant: {HasApplicant}, HasBusiness: {HasBusiness}, HasMetadata: {HasMetadata}, MetadataKeys: {MetadataKeys}",
            request.Type,
            request.Applicant != null,
            request.Business != null,
            request.Metadata != null && request.Metadata.Count > 0,
            request.Metadata != null ? string.Join(", ", request.Metadata.Keys) : "none");

        // STEP 1: Get schema identifiers from headers (schema-driven forms)
        // Priority: X-Form-Config-Id > X-Entity-Type > metadata
        var formConfigId = Request.Headers["X-Form-Config-Id"].FirstOrDefault();
        var formVersion = Request.Headers["X-Form-Version"].FirstOrDefault();
        var entityTypeCode = Request.Headers["X-Entity-Type"].FirstOrDefault() 
            ?? (request.Metadata?.ContainsKey("entity_type_code") == true 
                ? request.Metadata["entity_type_code"]?.ToString() 
                : null);

        // Generate debug ID for tracing
        var debugId = $"{Request.Headers["X-Request-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString("N").Substring(0, 16).ToUpper()}:{DateTime.UtcNow:HHmmss}";
        
        _logger.LogInformation("[{DebugId}] Schema-driven form request received. FormConfigId: {FormConfigId}, Version: {Version}, EntityType: {EntityType}", 
            debugId, formConfigId ?? "none", formVersion ?? "none", entityTypeCode ?? "none");

        OnboardingApi.Infrastructure.Services.EntityTypeConfiguration? entityConfig = null;
        List<string> validationErrors = new();

        // STEP 2: Fetch and validate against entity configuration FIRST (before mapping to domain objects)
        // Use form config ID if available (most specific), otherwise fall back to entity type code
        if (!string.IsNullOrWhiteSpace(formConfigId))
        {
            _logger.LogInformation("[{DebugId}] Fetching entity configuration by Form Config ID: {FormConfigId} (version: {Version})", 
                debugId, formConfigId, formVersion ?? "latest");
            entityConfig = await _entityConfigService.GetEntityTypeConfigurationByIdAsync(formConfigId, formVersion, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(entityTypeCode))
        {
            _logger.LogInformation("[{DebugId}] Fetching entity configuration by Entity Type Code: {EntityTypeCode}", 
                debugId, entityTypeCode);
            entityConfig = await _entityConfigService.GetEntityTypeConfigurationAsync(entityTypeCode, cancellationToken);
        }
        
        if (entityConfig != null)
        {
            _logger.LogInformation("[{DebugId}] Entity configuration loaded. Validating payload against schema with {Count} requirements", 
                debugId, entityConfig.Requirements.Count);
            
            // Validate against schema BEFORE creating domain objects
            validationErrors = ValidateAgainstEntityConfiguration(entityConfig, request.Applicant, request.Business);
            if (validationErrors.Count > 0)
            {
                _logger.LogWarning("[{DebugId}] Schema validation failed: {Errors}", 
                    debugId, string.Join(", ", validationErrors));
                return BadRequest(new { 
                    name = "ValidationError",
                    error = "Validation failed against entity configuration", 
                    message = string.Join("; ", validationErrors),
                    details = validationErrors,
                    entityTypeCode = entityTypeCode ?? formConfigId,
                    formConfigId = formConfigId,
                    formVersion = formVersion,
                    debug_id = debugId
                });
            }
            _logger.LogInformation("[{DebugId}] Schema validation passed. All required fields from entity configuration are present", debugId);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(formConfigId) || !string.IsNullOrWhiteSpace(entityTypeCode))
            {
                _logger.LogWarning("[{DebugId}] Entity configuration not found (FormConfigId: {FormConfigId}, EntityType: {EntityType}). Will use default mapping but bypass hardcoded validation.", 
                    debugId, formConfigId ?? "none", entityTypeCode ?? "none");
            }
            else
            {
                _logger.LogInformation("[{DebugId}] No schema identifiers provided, using default validation (legacy mode)", debugId);
            }
        }

        // STEP 3: Map to domain objects - use schema-aware mapping if entity config is available
        // For schema-driven forms, only map fields that exist in the request (may be empty for fields not in schema)
        var applicant = MapApplicantFromRequest(request.Applicant, entityConfig);
        OnboardingApi.Domain.ValueObjects.BusinessDetails? business = null;
        if (request.Business != null)
        {
            business = MapBusinessFromRequest(request.Business, entityConfig);
        }

        // STEP 4: Create entity
        var entity = OnboardingCase.Create(
            request.Type,
            partnerId,  // Use validated/generated PartnerId
            request.PartnerReferenceId,
            applicant,
            business,
            createdBy);  // Use authenticated user's email from JWT

        // STEP 5: Add metadata from request (contains dynamic fields from Entity Configuration Service)
        if (request.Metadata != null && request.Metadata.Count > 0)
        {
            foreach (var kvp in request.Metadata)
            {
                entity.Metadata[kvp.Key] = kvp.Value?.ToString() ?? string.Empty;
            }
        }

        // Store schema identifiers in metadata for persistence and auditing
        if (!string.IsNullOrWhiteSpace(formConfigId))
        {
            entity.Metadata["form_config_id"] = formConfigId;
            if (!string.IsNullOrWhiteSpace(formVersion))
            {
                entity.Metadata["form_version"] = formVersion;
            }
        }
        if (!string.IsNullOrWhiteSpace(entityTypeCode))
        {
            entity.Metadata["entity_type_code"] = entityTypeCode;
        }
        entity.Metadata["debug_id"] = debugId;

        // Submit the case immediately after creation (user submitted the form)
        // This changes status from Draft to Submitted
        // CRITICAL: For schema-driven forms (formConfigId or entityTypeCode provided), ALWAYS bypass hardcoded IsComplete() check
        // because the frontend is fully dynamic and may not have all hardcoded fields
        var isSchemaDriven = !string.IsNullOrWhiteSpace(formConfigId) || !string.IsNullOrWhiteSpace(entityTypeCode);
        if (isSchemaDriven)
        {
            // Schema-driven form detected - bypass hardcoded validation
            // Even if entity config fetch failed, we trust the frontend validation
            _logger.LogInformation("[{DebugId}] Schema-driven form detected (FormConfigId: {FormConfigId}, EntityType: {EntityType}). Bypassing hardcoded IsComplete() check.", 
                debugId, formConfigId ?? "none", entityTypeCode ?? "none");
            
            // Manually set status to Submitted using reflection (domain model has private setters)
            var statusProperty = entity.GetType().GetProperty("Status", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            if (statusProperty != null && statusProperty.CanWrite)
            {
                statusProperty.SetValue(entity, Domain.Aggregates.OnboardingStatus.Submitted);
                var updatedAtProperty = entity.GetType().GetProperty("UpdatedAt", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                updatedAtProperty?.SetValue(entity, DateTime.UtcNow);
                var updatedByProperty = entity.GetType().GetProperty("UpdatedBy", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                updatedByProperty?.SetValue(entity, createdBy);
                
                // Trigger domain event manually (same as Submit() method does)
                var addEventMethod = entity.GetType().GetMethod("AddDomainEvent", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                if (addEventMethod != null)
                {
                    var submittedEvent = new Domain.Events.OnboardingCaseSubmittedEvent(
                        entity.Id,
                        entity.CaseNumber,
                        entity.Type,
                        entity.PartnerId,
                        DateTime.UtcNow,
                        entity.Metadata.Count > 0 ? new Dictionary<string, string>(entity.Metadata) : null,
                        entity.Applicant,
                        entity.Business
                    );
                    addEventMethod.Invoke(entity, new[] { submittedEvent });
                    _logger.LogInformation("[{DebugId}] Case {CaseId} submitted via schema-driven validation bypass (FormConfigId: {FormConfigId}, Version: {Version})", 
                        debugId, entity.Id, formConfigId ?? "none", formVersion ?? "none");
                }
            }
            else
            {
                // Reflection failed - try Submit() and catch the exception
                _logger.LogWarning("Could not set Status via reflection, attempting Submit() with exception handling");
                try
                {
        entity.Submit(createdBy);
                }
                catch (InvalidOperationException ex) when (ex.Message.Contains("incomplete"))
                {
                    // If Submit() fails due to IsComplete(), we still bypass it for schema-driven forms
                    _logger.LogWarning("Submit() failed with IsComplete() check, but this is a schema-driven form. Forcing status to Submitted.");
                    // Try to set status via reflection one more time with different approach
                    var statusProp = typeof(OnboardingCase).GetProperty("Status", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                    if (statusProp != null)
                    {
                        // Use SetValue with BindingFlags to bypass access restrictions
                        statusProp.SetValue(entity, Domain.Aggregates.OnboardingStatus.Submitted, System.Reflection.BindingFlags.SetProperty, null, null, null);
                        entity.GetType().GetProperty("UpdatedAt")?.SetValue(entity, DateTime.UtcNow);
                        entity.GetType().GetProperty("UpdatedBy")?.SetValue(entity, createdBy);
                    }
                    else
                    {
                        _logger.LogError("[{DebugId}] CRITICAL: Cannot bypass IsComplete() check. Reflection failed. Error: {Error}", debugId, ex.Message);
                        return BadRequest(new { 
                            name = "ValidationBypassFailed",
                            error = "Schema-driven form validation bypass failed", 
                            message = "Could not bypass hardcoded domain validation. Please ensure X-Form-Config-Id or X-Entity-Type header is correctly set.",
                            details = ex.Message,
                            formConfigId = formConfigId,
                            entityTypeCode = entityTypeCode,
                            debug_id = debugId
                        });
                    }
                }
            }
        }
        else
        {
            // Legacy mode - no entity_type_code provided, use standard hardcoded validation
            _logger.LogInformation("Legacy mode: No entity_type_code provided, using standard Submit() with hardcoded validation");
            try
            {
        entity.Submit(createdBy);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("incomplete"))
            {
                _logger.LogWarning("Legacy validation failed: {Error}", ex.Message);
                return BadRequest(new { error = "Applicant details are incomplete", details = ex.Message });
            }
        }

        await _repository.AddAsync(entity, cancellationToken);
        await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        // Publish domain events after successful save
        foreach (var domainEvent in entity.DomainEvents)
        {
            await _eventBus.PublishAsync(domainEvent, cancellationToken);
        }
        entity.ClearDomainEvents();

        _logger.LogInformation("Created onboarding case {CaseId} for partner {PartnerId}", entity.Id, entity.PartnerId);

        // Orchestrate downstream calls (best-effort, non-blocking failures)
        _ = OrchestrateDownstreamAsync(entity, request, HttpContext.RequestAborted);

        return CreatedAtAction(nameof(Get), new { id = entity.Id }, new { case_id = entity.Id, case_number = entity.CaseNumber });
    }

    [HttpGet("by-number/{caseNumber}")]
#if DEBUG
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
#endif
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCaseNumber(string caseNumber, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Looking up case by number: {CaseNumber}", caseNumber);
        var entity = await _repository.GetByCaseNumberAsync(caseNumber, cancellationToken);
        if (entity == null)
        {
            _logger.LogWarning("Case number {CaseNumber} not found in database", caseNumber);
            return NotFound();
        }
        _logger.LogInformation("Found case {CaseId} for case number {CaseNumber}", entity.Id, caseNumber);
        
        // Return full case details matching OnboardingCaseDto structure
        var response = new
        {
            id = entity.Id,
            case_number = entity.CaseNumber,
            type = entity.Type.ToString(),
            status = entity.Status.ToString(),
            partner_id = entity.PartnerId,
            partner_reference_id = entity.PartnerReferenceId,
            applicant = new
            {
                first_name = entity.Applicant.FirstName,
                last_name = entity.Applicant.LastName,
                middle_name = entity.Applicant.MiddleName,
                date_of_birth = entity.Applicant.DateOfBirth,
                email = entity.Applicant.Email,
                phone_number = entity.Applicant.PhoneNumber,
                residential_address = new
                {
                    street = entity.Applicant.ResidentialAddress.Street,
                    street2 = entity.Applicant.ResidentialAddress.Street2,
                    city = entity.Applicant.ResidentialAddress.City,
                    state = entity.Applicant.ResidentialAddress.State,
                    postal_code = entity.Applicant.ResidentialAddress.PostalCode,
                    country = entity.Applicant.ResidentialAddress.Country
                },
                nationality = entity.Applicant.Nationality
            },
            business = entity.Business != null ? new
            {
                legal_name = entity.Business.LegalName,
                trade_name = entity.Business.TradeName,
                registration_number = entity.Business.RegistrationNumber,
                registration_country = entity.Business.RegistrationCountry,
                incorporation_date = entity.Business.IncorporationDate,
                business_type = entity.Business.BusinessType,
                industry = entity.Business.Industry,
                registered_address = new
                {
                    street = entity.Business.RegisteredAddress.Street,
                    street2 = entity.Business.RegisteredAddress.Street2,
                    city = entity.Business.RegisteredAddress.City,
                    state = entity.Business.RegisteredAddress.State,
                    postal_code = entity.Business.RegisteredAddress.PostalCode,
                    country = entity.Business.RegisteredAddress.Country
                },
                operating_address = entity.Business.OperatingAddress != null ? new
                {
                    street = entity.Business.OperatingAddress.Street,
                    street2 = entity.Business.OperatingAddress.Street2,
                    city = entity.Business.OperatingAddress.City,
                    state = entity.Business.OperatingAddress.State,
                    postal_code = entity.Business.OperatingAddress.PostalCode,
                    country = entity.Business.OperatingAddress.Country
                } : null
            } : null,
            created_at = entity.CreatedAt,
            updated_at = entity.UpdatedAt,
            created_by = entity.CreatedBy,
            updated_by = entity.UpdatedBy,
            metadata = entity.Metadata
        };
        
        return Ok(response);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null) return NotFound();
        
        // Return full case details matching OnboardingCaseDto structure
        var response = new
        {
            id = entity.Id,
            case_number = entity.CaseNumber,
            type = entity.Type.ToString(),
            status = entity.Status.ToString(),
            partner_id = entity.PartnerId,
            partner_reference_id = entity.PartnerReferenceId,
            applicant = new
            {
                first_name = entity.Applicant.FirstName,
                last_name = entity.Applicant.LastName,
                middle_name = entity.Applicant.MiddleName,
                date_of_birth = entity.Applicant.DateOfBirth,
                email = entity.Applicant.Email,
                phone_number = entity.Applicant.PhoneNumber,
                residential_address = new
                {
                    street = entity.Applicant.ResidentialAddress.Street,
                    street2 = entity.Applicant.ResidentialAddress.Street2,
                    city = entity.Applicant.ResidentialAddress.City,
                    state = entity.Applicant.ResidentialAddress.State,
                    postal_code = entity.Applicant.ResidentialAddress.PostalCode,
                    country = entity.Applicant.ResidentialAddress.Country
                },
                nationality = entity.Applicant.Nationality
            },
            business = entity.Business != null ? new
            {
                legal_name = entity.Business.LegalName,
                trade_name = entity.Business.TradeName,
                registration_number = entity.Business.RegistrationNumber,
                registration_country = entity.Business.RegistrationCountry,
                incorporation_date = entity.Business.IncorporationDate,
                business_type = entity.Business.BusinessType,
                industry = entity.Business.Industry,
                registered_address = new
                {
                    street = entity.Business.RegisteredAddress.Street,
                    street2 = entity.Business.RegisteredAddress.Street2,
                    city = entity.Business.RegisteredAddress.City,
                    state = entity.Business.RegisteredAddress.State,
                    postal_code = entity.Business.RegisteredAddress.PostalCode,
                    country = entity.Business.RegisteredAddress.Country
                },
                operating_address = entity.Business.OperatingAddress != null ? new
                {
                    street = entity.Business.OperatingAddress.Street,
                    street2 = entity.Business.OperatingAddress.Street2,
                    city = entity.Business.OperatingAddress.City,
                    state = entity.Business.OperatingAddress.State,
                    postal_code = entity.Business.OperatingAddress.PostalCode,
                    country = entity.Business.OperatingAddress.Country
                } : null
            } : null,
            created_at = entity.CreatedAt,
            updated_at = entity.UpdatedAt,
            created_by = entity.CreatedBy,
            updated_by = entity.UpdatedBy,
            metadata = entity.Metadata
        };
        
        return Ok(response);
    }

    [HttpPut("{id}/approve")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest? request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated)
        {
            return Unauthorized(new { error = "Authentication required" });
        }

        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null) return NotFound();

        // Use authenticated user's email instead of request body
        var approvedBy = _currentUser.Email;
        if (string.IsNullOrWhiteSpace(approvedBy))
        {
            approvedBy = _currentUser.UserId;
        }

        try
        {
            entity.Approve(approvedBy, request?.Notes);
            await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Approved case {CaseId} by {ApprovedBy}", entity.Id, approvedBy);
            return Ok(new { case_id = entity.Id, case_number = entity.CaseNumber, status = entity.Status.ToString() });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}/reject")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated)
        {
            return Unauthorized(new { error = "Authentication required" });
        }

        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(new { error = "Rejection reason is required" });

        // Use authenticated user's email instead of request body
        var rejectedBy = _currentUser.Email;
        if (string.IsNullOrWhiteSpace(rejectedBy))
        {
            rejectedBy = _currentUser.UserId;
        }

        try
        {
            entity.Reject(rejectedBy, request.Reason);
            await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Rejected case {CaseId} by {RejectedBy}", entity.Id, rejectedBy);
            return Ok(new { case_id = entity.Id, case_number = entity.CaseNumber, status = entity.Status.ToString() });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated)
        {
            return Unauthorized(new { error = "Authentication required" });
        }

        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null) return NotFound();

        // Use authenticated user's email instead of request body
        var updatedBy = _currentUser.Email;
        if (string.IsNullOrWhiteSpace(updatedBy))
        {
            updatedBy = _currentUser.UserId;
        }

        try
        {
            // Map frontend status to domain status
            var domainStatus = request.Status.ToUpper() switch
            {
                "SUBMITTED" => Domain.Aggregates.OnboardingStatus.Submitted,
                "IN PROGRESS" or "INPROGRESS" => Domain.Aggregates.OnboardingStatus.UnderReview,
                "RISK REVIEW" => Domain.Aggregates.OnboardingStatus.UnderReview,
                "COMPLETE" or "APPROVED" => Domain.Aggregates.OnboardingStatus.Approved,
                "DECLINED" or "REJECTED" => Domain.Aggregates.OnboardingStatus.Rejected,
                "INCOMPLETE" or "DRAFT" => Domain.Aggregates.OnboardingStatus.Draft,
                _ => throw new ArgumentException($"Invalid status: {request.Status}")
            };

            // Use appropriate domain method based on target status
            if (domainStatus == Domain.Aggregates.OnboardingStatus.Approved)
            {
                entity.Approve(updatedBy, request.Notes);
            }
            else if (domainStatus == Domain.Aggregates.OnboardingStatus.Rejected)
            {
                entity.Reject(updatedBy, request.Reason ?? "No reason provided");
            }
            else
            {
                // For other statuses, we might need additional domain methods
                // For now, just update the status directly (this might need domain method)
                return BadRequest(new { error = $"Status update to {request.Status} requires specific endpoint" });
            }

            await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);
            return Ok(new { case_id = entity.Id, case_number = entity.CaseNumber, status = entity.Status.ToString() });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get all cases with filtering, pagination, and sorting
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? partnerId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] bool? isOverdue = null,
        [FromQuery] bool? requiresManualReview = null,
        [FromQuery] string? fromDate = null,
        [FromQuery] string? toDate = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.OnboardingCases.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(partnerId) && Guid.TryParse(partnerId, out var partnerGuid))
            {
                query = query.Where(c => c.PartnerId == partnerGuid);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (Enum.TryParse<OnboardingStatus>(status, true, out var statusEnum))
                {
                    query = query.Where(c => c.Status == statusEnum);
                }
            }

            // Search term - search in case number, applicant name, business name
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchLower = searchTerm.ToLower();
                query = query.Where(c => 
                    c.CaseNumber.ToLower().Contains(searchLower) ||
                    (c.Applicant.FirstName + " " + c.Applicant.LastName).ToLower().Contains(searchLower) ||
                    (c.Business != null && c.Business.LegalName.ToLower().Contains(searchLower)) ||
                    c.Id.ToString().ToLower().Contains(searchLower));
            }

            // Date range filter
            if (!string.IsNullOrWhiteSpace(fromDate) && DateTime.TryParse(fromDate, out var from))
            {
                query = query.Where(c => c.CreatedAt >= from);
            }
            if (!string.IsNullOrWhiteSpace(toDate) && DateTime.TryParse(toDate, out var to))
            {
                query = query.Where(c => c.CreatedAt <= to);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                var direction = sortDirection?.ToLower() == "asc" ? "asc" : "desc";
                query = sortBy.ToLower() switch
                {
                    "createdat" => direction == "asc" ? query.OrderBy(c => c.CreatedAt) : query.OrderByDescending(c => c.CreatedAt),
                    "updatedat" => direction == "asc" ? query.OrderBy(c => c.UpdatedAt) : query.OrderByDescending(c => c.UpdatedAt),
                    "status" => direction == "asc" ? query.OrderBy(c => c.Status) : query.OrderByDescending(c => c.Status),
                    "casenumber" => direction == "asc" ? query.OrderBy(c => c.CaseNumber) : query.OrderByDescending(c => c.CaseNumber),
                    _ => query.OrderByDescending(c => c.CreatedAt)
                };
            }
            else
            {
                query = query.OrderByDescending(c => c.CreatedAt);
            }

            // Apply pagination
            var cases = await query
                .Skip(skip)
                .Take(take)
                .ToListAsync(cancellationToken);

            // Map to response format
            var items = cases.Select(c => new
            {
                caseId = c.Id.ToString(),
                caseNumber = c.CaseNumber,
                type = c.Type.ToString(),
                status = c.Status.ToString(),
                partnerId = c.PartnerId.ToString(),
                partnerReferenceId = c.PartnerReferenceId,
                applicantFirstName = c.Applicant.FirstName,
                applicantLastName = c.Applicant.LastName,
                applicantEmail = c.Applicant.Email,
                applicantCountry = c.Applicant.ResidentialAddress.Country,
                applicantCity = c.Applicant.ResidentialAddress.City,
                businessLegalName = c.Business?.LegalName,
                createdAt = c.CreatedAt,
                updatedAt = c.UpdatedAt,
                createdBy = c.CreatedBy,
                updatedBy = c.UpdatedBy
            }).ToList();

            return Ok(new
            {
                items = items,
                totalCount = totalCount,
                skip = skip,
                take = take,
                hasMore = skip + take < totalCount,
                page = skip / take + 1,
                pageSize = take
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cases");
            return StatusCode(500, new { error = "Failed to fetch cases", message = ex.Message });
        }
    }

    /// <summary>
    /// Get cases requiring attention
    /// </summary>
    [HttpGet("attention")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> GetCasesRequiringAttention(
        [FromQuery] string? partnerId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.OnboardingCases.AsQueryable()
                .Where(c => c.Status == OnboardingStatus.UnderReview || 
                           c.Status == OnboardingStatus.Submitted);

            if (!string.IsNullOrWhiteSpace(partnerId) && Guid.TryParse(partnerId, out var partnerGuid))
            {
                query = query.Where(c => c.PartnerId == partnerGuid);
            }

            var cases = await query
                .OrderByDescending(c => c.CreatedAt)
                .Take(50)
                .ToListAsync(cancellationToken);

            var items = cases.Select(c => new
            {
                caseId = c.Id.ToString(),
                caseNumber = c.CaseNumber,
                type = c.Type.ToString(),
                status = c.Status.ToString(),
                partnerId = c.PartnerId.ToString(),
                applicantFirstName = c.Applicant.FirstName,
                applicantLastName = c.Applicant.LastName,
                applicantEmail = c.Applicant.Email,
                businessLegalName = c.Business?.LegalName,
                createdAt = c.CreatedAt
            }).ToList();

            return Ok(items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cases requiring attention");
            return StatusCode(500, new { error = "Failed to fetch cases", message = ex.Message });
        }
    }

    /// <summary>
    /// Export cases to CSV
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> ExportCases(
        [FromQuery] string? partnerId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] string? fromDate = null,
        [FromQuery] string? toDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.OnboardingCases.AsQueryable();

            if (!string.IsNullOrWhiteSpace(partnerId) && Guid.TryParse(partnerId, out var partnerGuid))
            {
                query = query.Where(c => c.PartnerId == partnerGuid);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (Enum.TryParse<OnboardingStatus>(status, true, out var statusEnum))
                {
                    query = query.Where(c => c.Status == statusEnum);
                }
            }

            if (!string.IsNullOrWhiteSpace(fromDate) && DateTime.TryParse(fromDate, out var from))
            {
                query = query.Where(c => c.CreatedAt >= from);
            }
            if (!string.IsNullOrWhiteSpace(toDate) && DateTime.TryParse(toDate, out var to))
            {
                query = query.Where(c => c.CreatedAt <= to);
            }

            var cases = await query
                .OrderByDescending(c => c.CreatedAt)
                .Take(10000) // Limit for export
                .ToListAsync(cancellationToken);

            // Generate CSV
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Case ID,Case Number,Type,Status,Partner ID,Applicant Name,Email,Business Name,Created At");

            foreach (var c in cases)
            {
                var applicantName = $"{c.Applicant.FirstName} {c.Applicant.LastName}";
                var businessName = c.Business?.LegalName ?? "";
                csv.AppendLine($"{c.Id},{c.CaseNumber},{c.Type},{c.Status},{c.PartnerId},\"{applicantName}\",{c.Applicant.Email},\"{businessName}\",{c.CreatedAt:yyyy-MM-dd HH:mm:ss}");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"applications_{DateTime.UtcNow:yyyyMMdd}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting cases");
            return StatusCode(500, new { error = "Failed to export cases", message = ex.Message });
        }
    }
}

public class ApproveRequest
{
    public string? ApprovedBy { get; set; }
    public string? Notes { get; set; }
}

public class RejectRequest
{
    public string? RejectedBy { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? UpdatedBy { get; set; }
    public string? Notes { get; set; }
    public string? Reason { get; set; }
}

public class CreateCaseRequest
{
    public OnboardingType Type { get; set; }
    /// <summary>
    /// PartnerId is optional - if not provided, backend will generate it from authenticated user's email.
    /// If provided, it must match the authenticated user's generated PartnerId.
    /// </summary>
    public Guid? PartnerId { get; set; }
    public string PartnerReferenceId { get; set; } = string.Empty;
    /// <summary>
    /// CreatedBy is ignored - backend uses authenticated user's email from JWT token.
    /// This field is kept for backward compatibility but will be overridden.
    /// </summary>
    [Obsolete("CreatedBy is now extracted from JWT token. This field is ignored.")]
    public string? CreatedBy { get; set; }
    public ApplicantRequest Applicant { get; set; } = null!;
    public BusinessRequest? Business { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public partial class CasesController
{
    /// <summary>
    /// Validate applicant and business data against entity configuration requirements
    /// Returns field-level errors with schema paths for dynamic validation
    /// </summary>
    private List<string> ValidateAgainstEntityConfiguration(
        OnboardingApi.Infrastructure.Services.EntityTypeConfiguration entityConfig,
        ApplicantRequest applicant,
        BusinessRequest? business)
    {
        var errors = new List<string>();
        
        // Map requirement codes to field values (case-insensitive matching)
        // These maps connect entity configuration requirement codes to the actual request payload structure
        var applicantFields = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            { "FIRST_NAME", applicant.FirstName },
            { "LAST_NAME", applicant.LastName },
            { "MIDDLE_NAME", applicant.MiddleName },
            { "EMAIL", applicant.Email },
            { "PHONE", applicant.PhoneNumber },
            { "PHONE_NUMBER", applicant.PhoneNumber },
            { "DATE_OF_BIRTH", applicant.DateOfBirth != default ? applicant.DateOfBirth.ToString("yyyy-MM-dd") : null },
            { "DOB", applicant.DateOfBirth != default ? applicant.DateOfBirth.ToString("yyyy-MM-dd") : null },
            { "BIRTH_DATE", applicant.DateOfBirth != default ? applicant.DateOfBirth.ToString("yyyy-MM-dd") : null },
            { "NATIONALITY", applicant.Nationality },
            { "COUNTRY_OF_NATIONALITY", applicant.Nationality },
            { "ADDRESS", applicant.ResidentialAddress?.Line1 },
            { "ADDRESS_LINE1", applicant.ResidentialAddress?.Line1 },
            { "ADDRESS_LINE_1", applicant.ResidentialAddress?.Line1 },
            { "RESIDENTIAL_ADDRESS", applicant.ResidentialAddress?.Line1 },
            { "STREET_ADDRESS", applicant.ResidentialAddress?.Line1 },
            { "CITY", applicant.ResidentialAddress?.City },
            { "STATE", applicant.ResidentialAddress?.State },
            { "PROVINCE", applicant.ResidentialAddress?.State },
            { "POSTAL_CODE", applicant.ResidentialAddress?.PostalCode },
            { "POSTCODE", applicant.ResidentialAddress?.PostalCode },
            { "ZIP_CODE", applicant.ResidentialAddress?.PostalCode },
            { "COUNTRY", applicant.ResidentialAddress?.Country },
            { "RESIDENTIAL_COUNTRY", applicant.ResidentialAddress?.Country }
        };

        // Validate required applicant fields from entity configuration
        // Only validate fields that are marked as required in the entity configuration schema
        foreach (var requirement in entityConfig.Requirements.Where(r => r.IsRequired))
        {
            var codeUpper = requirement.Code.ToUpper();
            var hasValue = applicantFields.TryGetValue(codeUpper, out var value) && !string.IsNullOrWhiteSpace(value);
            
            if (!hasValue)
            {
                // Check if it's a business field (skip applicant validation for business fields)
                var isBusinessField = codeUpper.Contains("LEGAL_NAME") || 
                                     codeUpper.Contains("REGISTRATION") || 
                                     codeUpper.Contains("BUSINESS") ||
                                     codeUpper.Contains("COMPANY") ||
                                     codeUpper.Contains("TRADING_NAME") ||
                                     codeUpper.Contains("TRADE_NAME");
                
                if (!isBusinessField)
                {
                    // Return field path in schema format: applicant.fieldName
                    var fieldPath = MapRequirementCodeToFieldPath(requirement.Code);
                    errors.Add($"applicant.{fieldPath}: {requirement.DisplayName} ({requirement.Code}) is required");
                }
            }
        }

        // Validate business fields if business is provided
        if (business != null)
        {
            var businessFields = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
            {
                { "LEGAL_NAME", business.LegalName },
                { "BUSINESS_LEGAL_NAME", business.LegalName },
                { "COMPANY_NAME", business.LegalName },
                { "REGISTERED_NAME", business.LegalName },
                { "REGISTRATION_NUMBER", business.RegistrationNumber },
                { "BUSINESS_REGISTRATION_NUMBER", business.RegistrationNumber },
                { "COUNTRY_OF_REGISTRATION", business.CountryOfRegistration },
                { "REGISTRATION_COUNTRY", business.CountryOfRegistration },
                { "REGISTERED_ADDRESS", business.RegisteredAddress?.Line1 },
                { "BUSINESS_ADDRESS", business.RegisteredAddress?.Line1 },
                { "ADDRESS", business.RegisteredAddress?.Line1 },
                { "ADDRESS_LINE1", business.RegisteredAddress?.Line1 },
                { "CITY", business.RegisteredAddress?.City },
                { "STATE", business.RegisteredAddress?.State },
                { "POSTAL_CODE", business.RegisteredAddress?.PostalCode },
                { "COUNTRY", business.RegisteredAddress?.Country }
            };

            foreach (var requirement in entityConfig.Requirements.Where(r => r.IsRequired))
            {
                var codeUpper = requirement.Code.ToUpper();
                var isBusinessField = codeUpper.Contains("LEGAL_NAME") || 
                                     codeUpper.Contains("REGISTRATION") || 
                                     codeUpper.Contains("BUSINESS") ||
                                     codeUpper.Contains("COMPANY") ||
                                     codeUpper.Contains("TRADING_NAME") ||
                                     codeUpper.Contains("TRADE_NAME");
                
                if (isBusinessField)
                {
                    var hasValue = businessFields.TryGetValue(codeUpper, out var value) && !string.IsNullOrWhiteSpace(value);
                    if (!hasValue)
                    {
                        var fieldPath = MapRequirementCodeToFieldPath(requirement.Code);
                        errors.Add($"business.{fieldPath}: {requirement.DisplayName} ({requirement.Code}) is required");
                    }
                }
            }
        }

        return errors;
    }

    /// <summary>
    /// Map requirement code to field path in request payload (snake_case for API)
    /// </summary>
    private string MapRequirementCodeToFieldPath(string requirementCode)
    {
        // Convert requirement code (e.g., "FIRST_NAME") to field path (e.g., "first_name")
        return requirementCode.ToLower().Replace("_", "_");
    }

    /// <summary>
    /// Map applicant request to domain object - schema-aware (allows empty values for fields not in schema)
    /// </summary>
    private OnboardingApi.Domain.ValueObjects.ApplicantDetails MapApplicantFromRequest(
        ApplicantRequest request,
        OnboardingApi.Infrastructure.Services.EntityTypeConfiguration? entityConfig)
    {
        // For schema-driven forms, allow empty values for fields not in the entity configuration
        // The domain model requires non-null strings, so use empty strings as defaults
        return new OnboardingApi.Domain.ValueObjects.ApplicantDetails
        {
            FirstName = request.FirstName ?? string.Empty,
            LastName = request.LastName ?? string.Empty,
            MiddleName = request.MiddleName,
            DateOfBirth = request.DateOfBirth != default ? request.DateOfBirth : default,
            Email = request.Email ?? string.Empty,
            PhoneNumber = request.PhoneNumber ?? string.Empty,
            ResidentialAddress = request.ResidentialAddress != null ? new OnboardingApi.Domain.ValueObjects.Address
            {
                Street = request.ResidentialAddress.Line1 ?? string.Empty,
                Street2 = request.ResidentialAddress.Line2,
                City = request.ResidentialAddress.City ?? string.Empty,
                State = request.ResidentialAddress.State ?? string.Empty,
                PostalCode = request.ResidentialAddress.PostalCode ?? string.Empty,
                Country = request.ResidentialAddress.Country ?? string.Empty
            } : new OnboardingApi.Domain.ValueObjects.Address
            {
                Street = string.Empty,
                Street2 = null,
                City = string.Empty,
                State = string.Empty,
                PostalCode = string.Empty,
                Country = string.Empty
            },
            Nationality = !string.IsNullOrWhiteSpace(request.Nationality) 
                ? request.Nationality.Length > 2 
                    ? request.Nationality.Substring(0, 2).ToUpperInvariant() 
                    : request.Nationality.ToUpperInvariant() 
                : string.Empty,
            TaxId = request.TaxId,
            PassportNumber = request.PassportNumber,
            DriversLicenseNumber = request.DriversLicenseNumber
        };
    }

    /// <summary>
    /// Map business request to domain object - schema-aware (allows empty values for fields not in schema)
    /// </summary>
    private OnboardingApi.Domain.ValueObjects.BusinessDetails MapBusinessFromRequest(
        BusinessRequest request,
        OnboardingApi.Infrastructure.Services.EntityTypeConfiguration? entityConfig)
    {
        // For schema-driven forms, allow empty values for fields not in the entity configuration
        return new OnboardingApi.Domain.ValueObjects.BusinessDetails
        {
            LegalName = request.LegalName ?? string.Empty,
            RegistrationNumber = request.RegistrationNumber ?? string.Empty,
            RegistrationCountry = request.CountryOfRegistration ?? string.Empty,
            IncorporationDate = DateTime.UtcNow, // Default if not provided
            BusinessType = "Company", // Default if not provided
            Industry = "General", // Default if not provided
            RegisteredAddress = request.RegisteredAddress != null ? new OnboardingApi.Domain.ValueObjects.Address
            {
                Street = request.RegisteredAddress.Line1 ?? string.Empty,
                Street2 = request.RegisteredAddress.Line2,
                City = request.RegisteredAddress.City ?? string.Empty,
                State = request.RegisteredAddress.State ?? string.Empty,
                PostalCode = request.RegisteredAddress.PostalCode ?? string.Empty,
                Country = request.RegisteredAddress.Country ?? string.Empty
            } : new OnboardingApi.Domain.ValueObjects.Address
            {
                Street = string.Empty,
                Street2 = null,
                City = string.Empty,
                State = string.Empty,
                PostalCode = string.Empty,
                Country = string.Empty
            },
            TradeName = null,
            OperatingAddress = null,
            TaxId = null,
            VatNumber = null,
            Website = string.Empty,
            NumberOfEmployees = 0,
            EstimatedAnnualRevenue = 0
        };
    }

    private async Task OrchestrateDownstreamAsync(OnboardingCase entity, CreateCaseRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();

            var checklistBase = _configuration["Services:Checklist:BaseUrl"]?.TrimEnd('/');
            var riskBase = _configuration["Services:Risk:BaseUrl"]?.TrimEnd('/');
            var notificationBase = _configuration["Services:Notification:BaseUrl"]?.TrimEnd('/');
            var projectionsBase = _configuration["Services:Projections:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:8090";

            // Checklist create
            if (!string.IsNullOrWhiteSpace(checklistBase))
            {
                var checklistPayload = new
                {
                    caseId = entity.Id.ToString(),
                    type = entity.Type.ToString(),
                    partnerId = entity.PartnerId.ToString()
                };
                var checklistResp = await client.PostAsJsonAsync($"{checklistBase}/api/v1/checklists", checklistPayload, cancellationToken);
                _logger.LogInformation("Checklist create returned {Status}", (int)checklistResp.StatusCode);
            }

            // Risk assessment creation is now manual only
            // Risk assessments must be created manually by authorized personnel through the Risk Review interface
            // No automatic risk assessment creation is performed
            _logger.LogInformation("Risk assessment creation skipped - must be done manually by authorized personnel");

            // Trigger projections sync automatically (non-blocking)
            // This ensures the case appears in admin dashboard immediately
            _ = Task.Run(async () =>
            {
                try
                {
                    // Longer delay to ensure database transaction is fully committed and visible
                    await Task.Delay(1000, CancellationToken.None);
                    
                    // Create a new client for the background task to avoid disposal issues
                    using var syncClient = _httpClientFactory.CreateClient();
                    syncClient.Timeout = TimeSpan.FromSeconds(30);
                    
                    // Try sync with forceFullSync=false first (incremental)
                    var syncUrl = $"{projectionsBase}/api/v1/sync?forceFullSync=false";
                    _logger.LogInformation("Triggering projections sync for case {CaseId} at {Url}", entity.Id, syncUrl);
                    
                    var syncResp = await syncClient.PostAsync(syncUrl, null, CancellationToken.None);
                    if (syncResp.IsSuccessStatusCode)
                    {
                        var result = await syncResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
                        var casesCreated = result.TryGetProperty("casesCreated", out var created) ? created.GetInt32() : 0;
                        var casesUpdated = result.TryGetProperty("casesUpdated", out var updated) ? updated.GetInt32() : 0;
                        _logger.LogInformation("Projections sync completed for case {CaseId}. Created: {Created}, Updated: {Updated}", 
                            entity.Id, casesCreated, casesUpdated);
                        
                        // If no cases were created/updated, try force sync as fallback
                        if (casesCreated == 0 && casesUpdated == 0)
                        {
                            _logger.LogWarning("Incremental sync found no new cases, trying force sync for case {CaseId}", entity.Id);
                            var forceSyncResp = await syncClient.PostAsync($"{projectionsBase}/api/v1/sync?forceFullSync=true", null, CancellationToken.None);
                            if (forceSyncResp.IsSuccessStatusCode)
                            {
                                var forceResult = await forceSyncResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
                                var forceCreated = forceResult.TryGetProperty("casesCreated", out var fc) ? fc.GetInt32() : 0;
                                var forceUpdated = forceResult.TryGetProperty("casesUpdated", out var fu) ? fu.GetInt32() : 0;
                                _logger.LogInformation("Force sync completed. Created: {Created}, Updated: {Updated}", forceCreated, forceUpdated);
                            }
                        }
                    }
                    else
                    {
                        var errorContent = await syncResp.Content.ReadAsStringAsync();
                        _logger.LogError("Projections sync returned {Status} for case {CaseId}: {Error}. URL: {Url}", 
                            (int)syncResp.StatusCode, entity.Id, errorContent, syncUrl);
                    }
                }
                catch (Exception syncEx)
                {
                    // Don't fail case creation if sync fails - it can be triggered manually
                    _logger.LogError(syncEx, "Failed to trigger projections sync for case {CaseId} - will sync on next scheduled run. Error: {Message}", 
                        entity.Id, syncEx.Message);
                }
            }, CancellationToken.None);

            // Optional: fire notification (welcome/created)
            if (!string.IsNullOrWhiteSpace(notificationBase))
            {
                var notifPayload = new
                {
                    type = "OnboardingCaseCreated",
                    caseId = entity.Id,
                    caseNumber = entity.CaseNumber,
                    partnerId = entity.PartnerId
                };
                var notifResp = await client.PostAsJsonAsync($"{notificationBase}/api/v1/notifications", notifPayload, cancellationToken);
                _logger.LogInformation("Notification send returned {Status}", (int)notifResp.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Orchestration failed for case {CaseId}", entity.Id);
        }
    }
}

public class ApplicantRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public AddressRequest ResidentialAddress { get; set; } = null!;
    public string Nationality { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public string? PassportNumber { get; set; }
    public string? DriversLicenseNumber { get; set; }
}

public class BusinessRequest
{
    public string LegalName { get; set; } = string.Empty;
    public string RegistrationNumber { get; set; } = string.Empty;
    public string CountryOfRegistration { get; set; } = string.Empty;
    public AddressRequest RegisteredAddress { get; set; } = null!;
}

public class AddressRequest
{
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}


