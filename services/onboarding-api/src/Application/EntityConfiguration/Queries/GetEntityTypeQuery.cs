using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;

namespace OnboardingApi.Application.EntityConfiguration.Queries;

public record GetAllEntityTypesQuery(
    bool IncludeInactive = false,
    bool IncludeRequirements = false
) : IRequest<List<EntityTypeDto>>;

public record GetEntityTypeByIdQuery(
    Guid Id,
    bool IncludeRequirements = false
) : IRequest<EntityTypeDto?>;

public record GetEntityTypeByCodeQuery(
    string Code,
    bool IncludeRequirements = false
) : IRequest<EntityTypeDto?>;

public class GetAllEntityTypesQueryHandler : IRequestHandler<GetAllEntityTypesQuery, List<EntityTypeDto>>
{
    private readonly IEntityTypeRepository _repository;

    public GetAllEntityTypesQueryHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<EntityTypeDto>> Handle(GetAllEntityTypesQuery request, CancellationToken cancellationToken)
    {
        var entityTypes = request.IncludeRequirements
            ? await _repository.GetAllWithRequirementsAsync(request.IncludeInactive, cancellationToken)
            : await _repository.GetAllAsync(request.IncludeInactive, cancellationToken);

        return entityTypes.Select(et => new EntityTypeDto
        {
            Id = et.Id,
            Code = et.Code,
            DisplayName = et.DisplayName,
            Description = et.Description,
            Icon = et.Icon,
            IsActive = et.IsActive,
            CreatedAt = et.CreatedAt,
            UpdatedAt = et.UpdatedAt,
            Requirements = request.IncludeRequirements
                ? et.Requirements.Select(r => new EntityTypeRequirementDto
                {
                    Id = r.Id,
                    RequirementId = r.RequirementId,
                    IsRequired = r.IsRequired,
                    DisplayOrder = r.DisplayOrder,
                    // Map full requirement details from navigation property
                    Code = r.Requirement?.Code,
                    DisplayName = r.Requirement?.DisplayName,
                    Description = r.Requirement?.Description,
                    Type = r.Requirement?.Type,
                    FieldType = r.Requirement?.FieldType,
                    ValidationRules = r.Requirement?.ValidationRules,
                    HelpText = r.Requirement?.HelpText
                }).ToList()
                : null
        }).ToList();
    }
}

public class GetEntityTypeByIdQueryHandler : IRequestHandler<GetEntityTypeByIdQuery, EntityTypeDto?>
{
    private readonly IEntityTypeRepository _repository;
    private readonly ILogger<GetEntityTypeByIdQueryHandler> _logger;

    public GetEntityTypeByIdQueryHandler(IEntityTypeRepository repository, ILogger<GetEntityTypeByIdQueryHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<EntityTypeDto?> Handle(GetEntityTypeByIdQuery request, CancellationToken cancellationToken)
    {
        var entityType = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entityType == null)
            return null;

        // Log requirements for debugging
        var requirementsCount = entityType.Requirements?.Count ?? 0;
        _logger.LogInformation("[GetEntityTypeByIdQuery] Entity Type: {Code}, Requirements Count: {Count}, IncludeRequirements: {Include}", 
            entityType.Code, requirementsCount, request.IncludeRequirements);
        
        if (request.IncludeRequirements)
        {
            _logger.LogInformation("[GetEntityTypeByIdQuery] IncludeRequirements is TRUE, will map requirements");
            if (requirementsCount > 0 && entityType.Requirements != null)
            {
                var requirementIds = entityType.Requirements.Select(r => r.RequirementId).ToList();
                _logger.LogInformation("[GetEntityTypeByIdQuery] Requirement IDs: {Ids}", string.Join(", ", requirementIds));
            }
            else
            {
                _logger.LogWarning("[GetEntityTypeByIdQuery] IncludeRequirements is TRUE but Requirements count is 0!");
            }
        }
        else
        {
            _logger.LogInformation("[GetEntityTypeByIdQuery] IncludeRequirements is FALSE, will NOT map requirements");
        }

        var requirements = request.IncludeRequirements && entityType.Requirements != null && entityType.Requirements.Count > 0
            ? entityType.Requirements.Select(r => {
                var hasRequirement = r.Requirement != null;
                _logger.LogInformation("[GetEntityTypeByIdQuery] Mapping requirement {RequirementId}, has Requirement nav prop: {HasRequirement}, Code: {Code}", 
                    r.RequirementId, hasRequirement, r.Requirement?.Code ?? "null");
                
                return new EntityTypeRequirementDto
                {
                    Id = r.Id,
                    RequirementId = r.RequirementId,
                    IsRequired = r.IsRequired,
                    DisplayOrder = r.DisplayOrder,
                    // Map full requirement details from navigation property
                    Code = r.Requirement?.Code,
                    DisplayName = r.Requirement?.DisplayName,
                    Description = r.Requirement?.Description,
                    Type = r.Requirement?.Type,
                    FieldType = r.Requirement?.FieldType,
                    ValidationRules = r.Requirement?.ValidationRules,
                    HelpText = r.Requirement?.HelpText
                };
            }).ToList()
            : new List<EntityTypeRequirementDto>(); // Return empty list instead of null
        
        _logger.LogInformation("[GetEntityTypeByIdQuery] Mapped {Count} requirements to DTO", requirements.Count);

        return new EntityTypeDto
        {
            Id = entityType.Id,
            Code = entityType.Code,
            DisplayName = entityType.DisplayName,
            Description = entityType.Description,
            Icon = entityType.Icon,
            IsActive = entityType.IsActive,
            CreatedAt = entityType.CreatedAt,
            UpdatedAt = entityType.UpdatedAt,
            Requirements = requirements
        };
    }
}

