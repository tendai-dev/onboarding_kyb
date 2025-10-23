using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record AddRequirementToEntityTypeCommand(
    Guid EntityTypeId,
    Guid RequirementId,
    bool IsRequired,
    int DisplayOrder
) : IRequest<Unit>;


