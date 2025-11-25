using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using System.Text.Json;

namespace OnboardingApi.Application.EntityConfiguration.Queries;

public record GetAllWizardConfigurationsQuery(
    bool IncludeInactive = false
) : IRequest<List<WizardConfigurationDto>>;

public record GetWizardConfigurationByIdQuery(
    Guid Id
) : IRequest<WizardConfigurationDto?>;

public record GetWizardConfigurationByEntityTypeIdQuery(
    Guid EntityTypeId
) : IRequest<WizardConfigurationDto?>;

public class GetAllWizardConfigurationsQueryHandler : IRequestHandler<GetAllWizardConfigurationsQuery, List<WizardConfigurationDto>>
{
    private readonly IWizardConfigurationRepository _repository;
    private readonly IEntityTypeRepository _entityTypeRepository;
    private readonly ILogger<GetAllWizardConfigurationsQueryHandler> _logger;

    public GetAllWizardConfigurationsQueryHandler(
        IWizardConfigurationRepository repository,
        IEntityTypeRepository entityTypeRepository,
        ILogger<GetAllWizardConfigurationsQueryHandler> logger)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
        _logger = logger;
    }

    public async Task<List<WizardConfigurationDto>> Handle(GetAllWizardConfigurationsQuery request, CancellationToken cancellationToken)
    {
        var configurations = await _repository.GetAllAsync(request.IncludeInactive, cancellationToken);
        
        var result = new List<WizardConfigurationDto>();
        
        foreach (var config in configurations)
        {
            // Get entity type for display name
            var entityType = await _entityTypeRepository.GetByIdAsync(config.EntityTypeId, cancellationToken);
            
            var dto = new WizardConfigurationDto
            {
                Id = config.Id,
                EntityTypeId = config.EntityTypeId,
                EntityTypeDisplayName = entityType?.DisplayName,
                IsActive = config.IsActive,
                CreatedAt = config.CreatedAt,
                UpdatedAt = config.UpdatedAt,
                Steps = config.Steps.Select(s => new WizardStepDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Subtitle = s.Subtitle,
                    RequirementTypes = ParseRequirementTypes(s.RequirementTypes),
                    ChecklistCategory = s.ChecklistCategory,
                    StepNumber = s.StepNumber,
                    IsActive = s.IsActive
                }).OrderBy(s => s.StepNumber).ToList()
            };
            
            result.Add(dto);
        }
        
        return result;
    }

    private List<string> ParseRequirementTypes(string requirementTypesJson)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(requirementTypesJson) || requirementTypesJson == "[]")
                return new List<string>();
            
            return JsonSerializer.Deserialize<List<string>>(requirementTypesJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}

public class GetWizardConfigurationByIdQueryHandler : IRequestHandler<GetWizardConfigurationByIdQuery, WizardConfigurationDto?>
{
    private readonly IWizardConfigurationRepository _repository;
    private readonly IEntityTypeRepository _entityTypeRepository;

    public GetWizardConfigurationByIdQueryHandler(
        IWizardConfigurationRepository repository,
        IEntityTypeRepository entityTypeRepository)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
    }

    public async Task<WizardConfigurationDto?> Handle(GetWizardConfigurationByIdQuery request, CancellationToken cancellationToken)
    {
        var config = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (config == null)
            return null;

        var entityType = await _entityTypeRepository.GetByIdAsync(config.EntityTypeId, cancellationToken);

        return new WizardConfigurationDto
        {
            Id = config.Id,
            EntityTypeId = config.EntityTypeId,
            EntityTypeDisplayName = entityType?.DisplayName,
            IsActive = config.IsActive,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt,
            Steps = config.Steps.Select(s => new WizardStepDto
            {
                Id = s.Id,
                Title = s.Title,
                Subtitle = s.Subtitle,
                RequirementTypes = ParseRequirementTypes(s.RequirementTypes),
                ChecklistCategory = s.ChecklistCategory,
                StepNumber = s.StepNumber,
                IsActive = s.IsActive
            }).OrderBy(s => s.StepNumber).ToList()
        };
    }

    private List<string> ParseRequirementTypes(string requirementTypesJson)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(requirementTypesJson) || requirementTypesJson == "[]")
                return new List<string>();
            
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(requirementTypesJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}

public class GetWizardConfigurationByEntityTypeIdQueryHandler : IRequestHandler<GetWizardConfigurationByEntityTypeIdQuery, WizardConfigurationDto?>
{
    private readonly IWizardConfigurationRepository _repository;
    private readonly IEntityTypeRepository _entityTypeRepository;

    public GetWizardConfigurationByEntityTypeIdQueryHandler(
        IWizardConfigurationRepository repository,
        IEntityTypeRepository entityTypeRepository)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
    }

    public async Task<WizardConfigurationDto?> Handle(GetWizardConfigurationByEntityTypeIdQuery request, CancellationToken cancellationToken)
    {
        var config = await _repository.GetByEntityTypeIdAsync(request.EntityTypeId, cancellationToken);
        if (config == null)
            return null;

        var entityType = await _entityTypeRepository.GetByIdAsync(config.EntityTypeId, cancellationToken);

        return new WizardConfigurationDto
        {
            Id = config.Id,
            EntityTypeId = config.EntityTypeId,
            EntityTypeDisplayName = entityType?.DisplayName,
            IsActive = config.IsActive,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt,
            Steps = config.Steps.Select(s => new WizardStepDto
            {
                Id = s.Id,
                Title = s.Title,
                Subtitle = s.Subtitle,
                RequirementTypes = ParseRequirementTypes(s.RequirementTypes),
                ChecklistCategory = s.ChecklistCategory,
                StepNumber = s.StepNumber,
                IsActive = s.IsActive
            }).OrderBy(s => s.StepNumber).ToList()
        };
    }

    private List<string> ParseRequirementTypes(string requirementTypesJson)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(requirementTypesJson) || requirementTypesJson == "[]")
                return new List<string>();
            
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(requirementTypesJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}

public class WizardConfigurationDto
{
    public Guid Id { get; set; }
    public Guid EntityTypeId { get; set; }
    public string? EntityTypeDisplayName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<WizardStepDto> Steps { get; set; } = new();
}

public class WizardStepDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public List<string> RequirementTypes { get; set; } = new();
    public string ChecklistCategory { get; set; } = string.Empty;
    public int StepNumber { get; set; }
    public bool IsActive { get; set; }
}

