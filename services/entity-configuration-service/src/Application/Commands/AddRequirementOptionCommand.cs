using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record AddRequirementOptionCommand(
    Guid RequirementId,
    string Value,
    string DisplayText,
    int DisplayOrder
) : IRequest<RequirementOption?>;
