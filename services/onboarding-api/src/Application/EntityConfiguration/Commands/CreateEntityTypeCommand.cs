using MediatR;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

public record CreateEntityTypeCommand(
    string Code,
    string DisplayName,
    string Description,
    string? Icon = null
) : IRequest<CreateEntityTypeResult>;

public record CreateEntityTypeResult(
    Guid Id,
    string Code,
    string DisplayName
);

public record UpdateEntityTypeCommand(
    Guid Id,
    string DisplayName,
    string Description,
    bool? IsActive,
    string? Icon
) : IRequest<UpdateEntityTypeResult>;

public record UpdateEntityTypeResult(
    Guid Id,
    string Code,
    string DisplayName
);

public record DeleteEntityTypeCommand(
    Guid Id
) : IRequest<bool>;

public record AddRequirementToEntityTypeCommand(
    Guid EntityTypeId,
    Guid RequirementId,
    bool IsRequired,
    int DisplayOrder
) : IRequest<bool>;

public record RemoveRequirementFromEntityTypeCommand(
    Guid EntityTypeId,
    Guid RequirementId
) : IRequest<bool>;

