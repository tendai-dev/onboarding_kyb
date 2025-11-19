using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record DeleteRequirementOptionCommand(
    Guid RequirementId,
    Guid OptionId
) : IRequest<bool>;
