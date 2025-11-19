using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record RemoveRequirementFromEntityTypeCommand(
    Guid EntityTypeId,
    Guid RequirementId
) : IRequest<bool>;
