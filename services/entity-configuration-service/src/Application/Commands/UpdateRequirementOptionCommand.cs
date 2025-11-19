using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record UpdateRequirementOptionCommand(
    Guid RequirementId,
    Guid OptionId,
    string Value,
    string DisplayText,
    int DisplayOrder
) : IRequest<RequirementOption?>;
