using MediatR;
using OnboardingApi.Application.EntityConfiguration.Interfaces;

namespace OnboardingApi.Application.EntityConfiguration.Queries;

public record GetAllRequirementsQuery(
    bool IncludeInactive = false
) : IRequest<List<RequirementDto>>;

public record GetRequirementByIdQuery(
    Guid Id
) : IRequest<RequirementDto?>;

public record GetRequirementByCodeQuery(
    string Code
) : IRequest<RequirementDto?>;

public class GetAllRequirementsQueryHandler : IRequestHandler<GetAllRequirementsQuery, List<RequirementDto>>
{
    private readonly IRequirementRepository _repository;

    public GetAllRequirementsQueryHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<RequirementDto>> Handle(GetAllRequirementsQuery request, CancellationToken cancellationToken)
    {
        var requirements = await _repository.GetAllAsync(request.IncludeInactive, cancellationToken);

        return requirements.Select(r => new RequirementDto
        {
            Id = r.Id,
            Code = r.Code,
            DisplayName = r.DisplayName,
            Description = r.Description,
            Type = r.Type,
            FieldType = r.FieldType,
            ValidationRules = r.ValidationRules,
            HelpText = r.HelpText,
            IsActive = r.IsActive,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();
    }
}

public class GetRequirementByIdQueryHandler : IRequestHandler<GetRequirementByIdQuery, RequirementDto?>
{
    private readonly IRequirementRepository _repository;

    public GetRequirementByIdQueryHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<RequirementDto?> Handle(GetRequirementByIdQuery request, CancellationToken cancellationToken)
    {
        var requirement = await _repository.GetByIdAsync(request.Id, cancellationToken);

        if (requirement == null)
            return null;

        return new RequirementDto
        {
            Id = requirement.Id,
            Code = requirement.Code,
            DisplayName = requirement.DisplayName,
            Description = requirement.Description,
            Type = requirement.Type,
            FieldType = requirement.FieldType,
            ValidationRules = requirement.ValidationRules,
            HelpText = requirement.HelpText,
            IsActive = requirement.IsActive,
            CreatedAt = requirement.CreatedAt,
            UpdatedAt = requirement.UpdatedAt
        };
    }
}

public class GetRequirementByCodeQueryHandler : IRequestHandler<GetRequirementByCodeQuery, RequirementDto?>
{
    private readonly IRequirementRepository _repository;

    public GetRequirementByCodeQueryHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<RequirementDto?> Handle(GetRequirementByCodeQuery request, CancellationToken cancellationToken)
    {
        var requirement = await _repository.GetByCodeAsync(request.Code, cancellationToken);

        if (requirement == null)
            return null;

        return new RequirementDto
        {
            Id = requirement.Id,
            Code = requirement.Code,
            DisplayName = requirement.DisplayName,
            Description = requirement.Description,
            Type = requirement.Type,
            FieldType = requirement.FieldType,
            ValidationRules = requirement.ValidationRules,
            HelpText = requirement.HelpText,
            IsActive = requirement.IsActive,
            CreatedAt = requirement.CreatedAt,
            UpdatedAt = requirement.UpdatedAt
        };
    }
}

public class RequirementDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public string? ValidationRules { get; set; }
    public string? HelpText { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

