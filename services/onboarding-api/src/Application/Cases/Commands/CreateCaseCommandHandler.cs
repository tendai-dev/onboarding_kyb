using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Cases.Interfaces;
using OnboardingApi.Application.Cases.Mapping;
using OnboardingApi.Application.Cases.Validation;
using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Cases.Commands;

/// <summary>
/// Handler for CreateCaseCommand - extracts business logic from CasesController
/// </summary>
public class CreateCaseCommandHandler : IRequestHandler<CreateCaseCommand, CreateCaseResult>
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly IEntityConfigurationService _entityConfigService;
    private readonly ILogger<CreateCaseCommandHandler> _logger;

    public CreateCaseCommandHandler(
        IOnboardingCaseRepository repository,
        IEntityConfigurationService entityConfigService,
        ILogger<CreateCaseCommandHandler> logger)
    {
        _repository = repository;
        _entityConfigService = entityConfigService;
        _logger = logger;
    }

    public async Task<CreateCaseResult> Handle(CreateCaseCommand request, CancellationToken cancellationToken)
    {
        var debugId = $"{Guid.NewGuid().ToString("N").Substring(0, 8)}:{DateTime.UtcNow:HHmmss}";
        
        try
        {
            _logger.LogInformation("[{DebugId}] Processing CreateCaseCommand for partner {PartnerId}", 
                debugId, request.PartnerId);

            // Step 1: Fetch entity configuration if schema identifiers provided
            EntityTypeConfiguration? entityConfig = null;
            
            if (!string.IsNullOrWhiteSpace(request.FormConfigId))
            {
                entityConfig = await _entityConfigService.GetEntityTypeConfigurationByIdAsync(
                    request.FormConfigId, request.FormVersion, cancellationToken);
            }
            else if (!string.IsNullOrWhiteSpace(request.EntityTypeCode))
            {
                entityConfig = await _entityConfigService.GetEntityTypeConfigurationAsync(
                    request.EntityTypeCode, cancellationToken);
            }

            // Step 2: Validate against entity configuration
            if (entityConfig != null)
            {
                var validationErrors = CaseValidator.ValidateAgainstEntityConfiguration(
                    entityConfig, request.Applicant, request.Business);
                
                if (validationErrors.Count > 0)
                {
                    _logger.LogWarning("[{DebugId}] Schema validation failed: {Errors}", 
                        debugId, string.Join(", ", validationErrors));
                    return CreateCaseResult.ValidationFailed(validationErrors);
                }
            }

            // Step 3: Map to domain objects
            var applicant = CaseMapper.MapApplicant(request.Applicant, entityConfig);
            var business = request.Business != null 
                ? CaseMapper.MapBusiness(request.Business, entityConfig) 
                : null;

            // Step 4: Create entity
            var entity = OnboardingCase.Create(
                request.Type,
                request.PartnerId,
                request.PartnerReferenceId,
                applicant,
                business,
                request.CreatedBy);

            // Step 5: Add metadata
            if (request.Metadata != null)
            {
                foreach (var kvp in request.Metadata)
                {
                    entity.Metadata[kvp.Key] = kvp.Value?.ToString() ?? string.Empty;
                }
            }

            // Store schema identifiers in metadata
            if (!string.IsNullOrWhiteSpace(request.FormConfigId))
            {
                entity.Metadata["form_config_id"] = request.FormConfigId;
                if (!string.IsNullOrWhiteSpace(request.FormVersion))
                {
                    entity.Metadata["form_version"] = request.FormVersion;
                }
            }
            if (!string.IsNullOrWhiteSpace(request.EntityTypeCode))
            {
                entity.Metadata["entity_type_code"] = request.EntityTypeCode;
            }
            entity.Metadata["debug_id"] = debugId;

            // Step 6: Submit the case
            var isSchemaDriven = !string.IsNullOrWhiteSpace(request.FormConfigId) || 
                                 !string.IsNullOrWhiteSpace(request.EntityTypeCode);
            
            if (isSchemaDriven)
            {
                entity.SubmitSchemaDriven(request.CreatedBy, 
                    $"FormConfigId: {request.FormConfigId ?? "none"}, EntityType: {request.EntityTypeCode ?? "none"}");
            }
            else
            {
                entity.Submit(request.CreatedBy);
            }

            // Step 7: Save
            await _repository.AddAsync(entity, cancellationToken);
            await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("[{DebugId}] Created case {CaseId} ({CaseNumber})", 
                debugId, entity.Id, entity.CaseNumber);

            return CreateCaseResult.Succeeded(entity.Id, entity.CaseNumber);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("incomplete"))
        {
            _logger.LogWarning("[{DebugId}] Validation failed: {Error}", debugId, ex.Message);
            return CreateCaseResult.Failed("Applicant details are incomplete");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{DebugId}] Failed to create case: {Error}", debugId, ex.Message);
            return CreateCaseResult.Failed($"Failed to create case: {ex.Message}");
        }
    }
}