public class GetEntityTypeByCodeQueryHandler : IRequestHandler<GetEntityTypeByCodeQuery, EntityTypeDto?>
{
    private readonly IEntityTypeRepository _repository;
    private readonly ILogger<GetEntityTypeByCodeQueryHandler> _logger;

    public GetEntityTypeByCodeQueryHandler(IEntityTypeRepository repository, ILogger<GetEntityTypeByCodeQueryHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<EntityTypeDto?> Handle(GetEntityTypeByCodeQuery request, CancellationToken cancellationToken)
    {
        var entityType = await _repository.GetByCodeAsync(request.Code, cancellationToken);
        if (entityType == null)
            return null;

        // Log requirements for debugging
        var requirementsCount = entityType.Requirements?.Count ?? 0;
        _logger.LogInformation("[GetEntityTypeByCodeQuery] Entity Type: {Code}, Requirements Count: {Count}, IncludeRequirements: {Include}", 
            entityType.Code, requirementsCount, request.IncludeRequirements);

        var requirements = request.IncludeRequirements && entityType.Requirements != null && entityType.Requirements.Count > 0
            ? entityType.Requirements.Select(r => {
                var hasRequirement = r.Requirement != null;
                _logger.LogInformation("[GetEntityTypeByCodeQuery] Mapping requirement {RequirementId}, has Requirement nav prop: {HasRequirement}, Code: {Code}", 
                    r.RequirementId, hasRequirement, r.Requirement?.Code ?? "null");
                
                return new EntityTypeRequirementDto
                {
                    Id = r.Id,
                    RequirementId = r.RequirementId,
                    IsRequired = r.IsRequired,
                    DisplayOrder = r.DisplayOrder,
                    // Map full requirement details from navigation property
                    Code = r.Requirement?.Code,
                    DisplayName = r.Requirement?.DisplayName,
                    Description = r.Requirement?.Description,
                    Type = r.Requirement?.Type,
                    FieldType = r.Requirement?.FieldType,
                    ValidationRules = r.Requirement?.ValidationRules,
                    HelpText = r.Requirement?.HelpText
                };
            }).ToList()
            : new List<EntityTypeRequirementDto>(); // Return empty list instead of null
        
        _logger.LogInformation("[GetEntityTypeByCodeQuery] Mapped {Count} requirements to DTO", requirements.Count);

        return new EntityTypeDto
        {
            Id = entityType.Id,
            Code = entityType.Code,
            DisplayName = entityType.DisplayName,
            Description = entityType.Description,
            Icon = entityType.Icon,
            IsActive = entityType.IsActive,
            CreatedAt = entityType.CreatedAt,
            UpdatedAt = entityType.UpdatedAt,
            Requirements = requirements
        };
    }
}

public class EntityTypeDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<EntityTypeRequirementDto>? Requirements { get; set; }
}

public class EntityTypeRequirementDto
{
    public Guid Id { get; set; }
    public Guid RequirementId { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    
    // Include full requirement details
    public string? Code { get; set; }
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Type { get; set; }
    public string? FieldType { get; set; }
    public string? ValidationRules { get; set; }
    public string? HelpText { get; set; }
}

